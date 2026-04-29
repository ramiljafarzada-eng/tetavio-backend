import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoicePaymentDto } from './dto/create-invoice-payment.dto';
import { InvoiceLineDto } from './dto/invoice-line.dto';
import {
  ListInvoicesQueryDto,
  type InvoiceSortField,
} from './dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';

type CalculatedInvoiceLine = Prisma.InvoiceLineCreateWithoutInvoiceInput;

type CalculatedInvoiceTotals = {
  subTotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  lines: CalculatedInvoiceLine[];
};

const AUTO_INVOICE_NUMBER_MAX_RETRIES = 5;
const PAID_STATUSES_SET = new Set(['PAID', 'Ödənilib']);

const INVOICE_INCLUDE = {
  customer: true,
  lines: { where: { deletedAt: null as null } },
  payments: {
    where: { deletedAt: null as null },
    orderBy: { paymentDate: 'asc' as const },
  },
} satisfies Prisma.InvoiceInclude;

type InvoiceWithPayments = Prisma.InvoiceGetPayload<{ include: typeof INVOICE_INCLUDE }>;
type EnrichedInvoice = InvoiceWithPayments & { paidAmountMinor: number; outstandingMinor: number };

function attachPaymentDerived(invoice: InvoiceWithPayments) {
  const paidAmountMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const outstandingMinor = invoice.totalMinor - paidAmountMinor;
  return { ...invoice, paidAmountMinor, outstandingMinor };
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private getInvoiceOrderBy(
    sortBy?: InvoiceSortField,
    sortOrder: Prisma.SortOrder = 'desc',
  ): Prisma.InvoiceOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'dueDate':
        return [{ dueDate: sortOrder }, { createdAt: 'desc' }];
      case 'createdAt':
        return [{ createdAt: sortOrder }];
      case 'invoiceNumber':
        return [{ invoiceNumber: sortOrder }, { createdAt: 'desc' }];
      case 'totalMinor':
        return [{ totalMinor: sortOrder }, { createdAt: 'desc' }];
      case 'status':
        return [{ status: sortOrder }, { createdAt: 'desc' }];
      case 'issueDate':
      default:
        return [{ issueDate: sortOrder }, { createdAt: 'desc' }];
    }
  }

  private parseFilterDate(
    value: string,
    boundary: 'startOfDay' | 'endOfDay',
    fieldName: string,
  ): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName} date`);
    }

    if (boundary === 'startOfDay') {
      date.setHours(0, 0, 0, 0);
      return date;
    }

    date.setHours(23, 59, 59, 999);
    return date;
  }

  private isInvoiceNumberUniqueViolation(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2002') {
      return false;
    }

    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    const normalizedTarget = target.map((value) => String(value));

    const accountFieldPresent =
      normalizedTarget.includes('accountId') ||
      normalizedTarget.includes('account_id');
    const invoiceFieldPresent =
      normalizedTarget.includes('invoiceNumber') ||
      normalizedTarget.includes('invoice_number');

    return accountFieldPresent && invoiceFieldPresent;
  }

  private normalizeInvoiceNumber(invoiceNumber?: string | null): string | null {
    if (invoiceNumber === null || invoiceNumber === undefined) {
      return null;
    }

    const normalized = invoiceNumber.trim();

    if (!normalized) {
      throw new BadRequestException('Invoice number cannot be empty');
    }

    return normalized;
  }

  private async ensureUniqueInvoiceNumber(
    accountId: string,
    invoiceNumber: string,
    excludeInvoiceId?: string,
  ): Promise<void> {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        accountId,
        invoiceNumber,
        ...(excludeInvoiceId ? { id: { not: excludeInvoiceId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Invoice number already exists for account');
    }
  }

  private async generateInvoiceNumber(accountId: string): Promise<string> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        accountId,
        invoiceNumber: {
          startsWith: 'INV-',
        },
      },
      select: {
        invoiceNumber: true,
      },
    });

    let maxSequence = 0;

    for (const invoice of invoices) {
      const match = /^INV-(\d{6})$/.exec(invoice.invoiceNumber);

      if (!match) {
        continue;
      }

      const sequence = Number(match[1]);

      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    while (true) {
      maxSequence += 1;
      const candidate = `INV-${String(maxSequence).padStart(6, '0')}`;

      const collision = await this.prisma.invoice.findFirst({
        where: {
          accountId,
          invoiceNumber: candidate,
        },
        select: { id: true },
      });

      if (!collision) {
        return candidate;
      }
    }
  }

  private async recalculateInvoiceState(
    tx: Prisma.TransactionClient,
    invoiceId: string,
  ): Promise<void> {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      select: { totalMinor: true, status: true, paidAt: true },
    });
    if (!invoice) return;

    const agg = await tx.invoicePayment.aggregate({
      where: { invoiceId, deletedAt: null },
      _sum: { amountMinor: true },
    });

    const paidAmountMinor = agg._sum.amountMinor ?? 0;

    let newStatus: string;
    let newPaidAt: Date | null;

    if (invoice.totalMinor > 0 && paidAmountMinor >= invoice.totalMinor) {
      newStatus = 'PAID';
      newPaidAt = invoice.paidAt ?? new Date();
    } else if (paidAmountMinor > 0) {
      newStatus = 'PARTIAL';
      newPaidAt = null;
    } else {
      const wasPaymentDerived =
        invoice.status === 'PAID' ||
        invoice.status === 'PARTIAL' ||
        PAID_STATUSES_SET.has(invoice.status);
      newStatus = wasPaymentDerived ? 'SENT' : invoice.status;
      newPaidAt = null;
    }

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus, paidAt: newPaidAt },
    });
  }

  async list(user: JwtPayload, query: ListInvoicesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy = this.getInvoiceOrderBy(query.sortBy, sortOrder);
    const issueDateFrom = query.issueDateFrom
      ? this.parseFilterDate(query.issueDateFrom, 'startOfDay', 'issueDateFrom')
      : undefined;
    const issueDateTo = query.issueDateTo
      ? this.parseFilterDate(query.issueDateTo, 'endOfDay', 'issueDateTo')
      : undefined;
    const dueDateFrom = query.dueDateFrom
      ? this.parseFilterDate(query.dueDateFrom, 'startOfDay', 'dueDateFrom')
      : undefined;
    const dueDateTo = query.dueDateTo
      ? this.parseFilterDate(query.dueDateTo, 'endOfDay', 'dueDateTo')
      : undefined;

    const where: Prisma.InvoiceWhereInput = {
      accountId: user.accountId,
      deletedAt: null,
      ...(search
        ? {
            invoiceNumber: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.status
        ? {
            status: query.status,
          }
        : {}),
      ...(query.customerId
        ? {
            customerId: query.customerId,
          }
        : {}),
      ...((query.issueDateFrom || query.issueDateTo)
        ? {
            issueDate: {
              ...(issueDateFrom ? { gte: issueDateFrom } : {}),
              ...(issueDateTo ? { lte: issueDateTo } : {}),
            },
          }
        : {}),
      ...((query.dueDateFrom || query.dueDateTo)
        ? {
            dueDate: {
              ...(dueDateFrom ? { gte: dueDateFrom } : {}),
              ...(dueDateTo ? { lte: dueDateTo } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: INVOICE_INCLUDE,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(data.map(attachPaymentDerived), page, limit, total);
  }

  async getById(user: JwtPayload, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        accountId: user.accountId,
        deletedAt: null,
      },
      include: INVOICE_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return attachPaymentDerived(invoice);
  }

  private async ensureCustomerOwnership(
    user: JwtPayload,
    customerId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        accountId: user.accountId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found for account');
    }
  }

  private calculateLineBaseMinor(quantity: number, unitPriceMinor: number): number {
    return Math.round(quantity * unitPriceMinor);
  }

  private calculateLineTaxMinor(baseMinor: number, taxRate?: number | null): number {
    if (taxRate === null || taxRate === undefined || taxRate === 0) {
      return 0;
    }

    return Math.round((baseMinor * taxRate) / 100);
  }

  private calculateTotals(lines: InvoiceLineDto[]): CalculatedInvoiceTotals {
    if (!lines.length) {
      throw new BadRequestException('At least one invoice line is required');
    }

    let subTotalMinor = 0;
    let taxMinor = 0;

    const normalizedLines = lines.map((line) => {
      const baseMinor = this.calculateLineBaseMinor(line.quantity, line.unitPriceMinor);
      const lineTaxMinor = this.calculateLineTaxMinor(baseMinor, line.taxRate);
      const lineTotalMinor = baseMinor + lineTaxMinor;

      subTotalMinor += baseMinor;
      taxMinor += lineTaxMinor;

      return {
        itemName: line.itemName,
        description: line.description ?? null,
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
        taxCode: line.taxCode ?? null,
        taxRate: line.taxRate ?? null,
        lineTotalMinor,
      };
    });

    const discountMinor = 0;
    const totalMinor = subTotalMinor + taxMinor - discountMinor;

    return {
      subTotalMinor,
      taxMinor,
      discountMinor,
      totalMinor,
      lines: normalizedLines,
    };
  }

  private buildCreateData(
    user: JwtPayload,
    dto: CreateInvoiceDto,
    invoiceNumber: string,
    totals: CalculatedInvoiceTotals,
  ): Prisma.InvoiceUncheckedCreateInput {
    const status = dto.status ?? 'DRAFT';
    return {
      accountId: user.accountId,
      customerId: dto.customerId,
      invoiceNumber,
      status,
      issueDate: new Date(dto.issueDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      currency: dto.currency ?? 'AZN',
      subTotalMinor: totals.subTotalMinor,
      taxMinor: totals.taxMinor,
      discountMinor: totals.discountMinor,
      totalMinor: totals.totalMinor,
      notes: dto.notes ?? null,
      paidAt: PAID_STATUSES_SET.has(status) ? new Date() : null,
      lines: {
        create: totals.lines,
      },
    };
  }

  async create(user: JwtPayload, dto: CreateInvoiceDto) {
    await this.ensureCustomerOwnership(user, dto.customerId);

    const totals = this.calculateTotals(dto.lines);
    const normalizedInvoiceNumber = this.normalizeInvoiceNumber(dto.invoiceNumber);
    const isAutoGenerated = normalizedInvoiceNumber === null;

    if (!isAutoGenerated) {
      const invoiceNumber = normalizedInvoiceNumber;

      await this.ensureUniqueInvoiceNumber(user.accountId, invoiceNumber);

      try {
        const created = await this.prisma.invoice.create({
          data: this.buildCreateData(user, dto, invoiceNumber, totals),
          include: INVOICE_INCLUDE,
        });
        return attachPaymentDerived(created);
      } catch (error) {
        if (this.isInvoiceNumberUniqueViolation(error)) {
          throw new ConflictException('Invoice number already exists for account');
        }

        throw error;
      }
    }

    for (let attempt = 1; attempt <= AUTO_INVOICE_NUMBER_MAX_RETRIES; attempt += 1) {
      const invoiceNumber = await this.generateInvoiceNumber(user.accountId);

      try {
        const created = await this.prisma.invoice.create({
          data: this.buildCreateData(user, dto, invoiceNumber, totals),
          include: INVOICE_INCLUDE,
        });
        return attachPaymentDerived(created);
      } catch (error) {
        if (!this.isInvoiceNumberUniqueViolation(error)) {
          throw error;
        }

        if (attempt === AUTO_INVOICE_NUMBER_MAX_RETRIES) {
          throw new ConflictException(
            'Unable to generate a unique invoice number for account after multiple attempts',
          );
        }
      }
    }

    throw new ConflictException(
      'Unable to generate a unique invoice number for account',
    );
  }

  async update(user: JwtPayload, invoiceId: string, dto: UpdateInvoiceDto) {
    const existing = await this.getById(user, invoiceId);

    if (dto.customerId) {
      await this.ensureCustomerOwnership(user, dto.customerId);
    }

    const totals = dto.lines ? this.calculateTotals(dto.lines) : null;
    const normalizedInvoiceNumberRaw =
      dto.invoiceNumber !== undefined
        ? this.normalizeInvoiceNumber(dto.invoiceNumber)
        : undefined;
    const normalizedInvoiceNumber =
      normalizedInvoiceNumberRaw === null ? undefined : normalizedInvoiceNumberRaw;

    if (normalizedInvoiceNumber !== undefined) {
      await this.ensureUniqueInvoiceNumber(
        user.accountId,
        normalizedInvoiceNumber,
        invoiceId,
      );
    }

    let paidAtUpdate: Date | null | undefined;
    if (dto.status !== undefined) {
      const newStatusIsPaid = PAID_STATUSES_SET.has(dto.status);
      const oldStatusIsPaid = PAID_STATUSES_SET.has(existing.status);
      if (newStatusIsPaid && !existing.paidAt) {
        paidAtUpdate = new Date();
      } else if (!newStatusIsPaid && oldStatusIsPaid) {
        paidAtUpdate = null;
      }
    }

    const data: Prisma.InvoiceUpdateInput = {
      ...(dto.customerId !== undefined
        ? { customer: { connect: { id: dto.customerId } } }
        : {}),
      ...(dto.invoiceNumber !== undefined
        ? { invoiceNumber: normalizedInvoiceNumber }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.issueDate !== undefined
        ? { issueDate: new Date(dto.issueDate) }
        : {}),
      ...(dto.dueDate !== undefined
        ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
        : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(paidAtUpdate !== undefined ? { paidAt: paidAtUpdate } : {}),
      ...(totals
        ? {
            subTotalMinor: totals.subTotalMinor,
            taxMinor: totals.taxMinor,
            discountMinor: totals.discountMinor,
            totalMinor: totals.totalMinor,
          }
        : {}),
    };

    return this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data,
      });

      if (totals) {
        const now = new Date();

        await tx.invoiceLine.updateMany({
          where: {
            invoiceId,
            deletedAt: null,
          },
          data: {
            deletedAt: now,
          },
        });

        await tx.invoiceLine.createMany({
          data: totals.lines.map((line) => ({
            invoiceId,
            itemName: line.itemName,
            description: line.description ?? null,
            quantity: line.quantity,
            unitPriceMinor: line.unitPriceMinor,
            taxCode: line.taxCode ?? null,
            taxRate: line.taxRate ?? null,
            lineTotalMinor: line.lineTotalMinor,
          })),
        });
      }

      const invoice = await tx.invoice.findFirst({
        where: {
          id: invoiceId,
          accountId: user.accountId,
          deletedAt: null,
        },
        include: INVOICE_INCLUDE,
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      return attachPaymentDerived(invoice);
    });
  }

  async remove(user: JwtPayload, invoiceId: string) {
    await this.getById(user, invoiceId);

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.invoicePayment.updateMany({
        where: { invoiceId, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.invoiceLine.updateMany({
        where: { invoiceId, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { deletedAt: now },
      }),
    ]);

    return { deleted: true, id: invoiceId };
  }

  // ─── PDF ───────────────────────────────────────────────────────────────────

  private formatMoney(amountMinor: number, currency: string): string {
    return `${(amountMinor / 100).toFixed(2)} ${currency}`;
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  async generatePdf(user: JwtPayload, invoiceId: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await this.getById(user, invoiceId);

    const account = await this.prisma.account.findUnique({
      where: { id: user.accountId },
      include: { companyProfile: true },
    });

    const profile = account?.companyProfile;
    const companyName = profile?.companyName ?? account?.name ?? '';
    const taxId = profile?.taxId ?? null;
    const phone = profile?.mobilePhone ?? null;
    const currency = invoice.currency;

    const buffer = await this.buildInvoicePdf(invoice, companyName, taxId, phone, currency);
    return { buffer, invoiceNumber: invoice.invoiceNumber };
  }

  async sendInvoice(user: JwtPayload, invoiceId: string): Promise<{ success: true }> {
    const invoice = await this.getById(user, invoiceId);

    if (!invoice.customer?.email) {
      throw new BadRequestException('Customer does not have an email address');
    }

    const account = await this.prisma.account.findUnique({
      where: { id: user.accountId },
      include: { companyProfile: true },
    });

    const profile = account?.companyProfile;
    const companyName = profile?.companyName ?? account?.name ?? '';
    const taxId = profile?.taxId ?? null;
    const phone = profile?.mobilePhone ?? null;

    const buffer = await this.buildInvoicePdf(invoice, companyName, taxId, phone, invoice.currency);

    this.logger.log(`Sending invoice ${invoice.invoiceNumber} to customer (${invoice.customer.email.slice(0, 3)}***)`);

    await this.emailService.sendInvoiceEmail(
      invoice.customer.email,
      {
        invoiceNumber: invoice.invoiceNumber,
        totalMinor: invoice.totalMinor,
        currency: invoice.currency,
        notes: invoice.notes,
      },
      buffer,
    );

    return { success: true };
  }

  private buildInvoicePdf(
    invoice: EnrichedInvoice,
    companyName: string,
    taxId: string | null,
    phone: string | null,
    currency: string,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const L = 50;
      const R = 545;
      const W = R - L;

      const C_PRIMARY = '#1a56db';
      const C_DARK    = '#111827';
      const C_GRAY    = '#6b7280';
      const C_LIGHT   = '#e5e7eb';
      const C_GREEN   = '#16a34a';
      const C_RED     = '#dc2626';

      // ── Company name (left) + INVOICE title (right) ──────────
      doc.fontSize(14).fillColor(C_PRIMARY).font('Helvetica-Bold')
         .text(companyName, L, 50, { width: 250, lineBreak: false });

      doc.fontSize(24).fillColor(C_PRIMARY).font('Helvetica-Bold')
         .text('INVOICE', L, 44, { width: W, align: 'right' });

      let companyY = 70;
      doc.fontSize(9).font('Helvetica').fillColor(C_GRAY);
      if (taxId) { doc.text(`Tax ID: ${taxId}`, L, companyY, { lineBreak: false }); companyY += 13; }
      if (phone)  { doc.text(`Phone: ${phone}`,   L, companyY, { lineBreak: false }); companyY += 13; }

      // ── Invoice metadata (right column) ──────────────────────
      const META_LABEL_X = 378;
      const META_LABEL_W = 72;
      const META_VALUE_X = 460;
      const META_VALUE_W = 85;
      const metaRows: [string, string][] = [
        ['Invoice #:', invoice.invoiceNumber],
        ['Issue Date:', this.formatDate(invoice.issueDate)],
        ['Due Date:', this.formatDate(invoice.dueDate)],
        ['Status:', invoice.status],
      ];
      let metaY = 74;
      for (const [label, value] of metaRows) {
        doc.fontSize(9).fillColor(C_GRAY).font('Helvetica')
           .text(label, META_LABEL_X, metaY, { width: META_LABEL_W, align: 'right', lineBreak: false });
        doc.fontSize(9).fillColor(C_DARK).font('Helvetica-Bold')
           .text(value, META_VALUE_X, metaY, { width: META_VALUE_W, lineBreak: false });
        metaY += 16;
      }

      // ── Separator ─────────────────────────────────────────────
      const sep1Y = Math.max(companyY, metaY) + 12;
      doc.moveTo(L, sep1Y).lineTo(R, sep1Y).strokeColor(C_LIGHT).lineWidth(1).stroke();

      // ── Bill To ───────────────────────────────────────────────
      let billY = sep1Y + 14;
      doc.fontSize(8).fillColor(C_GRAY).font('Helvetica')
         .text('BILL TO', L, billY, { lineBreak: false });
      billY += 14;

      const cust = invoice.customer;
      doc.fontSize(11).fillColor(C_DARK).font('Helvetica-Bold')
         .text(cust.displayName, L, billY, { lineBreak: false });
      billY += 16;

      doc.fontSize(9).font('Helvetica').fillColor(C_GRAY);
      if (cust.companyName) { doc.text(cust.companyName, L, billY, { lineBreak: false }); billY += 13; }
      if (cust.email)       { doc.text(cust.email,       L, billY, { lineBreak: false }); billY += 13; }
      if (cust.phone)       { doc.text(cust.phone,       L, billY, { lineBreak: false }); billY += 13; }
      if (cust.taxId)       { doc.text(`Tax ID: ${cust.taxId}`, L, billY, { lineBreak: false }); billY += 13; }

      // ── Separator ─────────────────────────────────────────────
      const sep2Y = billY + 12;
      doc.moveTo(L, sep2Y).lineTo(R, sep2Y).strokeColor(C_LIGHT).lineWidth(1).stroke();

      // ── Line Items Table ──────────────────────────────────────
      const TABLE_TOP = sep2Y + 8;
      const ROW_H = 22;
      const COL = { item: L + 4, qty: 310, price: 368, total: 460 };

      doc.rect(L, TABLE_TOP, W, ROW_H).fill('#f3f4f6');
      doc.fontSize(9).fillColor('#374151').font('Helvetica-Bold');
      doc.text('Item',       COL.item,  TABLE_TOP + 7, { width: 246, lineBreak: false });
      doc.text('Qty',        COL.qty,   TABLE_TOP + 7, { width:  50, lineBreak: false });
      doc.text('Unit Price', COL.price, TABLE_TOP + 7, { width:  87, lineBreak: false });
      doc.text('Total',      COL.total, TABLE_TOP + 7, { width:  85, align: 'right', lineBreak: false });

      let rowY = TABLE_TOP + ROW_H;
      for (const line of invoice.lines) {
        const qty = Number(line.quantity);
        const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(2);

        doc.fontSize(9).fillColor(C_DARK).font('Helvetica');
        doc.text(line.itemName,                                          COL.item,  rowY + 6, { width: 246, lineBreak: false });
        doc.text(qtyStr,                                                 COL.qty,   rowY + 6, { width:  50, lineBreak: false });
        doc.text(this.formatMoney(line.unitPriceMinor, currency),        COL.price, rowY + 6, { width:  87, lineBreak: false });
        doc.text(this.formatMoney(line.lineTotalMinor, currency),        COL.total, rowY + 6, { width:  85, align: 'right', lineBreak: false });

        rowY += ROW_H;
        doc.moveTo(L, rowY).lineTo(R, rowY).strokeColor(C_LIGHT).lineWidth(0.5).stroke();
      }

      // ── Totals ────────────────────────────────────────────────
      const TOT_LBL_X = 370;
      const TOT_LBL_W = 80;
      const TOT_VAL_X = 460;
      const TOT_VAL_W = 85;
      let totY = rowY + 16;

      const drawTotalRow = (label: string, amount: number, color = C_DARK, bold = false) => {
        doc.fontSize(9).fillColor(C_GRAY).font('Helvetica')
           .text(label, TOT_LBL_X, totY, { width: TOT_LBL_W, align: 'right', lineBreak: false });
        doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(this.formatMoney(amount, currency), TOT_VAL_X, totY, { width: TOT_VAL_W, align: 'right', lineBreak: false });
        totY += 15;
      };

      drawTotalRow('Subtotal:', invoice.subTotalMinor);
      if (invoice.taxMinor > 0) drawTotalRow('Tax:', invoice.taxMinor);

      doc.moveTo(TOT_LBL_X, totY).lineTo(R, totY).strokeColor(C_GRAY).lineWidth(0.5).stroke();
      totY += 8;

      doc.fontSize(11).fillColor(C_DARK).font('Helvetica-Bold')
         .text('Total:', TOT_LBL_X, totY, { width: TOT_LBL_W, align: 'right', lineBreak: false });
      doc.text(this.formatMoney(invoice.totalMinor, currency), TOT_VAL_X, totY, { width: TOT_VAL_W, align: 'right', lineBreak: false });
      totY += 22;

      if (invoice.paidAmountMinor > 0) {
        drawTotalRow('Paid:', invoice.paidAmountMinor, C_GREEN, true);
      }

      const outColor = invoice.outstandingMinor <= 0 ? C_GREEN : C_RED;
      doc.fontSize(9).fillColor(C_GRAY).font('Helvetica')
         .text('Outstanding:', TOT_LBL_X, totY, { width: TOT_LBL_W, align: 'right', lineBreak: false });
      doc.fillColor(outColor).font('Helvetica-Bold')
         .text(this.formatMoney(invoice.outstandingMinor, currency), TOT_VAL_X, totY, { width: TOT_VAL_W, align: 'right', lineBreak: false });

      // ── Notes ─────────────────────────────────────────────────
      if (invoice.notes) {
        const notesY = totY + 28;
        doc.moveTo(L, notesY).lineTo(R, notesY).strokeColor(C_LIGHT).lineWidth(0.5).stroke();
        doc.fontSize(9).fillColor(C_GRAY).font('Helvetica')
           .text('Notes:', L, notesY + 12, { lineBreak: false });
        doc.fillColor(C_DARK)
           .text(invoice.notes, L, notesY + 26, { width: W });
      }

      doc.end();
    });
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async listPayments(user: JwtPayload, invoiceId: string) {
    await this.getById(user, invoiceId);

    return this.prisma.invoicePayment.findMany({
      where: { invoiceId, accountId: user.accountId, deletedAt: null },
      orderBy: { paymentDate: 'asc' },
    });
  }

  async addPayment(
    user: JwtPayload,
    invoiceId: string,
    dto: CreateInvoicePaymentDto,
  ) {
    const invoice = await this.getById(user, invoiceId);

    if (invoice.outstandingMinor <= 0) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    if (dto.amountMinor > invoice.outstandingMinor) {
      throw new BadRequestException(
        `Payment amount (${dto.amountMinor}) exceeds outstanding balance (${invoice.outstandingMinor})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          accountId: user.accountId,
          invoiceId,
          amountMinor: dto.amountMinor,
          paymentDate: new Date(dto.paymentDate),
          method: dto.method ?? null,
          reference: dto.reference ?? null,
          note: dto.note ?? null,
        },
      });

      await this.recalculateInvoiceState(tx, invoiceId);

      const updated = await tx.invoice.findFirst({
        where: { id: invoiceId },
        include: INVOICE_INCLUDE,
      });

      return attachPaymentDerived(updated!);
    });
  }

  async removePayment(
    user: JwtPayload,
    invoiceId: string,
    paymentId: string,
  ) {
    await this.getById(user, invoiceId);

    const payment = await this.prisma.invoicePayment.findFirst({
      where: {
        id: paymentId,
        invoiceId,
        accountId: user.accountId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.update({
        where: { id: paymentId },
        data: { deletedAt: new Date() },
      });

      await this.recalculateInvoiceState(tx, invoiceId);

      const updated = await tx.invoice.findFirst({
        where: { id: invoiceId },
        include: INVOICE_INCLUDE,
      });

      return attachPaymentDerived(updated!);
    });
  }
}
