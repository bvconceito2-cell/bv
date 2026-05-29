-- CORREÇÃO DA TABELA APARENCIA
-- Garantir que a tabela existe com a estrutura correta (campos individuais em vez de chave/valor)

DO $$ 
BEGIN
    -- Se a coluna 'chave' existir, significa que a tabela está no formato errado
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aparencia' AND column_name = 'chave') THEN
        -- Backup simples se houver dados (opcional, mas seguro)
        -- DROP TABLE public.aparencia; -- O usuário disse "NÃO dropar tabelas", então vamos renomear se necessário ou apenas alterar
        ALTER TABLE public.aparencia RENAME TO aparencia_old;
    END IF;
END $$;

-- Criar ou recriar a tabela com a estrutura correta se não existir
CREATE TABLE IF NOT EXISTS public.aparencia (
    id SERIAL PRIMARY KEY,
    cores jsonb DEFAULT '{
        "primary": "#04548c",
        "primary_hover": "#03426d",
        "secondary": "#f5f5f5",
        "accent": "#22c55e",
        "background": "#ffffff",
        "foreground": "#111111",
        "muted": "#6b7280",
        "border": "#e5e7eb",
        "card": "#ffffff"
    }'::jsonb,
    fontes jsonb DEFAULT '{
        "heading": "Outfit",
        "body": "Outfit"
    }'::jsonb,
    logo_url text,
    favicon_url text,
    updated_at timestamptz DEFAULT now()
);

-- Garantir que as colunas existam caso a tabela já exista mas com colunas faltando
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS cores jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS fontes jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Inserir registro padrão se não existir
INSERT INTO public.aparencia (id, cores, fontes)
VALUES (1, '{
    "primary": "#04548c",
    "primary_hover": "#03426d",
    "secondary": "#f5f5f5",
    "accent": "#22c55e",
    "background": "#ffffff",
    "foreground": "#111111",
    "muted": "#6b7280",
    "border": "#e5e7eb",
    "card": "#ffffff"
}'::jsonb, '{
    "heading": "Outfit",
    "body": "Outfit"
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.aparencia ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Permitir leitura pública da aparência" ON public.aparencia;
CREATE POLICY "Permitir leitura pública da aparência" ON public.aparencia
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir update apenas para admin" ON public.aparencia;
CREATE POLICY "Permitir update apenas para admin" ON public.aparencia
    FOR ALL 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- BLOCO 7: STORAGE
-- Garantir bucket para assets do site
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to site-assets" ON storage.objects;
CREATE POLICY "Public access to site-assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Admin full access to site-assets" ON storage.objects;
CREATE POLICY "Admin full access to site-assets" ON storage.objects
    FOR ALL 
    USING (bucket_id = 'site-assets' AND public.is_admin())
    WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());


