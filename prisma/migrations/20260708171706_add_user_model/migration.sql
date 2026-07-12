-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VOLUNTEER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CallReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    CONSTRAINT "CallReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CallReport" ("callDuration", "callPurpose", "callerName", "callerType", "contactedOtherCenterBefore", "createdAt", "email", "gender", "id", "phone", "region", "sector", "summaryNotes") SELECT "callDuration", "callPurpose", "callerName", "callerType", "contactedOtherCenterBefore", "createdAt", "email", "gender", "id", "phone", "region", "sector", "summaryNotes" FROM "CallReport";
DROP TABLE "CallReport";
ALTER TABLE "new_CallReport" RENAME TO "CallReport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
