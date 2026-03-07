-- CreateEnum
CREATE TYPE "ConversationDisposition" AS ENUM ('PROSPECT', 'CONTACTED', 'QUALIFIED', 'CLIENT', 'SUPPORT_PENDING', 'SUPPORT_RESOLVED', 'NOT_INTERESTED', 'SPAM', 'FOLLOW_UP', 'OTHER');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "disposition" "ConversationDisposition",
ADD COLUMN IF NOT EXISTS "dispositionNote" TEXT,
ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "resolvedById" VARCHAR(255);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_disposition_idx" ON "conversations"("disposition");
