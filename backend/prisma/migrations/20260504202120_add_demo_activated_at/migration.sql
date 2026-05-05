-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "demo_activated_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "bank_accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bank_transactions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bill_lines" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bills" ALTER COLUMN "id" DROP DEFAULT;
