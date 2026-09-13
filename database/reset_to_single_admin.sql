-- DANGER: DESTRUCTIVE RESET FOR A CONTROLLED TEST OR FRESH DEPLOYMENT ONLY.
-- This permanently removes all MUDernize application records and every
-- Supabase Auth user except the designated administrator.
--
-- Before running:
-- 1. Back up any data that must be retained.
-- 2. In Supabase Dashboard > Authentication > Users, confirm this account exists:
--      Email: admin-001@accounts.mudernize.local
--      New password after reset: slcnClinicalAdmin001
-- 3. Change the values below if a different Admin ID, email, or password is used.
-- 4. Run this complete file once in Supabase SQL Editor.
--
-- The password is stored as a bcrypt hash; plaintext is never stored.

BEGIN;

DO $reset$
DECLARE
 keep_admin_email constant text := 'admin-001@accounts.mudernize.local';
 keep_admin_number constant text := 'ADMIN-001';
 keep_password constant text := 'slcnClinicalAdmin001';
 keep_first_name text;
 keep_middle_initial text;
 keep_last_name text;
 keep_admin_id uuid;
BEGIN
 SELECT au.id,
        coalesce(nullif(trim(pu.first_name),''),nullif(trim(au.raw_app_meta_data->>'first_name'),''),'Clinical'),
        nullif(upper(left(trim(coalesce(pu.middle_initial,au.raw_app_meta_data->>'middle_initial','')),1)),''),
        coalesce(nullif(trim(pu.last_name),''),nullif(trim(au.raw_app_meta_data->>'last_name'),''),'Head')
 INTO keep_admin_id,keep_first_name,keep_middle_initial,keep_last_name
 FROM auth.users au
 LEFT JOIN public.users pu ON pu.user_id=au.id AND pu.role='clinical_head'
 WHERE lower(au.email)=lower(keep_admin_email)
 LIMIT 1;

 IF keep_admin_id IS NULL THEN
  RAISE EXCEPTION 'Reset cancelled. Create and confirm the Auth user % before running this file.',keep_admin_email;
 END IF;
 IF EXISTS(SELECT 1 FROM public.users WHERE admin_number=keep_admin_number AND user_id<>keep_admin_id) THEN
  RAISE EXCEPTION 'Reset cancelled. Admin ID % belongs to a different Auth account.',keep_admin_number;
 END IF;

 -- Truncating public.users cascades to application tables that contain student,
 -- schedule, registration, announcement, tally, reset, and document metadata.
 TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;

 -- Remove every other login only after the keep-account safety check succeeds.
 DELETE FROM auth.users WHERE id<>keep_admin_id;

 -- Revoke the retained administrator's existing sessions so the new password
 -- is required on the next sign-in.
 DELETE FROM auth.refresh_tokens WHERE user_id=keep_admin_id::text;
 DELETE FROM auth.sessions WHERE user_id=keep_admin_id;

 UPDATE auth.users
 SET encrypted_password=extensions.crypt(keep_password,extensions.gen_salt('bf')),
     raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object(
      'role','clinical_head',
      'admin_number',keep_admin_number,
      'first_name',keep_first_name,
      'middle_initial',keep_middle_initial,
      'last_name',keep_last_name
     ),
     updated_at=now()
 WHERE id=keep_admin_id;

 INSERT INTO public.users(
  user_id,student_number,admin_number,role,first_name,middle_initial,last_name,
  year_level,batch,recommendation,is_active
 ) VALUES (
  keep_admin_id,NULL,keep_admin_number,'clinical_head',keep_first_name,keep_middle_initial,keep_last_name,
  NULL,NULL,NULL,true
 );

 INSERT INTO public.batches(
  name,student_year_prefix,year_level,theme_color,logo_path,is_active,created_by
 ) VALUES
  ('Sanghaya','2025','2nd','#ffacec','/logos/sanghaya.png',true,keep_admin_id),
  ('Astraea','2023','4th','#401268','/logos/astraea.png',true,keep_admin_id),
  ('Solaris','2024','3rd','#7a0000','/logos/solaris.png',true,keep_admin_id)
 ON CONFLICT(name) DO UPDATE SET
  student_year_prefix=EXCLUDED.student_year_prefix,
  year_level=EXCLUDED.year_level,
  theme_color=EXCLUDED.theme_color,
  logo_path=EXCLUDED.logo_path,
  is_active=true,
  created_by=EXCLUDED.created_by,
  updated_at=now();

 RAISE NOTICE 'Reset complete. The only Auth account is %, with Admin ID %. Existing sessions were revoked.',keep_admin_email,keep_admin_number;
END;
$reset$;

COMMIT;

SELECT admin_number,role,first_name,middle_initial,last_name,is_active
FROM public.users;

SELECT
 (SELECT count(*) FROM auth.users) AS auth_accounts_remaining,
 (SELECT count(*) FROM public.users WHERE role='student') AS students_remaining,
 (SELECT count(*) FROM public.batches WHERE is_active) AS active_batches;
