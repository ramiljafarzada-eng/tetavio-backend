-- CreateTable
CREATE TABLE "admin_account_notes" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_account_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_account_flags" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID NOT NULL,
    "cleared_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleared_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_account_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_anomaly_reviews" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "anomaly_type" TEXT NOT NULL,
    "reviewed_by_user_id" UUID NOT NULL,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "admin_anomaly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_account_notes_account_id_idx" ON "admin_account_notes"("account_id");

-- CreateIndex
CREATE INDEX "admin_account_flags_account_id_idx" ON "admin_account_flags"("account_id");

-- CreateIndex
CREATE INDEX "admin_anomaly_reviews_account_id_idx" ON "admin_anomaly_reviews"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_anomaly_reviews_account_id_anomaly_type_key" ON "admin_anomaly_reviews"("account_id", "anomaly_type");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_user_id_idx" ON "admin_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_id_idx" ON "admin_audit_logs"("target_id");

-- AddForeignKey
ALTER TABLE "admin_account_notes" ADD CONSTRAINT "admin_account_notes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_account_notes" ADD CONSTRAINT "admin_account_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_account_flags" ADD CONSTRAINT "admin_account_flags_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_account_flags" ADD CONSTRAINT "admin_account_flags_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_account_flags" ADD CONSTRAINT "admin_account_flags_cleared_by_user_id_fkey" FOREIGN KEY ("cleared_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_anomaly_reviews" ADD CONSTRAINT "admin_anomaly_reviews_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_anomaly_reviews" ADD CONSTRAINT "admin_anomaly_reviews_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
