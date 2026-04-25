-- AlterTable
ALTER TABLE "customers"
ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "vendors"
ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "invoices"
ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "invoice_lines"
ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "customers_account_id_deleted_at_idx" ON "customers"("account_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vendors_account_id_deleted_at_idx" ON "vendors"("account_id", "deleted_at");

-- CreateIndex
CREATE INDEX "invoices_account_id_deleted_at_idx" ON "invoices"("account_id", "deleted_at");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_deleted_at_idx" ON "invoice_lines"("invoice_id", "deleted_at");
