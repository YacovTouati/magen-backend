/*
  Hand-edited from the Prisma-generated diff: the generated version dropped
  and re-added `contactedOtherCenterBefore` (destroying any existing values)
  and added the two new NOT NULL columns with no default, which would fail
  outright against a non-empty CallReport table (e.g. production). This
  version renames instead of drop+add, and backfills the two new columns via
  a temporary DEFAULT that's dropped immediately after — so existing rows get
  a sane value, `schema.prisma` (no `@default`) stays true to the DB, and
  no default lingers for future inserts to rely on by accident.
*/

-- Preserve existing values; same boolean semantics under a name that reflects
-- "received support" rather than "contacted" (see schema.prisma comment).
ALTER TABLE "CallReport" RENAME COLUMN "contactedOtherCenterBefore" TO "receivedSupportAtOtherCenter";

-- AlterTable
ALTER TABLE "CallReport" ADD COLUMN     "isFamilyMemberOrAcquaintance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "magenContactHistory" TEXT NOT NULL DEFAULT 'dont_remember';

ALTER TABLE "CallReport" ALTER COLUMN "isFamilyMemberOrAcquaintance" DROP DEFAULT,
ALTER COLUMN "magenContactHistory" DROP DEFAULT;
