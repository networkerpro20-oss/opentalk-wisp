/*
  Warnings:

  - You are about to drop the column `authorId` on the `internal_notes` table. All the data in the column will be lost.
  - Added the required column `messageTemplate` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'REPLIED', 'FAILED');

-- AlterEnum
ALTER TYPE "CampaignStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "internal_notes" DROP CONSTRAINT IF EXISTS "internal_notes_authorId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "internal_notes_authorId_idx";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "autoStart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "createdById" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT,
ADD COLUMN IF NOT EXISTS "messageTemplate" TEXT,
ADD COLUMN IF NOT EXISTS "messagesPerMinute" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "targetSegment" JSONB;

-- Set default value for existing rows
UPDATE "campaigns" SET "messageTemplate" = '' WHERE "messageTemplate" IS NULL;
UPDATE "campaigns" SET "createdById" = (SELECT id FROM users LIMIT 1) WHERE "createdById" IS NULL;

-- Make fields required
ALTER TABLE "campaigns" ALTER COLUMN "messageTemplate" SET NOT NULL;
ALTER TABLE "campaigns" ALTER COLUMN "createdById" SET NOT NULL;

-- AlterTable
ALTER TABLE "internal_notes" DROP COLUMN IF EXISTS "authorId",
ADD COLUMN IF NOT EXISTS "createdById" TEXT;

-- Set default value for existing rows
UPDATE "internal_notes" SET "createdById" = (SELECT id FROM users LIMIT 1) WHERE "createdById" IS NULL;
ALTER TABLE "internal_notes" ALTER COLUMN "createdById" SET NOT NULL;

-- AlterTable
ALTER TABLE "quick_replies" ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE IF NOT EXISTS "campaign_executions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaign_executions_campaignId_idx" ON "campaign_executions"("campaignId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaign_executions_contactId_idx" ON "campaign_executions"("contactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaign_executions_status_idx" ON "campaign_executions"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "internal_notes_createdById_idx" ON "internal_notes"("createdById");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_createdById_fkey') THEN
    ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_executions_campaignId_fkey') THEN
    ALTER TABLE "campaign_executions" ADD CONSTRAINT "campaign_executions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_executions_contactId_fkey') THEN
    ALTER TABLE "campaign_executions" ADD CONSTRAINT "campaign_executions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_notes_createdById_fkey') THEN
    ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
