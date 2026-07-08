-- CreateTable
CREATE TABLE "CallReport" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
