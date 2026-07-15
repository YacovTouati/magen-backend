-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "volunteerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShiftAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_date_key" ON "ShiftAssignment"("date");

-- CreateIndex
CREATE INDEX "ShiftAssignment_volunteerId_idx" ON "ShiftAssignment"("volunteerId");
