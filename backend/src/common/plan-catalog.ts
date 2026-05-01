import { PlanInterval } from '@prisma/client';

export const CANONICAL_PLANS = [
  {
    code: 'FREE',
    name: 'Free',
    priceMinor: 0,
    currency: 'USD',
    interval: PlanInterval.NONE,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'STANDARD',
    name: 'Standard',
    priceMinor: 1200,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional',
    priceMinor: 2400,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 3,
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    priceMinor: 3600,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 4,
  },
  {
    code: 'ELITE',
    name: 'Elite',
    priceMinor: 10000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 5,
  },
  {
    code: 'ULTIMATE',
    name: 'Ultimate',
    priceMinor: 20000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 6,
  },
] as const;

export const LEGACY_INACTIVE_PLAN_CODES = ['PRO_MONTHLY', 'PREMIUM_MONTHLY'] as const;
