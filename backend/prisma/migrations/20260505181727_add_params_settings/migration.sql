-- AlterTable
ALTER TABLE "company_profiles" ADD COLUMN     "additional_adjustment" TEXT,
ADD COLUMN     "default_payment_term" TEXT,
ADD COLUMN     "default_tax_label" TEXT,
ADD COLUMN     "discount_mode" TEXT,
ADD COLUMN     "discount_timing" TEXT,
ADD COLUMN     "invoice_prefix" TEXT,
ADD COLUMN     "negative_stock" TEXT,
ADD COLUMN     "numbering_mode" TEXT,
ADD COLUMN     "quote_prefix" TEXT,
ADD COLUMN     "sales_rounding_mode" TEXT,
ADD COLUMN     "salesperson_field" TEXT,
ADD COLUMN     "shipping_charge" TEXT,
ADD COLUMN     "stock_warning" TEXT,
ADD COLUMN     "tax_mode" TEXT;

-- AlterTable
ALTER TABLE "support_threads" ALTER COLUMN "updated_at" DROP DEFAULT;
