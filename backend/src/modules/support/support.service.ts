import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SupportAuthorType, SupportThreadStatus } from '@prisma/client';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportThreadDto } from './dto/create-support-thread.dto';
import { ListSupportThreadsQueryDto } from './dto/list-support-threads-query.dto';
import { ReplySupportMessageDto } from './dto/reply-support-message.dto';
import { UpdateSupportThreadStatusDto } from './dto/update-support-thread-status.dto';

const THREAD_SELECT = {
  id: true,
  accountId: true,
  subject: true,
  category: true,
  priority: true,
  status: true,
  context: true,
  unreadForAccount: true,
  unreadForAdmin: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  createdByUser: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  account: {
    select: {
      id: true,
      name: true,
    },
  },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      authorType: true,
      body: true,
      createdAt: true,
      authorUser: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  },
} satisfies Prisma.SupportThreadSelect;

type SupportThreadRow = Prisma.SupportThreadGetPayload<{
  select: typeof THREAD_SELECT;
}>;

function normalizeStatus(status: SupportThreadStatus | null | undefined): string {
  return status ? String(status).toLowerCase() : 'open';
}

function toThreadResponse(row: SupportThreadRow) {
  return {
    id: row.id,
    accountId: row.accountId,
    accountKey: row.accountId,
    ownerEmail: row.createdByUser.email,
    ownerName: row.createdByUser.fullName || row.createdByUser.email,
    companyName: row.account.name,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: normalizeStatus(row.status),
    context: row.context || '',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    unreadForAdmin: row.unreadForAdmin,
    unreadForUser: row.unreadForAccount,
    messages: row.messages.map((message) => ({
      id: message.id,
      authorType: message.authorType === SupportAuthorType.SUPER_ADMIN ? 'admin' : 'user',
      authorName:
        message.authorType === SupportAuthorType.SUPER_ADMIN
          ? message.authorUser?.fullName || message.authorUser?.email || 'Support'
          : message.authorUser?.fullName || message.authorUser?.email || row.createdByUser.email,
      authorEmail:
        message.authorUser?.email ||
        (message.authorType === SupportAuthorType.SUPER_ADMIN ? 'support@tetavio.com' : row.createdByUser.email),
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  private requireAccountThread(thread: Pick<SupportThreadRow, 'accountId'>, user: JwtPayload): void {
    if (thread.accountId !== user.accountId) {
      throw new NotFoundException('Support thread not found');
    }
  }

  private normalizeThreadStatusForUser(status: SupportThreadStatus): SupportThreadStatus {
    if (status === SupportThreadStatus.CLOSED) return SupportThreadStatus.CLOSED;
    return SupportThreadStatus.WAITING_SUPPORT;
  }

  async listMine(user: JwtPayload) {
    const rows = await this.prisma.supportThread.findMany({
      where: { accountId: user.accountId },
      select: THREAD_SELECT,
      orderBy: { lastMessageAt: 'desc' },
    });

    return rows.map(toThreadResponse);
  }

  async create(user: JwtPayload, dto: CreateSupportThreadDto) {
    const created = await this.prisma.$transaction(async (tx) => {
      const thread = await tx.supportThread.create({
        data: {
          accountId: user.accountId,
          subject: dto.subject.trim(),
          category: dto.category,
          priority: dto.priority,
          status: SupportThreadStatus.WAITING_SUPPORT,
          context: dto.context?.trim() || null,
          createdByUserId: user.sub,
          unreadForAccount: 0,
          unreadForAdmin: 1,
          lastMessageAt: new Date(),
          messages: {
            create: {
              authorUserId: user.sub,
              authorType: SupportAuthorType.ACCOUNT_USER,
              body: dto.body.trim(),
            },
          },
        },
        select: THREAD_SELECT,
      });

      return thread;
    });

    return toThreadResponse(created);
  }

  async getMine(user: JwtPayload, threadId: string) {
    const thread = await this.prisma.supportThread.findFirst({
      where: { id: threadId, accountId: user.accountId },
      select: THREAD_SELECT,
    });

    if (!thread) throw new NotFoundException('Support thread not found');
    return toThreadResponse(thread);
  }

  async replyMine(user: JwtPayload, threadId: string, dto: ReplySupportMessageDto) {
    const thread = await this.prisma.supportThread.findFirst({
      where: { id: threadId, accountId: user.accountId },
      select: { id: true, accountId: true, status: true },
    });

    if (!thread) throw new NotFoundException('Support thread not found');
    if (thread.status === SupportThreadStatus.CLOSED) {
      throw new BadRequestException('Closed threads cannot be replied to');
    }

    await this.prisma.supportMessage.create({
      data: {
        threadId: thread.id,
        authorUserId: user.sub,
        authorType: SupportAuthorType.ACCOUNT_USER,
        body: dto.body.trim(),
      },
    });

    const updated = await this.prisma.supportThread.update({
      where: { id: thread.id },
      data: {
        status: this.normalizeThreadStatusForUser(thread.status),
        unreadForAccount: 0,
        unreadForAdmin: { increment: 1 },
        lastMessageAt: new Date(),
      },
      select: THREAD_SELECT,
    });

    return toThreadResponse(updated);
  }

  async updateMine(user: JwtPayload, threadId: string, dto: UpdateSupportThreadStatusDto) {
    const thread = await this.prisma.supportThread.findFirst({
      where: { id: threadId, accountId: user.accountId },
      select: { id: true, accountId: true, status: true },
    });

    if (!thread) throw new NotFoundException('Support thread not found');

    const nextStatus = dto.status;
    if (nextStatus !== SupportThreadStatus.CLOSED && nextStatus !== SupportThreadStatus.WAITING_SUPPORT && nextStatus !== SupportThreadStatus.OPEN) {
      throw new BadRequestException('Unsupported support status change');
    }

    const updated = await this.prisma.supportThread.update({
      where: { id: thread.id },
      data: {
        status: nextStatus === SupportThreadStatus.OPEN ? SupportThreadStatus.WAITING_SUPPORT : nextStatus,
        unreadForAccount: 0,
        updatedAt: new Date(),
      },
      select: THREAD_SELECT,
    });

    return toThreadResponse(updated);
  }

  async listInternal(user: JwtPayload, query: ListSupportThreadsQueryDto) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.SupportThreadWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: 'insensitive' } },
              { context: { contains: search, mode: 'insensitive' } },
              { account: { name: { contains: search, mode: 'insensitive' } } },
              { createdByUser: { email: { contains: search, mode: 'insensitive' } } },
              { createdByUser: { fullName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.supportThread.findMany({
        where,
        select: THREAD_SELECT,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportThread.count({ where }),
    ]);

    return buildPaginatedResponse(rows.map(toThreadResponse), page, limit, total);
  }

  async getInternal(user: JwtPayload, threadId: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    const thread = await this.prisma.supportThread.findUnique({
      where: { id: threadId },
      select: THREAD_SELECT,
    });

    if (!thread) throw new NotFoundException('Support thread not found');
    return toThreadResponse(thread);
  }

  async replyInternal(user: JwtPayload, threadId: string, dto: ReplySupportMessageDto) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    const thread = await this.prisma.supportThread.findUnique({
      where: { id: threadId },
      select: { id: true, accountId: true },
    });

    if (!thread) throw new NotFoundException('Support thread not found');

    await this.prisma.supportMessage.create({
      data: {
        threadId: thread.id,
        authorUserId: user.sub,
        authorType: SupportAuthorType.SUPER_ADMIN,
        body: dto.body.trim(),
      },
    });

    const updated = await this.prisma.supportThread.update({
      where: { id: thread.id },
      data: {
        status: SupportThreadStatus.WAITING_ACCOUNT,
        unreadForAccount: { increment: 1 },
        unreadForAdmin: 0,
        lastMessageAt: new Date(),
      },
      select: THREAD_SELECT,
    });

    return toThreadResponse(updated);
  }

  async updateInternal(user: JwtPayload, threadId: string, dto: UpdateSupportThreadStatusDto) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    const thread = await this.prisma.supportThread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });

    if (!thread) throw new NotFoundException('Support thread not found');

    const updated = await this.prisma.supportThread.update({
      where: { id: thread.id },
      data: {
        status: dto.status,
        updatedAt: new Date(),
      },
      select: THREAD_SELECT,
    });

    return toThreadResponse(updated);
  }
}
