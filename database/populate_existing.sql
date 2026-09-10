-- POPULATE THE EXISTING MUDernize TABLES.
-- 1. Install the baseline schema, constraints, RLS, storage and Auth trigger first.
-- 2. Run: node scripts/prepare-sql-seed.mjs --apply
-- 3. Run this entire file in Supabase SQL Editor.
-- Auth passwords/identities and Storage file bytes must be created through their APIs.
-- This script never inserts fake auth.users or storage.objects records.
-- Reserved negative IDs avoid changing the tables' normal positive ID sequences.
-- Re-running this file preserves existing matching demo rows and their review statuses.
BEGIN;
DO $seed$
DECLARE
 admin_id uuid;
 student public.users;
 sample record;
 slot_id integer;
 registration_id_to_use integer;
 evidence_path text;
 demo_date date := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
 PERFORM pg_advisory_xact_lock(87123391);
 SELECT user_id INTO admin_id FROM public.users
 WHERE admin_number='ADMIN-001' AND role='clinical_head';
 IF admin_id IS NULL THEN
  RAISE EXCEPTION 'Prepare ADMIN-001 first: run node scripts/prepare-sql-seed.mjs --apply';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=admin_id AND email='admin-001@accounts.mudernize.local') THEN
  RAISE EXCEPTION 'ADMIN-001 is not linked to the expected Auth login';
 END IF;

 -- Validate every account/file and every reserved ID before inserting data.
 FOR sample IN SELECT * FROM (VALUES
  ('2025-301107','Sanghaya','2nd','excused',-91001,1),
  ('2023-301108','Astraea','4th','unexcused',-91002,2),
  ('2024-301109','Solaris','3rd','waived',-91003,3)
 ) AS samples(student_number,batch,year_level,duty_type,record_id,day_offset)
 LOOP
  SELECT * INTO student FROM public.users u
  WHERE u.student_number=sample.student_number AND u.role='student';
  IF NOT FOUND OR student.batch IS DISTINCT FROM sample.batch OR student.year_level IS DISTINCT FROM sample.year_level THEN
   RAISE EXCEPTION 'Missing/mismatched demo student %. Run scripts/prepare-sql-seed.mjs --apply first.',sample.student_number;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=student.user_id AND email=sample.student_number || '@accounts.mudernize.local') THEN
   RAISE EXCEPTION 'Student % has a different Auth login',sample.student_number;
  END IF;
  evidence_path := student.user_id::text || '/sql-seed-placeholder.png';
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='duty-documents' AND name=evidence_path) THEN
   RAISE EXCEPTION 'Missing uploaded fixture for %. Run scripts/prepare-sql-seed.mjs --apply.',sample.student_number;
  END IF;
  IF EXISTS(SELECT 1 FROM public.mud_schedules WHERE schedule_id=sample.record_id
    AND (created_by IS DISTINCT FROM admin_id OR clinical_area IS DISTINCT FROM 'DEMO SQL - ' || sample.batch OR batch IS DISTINCT FROM sample.batch)) THEN
   RAISE EXCEPTION 'Reserved schedule ID % belongs to another record; no sample data inserted', sample.record_id;
  END IF;
  IF EXISTS(SELECT 1 FROM public.registrations WHERE registration_id=sample.record_id
    AND (student_id IS DISTINCT FROM student.user_id OR schedule_id IS DISTINCT FROM sample.record_id OR duty_type IS DISTINCT FROM sample.duty_type)) THEN
   RAISE EXCEPTION 'Reserved registration ID % belongs to another record',sample.record_id;
  END IF;
  IF EXISTS(SELECT 1 FROM public.verification_notes WHERE note_id=sample.record_id
    AND (registration_id IS DISTINCT FROM sample.record_id OR created_by IS DISTINCT FROM admin_id)) THEN
   RAISE EXCEPTION 'Reserved note ID % belongs to another record',sample.record_id;
  END IF;
 END LOOP;

 FOR sample IN SELECT * FROM (VALUES
  (-91001,'[DEMO] Welcome to MUDernize',NULL::text,
   'Choose an available duty date, attach the required evidence, and submit your request for review.'),
  (-91002,'[DEMO] Sanghaya duty reminder','Sanghaya',
   'Please arrive 15 minutes before your scheduled duty and bring your clinical requirements.')
 ) AS posts(record_id,title,batch,content)
 LOOP
  IF EXISTS(SELECT 1 FROM public.announcements WHERE announcement_id=sample.record_id
    AND (posted_by IS DISTINCT FROM admin_id OR title IS DISTINCT FROM sample.title)) THEN
   RAISE EXCEPTION 'Reserved announcement ID % belongs to another record',sample.record_id;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.announcements WHERE announcement_id=sample.record_id) THEN
   INSERT INTO public.announcements(announcement_id,posted_by,title,content,batch)
   VALUES(sample.record_id,admin_id,sample.title,sample.content,sample.batch);
  END IF;
 END LOOP;

 FOR sample IN SELECT * FROM (VALUES
  ('2025-301107','Sanghaya','2nd','excused',-91001,1),
  ('2023-301108','Astraea','4th','unexcused',-91002,2),
  ('2024-301109','Solaris','3rd','waived',-91003,3)
 ) AS samples(student_number,batch,year_level,duty_type,record_id,day_offset)
 LOOP
  SELECT * INTO STRICT student FROM public.users u WHERE u.student_number=sample.student_number;
  slot_id := sample.record_id;
  registration_id_to_use := sample.record_id;
  evidence_path := student.user_id::text || '/sql-seed-placeholder.png';

  INSERT INTO public.student_profiles(user_id,course_block,clinical_area)
  SELECT student.user_id,'BSN - Demo block','Demo training ward'
  WHERE NOT EXISTS(SELECT 1 FROM public.student_profiles WHERE user_id=student.user_id);
  -- The Auth trigger normally creates the profile first; fill only missing demo details.
  UPDATE public.student_profiles
  SET course_block=coalesce(course_block,'BSN - Demo block'),
      clinical_area=coalesce(clinical_area,'Demo training ward')
  WHERE user_id=student.user_id AND (course_block IS NULL OR clinical_area IS NULL);

  IF NOT EXISTS(SELECT 1 FROM public.mud_schedules WHERE schedule_id=slot_id) THEN
   INSERT INTO public.mud_schedules(schedule_id,date,time_slot,max_capacity,current_count,year_level,batch,clinical_area,status,created_by)
   VALUES(slot_id,demo_date+7+sample.day_offset,'AM',10,0,'all',sample.batch,'DEMO SQL - ' || sample.batch,'open',admin_id);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.registrations WHERE registration_id=registration_id_to_use) THEN
   INSERT INTO public.registrations(
    registration_id,student_id,schedule_id,duty_type,absence_date,duty_count,
    receipt_number,receipt_url,medcert_path,excuse_letter_path,status
   ) VALUES (
    registration_id_to_use,student.user_id,slot_id,sample.duty_type,demo_date-sample.day_offset,1,
    CASE WHEN sample.duty_type='waived' THEN NULL ELSE 'DEMO-' || sample.student_number END,
    CASE WHEN sample.duty_type='waived' THEN NULL ELSE evidence_path END,
    CASE WHEN sample.duty_type='waived' THEN evidence_path ELSE NULL END,
    CASE WHEN sample.duty_type='waived' THEN evidence_path ELSE NULL END,
    'pending'
   );
   -- Reservation triggers increment capacity exactly once. Do not update current_count here.
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.verification_notes WHERE note_id=sample.record_id) THEN
   INSERT INTO public.verification_notes(note_id,registration_id,note_text,created_by)
   VALUES(sample.record_id,registration_id_to_use,'DEMO fixture: placeholder evidence for workflow testing. No clinical review decision recorded by this note.',admin_id);
  END IF;
 END LOOP;
END $seed$;
COMMIT;

-- Confirm the inserted records and trigger-maintained reservation counts.
SELECT u.student_number,u.batch,u.year_level,r.duty_type,r.status,
       s.date,s.current_count,s.max_capacity
FROM public.registrations r
JOIN public.users u ON u.user_id=r.student_id
JOIN public.mud_schedules s ON s.schedule_id=r.schedule_id
WHERE r.registration_id IN (-91001,-91002,-91003)
ORDER BY u.student_number;


