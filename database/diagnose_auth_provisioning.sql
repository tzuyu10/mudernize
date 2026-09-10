-- Read-only diagnostics if account creation still fails after fix_auth_provisioning.sql.
-- Contains schema/trigger information only, not account passwords or tokens.
SELECT t.tgname, pg_get_triggerdef(t.oid) AS trigger_definition,
       p.proname AS function_name, p.prosecdef AS security_definer,
       pg_get_userbyid(p.proowner) AS function_owner
FROM pg_trigger t
JOIN pg_proc p ON p.oid=t.tgfoid
WHERE t.tgrelid IN ('auth.users'::regclass,'public.users'::regclass,'public.student_profiles'::regclass)
AND NOT t.tgisinternal
ORDER BY t.tgrelid,t.tgname;

SELECT table_name,column_name,is_nullable,column_default,is_identity
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('users','student_profiles')
ORDER BY table_name,ordinal_position;

SELECT conrelid::regclass AS table_name,conname,pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('public.users'::regclass,'public.student_profiles'::regclass)
ORDER BY conrelid,conname;

