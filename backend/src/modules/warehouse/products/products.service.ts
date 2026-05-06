import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtPayload, dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { accountId_sku: { accountId: user.accountId, sku: dto.sku } },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Bu SKU artıq mövcuddur');

    return this.prisma.product.create({
      data: {
        accountId: user.accountId,
        sku: dto.sku,
        name: dto.name,
        barcode: dto.barcode,
        unit: dto.unit ?? 'ədəd',
        categoryId: dto.categoryId,
        description: dto.description,
        salePriceMinor: dto.salePriceMinor ?? 0,
        costPriceMinor: dto.costPriceMinor ?? 0,
        minStockQty: dto.minStockQty ?? 0,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  findAll(user: JwtPayload, query: ListProductsQueryDto) {
    const where: Prisma.ProductWhereInput = { accountId: user.accountId };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: JwtPayload, id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, accountId: user.accountId },
      include: {
        category: { select: { id: true, name: true } },
        stockBalances: { include: { warehouse: { select: { id: true, name: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Məhsul tapılmadı');
    return p;
  }

  async update(user: JwtPayload, id: string, dto: UpdateProductDto) {
    await this.ensure(user.accountId, id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.salePriceMinor !== undefined && { salePriceMinor: dto.salePriceMinor }),
        ...(dto.costPriceMinor !== undefined && { costPriceMinor: dto.costPriceMinor }),
        ...(dto.minStockQty !== undefined && { minStockQty: dto.minStockQty }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async remove(user: JwtPayload, id: string) {
    await this.ensure(user.accountId, id);
    await this.prisma.product.delete({ where: { id } });
  }

  private async ensure(accountId: string, id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!p) throw new NotFoundException('Məhsul tapılmadı');
    return p;
  }
}
