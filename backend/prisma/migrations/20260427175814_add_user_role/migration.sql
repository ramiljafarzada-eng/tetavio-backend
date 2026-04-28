-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SUPER_ADMIN');

-- DropIndex
DROP INDEX "customers_account_id_deleted_at_idx";

-- DropIndex
DROP INDEX "invoice_lines_invoice_id_deleted_at_idx";

-- DropIndex
DROP INDEX "invoices_account_id_deleted_at_idx";

-- DropIndex
DROP INDEX "vendors_account_id_deleted_at_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'OWNER';
