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
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { ListBankAccountsQueryDto } from './dto/list-bank-accounts-query.dto';
import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { ListBankTransactionsQueryDto } from './dto/list-bank-transactions-query.dto';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';

@Injectable()
export class BankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── helpers ─────────────────────────────────────────────────────────────────

  private async ensureBankAccountOwnership(user: JwtPayload, bankAccountId: string) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, accountId: user.accountId, deletedAt: null },
      select: { id: true, name: true, balanceMinor: true, currency: true },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');
    return bankAccount;
  }

  // ─── bank accounts ───────────────────────────────────────────────────────────

  async listAccounts(user: JwtPayload, query: ListBankAccountsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.BankAccountWhereInput = {
      accountId: user.accountId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bankAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bankAccount.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async createAccount(user: JwtPayload, dto: CreateBankAccountDto) {
    const bankAccount = await this.prisma.bankAccount.create({
      data: {
        accountId: user.accountId,
        name: dto.name,
        currency: dto.currency ?? 'AZN',
        balanceMinor: dto.openingBalanceMinor ?? 0,
      },
    });

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bank_account.created', entityType: 'bank_account', entityId: bankAccount.id, metadata: { name: bankAccount.name } }).catch(() => {});
    return bankAccount;
  }

  async updateAccount(user: JwtPayload, bankAccountId: string, dto: UpdateBankAccountDto) {
    await this.ensureBankAccountOwnership(user, bankAccountId);

    const bankAccount = await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      },
    });

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bank_account.updated', entityType: 'bank_account', entityId: bankAccountId, metadata: { name: bankAccount.name } }).catch(() => {});
    return bankAccount;
  }

  async deleteAccount(user: JwtPayload, bankAccountId: string) {
    await this.ensureBankAccountOwnership(user, bankAccountId);

    const activeTransaction = await this.prisma.bankTransaction.findFirst({
      where: { bankAccountId, deletedAt: null },
      select: { id: true },
    });
    if (activeTransaction) {
      throw new ConflictException(
        'Bank account cannot be deleted because it has active transactions',
      );
    }

    await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { deletedAt: new Date() },
    });

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bank_account.deleted', entityType: 'bank_account', entityId: bankAccountId, metadata: {} }).catch(() => {});
    return { deleted: true, id: bankAccountId };
  }

  // ─── bank transactions ───────────────────────────────────────────────────────

  async listTransactions(user: JwtPayload, query: ListBankTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);

    const where: Prisma.BankTransactionWhereInput = {
      accountId: user.accountId,
      deletedAt: null,
      ...(query.bankAccountId ? { bankAccountId: query.bankAccountId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...((dateFrom || dateTo)
        ? {
            transactionDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.bankTransaction.findMany({
        where,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.bankTransaction.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async createTransaction(user: JwtPayload, dto: CreateBankTransactionDto) {
    await this.ensureBankAccountOwnership(user, dto.bankAccountId);

    const balanceDelta = dto.type === 'INFLOW' ? dto.amountMinor : -dto.amountMinor;

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bankTransaction.create({
        data: {
          accountId: user.accountId,
          bankAccountId: dto.bankAccountId,
          type: dto.type,
          amountMinor: dto.amountMinor,
          description: dto.description ?? null,
          reference: dto.reference ?? null,
          transactionDate: new Date(dto.transactionDate),
        },
      });

      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: { balanceMinor: { increment: balanceDelta } },
      });

      return created;
    });

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bank_transaction.created', entityType: 'bank_transaction', entityId: transaction.id, metadata: { type: dto.type, amountMinor: dto.amountMinor } }).catch(() => {});
    return transaction;
  }

  async deleteTransaction(user: JwtPayload, transactionId: string) {
    const transaction = await this.prisma.bankTransaction.findFirst({
      where: { id: transactionId, accountId: user.accountId, deletedAt: null },
      select: { id: true, bankAccountId: true, type: true, amountMinor: true },
    });
    if (!transaction) throw new NotFoundException('Bank transaction not found');

    const reversalDelta = transaction.type === 'INFLOW'
      ? -transaction.amountMinor
      : transaction.amountMinor;

    await this.prisma.$transaction([
      this.prisma.bankTransaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.bankAccount.update({
        where: { id: transaction.bankAccountId },
        data: { balanceMinor: { increment: reversalDelta } },
      }),
    ]);

    this.audit.logAction({ accountId: user.accountId, actorUserId: user.sub, action: 'bank_transaction.deleted', entityType: 'bank_transaction', entityId: transactionId, metadata: { type: transaction.type, amountMinor: transaction.amountMinor } }).catch(() => {});
    return { deleted: true, id: transactionId };
  }
}
