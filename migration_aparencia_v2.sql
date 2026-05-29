-- BLOCO: MIGRATION INCREMENTAL INTELIGENTE (APARENCIA)
-- Objetivo: Sincronizar estrutura sem quebrar tipos de ID existentes.

-- 1. Adicionar colunas faltantes se não existirem
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS cores jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS fontes jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.aparencia ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Garantir registro padrão detectando tipo de ID
DO $$
DECLARE
    v_id_type text;
    v_has_chave_col boolean;
BEGIN
    -- Verifica o tipo da coluna ID
    SELECT data_type INTO v_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'aparencia' AND column_name = 'id';

    -- Verifica se existe a coluna 'chave'
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'aparencia' AND column_name = 'chave'
    ) INTO v_has_chave_col;

    -- Se a tabela estiver vazia, insere o primeiro registro
    IF NOT EXISTS (SELECT 1 FROM public.aparencia LIMIT 1) THEN
        IF v_id_type IN ('integer', 'bigint', 'smallint') THEN
            -- Se for integer, força ID 1
            INSERT INTO public.aparencia (id, cores, fontes) VALUES (1, '{}', '{}');
        ELSIF v_id_type = 'uuid' THEN
            -- Se for UUID, deixa o banco gerar (ou default gen_random_uuid)
            INSERT INTO public.aparencia (cores, fontes) VALUES ('{}', '{}');
        ELSE
            -- Fallback genérico
            INSERT INTO public.aparencia (cores, fontes) VALUES ('{}', '{}');
        END IF;
    END IF;

    -- Se tiver coluna chave e estiver nula ou vazia no primeiro registro, atualiza para 'global'
    IF v_has_chave_col THEN
        UPDATE public.aparencia SET chave = 'global' WHERE chave IS NULL OR chave = '';
    END IF;
END $$;

-- 3. Configurar RLS e Policies (Segurança Admin)
ALTER TABLE public.aparencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aparência é pública" ON public.aparencia;
DROP POLICY IF EXISTS "Aparência pública" ON public.aparencia;
DROP POLICY IF EXISTS "Admin gerencia aparência" ON public.aparencia;

CREATE POLICY "Aparência é pública" ON public.aparencia FOR SELECT USING (true);
CREATE POLICY "Admin gerencia aparência" ON public.aparencia 
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Storage: Bucket e Policies para Assets do Site
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access to site-assets" ON storage.objects;

CREATE POLICY "Public access to site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Admin full access to site-assets" ON storage.objects 
FOR ALL USING (bucket_id = 'site-assets' AND public.is_admin()) 
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());
