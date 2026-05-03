CREATE TYPE "SupportThreadStatus" AS ENUM ('OPEN', 'WAITING_SUPPORT', 'WAITING_ACCOUNT', 'CLOSED');
CREATE TYPE "SupportThreadPriority" AS ENUM ('NORMAL', 'URGENT');
CREATE TYPE "SupportThreadCategory" AS ENUM ('TECHNICAL', 'BILLING', 'AUTH', 'REPORTING', 'OTHER');
CREATE TYPE "SupportAuthorType" AS ENUM ('ACCOUNT_USER', 'SUPER_ADMIN');

CREATE TABLE "support_threads" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "SupportThreadCategory" NOT NULL,
    "priority" "SupportThreadPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportThreadStatus" NOT NULL DEFAULT 'OPEN',
    "context" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "unread_for_account" INTEGER NOT NULL DEFAULT 0,
    "unread_for_admin" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "author_user_id" UUID,
    "author_type" "SupportAuthorType" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_threads_account_id_idx" ON "support_threads"("account_id");
CREATE INDEX "support_threads_account_id_status_idx" ON "support_threads"("account_id", "status");
CREATE INDEX "support_threads_last_message_at_idx" ON "support_threads"("last_message_at");
CREATE INDEX "support_messages_thread_id_idx" ON "support_messages"("thread_id");
CREATE INDEX "support_messages_thread_id_created_at_idx" ON "support_messages"("thread_id", "created_at");

ALTER TABLE "support_threads"
ADD CONSTRAINT "support_threads_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_threads"
ADD CONSTRAINT "support_threads_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_messages"
ADD CONSTRAINT "support_messages_thread_id_fkey"
FOREIGN KEY ("thread_id") REFERENCES "support_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_messages"
ADD CONSTRAINT "support_messages_author_user_id_fkey"
FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
