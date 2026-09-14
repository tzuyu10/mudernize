-- Allows Clinical Heads to decrease any unregistered duty units exactly.
-- Addition rules remain 1:1 for Excused/Waived and 1:3 or 1:6 for Unexcused.
-- Run after 009_tally_balances.sql.

BEGIN;

ALTER TABLE public.tally_adjustments DROP CONSTRAINT IF EXISTS mud_tally_ratio_by_type;
ALTER TABLE public.tally_adjustments ADD CONSTRAINT mud_tally_ratio_by_type CHECK (
 (adjustment_kind='decrease' AND duty_ratio IN (1,3,6)) OR
 (adjustment_kind='increase' AND (
   (duty_type IN ('excused','waived') AND duty_ratio=1) OR
   (duty_type='unexcused' AND duty_ratio IN (3,6))
 ))
);

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
 IF (change_kind='decrease' AND duty_ratio<>1)
    OR (change_kind='increase' AND duty_category IN ('excused','waived') AND duty_ratio<>1)
    OR (change_kind='increase' AND duty_category='unexcused' AND duty_ratio NOT IN (3,6))
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

REVOKE ALL ON FUNCTION public.change_tally_requirement(uuid,integer,text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_tally_requirement(uuid,integer,text,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mud_tally_balance_version()
RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT 2 $$;
GRANT EXECUTE ON FUNCTION public.mud_tally_balance_version() TO authenticated,service_role;

ANALYZE public.tally_adjustments;
COMMIT;
