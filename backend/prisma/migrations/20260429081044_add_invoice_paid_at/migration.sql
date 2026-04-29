-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paid_at" TIMESTAMPTZ(6);

-- Backfill: for existing PAID invoices where paid_at is null,
-- use updated_at as the best available approximation of cash inflow date.
-- This is a one-time migration approximation; new status transitions
-- will set paid_at precisely via application logic going forward.
UPDATE "invoices"
SET "paid_at" = "updated_at"
WHERE "status" IN ('PAID', 'Ödənilib')
  AND "paid_at" IS NULL
  AND "deleted_at" IS NULL;
