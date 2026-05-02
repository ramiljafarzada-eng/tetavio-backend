import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, OrderType, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { DowngradeSubscriptionDto } from './dto/downgrade-subscription.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { DEFAULT_OPERATION_LIMIT, FREE_TRIAL_DAYS, PLAN_OPERATION_LIMITS } from '../../common/plan-limits';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(user: JwtPayload) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId: user.accountId },
      include: {
        plan: {
          select: {
            code: true,
            name: true,
            priceMinor: true,
            currency: true,
            interval: true,
          },
        },
        scheduledPlan: {
          select: {
            code: true,
            name: true,
            priceMinor: true,
            currency: true,
            interval: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for account');
    }

    const planCode = subscription.plan.code;
    const isFreePlan = planCode === 'FREE';

    // For FREE plan: unlimited operations, access gated by trial expiry
    const operationLimit = isFreePlan ? null : (PLAN_OPERATION_LIMITS[planCode] ?? DEFAULT_OPERATION_LIMIT);

    const [invoices, bills, journals] = await Promise.all([
      this.prisma.invoice.count({ where: { accountId: user.accountId, deletedAt: null } }),
      this.prisma.bill.count({ where: { accountId: user.accountId, deletedAt: null } }),
      this.prisma.journalEntry.count({ where: { accountId: user.accountId, deletedAt: null } }),
    ]);

    const operationsUsed = invoices + bills + journals;

    // Trial metadata (only relevant for FREE plan)
    const trialExpiresAt = isFreePlan ? subscription.currentPeriodEnd : null;
    const now = new Date();
    const isTrialExpired = isFreePlan && trialExpiresAt ? now > trialExpiresAt : false;
    const trialDaysRemaining =
      isFreePlan && trialExpiresAt && !isTrialExpired
        ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

    // Auto-downgrade expired Demo trial → permanent Free plan
    if (isFreePlan && isTrialExpired) {
      const freePermanentPlan = await this.prisma.plan.findUnique({ where: { code: 'FREE_BASIC' } });
      if (freePermanentPlan) {
        const downgraded = await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            planId: freePermanentPlan.id,
            currentPeriodEnd: null,
            scheduledPlanId: null,
            scheduledChangeAt: null,
            cancelAtPeriodEnd: false,
          },
        });
        return {
          id: downgraded.id,
          status: downgraded.status,
          currentPeriodStart: downgraded.currentPeriodStart,
          currentPeriodEnd: null,
          plan: {
            code: freePermanentPlan.code,
            name: freePermanentPlan.name,
            priceMinor: freePermanentPlan.priceMinor,
            currency: freePermanentPlan.currency,
            interval: freePermanentPlan.interval,
          },
          scheduledPlan: null,
          scheduledChangeAt: null,
          cancelAtPeriodEnd: false,
          operationsUsed,
          operationLimit: null,
          trialExpiresAt: null,
          isTrialExpired: false,
          trialDaysRemaining: null,
        };
      }
    }

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      plan: subscription.plan,
      scheduledPlan: subscription.scheduledPlan,
      scheduledChangeAt: subscription.scheduledChangeAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      operationsUsed,
      operationLimit,
      trialExpiresAt,
      isTrialExpired,
      trialDaysRemaining,
    };
  }

  async upgrade(user: JwtPayload, dto: UpgradeSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId: user.accountId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for account');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be upgraded');
    }

    const targetPlan = await this.prisma.plan.findUnique({
      where: { code: dto.targetPlanCode },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new BadRequestException('Target plan is not available');
    }

    if (targetPlan.code === 'FREE' || targetPlan.priceMinor <= 0) {
      throw new BadRequestException('Upgrade only supports paid plans');
    }

    if (subscription.planId === targetPlan.id) {
      throw new ConflictException('Subscription is already on this plan');
    }

    const existingPendingOrder = await this.prisma.order.findFirst({
      where: {
        accountId: user.accountId,
        targetPlanId: targetPlan.id,
        type: OrderType.UPGRADE,
        status: OrderStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingPendingOrder) {
      return {
        orderId: existingPendingOrder.id,
        status: existingPendingOrder.status,
        amountMinor: existingPendingOrder.amountMinor,
        currency: existingPendingOrder.currency,
        idempotencyKey: existingPendingOrder.idempotencyKey,
        isReusedPendingOrder: true,
        nextAction: {
          type: 'PAYMENT_REQUIRED',
          note: 'Use payments checkout flow to complete upgrade. Activation happens immediately after successful payment.',
        },
      };
    }

    const order = await this.prisma.order.create({
      data: {
        accountId: user.accountId,
        subscriptionId: subscription.id,
        targetPlanId: targetPlan.id,
        type: OrderType.UPGRADE,
        status: OrderStatus.PENDING,
        amountMinor: targetPlan.priceMinor,
        currency: targetPlan.currency,
        idempotencyKey: randomUUID(),
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      amountMinor: order.amountMinor,
      currency: order.currency,
      idempotencyKey: order.idempotencyKey,
      isReusedPendingOrder: false,
      nextAction: {
        type: 'PAYMENT_REQUIRED',
        note: 'Use payments checkout flow to complete upgrade. Activation happens immediately after successful payment.',
      },
    };
  }

  async downgrade(user: JwtPayload, dto: DowngradeSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId: user.accountId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for account');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be downgraded');
    }

    if (subscription.plan.code === 'FREE') {
      throw new BadRequestException('Free plan cannot be downgraded');
    }

    const targetPlan = await this.prisma.plan.findUnique({
      where: { code: dto.targetPlanCode },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new BadRequestException('Target plan is not available');
    }

    if (targetPlan.id === subscription.planId) {
      throw new ConflictException('Subscription is already on this plan');
    }

    if (targetPlan.priceMinor >= subscription.plan.priceMinor) {
      throw new BadRequestException('Downgrade requires a lower-priced target plan');
    }

    if (!subscription.currentPeriodEnd) {
      throw new BadRequestException('Current period end is missing, cannot schedule downgrade');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        scheduledPlanId: targetPlan.id,
        scheduledChangeAt: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: true,
      },
      include: {
        plan: {
          select: { code: true, name: true },
        },
        scheduledPlan: {
          select: { code: true, name: true },
        },
      },
    });

    return {
      subscriptionId: updated.id,
      currentPlan: updated.plan,
      scheduledPlan: updated.scheduledPlan,
      scheduledChangeAt: updated.scheduledChangeAt,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    };
  }

  async cancelScheduledChange(user: JwtPayload) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId: user.accountId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for account');
    }

    if (!subscription.scheduledPlanId && !subscription.scheduledChangeAt) {
      return {
        message: 'No scheduled subscription change to cancel',
      };
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        scheduledPlanId: null,
        scheduledChangeAt: null,
        cancelAtPeriodEnd: false,
      },
    });

    return {
      message: 'Scheduled change canceled',
      subscriptionId: updated.id,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      scheduledChangeAt: updated.scheduledChangeAt,
    };
  }
}
