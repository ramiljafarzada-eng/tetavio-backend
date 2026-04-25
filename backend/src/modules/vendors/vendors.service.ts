import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import {
  ListVendorsQueryDto,
  type VendorSortField,
} from './dto/list-vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { buildPaginatedResponse } from '../../common/utils/paginated-response.util';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  private getOrderBy(
    sortBy?: VendorSortField,
    sortOrder: Prisma.SortOrder = 'desc',
  ): Prisma.VendorOrderByWithRelationInput {
    switch (sortBy ?? 'createdAt') {
      case 'vendorName':
        return { vendorName: sortOrder };
      case 'companyName':
        return { companyName: sortOrder };
      case 'email':
        return { email: sortOrder };
      case 'createdAt':
      default:
        return { createdAt: sortOrder };
    }
  }

  async list(user: JwtPayload, query: ListVendorsQueryDto) {
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
              { vendorName: { contains: search, mode: 'insensitive' as const } },
              { companyName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return buildPaginatedResponse(data, page, limit, total);
  }

  async getById(user: JwtPayload, vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: vendorId,
        accountId: user.accountId,
        deletedAt: null,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async create(user: JwtPayload, dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        accountId: user.accountId,
        vendorName: dto.vendorName,
        companyName: dto.companyName ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        taxId: dto.taxId ?? null,
        status: dto.status ?? 'ACTIVE',
      },
    });
  }

  async update(user: JwtPayload, vendorId: string, dto: UpdateVendorDto) {
    await this.getById(user, vendorId);

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(dto.vendorName !== undefined ? { vendorName: dto.vendorName } : {}),
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(user: JwtPayload, vendorId: string) {
    await this.getById(user, vendorId);

    // TODO: When vendor-linked purchase documents or bills are added,
    // block vendor deletion if active documents still reference this vendor.

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { deleted: true, id: vendorId };
  }
}
