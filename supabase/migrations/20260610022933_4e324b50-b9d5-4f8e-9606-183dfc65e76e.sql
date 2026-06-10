ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pontuacao integer NOT NULL DEFAULT 0;
ALTER TABLE public.acessos_vitalicios ADD COLUMN IF NOT EXISTS pontuacao integer NOT NULL DEFAULT 0;