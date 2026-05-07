import { PlanInterval } from '@prisma/client';

export const CANONICAL_PLANS = [
  {
    code: 'FREE_BASIC',
    name: 'Free',
    priceMinor: 0,
    annualPriceMinor: 0,
    currency: 'USD',
    interval: PlanInterval.NONE,
    isActive: true,
    sortOrder: 0,
  },
  {
    code: 'FREE',
    name: 'Demo 14 gün',
    priceMinor: 0,
    annualPriceMinor: 0,
    currency: 'USD',
    interval: PlanInterval.NONE,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'STANDARD',
    name: 'Standard',
    priceMinor: 1200,
    annualPriceMinor: 12000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 3,
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional',
    priceMinor: 2400,
    annualPriceMinor: 24000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 4,
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    priceMinor: 3600,
    annualPriceMinor: 36000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 5,
  },
  {
    code: 'ELITE',
    name: 'Elite',
    priceMinor: 12900,
    annualPriceMinor: 120000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 6,
  },
  {
    code: 'ULTIMATE',
    name: 'Ultimate',
    priceMinor: 24900,
    annualPriceMinor: 240000,
    currency: 'USD',
    interval: PlanInterval.MONTH,
    isActive: true,
    sortOrder: 7,
  },
] as const;

export const ANNUAL_PRICE_MINOR: Record<string, number> = Object.fromEntries(
  CANONICAL_PLANS.map((p) => [p.code, p.annualPriceMinor]),
);

export const LEGACY_INACTIVE_PLAN_CODES = ['PRO_MONTHLY', 'PREMIUM_MONTHLY'] as const;
