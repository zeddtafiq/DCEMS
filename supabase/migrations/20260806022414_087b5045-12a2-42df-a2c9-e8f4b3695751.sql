CREATE TABLE public.drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  no text NOT NULL,
  title text NOT NULL,
  rev text NOT NULL DEFAULT 'R0',
  discipline text NOT NULL DEFAULT 'Electrical',
  status text NOT NULL DEFAULT 'For Review',
  date date NOT NULL DEFAULT current_date,
  file_path text,
  file_name text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drawings TO authenticated;
GRANT ALL ON public.drawings TO service_role;

ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view drawings"
  ON public.drawings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Signed-in users can create drawings"
  ON public.drawings FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their drawings"
  ON public.drawings FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can delete their drawings"
  ON public.drawings FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER drawings_touch BEFORE UPDATE ON public.drawings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();