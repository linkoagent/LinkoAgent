-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationsSeenAt" TIMESTAMP(3);

-- Los usuarios ya existentes arrancan con la campanita "al día" (ahora), para no inundarlos
-- con todo el historial viejo de mensajes de clientes como si fuera nuevo.
UPDATE "User" SET "notificationsSeenAt" = now() WHERE "notificationsSeenAt" IS NULL;
