import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CreateMovementDto, ListMovementsQueryDto } from './dto/stock.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async createMovement(user: JwtPayload, dto: CreateMovementDto) {
    const { accountId, sub } = user;

    await this.ensureProduct(accountId, dto.productId);
    if (dto.warehouseId) await this.ensureWarehouse(accountId, dto.warehouseId);
    if (dto.toWarehouseId) await this.ensureWarehouse(accountId, dto.toWarehouseId);

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          accountId,
          type: dto.type as any,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          toWarehouseId: dto.toWarehouseId,
          qty: dto.qty,
          unitCostMinor: dto.unitCostMinor ?? 0,
          note: dto.note,
          ref: dto.ref,
          createdBy: sub,
        },
      });

      if (dto.type === 'IN' && dto.warehouseId) {
        await this.upsertBalance(tx, accountId, dto.productId, dto.warehouseId, dto.qty, dto.unitCostMinor ?? 0, 'in');
      } else if (dto.type === 'OUT' && dto.warehouseId) {
        await this.upsertBalance(tx, accountId, dto.productId, dto.warehouseId, -dto.qty, 0, 'out');
      } else if (dto.type === 'TRANSFER' && dto.warehouseId && dto.toWarehouseId) {
        const balance = await tx.stockBalance.findUnique({
          where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.warehouseId } },
        });
        const avgCost = balance?.avgCostMinor ?? 0;
        await this.upsertBalance(tx, accountId, dto.productId, dto.warehouseId, -dto.qty, 0, 'out');
        await this.upsertBalance(tx, accountId, dto.productId, dto.toWarehouseId, dto.qty, avgCost, 'in');
      } else if (dto.type === 'ADJUSTMENT' && dto.warehouseId) {
        await tx.stockBalance.upsert({
          where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.warehouseId } },
          create: { accountId, productId: dto.productId, warehouseId: dto.warehouseId, qty: dto.qty, avgCostMinor: dto.unitCostMinor ?? 0 },
          update: { qty: dto.qty, ...(dto.unitCostMinor ? { avgCostMinor: dto.unitCostMinor } : {}) },
        });
      }

      return movement;
    });
  }

  private async upsertBalance(
    tx: Prisma.TransactionClient,
    accountId: string,
    productId: string,
    warehouseId: string,
    deltaQty: number,
    unitCostMinor: number,
    dir: 'in' | 'out',
  ) {
    const existing = await tx.stockBalance.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (!existing) {
      if (dir === 'out') return;
      await tx.stockBalance.create({
        data: { accountId, productId, warehouseId, qty: deltaQty, avgCostMinor: unitCostMinor },
      });
      return;
    }

    let newAvg = existing.avgCostMinor;
    if (dir === 'in' && unitCostMinor > 0) {
      const oldQty = Number(existing.qty);
      const newQty = oldQty + deltaQty;
      if (newQty > 0) {
        newAvg = Math.round((oldQty * existing.avgCostMinor + deltaQty * unitCostMinor) / newQty);
      }
    }

    await tx.stockBalance.update({
      where: { productId_warehouseId: { productId, warehouseId } },
      data: {
        qty: { increment: deltaQty },
        avgCostMinor: newAvg,
      },
    });
  }

  listMovements(user: JwtPayload, query: ListMovementsQueryDto) {
    const where: Prisma.StockMovementWhereInput = { accountId: user.accountId };
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.type) where.type = query.type as any;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    return this.prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        warehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  listBalances(user: JwtPayload, warehouseId?: string) {
    const where: Prisma.StockBalanceWhereInput = { accountId: user.accountId };
    if (warehouseId) where.warehouseId = warehouseId;
    return this.prisma.stockBalance.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, minStockQty: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });
  }

  private async ensureProduct(accountId: string, id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!p) throw new NotFoundException('Məhsul tapılmadı');
  }

  private async ensureWarehouse(accountId: string, id: string) {
    const w = await this.prisma.warehouse.findFirst({ where: { id, accountId }, select: { id: true } });
    if (!w) throw new NotFoundException('Anbar tapılmadı');
  }
}
