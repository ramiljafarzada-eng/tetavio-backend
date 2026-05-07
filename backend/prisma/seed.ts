import {
  PrismaClient,
  SubscriptionStatus,
  UserStatus,
  UserRole,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { CANONICAL_PLANS, LEGACY_INACTIVE_PLAN_CODES } from '../src/common/plan-catalog';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = 'admin@finotam.local';
const DEFAULT_ADMIN_PASSWORD = 'Tetavio@2026';
const DEFAULT_ADMIN_NAME = 'Finotam Super Admin';

async function main() {
  for (const plan of CANONICAL_PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: {
        code: plan.code,
        name: plan.name,
        priceMinor: plan.priceMinor,
        currency: plan.currency,
        interval: plan.interval,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
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

  // Deactivate legacy plans
  await prisma.plan.updateMany({
    where: { code: { in: [...LEGACY_INACTIVE_PLAN_CODES] } },
    data: { isActive: false },
  });

  const result = await prisma.plan.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      code: true,
      name: true,
      priceMinor: true,
      currency: true,
      interval: true,
      isActive: true,
    },
  });

  console.log('Seeded plans:', result);

  const freePlan = await prisma.plan.findUnique({
    where: { code: 'FREE' },
  });

  if (!freePlan || !freePlan.isActive) {
    throw new Error('FREE plan must exist and be active before seeding the default admin');
  }

  const passwordHash = await hash(DEFAULT_ADMIN_PASSWORD, 12);
  const now = new Date();

  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
    select: {
      id: true,
      accountId: true,
      email: true,
    },
  });

  let adminAccountId = existingAdmin?.accountId;

  if (!adminAccountId) {
    const account = await prisma.account.create({
      data: {
        name: DEFAULT_ADMIN_NAME,
        type: 'INDIVIDUAL',
      },
      select: {
        id: true,
      },
    });

    adminAccountId = account.id;
  } else {
    await prisma.account.update({
      where: { id: adminAccountId },
      data: {
        name: DEFAULT_ADMIN_NAME,
      },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    create: {
      accountId: adminAccountId,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      fullName: DEFAULT_ADMIN_NAME,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      role: UserRole.SUPER_ADMIN,
    },
    update: {
      accountId: adminAccountId,
      passwordHash,
      fullName: DEFAULT_ADMIN_NAME,
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      role: UserRole.SUPER_ADMIN,
    },
    select: {
      id: true,
      accountId: true,
      email: true,
      isEmailVerified: true,
      status: true,
    },
  });

  const subscription = await prisma.subscription.upsert({
    where: { accountId: adminAccountId },
    create: {
      accountId: adminAccountId,
      planId: freePlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: freePlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      scheduledPlanId: null,
      scheduledChangeAt: null,
    },
    select: {
      id: true,
      accountId: true,
      status: true,
      plan: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  });

  console.log('Seeded default admin:', {
    email: adminUser.email,
    isEmailVerified: adminUser.isEmailVerified,
    status: adminUser.status,
    subscription: subscription.plan.code,
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
