
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'aluno');
CREATE TYPE public.kanban_status AS ENUM ('a_fazer', 'em_andamento', 'concluida');

-- Tabela de turmas
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  community_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separado por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Função de segurança has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Aulas
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  capa_url TEXT,
  iframe_video TEXT,
  materiais_url TEXT,
  liberada BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(turma_id, numero)
);

-- Tarefas
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status kanban por aluno/tarefa
CREATE TABLE public.aluno_tarefa_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  status public.kanban_status NOT NULL DEFAULT 'a_fazer',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(aluno_id, tarefa_id)
);

-- Compromissos
CREATE TABLE public.compromissos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_tarefa_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compromissos ENABLE ROW LEVEL SECURITY;

-- Policies: turmas
CREATE POLICY "Admins gerenciam turmas" ON public.turmas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alunos veem todas turmas" ON public.turmas FOR SELECT TO authenticated USING (true);

-- Policies: profiles
CREATE POLICY "Admins gerenciam profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Usuario ve proprio profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Usuario atualiza proprio profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
-- Cadastro público (aluno se cadastra antes da aprovação)
CREATE POLICY "Cadastro publico de profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Policies: user_roles
CREATE POLICY "Admins gerenciam roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Usuario ve proprio role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Policies: aulas
CREATE POLICY "Admins gerenciam aulas" ON public.aulas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alunos veem aulas da sua turma" ON public.aulas FOR SELECT TO authenticated
  USING (turma_id IN (SELECT turma_id FROM public.profiles WHERE id = auth.uid()));

-- Policies: tarefas
CREATE POLICY "Admins gerenciam tarefas" ON public.tarefas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alunos veem tarefas da sua turma" ON public.tarefas FOR SELECT TO authenticated
  USING (aula_id IN (SELECT a.id FROM public.aulas a JOIN public.profiles p ON p.turma_id = a.turma_id WHERE p.id = auth.uid()));

-- Policies: aluno_tarefa_status
CREATE POLICY "Aluno gerencia proprio status" ON public.aluno_tarefa_status FOR ALL TO authenticated
  USING (aluno_id = auth.uid()) WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "Admins veem todos status" ON public.aluno_tarefa_status FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: compromissos
CREATE POLICY "Admins gerenciam compromissos" ON public.compromissos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alunos veem compromissos da sua turma" ON public.compromissos FOR SELECT TO authenticated
  USING (turma_id IN (SELECT turma_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger pra criar profile básico ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
