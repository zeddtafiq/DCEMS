-- Open documents & drawings to everyone (no login required)
ALTER TABLE public.documents ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.drawings ALTER COLUMN created_by DROP NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drawings TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.drawings TO service_role;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('documents','drawings') LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY "Public can manage documents" ON public.documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage drawings" ON public.drawings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%drawing%' OR (schemaname='storage' AND tablename='objects' AND policyname ILIKE '%document%') LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read drawings and documents" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id IN ('drawings','documents'));
CREATE POLICY "Public write drawings and documents" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id IN ('drawings','documents'));
CREATE POLICY "Public update drawings and documents" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id IN ('drawings','documents')) WITH CHECK (bucket_id IN ('drawings','documents'));
CREATE POLICY "Public delete drawings and documents" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id IN ('drawings','documents'));