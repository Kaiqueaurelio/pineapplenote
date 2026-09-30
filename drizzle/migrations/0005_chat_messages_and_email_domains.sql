CREATE TABLE IF NOT EXISTS public.material_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_chat_messages_material_created_idx ON public.material_chat_messages (material_id, created_at);
GRANT SELECT, INSERT ON public.material_chat_messages TO authenticated;
GRANT ALL ON public.material_chat_messages TO service_role;
ALTER TABLE public.material_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own material chat" ON public.material_chat_messages FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users create own material chat" ON public.material_chat_messages FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.signup_email_domains (
  domain text PRIMARY KEY CHECK (domain = lower(domain) AND domain !~ '@' AND domain ~ '^[a-z0-9.-]+$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.signup_email_domains TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.signup_email_domains TO authenticated;
GRANT ALL ON public.signup_email_domains TO service_role;
ALTER TABLE public.signup_email_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read accepted email domains" ON public.signup_email_domains FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage accepted email domains" ON public.signup_email_domains FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.signup_email_domains (domain) VALUES ('edu.br'),('ac.br'),('edu'),('ac.uk') ON CONFLICT DO NOTHING;