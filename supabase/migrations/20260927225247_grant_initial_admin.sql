ALTER TABLE public.profiles
ADD COLUMN role text NOT NULL DEFAULT 'student'
CHECK (role IN ('student', 'admin'));

-- A profile is application data, so the initial administrator is assigned by
-- this trusted migration rather than from editable user metadata or the client.
INSERT INTO public.profiles (user_id, display_name, role)
SELECT id, COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), 'Administrador'), 'admin'
FROM auth.users
WHERE lower(email) = lower('Decoanalytics@outlook.com.br')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

DROP POLICY "Users can create own profile" ON public.profiles;
DROP POLICY "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can create own student profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id AND role = 'student');

CREATE POLICY "Users can update own profile without changing role"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK (
  (select auth.uid()) = user_id
  AND role = (SELECT p.role FROM public.profiles AS p WHERE p.user_id = (select auth.uid()))
);
