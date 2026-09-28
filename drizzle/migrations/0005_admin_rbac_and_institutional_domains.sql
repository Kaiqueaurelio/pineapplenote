-- Roles are decided server-side from auth.users; the browser can never promote itself.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING ((select private.is_admin()));

DROP POLICY IF EXISTS "Admins can read all study materials" ON public.study_materials;
CREATE POLICY "Admins can read all study materials"
ON public.study_materials FOR SELECT TO authenticated
USING ((select private.is_admin()));

DROP POLICY IF EXISTS "Admins can read all material outputs" ON public.material_outputs;
CREATE POLICY "Admins can read all material outputs"
ON public.material_outputs FOR SELECT TO authenticated
USING ((select private.is_admin()));

DROP POLICY IF EXISTS "Admins can read all study progress" ON public.study_progress;
CREATE POLICY "Admins can read all study progress"
ON public.study_progress FOR SELECT TO authenticated
USING ((select private.is_admin()));

CREATE TABLE IF NOT EXISTS public.signup_email_domains (
  domain text PRIMARY KEY CHECK (domain = lower(domain) AND domain !~ '@' AND domain ~ '^[a-z0-9.-]+$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_email_domains ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.signup_email_domains FROM anon, authenticated;
GRANT SELECT ON public.signup_email_domains TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.signup_email_domains TO authenticated;

DROP POLICY IF EXISTS "Anyone can read accepted email domains" ON public.signup_email_domains;
CREATE POLICY "Anyone can read accepted email domains"
ON public.signup_email_domains FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage accepted email domains" ON public.signup_email_domains;
CREATE POLICY "Admins manage accepted email domains"
ON public.signup_email_domains FOR ALL TO authenticated
USING ((select private.is_admin()))
WITH CHECK ((select private.is_admin()));

INSERT INTO public.signup_email_domains (domain)
VALUES ('edu.br'), ('ac.br'), ('edu'), ('ac.uk')
ON CONFLICT (domain) DO NOTHING;

-- Configure this function as Supabase Auth's "Before User Created" database hook.
CREATE OR REPLACE FUNCTION public.hook_restrict_signup_by_email_domain(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  email_domain text := lower(split_part(event->'user'->>'email', '@', 2));
BEGIN
  IF email_domain = 'outlook.com' AND lower(event->'user'->>'email') = 'decoanalytics@outlook.com.br' THEN
    RETURN '{}'::jsonb;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.signup_email_domains
    WHERE email_domain = domain OR email_domain LIKE '%.' || domain
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Use um e-mail institucional aceito para criar sua conta.'
  ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.hook_restrict_signup_by_email_domain(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.hook_restrict_signup_by_email_domain(jsonb) FROM PUBLIC, anon, authenticated;
