-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "tax_id" TEXT,
    "mobile_phone" TEXT,
    "entity_type" TEXT NOT NULL DEFAULT 'Huquqi sexs',
    "currency" CHAR(3) NOT NULL DEFAULT 'AZN',
    "fiscal_year" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "company_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "company_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "currency" CHAR(3) NOT NULL DEFAULT 'AZN',
    "sub_total_minor" INTEGER NOT NULL DEFAULT 0,
    "tax_minor" INTEGER NOT NULL DEFAULT 0,
    "discount_minor" INTEGER NOT NULL DEFAULT 0,
    "total_minor" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "unit_price_minor" INTEGER NOT NULL DEFAULT 0,
    "tax_code" TEXT,
    "tax_rate" DECIMAL(6,2),
    "line_total_minor" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_account_id_key" ON "company_profiles"("account_id");

-- CreateIndex
CREATE INDEX "customers_account_id_idx" ON "customers"("account_id");

-- CreateIndex
CREATE INDEX "customers_account_id_display_name_idx" ON "customers"("account_id", "display_name");

-- CreateIndex
CREATE INDEX "vendors_account_id_idx" ON "vendors"("account_id");

-- CreateIndex
CREATE INDEX "vendors_account_id_vendor_name_idx" ON "vendors"("account_id", "vendor_name");

-- CreateIndex
CREATE INDEX "invoices_account_id_idx" ON "invoices"("account_id");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_account_id_invoice_number_key" ON "invoices"("account_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
