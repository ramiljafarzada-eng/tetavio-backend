import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LEGACY_INACTIVE_PLAN_CODES, CANONICAL_PLANS } from '../../common/plan-catalog';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanCatalogService implements OnModuleInit {
  private readonly logger = new Logger(PlanCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.syncCanonicalPlans();
  }

  private async syncCanonicalPlans(): Promise<void> {
    for (const plan of CANONICAL_PLANS) {
      await this.prisma.plan.upsert({
        where: { code: plan.code },
        create: { ...plan },
        update: {
          name: plan.name,
          priceMinor: plan.priceMinor,
          currency: plan.currency,
          interval: plan.interval,
          isActive: plan.isActive,
          sortOrder: plan.sortOrder,
        },
      });
    }

    await this.prisma.plan.updateMany({
      where: { code: { in: [...LEGACY_INACTIVE_PLAN_CODES] } },
      data: { isActive: false },
    });

    // Migrate any subscriptions still on legacy inactive plans to FREE
    const freePlan = await this.prisma.plan.findUnique({ where: { code: 'FREE' } });
    if (freePlan) {
      const legacyPlans = await this.prisma.plan.findMany({
        where: { code: { in: [...LEGACY_INACTIVE_PLAN_CODES] } },
        select: { id: true },
      });
      const legacyPlanIds = legacyPlans.map((p) => p.id);
      if (legacyPlanIds.length > 0) {
        await this.prisma.subscription.updateMany({
          where: { planId: { in: legacyPlanIds } },
          data: {
            planId: freePlan.id,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            scheduledPlanId: null,
            scheduledChangeAt: null,
          },
        });
      }
    }

    this.logger.log(`Canonical plan catalog synchronized (${CANONICAL_PLANS.length} plans).`);
  }
}
