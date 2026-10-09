-- Run after 014_signup_muds.sql. Publishes only a revision number, never records
-- or uploaded documents. Existing database authorization policies are unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.app_revision (
 id integer PRIMARY KEY CHECK(id=1),
 revision bigint NOT NULL DEFAULT 0
);
INSERT INTO public.app_revision(id) VALUES(1) ON CONFLICT DO NOTHING;
ALTER TABLE public.app_revision ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_revision FROM anon,authenticated;
GRANT SELECT ON public.app_revision TO authenticated;
DROP POLICY IF EXISTS app_revision_read ON public.app_revision;
CREATE POLICY app_revision_read ON public.app_revision FOR SELECT TO authenticated USING(auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.signal_app_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.app_revision SET revision=revision+1 WHERE id=1;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.signal_app_change() FROM PUBLIC;

DO $$
DECLARE target text;
BEGIN
 FOREACH target IN ARRAY ARRAY['users','student_profiles','tally_adjustments','registrations','mud_schedules','announcements','batches'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS signal_app_change ON public.%I',target);
  EXECUTE format('CREATE TRIGGER signal_app_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.signal_app_change()',target);
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
  CREATE PUBLICATION supabase_realtime;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='app_revision') THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.app_revision;
 END IF;
END $$;
COMMIT;
