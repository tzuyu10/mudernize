-- Ensures the second Clinical Head login exists with the requested credentials.
-- Run once in Supabase Dashboard > SQL Editor after the numbered migrations.
-- Re-running is safe: the password and Clinical Head profile are updated in place.

BEGIN;

DO $admin$
DECLARE
 v_admin_email constant text := 'admin-002@accounts.mudernize.local';
 v_admin_number constant text := 'ADMIN-002';
 v_admin_password constant text := 'slcnClinicalAdmin002';
 admin_id uuid;
 metadata jsonb := jsonb_build_object(
  'role','clinical_head',
  'admin_number','ADMIN-002',
  'first_name','Clinical',
  'last_name','Administrator'
 );
BEGIN
 SELECT id INTO admin_id FROM auth.users WHERE lower(email)=v_admin_email LIMIT 1;

 IF admin_id IS NULL THEN
  admin_id := gen_random_uuid();
  INSERT INTO auth.users(
   instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
   raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
   confirmation_token,email_change,email_change_token_new,recovery_token
  ) VALUES (
   '00000000-0000-0000-0000-000000000000',admin_id,'authenticated','authenticated',v_admin_email,
   extensions.crypt(v_admin_password,extensions.gen_salt('bf')),now(),
   jsonb_build_object('provider','email','providers',jsonb_build_array('email'))||metadata,
   '{}'::jsonb,now(),now(),'','','',''
  );
 ELSE
  UPDATE auth.users
  SET encrypted_password=extensions.crypt(v_admin_password,extensions.gen_salt('bf')),
      email_confirmed_at=coalesce(email_confirmed_at,now()),
      raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||metadata,
      updated_at=now()
  WHERE id=admin_id;
 END IF;

 IF EXISTS(SELECT 1 FROM public.users WHERE public.users.admin_number=v_admin_number AND user_id<>admin_id) THEN
  RAISE EXCEPTION 'ADMIN-002 already belongs to a different Auth user.';
 END IF;

 INSERT INTO public.users(
  user_id,student_number,admin_number,role,first_name,middle_initial,last_name,
  year_level,year_section,batch,recommendation,is_active
 ) VALUES (
  admin_id,NULL,v_admin_number,'clinical_head','Clinical',NULL,'Administrator',
  NULL,NULL,NULL,NULL,true
 )
 ON CONFLICT(user_id) DO UPDATE SET
  student_number=NULL,
  admin_number=EXCLUDED.admin_number,
  role='clinical_head',
  first_name=EXCLUDED.first_name,
  middle_initial=NULL,
  last_name=EXCLUDED.last_name,
  year_level=NULL,
  year_section=NULL,
  batch=NULL,
  is_active=true;

 RAISE NOTICE 'Clinical Head account % is ready.',v_admin_number;
END;
$admin$;

COMMIT;

SELECT admin_number,role,first_name,middle_initial,last_name,is_active
FROM public.users
WHERE admin_number='ADMIN-002';

