-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "mpPreapprovalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_mpPreapprovalId_key" ON "Subscription"("mpPreapprovalId");
