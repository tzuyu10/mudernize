-- Run once after the baseline MUDernize schema and security policies are installed.
-- These indexes speed the authenticated dashboard filters and protect exact
-- duplicate schedule creation when multiple Clinical Heads submit together.

CREATE INDEX IF NOT EXISTS mud_registrations_status_submitted
 ON public.registrations(status,submitted_at);

CREATE INDEX IF NOT EXISTS mud_registrations_student_submitted
 ON public.registrations(student_id,submitted_at DESC);

CREATE INDEX IF NOT EXISTS mud_schedules_open_date_audience
 ON public.mud_schedules(status,date,batch,year_level);

CREATE INDEX IF NOT EXISTS mud_announcements_audience_posted
 ON public.announcements(batch,posted_at DESC);

CREATE INDEX IF NOT EXISTS mud_users_role_name
 ON public.users(role,last_name,first_name);

CREATE INDEX IF NOT EXISTS mud_verification_notes_registration_created
 ON public.verification_notes(registration_id,created_at);

-- Different clinical areas may intentionally share a date/time. An exact slot
-- for the same audience and area may only be created once.
CREATE UNIQUE INDEX IF NOT EXISTS mud_schedule_exact_slot
 ON public.mud_schedules(
  date,
  time_slot,
  coalesce(batch,'*'),
  coalesce(year_level,'all'),
  lower(trim(clinical_area))
 );

ANALYZE public.users;
ANALYZE public.announcements;
ANALYZE public.mud_schedules;
ANALYZE public.registrations;
ANALYZE public.verification_notes;
