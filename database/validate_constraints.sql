-- FINAL VALIDATION for all existing rows.
-- New writes must already obey these checks through the baseline schema rules.
-- If this fails, it reports the first violating table/check. Correct real values;
-- do not guess old batches, absence dates or medical evidence to force a pass.
BEGIN;
DO $validate$
DECLARE item record; invalid_count bigint;
BEGIN
 FOR item IN SELECT c.conname,c.conrelid::regclass AS table_name,
                    pg_get_expr(c.conbin,c.conrelid) AS expression
             FROM pg_constraint c
             JOIN pg_namespace n ON n.oid=c.connamespace
             WHERE n.nspname='public' AND c.contype='c' AND NOT c.convalidated
               AND (c.conname LIKE 'mud_%' OR c.conname='schedule_capacity_limit')
             ORDER BY c.conrelid,c.conname
 LOOP
  EXECUTE format('SELECT count(*) FROM %s WHERE NOT coalesce((%s),false)',item.table_name,item.expression)
   INTO invalid_count;
  IF invalid_count > 0 THEN
   RAISE EXCEPTION '% row(s) violate %.%. Correct those rows, then rerun validation.',
    invalid_count,item.table_name,item.conname;
  END IF;
  EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I',item.table_name,item.conname);
 END LOOP;
END $validate$;
COMMIT;
SELECT conrelid::regclass AS table_name,conname,convalidated
FROM pg_constraint
WHERE connamespace='public'::regnamespace
AND (conname LIKE 'mud_%' OR conname='schedule_capacity_limit')
ORDER BY conrelid::regclass::text,conname;


