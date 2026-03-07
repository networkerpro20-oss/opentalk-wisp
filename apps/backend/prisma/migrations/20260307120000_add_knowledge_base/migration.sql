-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "Personality" AS ENUM ('PROFESSIONAL', 'FRIENDLY', 'AGGRESSIVE', 'EDUCATIONAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "KBSourceType" AS ENUM ('URL', 'DOCUMENT', 'WIZARD', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "knowledge_bases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Base de Conocimiento',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "systemPrompt" TEXT,
    "personality" "Personality" NOT NULL DEFAULT 'PROFESSIONAL',
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "autoResponseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customApiKey" TEXT,
    "businessHours" JSONB,
    "outsideHoursMessage" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "knowledge_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "sourceType" "KBSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "sourceFileName" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "embedding" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "knowledgeBaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_bases_organizationId_key" ON "knowledge_bases"("organizationId");
CREATE INDEX IF NOT EXISTS "knowledge_bases_organizationId_idx" ON "knowledge_bases"("organizationId");
CREATE INDEX IF NOT EXISTS "knowledge_items_knowledgeBaseId_idx" ON "knowledge_items"("knowledgeBaseId");
CREATE INDEX IF NOT EXISTS "knowledge_items_category_idx" ON "knowledge_items"("category");
CREATE INDEX IF NOT EXISTS "knowledge_items_isActive_idx" ON "knowledge_items"("isActive");

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "knowledge_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
