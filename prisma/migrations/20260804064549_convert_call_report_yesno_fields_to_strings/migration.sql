/*
  Hand-edited from the Prisma-generated diff: the generated `SET DATA TYPE TEXT`
  with no USING clause would cast existing booleans to the literal strings
  'true'/'false', not our actual enum values ('yes'/'no'/'unknown' and
  'no'/'yes_practical'/'yes_principled'). This version maps old boolean values
  onto the new string vocabulary explicitly so existing rows stay meaningful.

  receivedSupportAtOtherCenter had no third state before, so true/false map
  1:1 onto yes/no (no existing row can become 'unknown' retroactively).

  reportingDuty's old `true` didn't distinguish practical vs. principled duty,
  so existing `true` rows are mapped to 'yes_practical' as the closest prior
  meaning (a report was in fact filed) — 'yes_principled' is a new, going
  -forward-only value.
*/

ALTER TABLE "CallReport"
  ALTER COLUMN "receivedSupportAtOtherCenter" TYPE TEXT
  USING (CASE WHEN "receivedSupportAtOtherCenter" THEN 'yes' ELSE 'no' END);

ALTER TABLE "CallReport"
  ALTER COLUMN "reportingDuty" TYPE TEXT
  USING (CASE
    WHEN "reportingDuty" IS TRUE THEN 'yes_practical'
    WHEN "reportingDuty" IS FALSE THEN 'no'
    ELSE NULL
  END);
