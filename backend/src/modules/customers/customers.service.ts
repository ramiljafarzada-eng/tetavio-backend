import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  ListCustomersQueryDto,
  type CustomerSortField,
} from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrderBy(
    sortBy?: CustomerSortField,
    sortOrder: Prisma.SortOrder = 'desc',
  ): Prisma.CustomerOrderByWithRelationInput {
    switch (sortBy ?? 'createdAt') {
      case 'displayName':
        return { displayName: sortOrder };
      case 'companyName':
        return { companyName: sortOrder };
      case 'email':
        return { email: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }

  async list(user: JwtPayload, query: ListCustomersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy = this.getOrderBy(query.sortBy, sortOrder);

    const where = {
      accountId: user.accountId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' as const } },
              { companyName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async getById(user: JwtPayload, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        accountId: user.accountId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(user: JwtPayload, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        accountId: user.accountId,
        displayName: dto.displayName,
        companyName: dto.companyName ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        taxId: dto.taxId ?? null,
        status: dto.status ?? 'ACTIVE',
      },
    });
  }

  async update(user: JwtPayload, customerId: string, dto: UpdateCustomerDto) {
    await this.getById(user, customerId);

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(user: JwtPayload, customerId: string) {
    await this.getById(user, customerId);

    const activeInvoice = await this.prisma.invoice.findFirst({
      where: {
        accountId: user.accountId,
        customerId,
        deletedAt: null,
      },
      select: { id: true, invoiceNumber: true },
    });

    if (activeInvoice) {
      throw new ConflictException(
        'Customer cannot be deleted because it is referenced by an active invoice',
      );
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { deleted: true, id: customerId };
  }
}
