-- Run this entire file in Supabase SQL Editor (as the postgres role).
-- Repairs only MUDernize's Auth provisioning function/trigger.
-- No accounts, passwords, application rows or security policies are deleted.
--
-- Supabase Admin createUser inserts auth.users BEFORE applying app_metadata.
-- A deferred constraint trigger reads the FINAL row at transaction completion.
BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
 m jsonb;
BEGIN
 SELECT raw_app_meta_data INTO m FROM auth.users WHERE id = NEW.id;
 -- A user inserted then removed in the same transaction needs no profile.
 IF NOT FOUND THEN RETURN NEW; END IF;

 IF m->>'role' IS NULL OR m->>'role' NOT IN ('student','clinical_head') THEN
  RAISE EXCEPTION 'Accounts must be provisioned by a Clinical Head';
 END IF;
 IF nullif(trim(m->>'first_name'),'') IS NULL
    OR nullif(trim(m->>'last_name'),'') IS NULL THEN
  RAISE EXCEPTION 'Names required';
 END IF;
 IF m->>'role'='student' AND (
    coalesce(m->>'student_number','') !~ '^[0-9]{4}-[0-9]{6}$'
    OR coalesce(m->>'batch','') NOT IN ('Sanghaya','Astraea','Solaris')
    OR coalesce(m->>'year_level','') NOT IN ('2nd','3rd','4th')
 ) THEN
  RAISE EXCEPTION 'Student ID, batch and year required';
 END IF;
 IF m->>'role'='clinical_head'
    AND coalesce(m->>'admin_number','') !~ '^[a-zA-Z0-9-]{3,40}$' THEN
  RAISE EXCEPTION 'Admin ID required';
 END IF;

 INSERT INTO public.users(
  user_id,student_number,admin_number,role,first_name,last_name,year_level,batch,recommendation
 ) VALUES (
  NEW.id,m->>'student_number',m->>'admin_number',m->>'role',
  m->>'first_name',m->>'last_name',m->>'year_level',m->>'batch',m->>'recommendation'
 );
 IF m->>'role'='student' THEN
  INSERT INTO public.student_profiles(user_id) VALUES(NEW.id);
 END IF;
 RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_auth_user ON auth.users;
CREATE CONSTRAINT TRIGGER trg_new_auth_user
AFTER INSERT ON auth.users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;

-- Expected: deferrable = true and initially_deferred = true.
SELECT tgname AS trigger_name,tgdeferrable AS deferrable,tginitdeferred AS initially_deferred
FROM pg_trigger
WHERE tgrelid='auth.users'::regclass AND tgname='trg_new_auth_user';

