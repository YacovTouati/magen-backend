-- AlterTable
ALTER TABLE "CallReport" ADD COLUMN     "reportedBy" TEXT NOT NULL DEFAULT 'ללא שם';

-- AlterTable
ALTER TABLE "Intake" ADD COLUMN     "reportedBy" TEXT NOT NULL DEFAULT 'ללא שם';
