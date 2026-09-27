ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

CREATE OR REPLACE FUNCTION public.enforce_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  account_email text;
BEGIN
  SELECT lower(email)
    INTO account_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF account_email = 'decoanalytics@outlook.com.br' THEN
    NEW.role := 'admin';
  ELSE
    NEW.role := 'user';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_profile_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_enforce_role ON public.profiles;

CREATE TRIGGER profiles_enforce_role
BEFORE INSERT OR UPDATE OF user_id, role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_role();

UPDATE public.profiles AS p
SET role = CASE
  WHEN lower(u.email) = 'decoanalytics@outlook.com.br' THEN 'admin'
  ELSE 'user'
END
FROM auth.users AS u
WHERE u.id = p.user_id;
