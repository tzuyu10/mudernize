-- Run after 013_tally_completion_fixes.sql, before deploying signup changes.
-- This trigger makes account creation and initial tally creation one transaction.
BEGIN;
CREATE OR REPLACE FUNCTION public.initialize_signup_muds()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE counts jsonb; category text; amount integer; total integer:=0;
BEGIN
 SELECT raw_app_meta_data->'initial_muds' INTO counts FROM auth.users WHERE id=NEW.user_id;
 IF counts IS NULL THEN RETURN NEW; END IF;
 IF jsonb_typeof(counts)<>'object' THEN RAISE EXCEPTION 'Invalid initial MUD counts'; END IF;
 FOREACH category IN ARRAY ARRAY['excused','waived','unexcused'] LOOP
  IF counts->>category IS NULL OR (counts->>category)!~ '^[0-9]{1,3}$' THEN
   RAISE EXCEPTION 'Each MUD category requires a whole number';
  END IF;
  amount:=(counts->>category)::integer;
  IF amount>180 THEN RAISE EXCEPTION 'A category cannot exceed 180 duties'; END IF;
  IF amount>0 THEN
   INSERT INTO public.tally_adjustments(student_id,added_by,duty_type,missed_count,duty_ratio,adjustment_kind)
   VALUES(NEW.user_id,NEW.user_id,category,amount,1,'increase');
  END IF;
  total:=total+amount;
 END LOOP;
 UPDATE public.student_profiles SET manual_tally_count=total WHERE user_id=NEW.user_id;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.initialize_signup_muds() FROM PUBLIC;
DROP TRIGGER IF EXISTS initialize_signup_muds ON public.student_profiles;
CREATE TRIGGER initialize_signup_muds AFTER INSERT ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.initialize_signup_muds();
CREATE OR REPLACE FUNCTION public.mud_signup_tally_version()
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 1 $$;
REVOKE ALL ON FUNCTION public.mud_signup_tally_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mud_signup_tally_version() TO service_role;
COMMIT;

