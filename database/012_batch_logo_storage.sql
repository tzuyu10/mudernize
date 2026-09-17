-- Creates public read-only storage for Clinical Head-managed batch logos.
-- Uploads are performed only by trusted server actions using the service role.
-- Run after 011_student_self_service.sql.

BEGIN;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('batch-logos','batch-logos',true,2097152,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=true,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS batch_logos_public_read ON storage.objects;
CREATE POLICY batch_logos_public_read ON storage.objects
 FOR SELECT TO anon,authenticated USING(bucket_id='batch-logos');

COMMIT;

