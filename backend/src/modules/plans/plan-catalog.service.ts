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

    this.logger.log(`Canonical plan catalog synchronized (${CANONICAL_PLANS.length} plans).`);
  }
}
