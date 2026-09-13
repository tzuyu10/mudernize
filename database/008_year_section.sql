-- Store each student's year and section in the canonical format 4NU-05.
-- Run after 007_optional_middle_initial.sql in the Supabase SQL Editor.

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS year_section varchar(6);

UPDATE public.users
SET year_section=upper(trim(year_section))
WHERE year_section IS NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS mud_users_year_section_format;
ALTER TABLE public.users ADD CONSTRAINT mud_users_year_section_format
 CHECK (year_section IS NULL OR year_section ~ '^[234]NU-[0-9]{2}$');

CREATE OR REPLACE FUNCTION public.validate_student_batch()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE rule public.batches%ROWTYPE;
BEGIN
 IF NEW.role<>'student' THEN RETURN NEW; END IF;
 SELECT * INTO rule FROM public.batches WHERE name=NEW.batch AND is_active;
 IF NOT FOUND OR NEW.student_number NOT LIKE rule.student_year_prefix || '-%' OR NEW.year_level<>rule.year_level THEN
  RAISE EXCEPTION 'Student ID, batch, and year do not match an active batch';
 END IF;
 IF NEW.year_section IS NOT NULL AND NEW.year_section NOT LIKE left(rule.year_level,1) || 'NU-%' THEN
  RAISE EXCEPTION 'Year and section must match the batch year level';
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS mud_validate_student_batch ON public.users;
CREATE TRIGGER mud_validate_student_batch BEFORE INSERT OR UPDATE OF student_number,batch,year_level,year_section,role
ON public.users FOR EACH ROW EXECUTE FUNCTION public.validate_student_batch();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m jsonb; rule public.batches%ROWTYPE; middle text; year_section_value text;
BEGIN
 SELECT raw_app_meta_data INTO m FROM auth.users WHERE id=NEW.id;
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF m->>'role' IS NULL OR m->>'role' NOT IN ('student','clinical_head') THEN RAISE EXCEPTION 'Accounts must be provisioned by a Clinical Head'; END IF;
 IF nullif(trim(m->>'first_name'),'') IS NULL OR nullif(trim(m->>'last_name'),'') IS NULL THEN RAISE EXCEPTION 'Names required'; END IF;
 middle=nullif(upper(trim(trailing '.' FROM trim(coalesce(m->>'middle_initial','')))), '');
 IF middle IS NOT NULL AND middle !~ '^[A-Z]$' THEN RAISE EXCEPTION 'Middle initial must be one letter'; END IF;
 year_section_value=nullif(upper(trim(coalesce(m->>'year_section',''))), '');
 IF m->>'role'='student' THEN
  SELECT * INTO rule FROM public.batches WHERE name=m->>'batch' AND is_active;
  IF NOT FOUND OR coalesce(m->>'student_number','') !~ '^[0-9]{4}-[0-9]{6}$'
     OR m->>'student_number' NOT LIKE rule.student_year_prefix || '-%'
     OR m->>'year_level'<>rule.year_level
     OR year_section_value IS NULL
     OR year_section_value !~ '^[234]NU-[0-9]{2}$'
     OR year_section_value NOT LIKE left(rule.year_level,1) || 'NU-%'
  THEN RAISE EXCEPTION 'Student ID, batch, year level, and year-section are required and must match'; END IF;
 END IF;
 IF m->>'role'='clinical_head' AND coalesce(m->>'admin_number','') !~ '^[a-zA-Z0-9-]{3,40}$' THEN RAISE EXCEPTION 'Admin ID required'; END IF;
 INSERT INTO public.users(user_id,student_number,admin_number,role,first_name,middle_initial,last_name,year_level,year_section,batch,recommendation,is_active)
 VALUES(NEW.id,m->>'student_number',m->>'admin_number',m->>'role',trim(m->>'first_name'),middle,trim(m->>'last_name'),m->>'year_level',year_section_value,m->>'batch',m->>'recommendation',true);
 IF m->>'role'='student' THEN INSERT INTO public.student_profiles(user_id) VALUES(NEW.id); END IF;
 RETURN NEW;
END $$;

CREATE INDEX IF NOT EXISTS mud_users_year_section ON public.users(year_level,year_section) WHERE role='student';

ANALYZE public.users;
COMMIT;

SELECT column_name,data_type,character_maximum_length,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users' AND column_name IN ('year_level','year_section');
