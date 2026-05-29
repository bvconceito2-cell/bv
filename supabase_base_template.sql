-- SQL BASE COMPLETO PARA NOVAS INSTALAÇÕES (REPLICÁVEL)
-- Esse arquivo deve ser rodado em um banco de dados Supabase limpo.

-- ==========================================
-- 1. EXTENSÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. TABELAS BASE
-- ==========================================

-- Perfis de Usuários (Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nome text,
    email text,
    role text DEFAULT 'user',
    cpf text,
    telefone text,
    data_nascimento date,
    genero text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Configurações da Loja
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id serial PRIMARY KEY,
    chave text UNIQUE NOT NULL,
    valor jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Aparência da Loja
CREATE TABLE IF NOT EXISTS public.aparencia (
    id serial PRIMARY KEY,
    cores jsonb DEFAULT '{}'::jsonb,
    fontes jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    favicon_url text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    slug text UNIQUE NOT NULL,
    imagem_url text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    slug text UNIQUE NOT NULL,
    descricao text,
    preco_original numeric(10,2) DEFAULT 0,
    preco_atual numeric(10,2) DEFAULT 0,
    imagem_principal text,
    imagens text[],
    midias jsonb DEFAULT '[]'::jsonb,
    categoria_id integer REFERENCES public.categorias(id),
    marca text,
    estoque integer DEFAULT 0,
    ativo boolean DEFAULT true,
    destaque boolean DEFAULT false,
    novidade boolean DEFAULT false,
    tamanhos text[],
    cores text[],
    detalhes jsonb DEFAULT '{}'::jsonb,
    avaliacao numeric(3,1) DEFAULT 5.0,
    total_avaliacoes integer DEFAULT 0,
    total_vendas integer DEFAULT 0,
    parcelas integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id serial PRIMARY KEY,
    codigo text UNIQUE NOT NULL,
    cliente_id uuid REFERENCES auth.users(id),
    cliente_nome text NOT NULL,
    cliente_email text NOT NULL,
    cliente_telefone text,
    itens jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    frete numeric(10,2) DEFAULT 0,
    desconto numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    cupom_codigo text,
    endereco_entrega jsonb NOT NULL,
    forma_pagamento text,
    status text DEFAULT 'pendente',
    status_pagamento text DEFAULT 'pendente',
    historico_status jsonb DEFAULT '[]'::jsonb,
    metodo_envio jsonb,
    mp_preference_id text,
    mp_payment_id text,
    codigo_rastreio text,
    transportadora text,
    observacoes_internas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    nome text NOT NULL,
    cpf text,
    telefone text,
    data_nascimento date,
    genero text,
    enderecos jsonb DEFAULT '[]'::jsonb,
    segmento text,
    notas_internas text,
    total_gasto numeric(10,2) DEFAULT 0,
    total_pedidos integer DEFAULT 0,
    ultimo_pedido timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Cupons
CREATE TABLE IF NOT EXISTS public.cupons (
    id serial PRIMARY KEY,
    codigo text UNIQUE NOT NULL,
    tipo text NOT NULL, -- 'fixo' ou 'percentual'
    valor numeric(10,2) NOT NULL,
    valor_minimo_pedido numeric(10,2) DEFAULT 0,
    validade timestamp with time zone,
    limite_usos integer,
    usos_atuais integer DEFAULT 0,
    limite_por_cliente integer DEFAULT 1,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Integrações
CREATE TABLE IF NOT EXISTS public.integracoes (
    id serial PRIMARY KEY,
    chave text UNIQUE NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);

-- Favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    produto_id integer REFERENCES public.produtos(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, produto_id)
);

-- Logs do Sistema
CREATE TABLE IF NOT EXISTS public.logs_sistema (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    nivel text NOT NULL,
    mensagem text NOT NULL,
    detalhes jsonb,
    origem text,
    user_id uuid,
    url text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Notificações Admin
CREATE TABLE IF NOT EXISTS public.notificacoes_admin (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo text NOT NULL,
    mensagem text NOT NULL,
    tipo text,
    link text,
    lida boolean DEFAULT false,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Seções da Home
CREATE TABLE IF NOT EXISTS public.secoes_home (
    id serial PRIMARY KEY,
    chave text UNIQUE NOT NULL,
    titulo text,
    visivel boolean DEFAULT true,
    ordem integer DEFAULT 0,
    config jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- Banners Hero
CREATE TABLE IF NOT EXISTS public.banners_hero (
    id serial PRIMARY KEY,
    titulo text,
    subtitulo text,
    imagem_desktop text NOT NULL,
    imagem_mobile text,
    link_botao text,
    texto_botao text,
    cor_botao text,
    posicao_texto text DEFAULT 'left',
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Banners Promocionais
CREATE TABLE IF NOT EXISTS public.banners_promocionais (
    id serial PRIMARY KEY,
    titulo text,
    subtitulo text,
    imagem_desktop text NOT NULL,
    imagem_mobile text NOT NULL,
    link_botao text,
    texto_botao text,
    cor_botao text,
    cor_texto text,
    alinhamento text DEFAULT 'center',
    overlay boolean DEFAULT true,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Banner Editorial
CREATE TABLE IF NOT EXISTS public.banner_editorial (
    id serial PRIMARY KEY,
    titulo text,
    subtitulo text,
    imagem_url text NOT NULL,
    texto_botao text,
    link_botao text,
    produtos_ids integer[],
    ativo boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 3. FUNÇÕES & TRIGGERS
-- ==========================================

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER update_aparencia_updated_at BEFORE UPDATE ON public.aparencia FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RPC para incrementar uso de cupom
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id integer)
RETURNS void AS $$
BEGIN
    UPDATE public.cupons
    SET usos_atuais = usos_atuais + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. POLICIES RLS
-- ==========================================

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aparencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secoes_home ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners_promocionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_editorial ENABLE ROW LEVEL SECURITY;

-- Storage Policies (Buckets must be created via Dashboard)
-- site-assets, produtos, banners, categorias
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id IN ('site-assets', 'produtos', 'banners', 'categorias'));
CREATE POLICY "Admin Write" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('site-assets', 'produtos', 'banners', 'categorias') AND public.is_admin());
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id IN ('site-assets', 'produtos', 'banners', 'categorias') AND public.is_admin());
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id IN ('site-assets', 'produtos', 'banners', 'categorias') AND public.is_admin());


-- Policies Públicas (Leitura)
CREATE POLICY "Leitura pública" ON public.aparencia FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.secoes_home FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.banners_hero FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.banners_promocionais FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON public.banner_editorial FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Usuários veem próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários atualizam próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin total access" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pedidos (Checkout Anônimo Suportado)
CREATE POLICY "Inserção pública para checkout" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes veem próprios pedidos" ON public.pedidos FOR SELECT USING (auth.uid() = cliente_id OR (auth.uid() IS NULL AND false));
CREATE POLICY "Admin total access" ON public.pedidos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Favoritos
CREATE POLICY "Usuários gerenciam próprios favoritos" ON public.favoritos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin Geral (Todas as outras tabelas)
CREATE POLICY "Admin total access" ON public.aparencia FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.configuracoes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.categorias FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.produtos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.cupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.integracoes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.logs_sistema FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.notificacoes_admin FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.secoes_home FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.banners_hero FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.banners_promocionais FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.banner_editorial FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin total access" ON public.clientes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- 5. SEEDS INICIAIS
-- ==========================================

-- Configurações Iniciais
INSERT INTO public.configuracoes (chave, valor) VALUES 
('nome_loja', '"Minha Nova Loja"'),
('tagline', '"Sua melhor escolha em e-commerce"'),
('email_contato', '"contato@meudominio.com.br"'),
('whatsapp', '"https://wa.me/5500000000000"'),
('endereco', '"Endereço da Loja, 123"'),
('cnpj', '"00.000.000/0001-00"'),
('moeda', '"BRL"'),
('politica_privacidade', '"Sua política de privacidade aqui..."'),
('termos_uso', '"Seus termos de uso aqui..."')
ON CONFLICT (chave) DO NOTHING;

-- Aparência Padrão (Bora Heart Glow - White Label)
INSERT INTO public.aparencia (id, cores_primarias, fontes, layout) VALUES (1, 
'{
  "brand": "#04548c",
  "background": "#ffffff", 
  "text": "#111111",
  "highlight": "#22c55e"
}', 
'{
  "heading": "Outfit",
  "body": "Outfit"
}',
'{
  "card_radius": 20,
  "button_radius": 12,
  "header_weight": "900",
  "header_spacing": 0.2,
  "header_transform": "uppercase"
}') ON CONFLICT (id) DO NOTHING;

-- Integrações Padrão
INSERT INTO public.integracoes (chave, config, ativo) VALUES 
('mercadopago', '{"ambiente": "sandbox", "metodos": ["pix", "card"]}', false),
('melhorenvio', '{"ambiente": "sandbox", "token": ""}', false),
('email', '{"provider": "resend", "apiKey": ""}', false),
('whatsapp', '{"apiUrl": "", "token": ""}', false)
ON CONFLICT (chave) DO NOTHING;

-- Seções Home Iniciais
INSERT INTO public.secoes_home (chave, titulo, visivel, ordem) VALUES 
('hero_banner', 'Banner Principal', true, 1),
('icones_categorias', 'Categorias', true, 2),
('beneficios', 'Benefícios', true, 3),
('destaques', 'Destaques', true, 4),
('promocional', 'Banner Promocional', true, 5),
('editorial', 'Editorial', true, 6),
('novidades', 'Novidades', true, 7),
('cadastro', 'Newsletter', true, 8),
('top_bar', 'Barra de Topo', true, 0)
ON CONFLICT (chave) DO NOTHING;
