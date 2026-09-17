-- Run once after 005_batch_and_user_management.sql.
-- Lets a student complete only their own approved or ongoing duty on or after
-- its scheduled date, while preserving the enforced status workflow.

BEGIN;

ALTER TABLE public.registrations
 ADD COLUMN IF NOT EXISTS student_completed_at timestamptz;

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

CREATE INDEX IF NOT EXISTS mud_registrations_student_completion
 ON public.registrations(student_id,student_completed_at DESC)
 WHERE student_completed_at IS NOT NULL;

COMMIT;