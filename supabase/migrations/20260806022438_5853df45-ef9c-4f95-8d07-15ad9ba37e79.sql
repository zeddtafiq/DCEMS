CREATE POLICY "Signed-in users can read drawing files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'drawings');

CREATE POLICY "Signed-in users can upload drawing files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drawings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can update drawing files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'drawings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can delete drawing files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'drawings' AND (storage.foldername(name))[1] = auth.uid()::text);