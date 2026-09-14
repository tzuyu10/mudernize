-- Adds auditable tally decreases and prevents students from registering more
-- duties than the Clinical Head assigned to their category.
-- Run after 008_year_section.sql in the Supabase SQL Editor.

BEGIN;

ALTER TABLE public.tally_adjustments
 ADD COLUMN IF NOT EXISTS adjustment_kind text NOT NULL DEFAULT 'increase';

DO $$ BEGIN
 ALTER TABLE public.tally_adjustments ADD CONSTRAINT mud_tally_adjustment_kind
  CHECK (adjustment_kind IN ('increase','decrease'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tally_adjustments
 ADD COLUMN IF NOT EXISTS signed_total integer
 GENERATED ALWAYS AS (
  CASE WHEN adjustment_kind='decrease' THEN -(missed_count*duty_ratio)
       ELSE missed_count*duty_ratio END
 ) STORED;

CREATE INDEX IF NOT EXISTS mud_tally_adjustments_student_category
 ON public.tally_adjustments(student_id,duty_type,created_at DESC);

CREATE OR REPLACE FUNCTION public.change_tally_requirement(
 target_user uuid,
 missed_count integer,
 duty_category text,
 duty_ratio integer,
 change_kind text
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE change_total integer; current_required integer; committed integer; updated_required integer;
BEGIN
 IF NOT public.is_clinical_head() THEN RAISE EXCEPTION 'Clinical Head access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE user_id=target_user AND role='student') THEN RAISE EXCEPTION 'Student account not found'; END IF;
 IF missed_count IS NULL OR missed_count<1 OR missed_count>180 THEN RAISE EXCEPTION 'Duty count must be from 1 to 180'; END IF;
 IF change_kind NOT IN ('increase','decrease') THEN RAISE EXCEPTION 'Invalid tally change'; END IF;
 IF (duty_category IN ('excused','waived') AND duty_ratio<>1)
    OR (duty_category='unexcused' AND duty_ratio NOT IN (3,6))
    OR duty_category NOT IN ('excused','unexcused','waived') THEN RAISE EXCEPTION 'Invalid duty tally ratio'; END IF;

 change_total:=missed_count*duty_ratio;
 IF change_total>180 THEN RAISE EXCEPTION 'One tally change cannot exceed 180 duties'; END IF;

 PERFORM pg_advisory_xact_lock(hashtextextended(target_user::text || ':' || duty_category,0));
 SELECT coalesce(sum(signed_total),0) INTO current_required
 FROM public.tally_adjustments WHERE student_id=target_user AND duty_type=duty_category;
 SELECT coalesce(sum(duty_count),0) INTO committed
 FROM public.registrations WHERE student_id=target_user AND duty_type=duty_category AND status<>'denied';

 updated_required:=current_required + CASE WHEN change_kind='decrease' THEN -change_total ELSE change_total END;
 IF updated_required<committed THEN
  RAISE EXCEPTION 'The tally cannot be lower than % duties already registered in this category',committed;
 END IF;

 INSERT INTO public.tally_adjustments(student_id,added_by,duty_type,missed_count,duty_ratio,adjustment_kind)
 VALUES(target_user,auth.uid(),duty_category,missed_count,duty_ratio,change_kind);

 INSERT INTO public.student_profiles(user_id,manual_tally_count)
 VALUES(target_user,0) ON CONFLICT(user_id) DO NOTHING;
 UPDATE public.student_profiles
 SET manual_tally_count=(SELECT coalesce(sum(signed_total),0) FROM public.tally_adjustments WHERE student_id=target_user),updated_at=now()
 WHERE user_id=target_user;
 RETURN updated_required;
END $$;

CREATE OR REPLACE FUNCTION public.apply_tally_adjustment(
 target_user uuid, missed_count integer, duty_category text, duty_ratio integer
) RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT public.change_tally_requirement(target_user,missed_count,duty_category,duty_ratio,'increase');
$$;

CREATE OR REPLACE FUNCTION public.enforce_registration_tally()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE required_total integer; allocated_total integer;
BEGIN
 IF NEW.status='denied' THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.student_id::text || ':' || NEW.duty_type,0));
 SELECT coalesce(sum(signed_total),0) INTO required_total
 FROM public.tally_adjustments WHERE student_id=NEW.student_id AND duty_type=NEW.duty_type;
 SELECT coalesce(sum(duty_count),0) INTO allocated_total
 FROM public.registrations
 WHERE student_id=NEW.student_id AND duty_type=NEW.duty_type AND status<>'denied'
   AND registration_id IS DISTINCT FROM NEW.registration_id;
 IF allocated_total+NEW.duty_count>required_total THEN
  RAISE EXCEPTION 'Only % % duties remain available to register',greatest(required_total-allocated_total,0),NEW.duty_type;
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS mud_enforce_registration_tally ON public.registrations;
CREATE TRIGGER mud_enforce_registration_tally
 BEFORE INSERT OR UPDATE OF student_id,duty_type,duty_count ON public.registrations
 FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_tally();

REVOKE ALL ON FUNCTION public.change_tally_requirement(uuid,integer,text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_tally_requirement(uuid,integer,text,integer,text) TO authenticated;
REVOKE ALL ON FUNCTION public.apply_tally_adjustment(uuid,integer,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_tally_adjustment(uuid,integer,text,integer) TO authenticated;

ANALYZE public.tally_adjustments;
ANALYZE public.registrations;
COMMIT;
