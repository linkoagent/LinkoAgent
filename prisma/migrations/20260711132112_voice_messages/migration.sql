-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "audioMediaId" TEXT,
ADD COLUMN     "isVoiceMessage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transcriptionConfidence" DOUBLE PRECISION,
ADD COLUMN     "transcriptionLanguage" TEXT,
ADD COLUMN     "transcriptionSummary" TEXT;

