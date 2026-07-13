-- CreateIndex
CREATE INDEX "CallReport_createdById_idx" ON "CallReport"("createdById");

-- CreateIndex
CREATE INDEX "CallReport_createdAt_idx" ON "CallReport"("createdAt");

-- CreateIndex
CREATE INDEX "Intake_assignedToId_idx" ON "Intake"("assignedToId");

-- CreateIndex
CREATE INDEX "Intake_status_idx" ON "Intake"("status");

-- CreateIndex
CREATE INDEX "Intake_createdAt_idx" ON "Intake"("createdAt");
