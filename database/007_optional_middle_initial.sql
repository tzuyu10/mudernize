-- Optional middle initial support for all MUDernize user accounts.
-- Run after 006_student_duty_completion.sql in Supabase SQL Editor.

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS middle_initial varchar(1);

UPDATE public.users
SET middle_initial=nullif(upper(left(trim(middle_initial),1)),'')
WHERE middle_initial IS NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS mud_users_middle_initial_format;
ALTER TABLE public.users ADD CONSTRAINT mud_users_middle_initial_format
 CHECK (middle_initial IS NULL OR middle_initial ~ '^[A-Z]$');

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m jsonb; rule public.batches%ROWTYPE; middle text;
BEGIN
 SELECT raw_app_meta_data INTO m FROM auth.users WHERE id=NEW.id;
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF m->>'role' IS NULL OR m->>'role' NOT IN ('student','clinical_head') THEN RAISE EXCEPTION 'Accounts must be provisioned by a Clinical Head'; END IF;
 IF nullif(trim(m->>'first_name'),'') IS NULL OR nullif(trim(m->>'last_name'),'') IS NULL THEN RAISE EXCEPTION 'Names required'; END IF;
 middle=nullif(upper(trim(trailing '.' FROM trim(coalesce(m->>'middle_initial','')))), '');
 IF middle IS NOT NULL AND middle !~ '^[A-Z]$' THEN RAISE EXCEPTION 'Middle initial must be one letter'; END IF;
 IF m->>'role'='student' THEN
  SELECT * INTO rule FROM public.batches WHERE name=m->>'batch' AND is_active;
  IF NOT FOUND OR coalesce(m->>'student_number','') !~ '^[0-9]{4}-[0-9]{6}$'
     OR m->>'student_number' NOT LIKE rule.student_year_prefix || '-%'
     OR m->>'year_level'<>rule.year_level THEN RAISE EXCEPTION 'Student ID, batch and year required'; END IF;
 END IF;
 IF m->>'role'='clinical_head' AND coalesce(m->>'admin_number','') !~ '^[a-zA-Z0-9-]{3,40}$' THEN RAISE EXCEPTION 'Admin ID required'; END IF;
 INSERT INTO public.users(user_id,student_number,admin_number,role,first_name,middle_initial,last_name,year_level,batch,recommendation,is_active)
 VALUES(NEW.id,m->>'student_number',m->>'admin_number',m->>'role',trim(m->>'first_name'),middle,trim(m->>'last_name'),m->>'year_level',m->>'batch',m->>'recommendation',true);
 IF m->>'role'='student' THEN INSERT INTO public.student_profiles(user_id) VALUES(NEW.id); END IF;
 RETURN NEW;
END $$;

COMMIT;

SELECT column_name,data_type,character_maximum_length,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users' AND column_name='middle_initial';
