CREATE TABLE public.arsenal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  link text,
  capa_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.arsenal TO authenticated;
GRANT ALL ON public.arsenal TO service_role;

ALTER TABLE public.arsenal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam arsenal" ON public.arsenal FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Alunos veem arsenal" ON public.arsenal FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_arsenal_updated_at BEFORE UPDATE ON public.arsenal
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();