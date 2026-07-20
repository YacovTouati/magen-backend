/*
  Hand-written (Prisma's `migrate dev` can't run non-interactively for a
  destructive enum-value change, and its raw generated diff casts
  role::text::UserRole_new directly, which would fail outright on any
  existing 'ADMIN' row since that value no longer exists in the new type).
  This version remaps 'ADMIN' -> 'SUPER_ADMIN' during the cast so existing
  admin accounts keep full access under their new role name instead of the
  migration erroring out (locally) or silently losing data.
*/

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'INTAKE_ADMIN', 'SCHEDULER_ADMIN', 'VOLUNTEER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'
    ELSE "role"::text
  END
)::"UserRole_new";
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VOLUNTEER';
COMMIT;
