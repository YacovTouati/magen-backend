-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "IntakeUrgency" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('NEW', 'NO_ANSWER', 'ACTIVE', 'CLOSED', 'LONG_TERM');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VOLUNTEER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intake" (
    "id" SERIAL NOT NULL,
    "callerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactedOtherCenter" TEXT NOT NULL,
    "caseDescription" TEXT NOT NULL,
    "urgency" "IntakeUrgency" NOT NULL,
    "status" "IntakeStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" INTEGER,
    "callReportId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallReport" (
    "id" SERIAL NOT NULL,
    "callDuration" INTEGER NOT NULL,
    "callerType" TEXT NOT NULL,
    "callPurpose" TEXT NOT NULL,
    "summaryNotes" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "region" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "contactedOtherCenterBefore" BOOLEAN NOT NULL,
    "reportingDuty" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,

    CONSTRAINT "CallReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_date_key" ON "ShiftAssignment"("date");

-- CreateIndex
CREATE INDEX "ShiftAssignment_volunteerId_idx" ON "ShiftAssignment"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "Intake_callReportId_key" ON "Intake"("callReportId");

-- CreateIndex
CREATE INDEX "Intake_assignedToId_idx" ON "Intake"("assignedToId");

-- CreateIndex
CREATE INDEX "Intake_status_idx" ON "Intake"("status");

-- CreateIndex
CREATE INDEX "Intake_createdAt_idx" ON "Intake"("createdAt");

-- CreateIndex
CREATE INDEX "CallReport_createdById_idx" ON "CallReport"("createdById");

-- CreateIndex
CREATE INDEX "CallReport_createdAt_idx" ON "CallReport"("createdAt");

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_callReportId_fkey" FOREIGN KEY ("callReportId") REFERENCES "CallReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallReport" ADD CONSTRAINT "CallReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
