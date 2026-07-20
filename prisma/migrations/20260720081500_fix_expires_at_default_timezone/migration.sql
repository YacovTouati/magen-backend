/*
  The previous migration's expiresAt default used bare now(), a timestamptz.
  Casting that down to the timestamp(3) column implicitly converts through
  the DB SESSION's timezone (EET/EEST locally) before dropping the offset,
  so the stored naive digits ended up 2-3 hours off from true UTC — verified
  empirically: a row inserted right after that migration had a 14d03h delta
  between createdAt and expiresAt instead of exactly 14d00h.

  createdAt has no such bug because Prisma computes @default(now()) values
  client-side in UTC and sends the naive digits directly; only the DB-level
  dbgenerated() default for expiresAt went through the session-timezone
  cast. Fixed by converting through UTC explicitly before adding the
  interval, so expiresAt lands in the same naive-UTC frame createdAt (and
  every JS `new Date()` comparison in the app) already uses.
*/

ALTER TABLE "Intake" ALTER COLUMN "expiresAt" SET DEFAULT (timezone('UTC'::text, now()) + '14 days'::interval);
