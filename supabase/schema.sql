-- SCHEMA DE BANCO DE DADOS - E-COMMERCE WHITE LABEL COMPLETO
-- Este script cria todas as tabelas, funções, triggers e RLS necessários.
-- Execute este script no SQL Editor do Supabase.

-- ==========================================
-- 0. EXTENSÕES E LIMPEZA (OPCIONAL)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. FUNÇÕES AUXILIARES E TRIGGERS GERAIS
-- ==========================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  ) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. TABELAS DE PERFIS E USUÁRIOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. TABELAS DE CONFIGURAÇÃO E APARÊNCIA
-- ==========================================

CREATE TABLE IF NOT EXISTS public.configuracoes (
    id BIGSERIAL PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    valor JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integracoes (
    id BIGSERIAL PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    ativo BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aparencia (
    id BIGSERIAL PRIMARY KEY,
    logo_url TEXT,
    favicon_url TEXT,
    cores JSONB DEFAULT '{"primary": "#2D1B4E", "secondary": "#FFFFFF"}'::jsonb,
    cores_primarias JSONB DEFAULT '{"brand": "#04548c", "background": "#ffffff", "text": "#111111", "highlight": "#22c55e"}'::jsonb,
    fontes JSONB DEFAULT '{"heading": "Inter", "body": "Inter"}'::jsonb,
    config_logo JSONB DEFAULT '{}'::jsonb,
    layout JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.secoes_home (
    id BIGSERIAL PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    visivel BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABELAS DE CATÁLOGO (PRODUTOS E CATEGORIAS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.categorias (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    imagem_url TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.produtos (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    slug TEXT UNIQUE,
    descricao TEXT,
    preco_original NUMERIC(10,2) NOT NULL DEFAULT 0,
    preco_atual NUMERIC(10,2) NOT NULL DEFAULT 0,
    estoque INTEGER DEFAULT 0,
    estoque_por_variacao JSONB DEFAULT '[]'::jsonb,
    imagem_principal TEXT,
    imagens TEXT[] DEFAULT '{}',
    categoria_id BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    novidade BOOLEAN DEFAULT false,
    detalhes JSONB DEFAULT '{}'::jsonb,
    cores JSONB DEFAULT '[]'::jsonb,
    tamanhos TEXT[] DEFAULT '{}',
    marca TEXT,
    total_vendas INTEGER DEFAULT 0,
    avaliacao NUMERIC(3,2) DEFAULT 0,
    total_avaliacoes INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    midias JSONB DEFAULT '[]'::jsonb,
    parcelas INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. TABELAS DE CLIENTES E PEDIDOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    cpf TEXT,
    data_nascimento DATE,
    genero TEXT,
    enderecos JSONB DEFAULT '[]'::jsonb,
    total_pedidos INTEGER DEFAULT 0,
    total_gasto NUMERIC(12,2) DEFAULT 0,
    ultimo_pedido TIMESTAMPTZ,
    segmento TEXT,
    notas_internas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pedidos (
    id BIGSERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL,
    cliente_email TEXT NOT NULL,
    cliente_telefone TEXT,
    status TEXT DEFAULT 'pendente',
    status_pagamento TEXT DEFAULT 'pendente',
    subtotal NUMERIC(10,2) NOT NULL,
    frete NUMERIC(10,2) DEFAULT 0,
    desconto NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    forma_pagamento TEXT,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb, -- JSONB legível para backup/histórico rápido
    endereco_entrega JSONB NOT NULL,
    codigo_rastreio TEXT,
    transportadora TEXT,
    metodo_envio JSONB,
    cupom_codigo TEXT,
    mp_preference_id TEXT,
    mp_payment_id TEXT,
    idempotency_key TEXT,
    historico_status JSONB DEFAULT '[]'::jsonb,
    observacoes_internas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pedido_itens (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id BIGINT REFERENCES public.produtos(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    imagem_url TEXT,
    variacao JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cupons (
    id BIGSERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'porcentagem' CHECK (tipo IN ('porcentagem', 'fixo')),
    valor NUMERIC(10,2) NOT NULL,
    valor_minimo_pedido NUMERIC(10,2) DEFAULT 0,
    limite_usos INTEGER,
    usos_atuais INTEGER DEFAULT 0,
    limite_por_cliente INTEGER DEFAULT 1,
    validade TIMESTAMPTZ,
    ativo BOOLEAN DEFAULT true,
    produtos_ids BIGINT[] DEFAULT '{}',
    categorias_ids BIGINT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. TABELAS de BANNERS E MARKETING
-- ==========================================

CREATE TABLE IF NOT EXISTS public.banners_hero (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT,
    subtitulo TEXT,
    imagem_desktop TEXT NOT NULL,
    imagem_mobile TEXT,
    link_botao TEXT,
    texto_botao TEXT,
    cor_botao TEXT DEFAULT '#2D1B4E',
    posicao_texto TEXT DEFAULT 'center',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banners_promocionais (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT,
    subtitulo TEXT,
    imagem_desktop TEXT NOT NULL,
    imagem_mobile TEXT NOT NULL,
    link_botao TEXT,
    texto_botao TEXT,
    cor_botao TEXT DEFAULT '#2D1B4E',
    cor_texto TEXT DEFAULT '#FFFFFF',
    alinhamento TEXT DEFAULT 'center',
    overlay BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banner_editorial (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT,
    subtitulo TEXT,
    imagem_url TEXT NOT NULL,
    texto_botao TEXT,
    link_botao TEXT,
    produtos_ids BIGINT[] DEFAULT '{}',
    ativo BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. TABELAS DE LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.mercadopago_webhooks_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT,
    order_id TEXT,
    status TEXT,
    payload_bruto JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nivel TEXT NOT NULL, -- info, warn, error
    origem TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    detalhes JSONB,
    user_id UUID,
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.checkout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa TEXT NOT NULL,
    endpoint TEXT,
    request_payload JSONB,
    response_payload JSONB,
    status_http INTEGER,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. ÍNDICES PRINCIPAIS
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON public.pedidos(codigo);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON public.pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON public.produtos(slug);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON public.categorias(slug);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);

-- ==========================================
-- 9. TRIGGERS DE UPDATED_AT
-- ==========================================

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'configuracoes', 'integracoes', 'aparencia', 'secoes_home', 'produtos', 'pedidos', 'banner_editorial')
    LOOP
        EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    END LOOP;
END $$;

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS em todas as tabelas
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- POLICIES: PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE USING (public.is_admin());

-- POLICIES: CONFIGURACOES & APARÊNCIA & SECOES_HOME
DROP POLICY IF EXISTS "Public can view configs" ON public.configuracoes;
CREATE POLICY "configuracoes_public_select" ON public.configuracoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage configs" ON public.configuracoes;
CREATE POLICY "configuracoes_admin_all" ON public.configuracoes FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view appearance" ON public.aparencia;
CREATE POLICY "aparencia_public_select" ON public.aparencia FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage appearance" ON public.aparencia;
CREATE POLICY "aparencia_admin_all" ON public.aparencia FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view sections" ON public.secoes_home;
CREATE POLICY "secoes_home_public_select" ON public.secoes_home FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage sections" ON public.secoes_home;
CREATE POLICY "secoes_home_admin_all" ON public.secoes_home FOR ALL USING (public.is_admin());

-- POLICIES: INTEGRACOES (Apenas Admin)
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.integracoes;
CREATE POLICY "integracoes_admin_all" ON public.integracoes FOR ALL USING (public.is_admin());

-- POLICIES: CATALOGO
DROP POLICY IF EXISTS "Public can view active categories" ON public.categorias;
CREATE POLICY "categorias_public_select" ON public.categorias FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categorias;
CREATE POLICY "categorias_admin_all" ON public.categorias FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view active products" ON public.produtos;
CREATE POLICY "produtos_public_select" ON public.produtos FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.produtos;
CREATE POLICY "produtos_admin_all" ON public.produtos FOR ALL USING (public.is_admin());

-- POLICIES: CLIENTES
CREATE POLICY "Users can manage own client data" ON public.clientes FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins can manage all clients" ON public.clientes FOR ALL USING (public.is_admin());

-- POLICIES: PEDIDOS & ITENS
CREATE POLICY "Users can view own orders" ON public.pedidos FOR SELECT USING (auth.uid() = cliente_id);
CREATE POLICY "Admins can manage all orders" ON public.pedidos FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own order items" ON public.pedido_itens FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pedidos WHERE id = pedido_id AND cliente_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON public.pedido_itens FOR ALL USING (public.is_admin());

-- POLICIES: CUPONS
CREATE POLICY "Public can view coupons" ON public.cupons FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage coupons" ON public.cupons FOR ALL USING (public.is_admin());

-- POLICIES: BANNERS
CREATE POLICY "Public can view active banners" ON public.banners_hero FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage hero banners" ON public.banners_hero FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view promo banners" ON public.banners_promocionais FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage promo banners" ON public.banners_promocionais FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view editorial banners" ON public.banner_editorial FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage editorial banners" ON public.banner_editorial FOR ALL USING (public.is_admin());

-- POLICIES: LOGS (Apenas Admin)
CREATE POLICY "Admins can view logs" ON public.mercadopago_webhooks_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view system logs" ON public.logs_sistema FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view checkout logs" ON public.checkout_logs FOR SELECT USING (public.is_admin());

-- ==========================================
-- 11. STORAGE (BUCKETS)
-- ==========================================

INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('produtos', 'produtos', true),
    ('banners', 'banners', true),
    ('logos', 'logos', true),
    ('categorias', 'categorias', true),
    ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- POLICIES STORAGE
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin All Access" ON storage.objects;
CREATE POLICY "storage_admin_all" ON storage.objects FOR ALL USING (public.is_admin());

-- ==========================================
-- 12. DADOS INICIAIS (SEED)
-- ==========================================

-- Configurações Padrão
INSERT INTO public.configuracoes (chave, valor) VALUES
('nome_loja', '"Bora Heart Glow"'),
('tagline', '"Sua melhor experiência de compra"'),
('email_contato', '"contato@boraheartglow.com"'),
('whatsapp', '"5500000000000"'),
('cepOrigem', '"01310-100"'),
('politicaPrivacidade', '"Seus dados estão seguros conosco. Não compartilhamos informações pessoais com terceiros."'),
('politicaTroca', '"O prazo para troca é de 7 dias após o recebimento do produto."')
ON CONFLICT (chave) DO NOTHING;

-- Aparência Padrão (Bora Heart Glow - White Label)
INSERT INTO public.aparencia (id, cores_primarias, fontes, layout) VALUES
(1, '{"brand": "#04548c", "background": "#ffffff", "text": "#111111", "highlight": "#22c55e"}', '{"heading": "Outfit", "body": "Outfit"}', '{"card_radius": 20, "button_radius": 12, "header_weight": "900", "header_spacing": 0.2, "header_transform": "uppercase"}')
ON CONFLICT (id) DO NOTHING;

-- Integrações (Vazias/Padrão)
INSERT INTO public.integracoes (chave, config, ativo) VALUES
('mercadopago', '{"ambiente": "sandbox", "metodos": ["pix", "card"]}', false),
('melhorenvio', '{"ambiente": "sandbox", "cep_origem": "01310-100"}', false),
('email', '{"provider": "resend"}', false),
('whatsapp', '{}', false)
ON CONFLICT (chave) DO NOTHING;

-- Seções Home Padrão
INSERT INTO public.secoes_home (chave, nome, ordem, visivel) VALUES
('top_bar', 'Barra de Topo', 0, true),
('hero_banner', 'Banner Principal', 1, true),
('icones_categorias', 'Grade de Categorias', 2, true),
('beneficios', 'Benefícios', 3, true),
('destaques', 'Produtos em Destaque', 4, true),
('editorial', 'Banner Editorial', 5, true),
('novidades', 'Novidades', 6, true),
('cadastro', 'Newsletter', 7, true)
ON CONFLICT (chave) DO NOTHING;

-- ==========================================
-- 13. FUNÇÕES DE BANCO (RPC) PARA CHECKOUT
-- ==========================================

-- Decrementar estoque de forma atômica
CREATE OR REPLACE FUNCTION public.decrement_stock_atomic(p_id BIGINT, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.produtos
    SET estoque = estoque - p_quantity
    WHERE id = p_id AND estoque >= p_quantity;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar uso do cupom
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.cupons
    SET usos_atuais = usos_atuais + 1
    WHERE id = coupon_id AND (limite_usos IS NULL OR usos_atuais < limite_usos);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
