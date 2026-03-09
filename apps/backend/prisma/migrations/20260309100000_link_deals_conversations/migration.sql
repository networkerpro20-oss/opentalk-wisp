-- AlterTable: Add conversationId to deals
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "conversationId" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "deals_conversationId_key" ON "deals"("conversationId");
CREATE INDEX IF NOT EXISTS "deals_conversationId_idx" ON "deals"("conversationId");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
