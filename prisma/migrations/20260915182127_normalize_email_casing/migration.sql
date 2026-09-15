-- Normalizes existing "User" and "InvitedUser" emails (trim + lowercase) to match
-- the app-level normalization now applied at every login/register/invite/reset
-- call site. Without this, accounts created before the code fix stay locked out
-- under their original casing even though new logins now normalize correctly.
--
-- Aborts loudly instead of running if two rows would collapse onto the same
-- normalized email (a pre-existing case-only duplicate) — better to fail the
-- deploy and require a manual look than silently violate the unique constraint
-- or merge two distinct accounts.
DO $$
DECLARE
    dup_count integer;
BEGIN
    SELECT COUNT(*) INTO dup_count FROM (
        SELECT LOWER(TRIM(email)) AS norm
        FROM "User"
        GROUP BY LOWER(TRIM(email))
        HAVING COUNT(*) > 1
    ) dupes;
    IF dup_count > 0 THEN
        RAISE EXCEPTION 'normalize_email_casing aborted: % case/whitespace-only duplicate email(s) in "User"', dup_count;
    END IF;

    SELECT COUNT(*) INTO dup_count FROM (
        SELECT LOWER(TRIM(email)) AS norm
        FROM "InvitedUser"
        GROUP BY LOWER(TRIM(email))
        HAVING COUNT(*) > 1
    ) dupes;
    IF dup_count > 0 THEN
        RAISE EXCEPTION 'normalize_email_casing aborted: % case/whitespace-only duplicate email(s) in "InvitedUser"', dup_count;
    END IF;
END $$;

UPDATE "User" SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email));
UPDATE "InvitedUser" SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email));
