import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';
import { StockMovementTypeDto } from '../stock/dto/stock.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
  ) {}

  private async nextPoNumber(accountId: string): Promise<string> {
    const last = await this.prisma.purchaseOrder.findFirst({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    });
    if (!last) return 'PO-0001';
    const num = parseInt(last.poNumber.replace(/\D/g, ''), 10) || 0;
    return `PO-${String(num + 1).padStart(4, '0')}`;
  }

  async create(user: JwtPayload, dto: CreatePurchaseOrderDto) {
    const poNumber = await this.nextPoNumber(user.accountId);
    const totalMinor = dto.items.reduce((s, i) => s + Math.round(i.qtyOrdered * i.unitCostMinor), 0);

    return this.prisma.purchaseOrder.create({
      data: {
        accountId: user.accountId,
        poNumber,
        supplierName: dto.supplierName,
        warehouseId: dto.warehouseId,
        orderDate: new Date(dto.orderDate),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        note: dto.note,
        totalMinor,
        createdBy: user.sub,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            qtyOrdered: i.qtyOrdered,
            unitCostMinor: i.unitCostMinor,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }

  findAll(user: JwtPayload, status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        accountId: user.accountId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: JwtPayload, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, accountId: user.accountId },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
        warehouse: { select: { id: true, name: true } },
      },
    });
    if (!po) throw new NotFoundException('Satınalma sifarişi tapılmadı');
    return po;
  }

  async update(user: JwtPayload, id: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.findOne(user, id);
    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      throw new BadRequestException('Bu sifariş artıq tamamlanıb və ya ləğv edilib');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.expectedDate !== undefined && { expectedDate: new Date(dto.expectedDate) }),
      },
    });
  }

  async receive(user: JwtPayload, id: string, dto: ReceivePurchaseOrderDto) {
    const po = await this.findOne(user, id);
    if (po.status === 'CANCELLED') throw new BadRequestException('Ləğv edilmiş sifariş qəbul edilə bilməz');
    if (po.status === 'RECEIVED') throw new BadRequestException('Sifariş artıq tam qəbul edilib');

    for (const recv of dto.items) {
      const item = po.items.find((i) => i.id === recv.itemId);
      if (!item) continue;
      if (recv.qtyReceived <= 0) continue;

      const newReceived = Number(item.qtyReceived) + recv.qtyReceived;
      await this.prisma.purchaseOrderItem.update({
        where: { id: recv.itemId },
        data: { qtyReceived: newReceived },
      });

      await this.stock.createMovement(user, {
        type: StockMovementTypeDto.IN,
        productId: item.productId,
        warehouseId: po.warehouseId,
        qty: recv.qtyReceived,
        unitCostMinor: item.unitCostMinor,
        ref: po.poNumber,
        note: `PO qəbulu: ${po.poNumber}`,
      });
    }

    const updatedItems = await this.prisma.purchaseOrderItem.findMany({ where: { orderId: id } });
    const allReceived = updatedItems.every((i) => Number(i.qtyReceived) >= Number(i.qtyOrdered));
    const anyReceived = updatedItems.some((i) => Number(i.qtyReceived) > 0);
    const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : po.status;

    await this.prisma.purchaseOrder.update({ where: { id }, data: { status: newStatus as any } });
    return this.findOne(user, id);
  }
}
