export const PLAN_OPERATION_LIMITS: Record<string, number> = {
  FREE: 10,
  STANDARD: 5000,
  PROFESSIONAL: 10000,
  PREMIUM: 25000,
  ELITE: 100000,
  ULTIMATE: 200000,
  // Legacy plans kept for backward compatibility
  PRO_MONTHLY: 10000,
  PREMIUM_MONTHLY: 25000,
};

export const DEFAULT_OPERATION_LIMIT = 10;
