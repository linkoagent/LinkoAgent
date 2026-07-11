-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "appointmentBufferMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "appointmentDurationMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "lunchBreakEnd" TEXT,
ADD COLUMN     "lunchBreakStart" TEXT,
ADD COLUMN     "maxSimultaneousAppointments" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "CompanyHoliday" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "label" TEXT,
    "recurringYearly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyHoliday_companyId_idx" ON "CompanyHoliday"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyHoliday" ADD CONSTRAINT "CompanyHoliday_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex: el índice único parcial ya no puede ser incondicional (maxSimultaneousAppointments
-- puede ser > 1). La protección contra doble-reserva pasa a una transacción Serializable en
-- src/lib/agenda/service.ts (ver comentario en el modelo Appointment del schema).
DROP INDEX IF EXISTS "Appointment_companyId_startsAt_confirmed_key";

