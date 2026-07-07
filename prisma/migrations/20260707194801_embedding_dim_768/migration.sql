-- Cambio de proveedor de embeddings (OpenAI -> Gemini): la dimensión del vector pasa de 1536
-- a 768. Los embeddings existentes no son compatibles con la nueva dimensión, así que se
-- borran acá; se recalculan solos la próxima vez que se (re)procese cada fuente.
DELETE FROM "KnowledgeChunk";
UPDATE "KnowledgeSource" SET status = 'PENDING';

-- AlterTable
ALTER TABLE "KnowledgeChunk" ALTER COLUMN "embedding" TYPE vector(768);
