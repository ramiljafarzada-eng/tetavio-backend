import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillLineDto } from './dto/bill-line.dto';
import { ListBillsQueryDto, type BillSortField } from './dto/list-bills-query.dto';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';

type CalculatedBillLine = {
  itemName: string;
  description: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

type CalculatedBillTotals = {
  totalMinor: number;
  lines: CalculatedBillLine[];
};

const AUTO_BILL_NUMBER_MAX_RETRIES = 5;

const BILL_INCLUDE = {
  vendor: true,
  lines: { where: { deletedAt: null as null } },
} satisfies Prisma.BillInclude;

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private getBillOrderBy(
    sortBy?: BillSortField,
    sortOrder: Prisma.SortOrder = 'desc',
  ): Prisma.BillOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'dueDate':
        return [{ dueDate: sortOrder }, { createdAt: 'desc' }];
      case 'createdAt':
        return [{ createdAt: sortOrder }];
      case 'billNumber':
        return [{ billNumber: sortOrder }, { createdAt: 'desc' }];
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

  private isBillNumberUniqueViolation(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    if (error.code !== 'P2002') return false;
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    const normalized = target.map((v) => String(v));
    const hasAccount = normalized.includes('accountId') || normalized.includes('account_id');
    const hasBill = normalized.includes('billNumber') || normalized.includes('bill_number');
    return hasAccount && hasBill;
  }

  private normalizeBillNumber(billNumber?: string | null): string | null {
    if (billNumber === null || billNumber === undefined) return null;
    const normalized = billNumber.trim();
    if (!normalized) throw new BadRequestException('Bill number cannot be empty');
    return normalized;
  }

  private async ensureUniqueBillNumber(
    accountId: string,
    billNumber: string,
    excludeBillId?: string,
  ): Promise<void> {
    const existing = await this.prisma.bill.findFirst({
      where: {
        accountId,
        billNumber,
        ...(excludeBillId ? { id: { not: excludeBillId } } : {}),
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Bill number already exists for account');
  }

  private async generateBillNumber(accountId: string): Promise<string> {
    const bills = await this.prisma.bill.findMany({
      where: { accountId, billNumber: { startsWith: 'BILL-' } },
      select: { billNumber: true },
    });

    let maxSequence = 0;
    for (const bill of bills) {
      const match = /^BILL-(\d{6})$/.exec(bill.billNumber);
      if (!match) continue;
      const sequence = Number(match[1]);
      if (sequence > maxSequence) maxSequence = sequence;
    }

    while (true) {
      maxSequence += 1;
      const candidate = `BILL-${String(maxSequence).padStart(6, '0')}`;
      const collision = await this.prisma.bill.findFirst({
        where: { accountId, billNumber: candidate },
        select: { id: true },
      });
      if (!collision) return candidate;
    }
  }

  private async ensureVendorOwnership(user: JwtPayload, vendorId: string): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, accountId: user.accountId, deletedAt: null },
      select: { id: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found for account');
  }

  private calculateTotals(lines: BillLineDto[]): CalculatedBillTotals {
    if (!lines.length) throw new BadRequestException('At least one bill line is required');

    let totalMinor = 0;
    const calculatedLines = lines.map((line) => {
      const lineTotalMinor = Math.round(line.quantity * line.unitPriceMinor);
      totalMinor += lineTotalMinor;
      return {
        itemName: line.itemName,
        description: line.description ?? null,
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
        lineTotalMinor,
      };
    });

    return { totalMinor, lines: calculatedLines };
  }

  private buildCreateData(
    user: JwtPayload,
    dto: CreateBillDto,
    billNumber: string,
    totals: CalculatedBillTotals,
  ): Prisma.BillUncheckedCreateInput {
    return {
      accountId: user.accountId,
      vendorId: dto.vendorId,
      billNumber,
      status: dto.status ?? 'DRAFT',
      issueDate: new Date(dto.issueDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      currency: dto.currency ?? 'AZN',
      totalMinor: totals.totalMinor,
      notes: dto.notes ?? null,
      lines: { create: totals.lines },
    };
  }

  // ─── Public methods ─────────────────────────────────────────────────────────

  async list(user: JwtPayload, query: ListBillsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy = this.getBillOrderBy(query.sortBy, sortOrder);

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

    const where: Prisma.BillWhereInput = {
      accountId: user.accountId,
      deletedAt: null,
      ...(search ? { billNumber: { contains: search, mode: 'insensitive' } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
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
      this.prisma.bill.findMany({ where, orderBy, skip, take: limit, include: BILL_INCLUDE }),
      this.prisma.bill.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async getById(user: JwtPayload, billId: string) {
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, accountId: user.accountId, deletedAt: null },
      include: BILL_INCLUDE,
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async create(user: JwtPayload, dto: CreateBillDto) {
    await this.ensureVendorOwnership(user, dto.vendorId);

    const totals = this.calculateTotals(dto.lines);
    const normalizedBillNumber = this.normalizeBillNumber(dto.billNumber);
    const isAutoGenerated = normalizedBillNumber === null;

    if (!isAutoGenerated) {
      const billNumber = normalizedBillNumber;
      await this.ensureUniqueBillNumber(user.accountId, billNumber);
      try {
        const bill = await this.prisma.bill.create({
          data: this.buildCreateData(user, dto, billNumber, totals),
          include: BILL_INCLUDE,
        });
        this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bill.created', entityType: 'bill', entityId: bill.id, metadata: { billNumber: bill.billNumber, totalMinor: bill.totalMinor, status: bill.status } }).catch(() => {});
        return bill;
      } catch (error) {
        if (this.isBillNumberUniqueViolation(error)) {
          throw new ConflictException('Bill number already exists for account');
        }
        throw error;
      }
    }

    for (let attempt = 1; attempt <= AUTO_BILL_NUMBER_MAX_RETRIES; attempt += 1) {
      const billNumber = await this.generateBillNumber(user.accountId);
      try {
        const bill = await this.prisma.bill.create({
          data: this.buildCreateData(user, dto, billNumber, totals),
          include: BILL_INCLUDE,
        });
        this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bill.created', entityType: 'bill', entityId: bill.id, metadata: { billNumber: bill.billNumber, totalMinor: bill.totalMinor, status: bill.status } }).catch(() => {});
        return bill;
      } catch (error) {
        if (!this.isBillNumberUniqueViolation(error)) throw error;
        if (attempt === AUTO_BILL_NUMBER_MAX_RETRIES) {
          throw new ConflictException('Unable to generate a unique bill number after multiple attempts');
        }
      }
    }

    throw new ConflictException('Unable to generate a unique bill number');
  }

  async update(user: JwtPayload, billId: string, dto: UpdateBillDto) {
    await this.getById(user, billId);

    if (dto.vendorId) await this.ensureVendorOwnership(user, dto.vendorId);

    const totals = dto.lines ? this.calculateTotals(dto.lines) : null;
    const normalizedBillNumberRaw =
      dto.billNumber !== undefined ? this.normalizeBillNumber(dto.billNumber) : undefined;
    const normalizedBillNumber =
      normalizedBillNumberRaw === null ? undefined : normalizedBillNumberRaw;

    if (normalizedBillNumber !== undefined) {
      await this.ensureUniqueBillNumber(user.accountId, normalizedBillNumber, billId);
    }

    const data: Prisma.BillUpdateInput = {
      ...(dto.vendorId !== undefined ? { vendor: { connect: { id: dto.vendorId } } } : {}),
      ...(dto.billNumber !== undefined ? { billNumber: normalizedBillNumber } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.issueDate !== undefined ? { issueDate: new Date(dto.issueDate) } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(totals ? { totalMinor: totals.totalMinor } : {}),
    };

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.bill.update({ where: { id: billId }, data });

      if (totals) {
        const now = new Date();
        await tx.billLine.updateMany({
          where: { billId, deletedAt: null },
          data: { deletedAt: now },
        });
        await tx.billLine.createMany({
          data: totals.lines.map((line) => ({
            billId,
            itemName: line.itemName,
            description: line.description ?? null,
            quantity: line.quantity,
            unitPriceMinor: line.unitPriceMinor,
            lineTotalMinor: line.lineTotalMinor,
          })),
        });
      }

      const bill = await tx.bill.findFirst({
        where: { id: billId, accountId: user.accountId, deletedAt: null },
        include: BILL_INCLUDE,
      });
      if (!bill) throw new NotFoundException('Bill not found');
      return bill;
    });

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bill.updated', entityType: 'bill', entityId: billId, metadata: { billNumber: result.billNumber, status: result.status } }).catch(() => {});
    return result;
  }

  async remove(user: JwtPayload, billId: string) {
    const bill = await this.getById(user, billId);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.billLine.updateMany({ where: { billId, deletedAt: null }, data: { deletedAt: now } }),
      this.prisma.bill.update({ where: { id: billId }, data: { deletedAt: now } }),
    ]);

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bill.deleted', entityType: 'bill', entityId: billId, metadata: { billNumber: bill.billNumber } }).catch(() => {});
    return { deleted: true, id: billId };
  }
}
