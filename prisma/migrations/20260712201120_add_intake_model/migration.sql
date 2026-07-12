-- CreateTable
CREATE TABLE "Intake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "callerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactedOtherCenter" TEXT NOT NULL,
    "caseDescription" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Intake_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
