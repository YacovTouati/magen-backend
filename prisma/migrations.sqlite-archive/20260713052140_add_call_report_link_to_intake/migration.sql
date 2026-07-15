-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Intake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "callerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactedOtherCenter" TEXT NOT NULL,
    "caseDescription" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToId" INTEGER,
    "callReportId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Intake_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Intake_callReportId_fkey" FOREIGN KEY ("callReportId") REFERENCES "CallReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Intake" ("assignedToId", "callerName", "caseDescription", "contactedOtherCenter", "createdAt", "id", "phone", "status", "updatedAt", "urgency") SELECT "assignedToId", "callerName", "caseDescription", "contactedOtherCenter", "createdAt", "id", "phone", "status", "updatedAt", "urgency" FROM "Intake";
DROP TABLE "Intake";
ALTER TABLE "new_Intake" RENAME TO "Intake";
CREATE UNIQUE INDEX "Intake_callReportId_key" ON "Intake"("callReportId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
