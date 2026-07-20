/*
  Hand-written for the same reason as prior enum/rename migrations in this
  project: Prisma's raw diff for a volatile-default ADD COLUMN (now() + ...)
  evaluates the expression ONCE and stamps every existing row with that same
  single timestamp, rather than each row's own creation time. This version
  backfills expiresAt as createdAt + 14 days per row instead, so existing
  intakes get a retention deadline consistent with when they actually came
  in, before the DB-level default takes over for every future INSERT.
*/

-- Drop the per-caseworker "assigned to" relation — case ownership is no
-- longer tracked at all; only SUPER_ADMIN/INTAKE_ADMIN can touch intakes,
-- enforced at the route layer instead.
ALTER TABLE "Intake" DROP CONSTRAINT "Intake_assignedToId_fkey";
DROP INDEX "Intake_assignedToId_idx";
ALTER TABLE "Intake" DROP COLUMN "assignedToId";

-- Add expiresAt: nullable first so the backfill can run, then locked to
-- NOT NULL with a DB-level default so every future INSERT (from any code
-- path) gets a 14-day deadline with no risk of a call site forgetting it.
ALTER TABLE "Intake" ADD COLUMN "expiresAt" TIMESTAMP(3);
UPDATE "Intake" SET "expiresAt" = "createdAt" + interval '14 days';
ALTER TABLE "Intake" ALTER COLUMN "expiresAt" SET NOT NULL;
ALTER TABLE "Intake" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '14 days');

CREATE INDEX "Intake_expiresAt_idx" ON "Intake"("expiresAt");
