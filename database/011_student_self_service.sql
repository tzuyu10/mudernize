-- Adds student-owned 1:1 tally additions and safe archival for finished schedules.
-- Run after 010_exact_tally_decrease.sql.

BEGIN;

ALTER TABLE public.tally_adjustments DROP CONSTRAINT IF EXISTS mud_tally_ratio_by_type;
ALTER TABLE public.tally_adjustments ADD CONSTRAINT mud_tally_ratio_by_type CHECK (
 (adjustment_kind='decrease' AND duty_ratio IN (1,3,6)) OR
 (adjustment_kind='increase' AND duty_type IN ('excused','waived') AND duty_ratio=1) OR
 (adjustment_kind='increase' AND duty_type='unexcused' AND duty_ratio IN (1,3,6))
);

CREATE OR REPLACE FUNCTION public.change_own_tally(duty_category text,duty_count integer,change_kind text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_required integer;committed integer;updated_required integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE user_id=auth.uid() AND role='student' AND coalesce(is_active,true)) THEN
  RAISE EXCEPTION 'Active student access required';
 END IF;
 IF duty_category NOT IN ('excused','waived','unexcused') THEN RAISE EXCEPTION 'Invalid duty category'; END IF;
 IF duty_count IS NULL OR duty_count<1 OR duty_count>180 THEN RAISE EXCEPTION 'Duty count must be from 1 to 180'; END IF;
 IF change_kind NOT IN ('increase','decrease') THEN RAISE EXCEPTION 'Invalid tally change'; END IF;

 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || duty_category,0));
 SELECT coalesce(sum(signed_total),0) INTO current_required FROM public.tally_adjustments
 WHERE student_id=auth.uid() AND duty_type=duty_category;
 SELECT coalesce(sum(registration.duty_count),0) INTO committed FROM public.registrations AS registration
 WHERE registration.student_id=auth.uid() AND registration.duty_type=duty_category AND registration.status<>'denied';
 updated_required:=current_required+CASE WHEN change_kind='decrease' THEN -duty_count ELSE duty_count END;
 IF updated_required>180 THEN RAISE EXCEPTION 'A category tally cannot exceed 180 duties'; END IF;
 IF updated_required<committed THEN RAISE EXCEPTION 'The tally cannot be lower than % duties already registered in this category',committed; END IF;

 INSERT INTO public.tally_adjustments(student_id,added_by,duty_type,missed_count,duty_ratio,adjustment_kind)
 VALUES(auth.uid(),auth.uid(),duty_category,duty_count,1,change_kind);
 UPDATE public.student_profiles SET
  manual_tally_count=(SELECT coalesce(sum(signed_total),0) FROM public.tally_adjustments WHERE student_id=auth.uid()),
  updated_at=now()
 WHERE user_id=auth.uid();
 RETURN updated_required;
END $$;

REVOKE ALL ON FUNCTION public.change_own_tally(text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_own_tally(text,integer,text) TO authenticated;
DROP FUNCTION IF EXISTS public.add_own_tally(text,integer);

ALTER TABLE public.mud_schedules ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS mud_schedules_active_date ON public.mud_schedules(date,status) WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.mud_tally_balance_version()
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$;
GRANT EXECUTE ON FUNCTION public.mud_tally_balance_version() TO authenticated,service_role;

ANALYZE public.tally_adjustments;
ANALYZE public.mud_schedules;
COMMIT;