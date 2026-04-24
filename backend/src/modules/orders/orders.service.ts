import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOrders(user: JwtPayload) {
    return this.prisma.order.findMany({
      where: { accountId: user.accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        targetPlan: {
          select: {
            code: true,
            name: true,
            priceMinor: true,
            currency: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            gateway: true,
            gatewayPaymentId: true,
            status: true,
            amountMinor: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async getOrderById(user: JwtPayload, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        accountId: user.accountId,
      },
      include: {
        targetPlan: {
          select: {
            code: true,
            name: true,
            priceMinor: true,
            currency: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            gateway: true,
            gatewayPaymentId: true,
            status: true,
            amountMinor: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
