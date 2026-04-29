import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
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

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: {
          customer: true,
          lines: {
            where: {
              deletedAt: null,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async getById(user: JwtPayload, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        accountId: user.accountId,
        deletedAt: null,
      },
      include: {
        customer: true,
        lines: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
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
        return await this.prisma.invoice.create({
          data: this.buildCreateData(user, dto, invoiceNumber, totals),
          include: {
            customer: true,
            lines: {
              where: {
                deletedAt: null,
              },
            },
          },
        });
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
        return await this.prisma.invoice.create({
          data: this.buildCreateData(user, dto, invoiceNumber, totals),
          include: {
            customer: true,
            lines: {
              where: {
                deletedAt: null,
              },
            },
          },
        });
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
        include: {
          customer: true,
          lines: {
            where: {
              deletedAt: null,
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      return invoice;
    });
  }

  async remove(user: JwtPayload, invoiceId: string) {
    await this.getById(user, invoiceId);

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.invoiceLine.updateMany({
        where: {
          invoiceId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          deletedAt: now,
        },
      }),
    ]);

    return { deleted: true, id: invoiceId };
  }
}
