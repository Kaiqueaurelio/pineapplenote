CREATE TABLE public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('audio', 'video', 'document')),
  mime_type text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own study materials"
ON public.study_materials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study materials"
ON public.study_materials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study materials"
ON public.study_materials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study materials"
ON public.study_materials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_study_material_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER study_materials_set_updated_at
BEFORE UPDATE ON public.study_materials
FOR EACH ROW
EXECUTE FUNCTION public.set_study_material_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own study materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own study materials files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own study materials files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own study materials files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
