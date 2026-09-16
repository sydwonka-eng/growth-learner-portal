
-- 1. Atualiza todas as políticas que usavam public.has_role para private.has_role
DROP POLICY IF EXISTS "Admins gerenciam turmas" ON public.turmas;
CREATE POLICY "Admins gerenciam turmas" ON public.turmas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins gerenciam aulas" ON public.aulas;
CREATE POLICY "Admins gerenciam aulas" ON public.aulas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins gerenciam tarefas" ON public.tarefas;
CREATE POLICY "Admins gerenciam tarefas" ON public.tarefas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins gerenciam compromissos" ON public.compromissos;
CREATE POLICY "Admins gerenciam compromissos" ON public.compromissos FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins veem todos status" ON public.aluno_tarefa_status;
CREATE POLICY "Admins veem todos status" ON public.aluno_tarefa_status FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 2. Tabela de acessos vitalícios
CREATE TABLE public.acessos_vitalicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.acessos_vitalicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam acessos vitalicios" ON public.acessos_vitalicios FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- 3. Bucket para capas e materiais
INSERT INTO storage.buckets (id, name, public) VALUES ('aulas-capas', 'aulas-capas', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Capas publicas leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'aulas-capas');
CREATE POLICY "Admins upload capas" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aulas-capas' AND private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update capas" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aulas-capas' AND private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete capas" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aulas-capas' AND private.has_role(auth.uid(), 'admin'::app_role));
