-- CreateEnum
CREATE TYPE "CorrectionType" AS ENUM ('CORRECTION', 'APPROVAL');

-- CreateTable
CREATE TABLE "MessageCorrection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agentId" TEXT,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "CorrectionType" NOT NULL,
    "customerMessage" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "correctedContent" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageCorrection_companyId_createdAt_idx" ON "MessageCorrection"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "MessageCorrection" ADD CONSTRAINT "MessageCorrection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCorrection" ADD CONSTRAINT "MessageCorrection_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCorrection" ADD CONSTRAINT "MessageCorrection_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCorrection" ADD CONSTRAINT "MessageCorrection_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCorrection" ADD CONSTRAINT "MessageCorrection_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

