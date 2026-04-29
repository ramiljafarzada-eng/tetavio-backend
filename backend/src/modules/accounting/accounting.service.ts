import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';
import { CreateAccountingAccountDto } from './dto/create-accounting-account.dto';
import { UpdateAccountingAccountDto } from './dto/update-accounting-account.dto';
import { ListAccountingAccountsQueryDto } from './dto/list-accounting-accounts-query.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { ListJournalEntriesQueryDto } from './dto/list-journal-entries-query.dto';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── helpers ───────────────────────────────────────────────────────────────

  private mapAccount(acc: {
    id: string;
    code: string;
    name: string;
    type: string;
    isActive: boolean;
    balanceMinor: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountType: acc.type,
      status: acc.isActive ? 'Aktiv' : 'Passiv',
      balance: acc.balanceMinor / 100,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    };
  }

  private mapJournalEntry(entry: {
    id: string;
    journalNumber: string;
    reference: string | null;
    entryDate: Date;
    createdAt: Date;
    updatedAt: Date;
    lines: Array<{
      id: string;
      debitMinor: number;
      creditMinor: number;
      description: string | null;
      accountingAccount: { code: string };
    }>;
  }) {
    const totalDebitMinor = entry.lines.reduce((s, l) => s + l.debitMinor, 0);
    const totalCreditMinor = entry.lines.reduce((s, l) => s + l.creditMinor, 0);
    const debitLine = entry.lines.find((l) => l.debitMinor > 0);
    const creditLine = entry.lines.find((l) => l.creditMinor > 0);

    return {
      id: entry.id,
      journalNumber: entry.journalNumber,
      reference: entry.reference ?? '',
      debitAccount: debitLine?.accountingAccount.code ?? '',
      creditAccount: creditLine?.accountingAccount.code ?? '',
      date: entry.entryDate.toISOString().slice(0, 10),
      debit: totalDebitMinor / 100,
      credit: totalCreditMinor / 100,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      journalLines: entry.lines.map((line) => ({
        id: line.id,
        accountCode: line.accountingAccount.code,
        entryType: line.debitMinor > 0 ? 'Debet' : 'Kredit',
        amount: (line.debitMinor > 0 ? line.debitMinor : line.creditMinor) / 100,
        subledgerCategory: line.description ?? '',
        linkedEntityType: '',
        linkedEntityId: '',
        linkedEntityName: '',
      })),
    };
  }

  private async resolveAccountCodes(
    accountId: string,
    codes: string[],
  ): Promise<Map<string, string>> {
    const uniqueCodes = [...new Set(codes)];
    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        accountId,
        code: { in: uniqueCodes },
        deletedAt: null,
      },
      select: { id: true, code: true },
    });
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.code, a.id));
    return map;
  }

  private validateJournalBalance(lines: { entryType: 'Debet' | 'Kredit'; amount: number }[]) {
    const debitTotal = lines
      .filter((l) => l.entryType === 'Debet')
      .reduce((s, l) => s + l.amount, 0);
    const creditTotal = lines
      .filter((l) => l.entryType === 'Kredit')
      .reduce((s, l) => s + l.amount, 0);

    if (debitTotal === 0 || creditTotal === 0) {
      throw new BadRequestException(
        'Journal entry must have at least one debit and one credit line',
      );
    }
    const diff = Math.abs(Math.round(debitTotal * 100) - Math.round(creditTotal * 100));
    if (diff > 0) {
      throw new BadRequestException(
        `Journal entry is not balanced: debit ${debitTotal} ≠ credit ${creditTotal}`,
      );
    }
  }

  private async generateJournalNumber(accountId: string): Promise<string> {
    const count = await this.prisma.journalEntry.count({
      where: { accountId, deletedAt: null },
    });
    const year = new Date().getFullYear();
    return `MJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ─── chart of accounts ─────────────────────────────────────────────────────

  async listAccounts(user: JwtPayload, query: ListAccountingAccountsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 500, 500);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Record<string, unknown> = {
      accountId: user.accountId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.accountingAccount.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.accountingAccount.count({ where }),
    ]);

    return buildPaginatedResponse(data.map((a) => this.mapAccount(a)), page, limit, total);
  }

  async createAccount(user: JwtPayload, dto: CreateAccountingAccountDto) {
    const existing = await this.prisma.accountingAccount.findFirst({
      where: {
        accountId: user.accountId,
        code: dto.accountCode,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `An active account with code "${dto.accountCode}" already exists`,
      );
    }

    const created = await this.prisma.accountingAccount.create({
      data: {
        accountId: user.accountId,
        code: dto.accountCode,
        name: dto.accountName,
        type: dto.accountType,
        isActive: (dto.status ?? 'Aktiv') !== 'Passiv',
        balanceMinor: Math.round((dto.balance ?? 0) * 100),
      },
    });

    return this.mapAccount(created);
  }

  async updateAccount(user: JwtPayload, id: string, dto: UpdateAccountingAccountDto) {
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
    });

    if (!account) throw new NotFoundException('Accounting account not found');

    if (dto.accountCode && dto.accountCode !== account.code) {
      const conflict = await this.prisma.accountingAccount.findFirst({
        where: {
          accountId: user.accountId,
          code: dto.accountCode,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `An active account with code "${dto.accountCode}" already exists`,
        );
      }
    }

    const updated = await this.prisma.accountingAccount.update({
      where: { id },
      data: {
        ...(dto.accountCode !== undefined ? { code: dto.accountCode } : {}),
        ...(dto.accountName !== undefined ? { name: dto.accountName } : {}),
        ...(dto.accountType !== undefined ? { type: dto.accountType } : {}),
        ...(dto.status !== undefined ? { isActive: dto.status !== 'Passiv' } : {}),
        ...(dto.balance !== undefined ? { balanceMinor: Math.round(dto.balance * 100) } : {}),
      },
    });

    return this.mapAccount(updated);
  }

  async deleteAccount(user: JwtPayload, id: string) {
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
    });

    if (!account) throw new NotFoundException('Accounting account not found');

    const usedInJournal = await this.prisma.journalEntryLine.findFirst({
      where: { accountingAccountId: id },
      select: { id: true },
    });

    if (usedInJournal) {
      throw new ConflictException(
        'This account cannot be deleted because it is referenced by a journal entry',
      );
    }

    await this.prisma.accountingAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { deleted: true, id };
  }

  // ─── journal entries ────────────────────────────────────────────────────────

  private readonly lineInclude = {
    lines: {
      include: { accountingAccount: { select: { code: true } } },
      orderBy: { debitMinor: 'desc' as const },
    },
  };

  async listJournals(user: JwtPayload, query: ListJournalEntriesQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 100, 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Record<string, unknown> = {
      accountId: user.accountId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { journalNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom) {
      where.entryDate = { ...((where.entryDate as object) || {}), gte: new Date(query.dateFrom) };
    }

    if (query.dateTo) {
      where.entryDate = { ...((where.entryDate as object) || {}), lte: new Date(query.dateTo) };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.journalEntry.findMany({
        where,
        include: this.lineInclude,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return buildPaginatedResponse(data.map((e) => this.mapJournalEntry(e)), page, limit, total);
  }

  async getJournalById(user: JwtPayload, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      include: this.lineInclude,
    });

    if (!entry) throw new NotFoundException('Journal entry not found');
    return this.mapJournalEntry(entry);
  }

  async createJournal(user: JwtPayload, dto: CreateJournalEntryDto) {
    this.validateJournalBalance(dto.journalLines);

    const codes = dto.journalLines.map((l) => l.accountCode);
    const codeToId = await this.resolveAccountCodes(user.accountId, codes);

    const missingCode = codes.find((c) => !codeToId.has(c));
    if (missingCode) {
      throw new BadRequestException(
        `Account code "${missingCode}" not found in your chart of accounts`,
      );
    }

    const journalNumber =
      dto.journalNumber?.trim() || (await this.generateJournalNumber(user.accountId));

    const entry = await this.prisma.journalEntry.create({
      data: {
        accountId: user.accountId,
        journalNumber,
        reference: dto.reference ?? null,
        entryDate: new Date(dto.date),
        lines: {
          create: dto.journalLines.map((line) => ({
            accountingAccountId: codeToId.get(line.accountCode)!,
            description: line.subledgerCategory ?? null,
            debitMinor: line.entryType === 'Debet' ? Math.round(line.amount * 100) : 0,
            creditMinor: line.entryType === 'Kredit' ? Math.round(line.amount * 100) : 0,
          })),
        },
      },
      include: this.lineInclude,
    });

    return this.mapJournalEntry(entry);
  }

  async updateJournal(user: JwtPayload, id: string, dto: UpdateJournalEntryDto) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
    });

    if (!existing) throw new NotFoundException('Journal entry not found');

    if (dto.journalLines) {
      this.validateJournalBalance(dto.journalLines);
    }

    const codes = dto.journalLines?.map((l) => l.accountCode) ?? [];
    const codeToId =
      codes.length > 0
        ? await this.resolveAccountCodes(user.accountId, codes)
        : new Map<string, string>();

    if (codes.length > 0) {
      const missingCode = codes.find((c) => !codeToId.has(c));
      if (missingCode) {
        throw new BadRequestException(
          `Account code "${missingCode}" not found in your chart of accounts`,
        );
      }
    }

    const entry = await this.prisma.$transaction(async (tx) => {
      if (dto.journalLines) {
        await tx.journalEntryLine.deleteMany({ where: { journalEntryId: id } });
      }

      return tx.journalEntry.update({
        where: { id },
        data: {
          ...(dto.journalNumber !== undefined ? { journalNumber: dto.journalNumber } : {}),
          ...(dto.reference !== undefined ? { reference: dto.reference } : {}),
          ...(dto.date !== undefined ? { entryDate: new Date(dto.date) } : {}),
          ...(dto.journalLines
            ? {
                lines: {
                  create: dto.journalLines.map((line) => ({
                    accountingAccountId: codeToId.get(line.accountCode)!,
                    description: line.subledgerCategory ?? null,
                    debitMinor: line.entryType === 'Debet' ? Math.round(line.amount * 100) : 0,
                    creditMinor: line.entryType === 'Kredit' ? Math.round(line.amount * 100) : 0,
                  })),
                },
              }
            : {}),
        },
        include: this.lineInclude,
      });
    });

    return this.mapJournalEntry(entry);
  }

  async deleteJournal(user: JwtPayload, id: string) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
    });

    if (!existing) throw new NotFoundException('Journal entry not found');

    await this.prisma.journalEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { deleted: true, id };
  }
}
