import { ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_OPERATION_LIMIT, FREE_TRIAL_DAYS, PLAN_OPERATION_LIMITS } from './plan-limits';

export async function checkOperationLimit(
  accountId: string,
  prisma: Pick<PrismaClient, '$transaction'> & {
    subscription: { findUnique: Function };
    invoice: { count: Function };
    bill: { count: Function };
    journalEntry: { count: Function };
  },
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { accountId },
    include: { plan: { select: { code: true } } },
  });

  const planCode = subscription?.plan?.code ?? 'FREE';

  if (planCode === 'FREE') {
    // Free plan is gated by a 14-day trial, not an operation count
    const trialEnd = subscription?.currentPeriodEnd;
    if (trialEnd && new Date() > trialEnd) {
      throw new ForbiddenException(
        `Your ${FREE_TRIAL_DAYS}-day free trial has expired. Please upgrade to a paid plan to continue.`,
      );
    }
    return;
  }

  const limit = PLAN_OPERATION_LIMITS[planCode] ?? DEFAULT_OPERATION_LIMIT;
  if (limit === null) return; // unlimited plan

  const [invoices, bills, journals] = await Promise.all([
    prisma.invoice.count({ where: { accountId, deletedAt: null } }),
    prisma.bill.count({ where: { accountId, deletedAt: null } }),
    prisma.journalEntry.count({ where: { accountId, deletedAt: null } }),
  ]);

  const used = invoices + bills + journals;

  if (used >= limit) {
    throw new ForbiddenException(
      `Operation limit reached (${used}/${limit}). Please upgrade your plan to continue.`,
    );
  }
}
