
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS card_image_url text;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS capa_url text;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS iframe_video text;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS materiais_url text;
ALTER TABLE public.acessos_vitalicios ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.acessos_vitalicios ADD COLUMN IF NOT EXISTS telefone text;
