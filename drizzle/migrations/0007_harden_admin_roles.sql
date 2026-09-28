-- Harden profile roles: users cannot self-promote, while the trusted admin backend can manage roles.
CREATE OR REPLACE FUNCTION public.enforce_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  account_email text;
  actor_id uuid;
  actor_is_admin boolean := false;
BEGIN
  SELECT lower(email)
    INTO account_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF TG_OP = 'INSERT' THEN
    NEW.role := CASE
      WHEN account_email = 'decoanalytics@outlook.com.br' THEN 'admin'
      ELSE 'user'
    END;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    actor_id := auth.uid();

    IF actor_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE user_id = actor_id
          AND role = 'admin'
      )
      INTO actor_is_admin;
    END IF;

    -- Browser users may update their profile fields, but never their role.
    -- The trusted service-role admin function has no auth.uid() and may manage roles.
    IF actor_id IS NULL OR actor_is_admin THEN
      RETURN NEW;
    END IF;

    NEW.role := OLD.role;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_profile_role() FROM PUBLIC, anon, authenticated;

-- Recreate the trigger explicitly so the hardened function is used for both
-- account creation and later role changes.
DROP TRIGGER IF EXISTS profiles_enforce_role ON public.profiles;
CREATE TRIGGER profiles_enforce_role
BEFORE INSERT OR UPDATE OF user_id, role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_role();
