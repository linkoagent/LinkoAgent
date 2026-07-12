-- AlterTable: Channel gets generic OAuth/metadata fields for non-WhatsApp providers
ALTER TABLE "Channel" ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Channel" ADD COLUMN "scope" TEXT;
ALTER TABLE "Channel" ADD COLUMN "metadata" JSONB;

-- CreateIndex: webhook resolution by (type, accountId) for channels without a unique id like phoneNumberId
CREATE UNIQUE INDEX "Channel_type_accountId_key" ON "Channel"("type", "accountId");

-- AlterTable: AgentChannel gets an optional per-channel tone override
ALTER TABLE "AgentChannel" ADD COLUMN "toneOverride" TEXT;
