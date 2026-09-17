-- Fixes student tally decreases and student-completed schedule transitions.
-- Run after 012_batch_logo_storage.sql on existing databases.

BEGIN;

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
 SELECT coalesce(sum(adjustment.signed_total),0) INTO current_required
 FROM public.tally_adjustments AS adjustment
 WHERE adjustment.student_id=auth.uid() AND adjustment.duty_type=duty_category;
 SELECT coalesce(sum(registration.duty_count),0) INTO committed
 FROM public.registrations AS registration
 WHERE registration.student_id=auth.uid()
   AND registration.duty_type=duty_category
   AND registration.status<>'denied';
 updated_required:=current_required+CASE WHEN change_kind='decrease' THEN -duty_count ELSE duty_count END;
 IF updated_required>180 THEN RAISE EXCEPTION 'A category tally cannot exceed 180 duties'; END IF;
 IF updated_required<committed THEN RAISE EXCEPTION 'The tally cannot be lower than % duties already registered in this category',committed; END IF;

 INSERT INTO public.tally_adjustments(student_id,added_by,duty_type,missed_count,duty_ratio,adjustment_kind)
 VALUES(auth.uid(),auth.uid(),duty_category,duty_count,1,change_kind);
 UPDATE public.student_profiles SET
  manual_tally_count=(SELECT coalesce(sum(adjustment.signed_total),0) FROM public.tally_adjustments AS adjustment WHERE adjustment.student_id=auth.uid()),
  updated_at=now()
 WHERE user_id=auth.uid();
 RETURN updated_required;
END $$;

REVOKE ALL ON FUNCTION public.change_own_tally(text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_own_tally(text,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_own_duty(target_registration bigint)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
 current_status text;
 completed_time timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE user_id=auth.uid() AND role='student' AND coalesce(is_active,true)) THEN
  RAISE EXCEPTION 'Active student access required';
 END IF;

 SELECT registration.status INTO current_status
 FROM public.registrations AS registration
 JOIN public.mud_schedules AS schedule ON schedule.schedule_id=registration.schedule_id
 WHERE registration.registration_id=target_registration
   AND registration.student_id=auth.uid()
   AND registration.status IN ('verified','ongoing')
   AND schedule.date <= (now() AT TIME ZONE 'Asia/Manila')::date
 FOR UPDATE OF registration;

 IF current_status IS NULL THEN
  RAISE EXCEPTION 'This duty cannot be completed. It must belong to you, be approved or ongoing, and have reached its scheduled date.';
 END IF;

 -- Preserve the enforced workflow instead of skipping Approved -> Ongoing.
 IF current_status='verified' THEN
  UPDATE public.registrations
  SET status='ongoing',verified_at=coalesce(verified_at,now())
  WHERE registration_id=target_registration AND student_id=auth.uid() AND status='verified';
 END IF;

 UPDATE public.registrations
 SET status='completed',student_completed_at=now(),verified_at=coalesce(verified_at,now())
 WHERE registration_id=target_registration AND student_id=auth.uid() AND status='ongoing'
 RETURNING student_completed_at INTO completed_time;

 IF completed_time IS NULL THEN RAISE EXCEPTION 'The duty status changed before completion. Refresh and try again.'; END IF;
 RETURN completed_time;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_own_duty(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_own_duty(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.mud_tally_balance_version()
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 5 $$;
GRANT EXECUTE ON FUNCTION public.mud_tally_balance_version() TO authenticated,service_role;

COMMIT;