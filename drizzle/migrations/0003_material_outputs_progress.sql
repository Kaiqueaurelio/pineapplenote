CREATE TABLE public.material_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  flashcards jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz jsonb NOT NULL DEFAULT '[]'::jsonb,
  transcript text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(material_id)
);

CREATE TABLE public.study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, material_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_outputs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_progress TO authenticated;
GRANT ALL ON public.material_outputs TO service_role;
GRANT ALL ON public.study_progress TO service_role;

ALTER TABLE public.material_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own material outputs" ON public.material_outputs
FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create own material outputs" ON public.material_outputs
FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own material outputs" ON public.material_outputs
FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own material outputs" ON public.material_outputs
FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can read own study progress" ON public.study_progress
FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create own study progress" ON public.study_progress
FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own study progress" ON public.study_progress
FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own study progress" ON public.study_progress
FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.set_material_output_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER material_outputs_set_updated_at
BEFORE UPDATE ON public.material_outputs FOR EACH ROW
EXECUTE FUNCTION public.set_material_output_updated_at();
