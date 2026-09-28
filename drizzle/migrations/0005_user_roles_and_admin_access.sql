-- Enum de papéis
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'student');
  END IF;
END
$$;

-- Tabela dedicada de papéis (nunca no perfil, evita escalonamento de privilégio)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Verificação de papel com SECURITY DEFINER (sem recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Papel atribuído automaticamente a cada novo usuário
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  account_email text;
  resolved_role public.app_role;
BEGIN
  SELECT lower(email) INTO account_email FROM auth.users WHERE id = NEW.id;

  IF account_email = 'decoanalytics@outlook.com.br' THEN
    resolved_role := 'admin';
  ELSE
    resolved_role := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, resolved_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_role_on_signup ON auth.users;
CREATE TRIGGER assign_role_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_role();

-- Backfill dos usuários existentes
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
  CASE WHEN lower(u.email) = 'decoanalytics@outlook.com.br' THEN 'admin'::public.app_role
       ELSE 'student'::public.app_role END
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- Acesso de leitura administrativo às tabelas da plataforma
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read all study materials" ON public.study_materials;
CREATE POLICY "Admins can read all study materials"
ON public.study_materials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read all study progress" ON public.study_progress;
CREATE POLICY "Admins can read all study progress"
ON public.study_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read all material outputs" ON public.material_outputs;
CREATE POLICY "Admins can read all material outputs"
ON public.material_outputs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));