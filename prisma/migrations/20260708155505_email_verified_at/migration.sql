-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- Las cuentas que ya existían antes de este cambio quedan verificadas automáticamente (usando
-- su fecha de alta): exigirles confirmar el email retroactivamente las dejaría afuera del
-- sistema sin haber hecho nada mal. Solo los signups nuevos, de acá en adelante, tienen que
-- confirmar el email antes de poder iniciar sesión.
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
