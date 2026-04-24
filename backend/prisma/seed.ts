import { PrismaClient, PlanInterval } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      code: 'FREE',
      name: 'Free',
      priceMinor: 0,
      currency: 'AZN',
      interval: PlanInterval.NONE,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: 'PRO_MONTHLY',
      name: 'Pro Monthly',
      priceMinor: 2900,
      currency: 'AZN',
      interval: PlanInterval.MONTH,
      isActive: true,
      sortOrder: 2,
    },
    {
      code: 'PREMIUM_MONTHLY',
      name: 'Premium Monthly',
      priceMinor: 5900,
      currency: 'AZN',
      interval: PlanInterval.MONTH,
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
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
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
