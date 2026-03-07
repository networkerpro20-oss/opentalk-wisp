-- AlterTable: Add AI campaign features to campaigns
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "aiBrief" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "aiGeneratedText" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "campaignMessageType" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "ttsVoice" TEXT DEFAULT 'alloy';
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "variants" JSONB;

-- AlterTable: Add A/B and response tracking to campaign_executions
ALTER TABLE "campaign_executions" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "campaign_executions" ADD COLUMN IF NOT EXISTS "responseContent" TEXT;
