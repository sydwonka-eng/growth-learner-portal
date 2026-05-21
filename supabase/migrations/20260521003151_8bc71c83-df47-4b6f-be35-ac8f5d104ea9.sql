
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  UPDATE public.profiles SET approved = true WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- Backfill: promover usuário existente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'victor.faridoff@gmail.com'
ON CONFLICT DO NOTHING;
UPDATE public.profiles SET approved = true WHERE id IN (SELECT id FROM auth.users WHERE email = 'victor.faridoff@gmail.com');
