-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- BANCO DE DADOS DEFINITIVO - VERSÃO DE PRODUÇÃO
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- BLOCO 1: EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- BLOCO 2: ESTRUTURA DE TABELAS (INCREMENTAL)
-- Garantindo que todas as tabelas e colunas necessárias existam sem destruir dados

-- 1. Profiles (Usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text,
  nome text,
  cpf text,
  telefone text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  descricao text,
  imagem_url text,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  descricao text,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  preco_promocional numeric(10,2),
  estoque integer DEFAULT 0,
  categoria_id uuid REFERENCES public.categorias(id),
  imagens text[] DEFAULT '{}',
  sku text,
  ativo boolean DEFAULT true,
  destaque boolean DEFAULT false,
  metadados jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  nome text,
  cpf text UNIQUE,
  telefone text,
  segmento text DEFAULT 'varejo',
  notas_internas text,
  origem text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Cupons
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('porcentagem', 'fixo')),
  valor numeric(10,2) NOT NULL,
  valor_minimo_pedido numeric(10,2) DEFAULT 0,
  limite_uso integer,
  usos_atuais integer DEFAULT 0,
  ativo boolean DEFAULT true,
  data_validade timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 6. Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero_pedido serial NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id),
  user_id uuid REFERENCES auth.users(id), -- Null para checkout anônimo
  status text NOT NULL DEFAULT 'pendente',
  total numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  frete numeric(10,2) DEFAULT 0,
  desconto numeric(10,2) DEFAULT 0,
  cupom_id uuid REFERENCES public.cupons(id),
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  endereco_entrega jsonb,
  metodo_pagamento text,
  dados_pagamento jsonb,
  rastreio_codigo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  produto_id uuid REFERENCES public.produtos(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, produto_id)
);

-- 8. CMS / Banners / Aparência
CREATE TABLE IF NOT EXISTS public.banners_hero (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo text,
  subtitulo text,
  imagem_url text NOT NULL,
  link_url text,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banners_promocionais (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  imagem_url text NOT NULL,
  link_url text,
  posicao text, -- 'topo', 'meio', 'rodape'
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banner_editorial (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo text,
  imagem_url text NOT NULL,
  link_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.secoes_home (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL, -- 'grid_produtos', 'carrosel_categorias', etc
  configuracao jsonb DEFAULT '{}'::jsonb,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.aparencia (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  chave text UNIQUE NOT NULL,
  valor jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 9. Configurações e Integrações
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  chave text UNIQUE NOT NULL,
  valor jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integracoes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome text UNIQUE NOT NULL,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- 10. Sistema (Logs e Notificações)
CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nivel text NOT NULL CHECK (nivel IN ('info', 'warning', 'error', 'critical')),
  origem text NOT NULL,
  mensagem text NOT NULL,
  detalhes jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notificacoes_admin (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean DEFAULT false,
  tipo text DEFAULT 'info',
  link text,
  created_at timestamptz DEFAULT now()
);

-- COLUNAS INCREMENTAIS (Caso as tabelas já existam)
DO $$ 
BEGIN
  -- Clientes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='segmento') THEN
    ALTER TABLE public.clientes ADD COLUMN segmento text DEFAULT 'varejo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='notas_internas') THEN
    ALTER TABLE public.clientes ADD COLUMN notas_internas text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='origem') THEN
    ALTER TABLE public.clientes ADD COLUMN origem text;
  END IF;

  -- Produtos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='metadados') THEN
    ALTER TABLE public.produtos ADD COLUMN metadados jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Pedidos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='numero_pedido') THEN
    ALTER TABLE public.pedidos ADD COLUMN numero_pedido serial NOT NULL;
  END IF;
END $$;


-- BLOCO 3: ÍNDICES
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON public.produtos(slug);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON public.categorias(slug);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON public.pedidos(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_logs_nivel ON public.logs_sistema(nivel);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs_sistema(created_at);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes_admin(lida);


-- BLOCO 4: FUNCTIONS / RPC (SECURITY DEFINER)
-- Função para verificar se o usuário é Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para incrementar uso de cupom de forma atômica
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code text)
RETURNS void AS $$
BEGIN
  UPDATE public.cupons
  SET usos_atuais = usos_atuais + 1
  WHERE codigo = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- BLOCO 5: HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners_promocionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_editorial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secoes_home ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aparencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_admin ENABLE ROW LEVEL SECURITY;


-- BLOCO 6: POLICIES COMPLETAS


-- --- PROFILES ---
DROP POLICY IF EXISTS "Profiles são legíveis pelo próprio usuário" ON public.profiles;
CREATE POLICY "Profiles são legíveis pelo próprio usuário" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles são atualizáveis pelo próprio usuário" ON public.profiles;
CREATE POLICY "Profiles são atualizáveis pelo próprio usuário" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins tem acesso total aos profiles" ON public.profiles;
CREATE POLICY "Admins tem acesso total aos profiles" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- PRODUTOS ---
DROP POLICY IF EXISTS "Produtos ativos são públicos para leitura" ON public.produtos;
CREATE POLICY "Produtos ativos são públicos para leitura" ON public.produtos FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Admins tem acesso total aos produtos" ON public.produtos;
CREATE POLICY "Admins tem acesso total aos produtos" ON public.produtos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- CATEGORIAS ---
DROP POLICY IF EXISTS "Categorias ativas são públicas para leitura" ON public.categorias;
CREATE POLICY "Categorias ativas são públicas para leitura" ON public.categorias FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Admins tem acesso total as categorias" ON public.categorias;
CREATE POLICY "Admins tem acesso total as categorias" ON public.categorias FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- PEDIDOS ---
DROP POLICY IF EXISTS "Usuários veem seus próprios pedidos" ON public.pedidos;
CREATE POLICY "Usuários veem seus próprios pedidos" ON public.pedidos FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Checkout pode criar pedidos" ON public.pedidos;
CREATE POLICY "Checkout pode criar pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins tem acesso total aos pedidos" ON public.pedidos;
CREATE POLICY "Admins tem acesso total aos pedidos" ON public.pedidos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- CLIENTES ---
DROP POLICY IF EXISTS "Admins tem acesso total aos clientes" ON public.clientes;
CREATE POLICY "Admins tem acesso total aos clientes" ON public.clientes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Checkout pode criar/atualizar cliente" ON public.clientes;
CREATE POLICY "Checkout pode criar/atualizar cliente" ON public.clientes FOR INSERT WITH CHECK (true);

-- --- CUPONS ---
DROP POLICY IF EXISTS "Cupons ativos são legíveis publicamente" ON public.cupons;
CREATE POLICY "Cupons ativos são legíveis publicamente" ON public.cupons FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Admins tem acesso total aos cupons" ON public.cupons;
CREATE POLICY "Admins tem acesso total aos cupons" ON public.cupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- FAVORITOS ---
DROP POLICY IF EXISTS "Usuários gerenciam seus próprios favoritos" ON public.favoritos;
CREATE POLICY "Usuários gerenciam seus próprios favoritos" ON public.favoritos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- BANNERS E CMS ---
DROP POLICY IF EXISTS "Banners ativos são públicos" ON public.banners_hero;
CREATE POLICY "Banners ativos são públicos" ON public.banners_hero FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Promos ativas são públicas" ON public.banners_promocionais;
CREATE POLICY "Promos ativas são públicas" ON public.banners_promocionais FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Editorial ativo é público" ON public.banner_editorial;
CREATE POLICY "Editorial ativo é público" ON public.banner_editorial FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Secoes home ativas são públicas" ON public.secoes_home;
CREATE POLICY "Secoes home ativas são públicas" ON public.secoes_home FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "Admins gerenciam CMS" ON public.banners_hero;
CREATE POLICY "Admins gerenciam CMS" ON public.banners_hero FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins gerenciam Promos" ON public.banners_promocionais;
CREATE POLICY "Admins gerenciam Promos" ON public.banners_promocionais FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins gerenciam Editorial" ON public.banner_editorial;
CREATE POLICY "Admins gerenciam Editorial" ON public.banner_editorial FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins gerenciam Secoes Home" ON public.secoes_home;
CREATE POLICY "Admins gerenciam Secoes Home" ON public.secoes_home FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- APARÊNCIA E CONFIGURAÇÕES ---
DROP POLICY IF EXISTS "Configurações e Aparência são públicas para leitura" ON public.aparencia;
CREATE POLICY "Configurações e Aparência são públicas para leitura" ON public.aparencia FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins gerenciam Aparência" ON public.aparencia;
CREATE POLICY "Admins gerenciam Aparência" ON public.aparencia FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins gerenciam Configurações" ON public.configuracoes;
CREATE POLICY "Admins gerenciam Configurações" ON public.configuracoes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- INTEGRAÇÕES (Protegido) ---
DROP POLICY IF EXISTS "Apenas admins veem integrações" ON public.integracoes;
CREATE POLICY "Apenas admins veem integrações" ON public.integracoes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- LOGS E NOTIFICAÇÕES ---
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.logs_sistema;
CREATE POLICY "Sistema pode inserir logs" ON public.logs_sistema FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins veem logs" ON public.logs_sistema;
CREATE POLICY "Admins veem logs" ON public.logs_sistema FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins veem notificações" ON public.notificacoes_admin;
CREATE POLICY "Admins veem notificações" ON public.notificacoes_admin FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins gerenciam notificações" ON public.notificacoes_admin;
CREATE POLICY "Admins gerenciam notificações" ON public.notificacoes_admin FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());



-- BLOCO 7: STORAGE (Buckets e Policies)
-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura pública

DROP POLICY IF EXISTS "Imagens de produtos são públicas" ON storage.objects;
CREATE POLICY "Imagens de produtos são públicas" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');

-- Permitir apenas admins fazerem upload/delete/update
DROP POLICY IF EXISTS "Admins gerenciam arquivos de produtos" ON storage.objects;
CREATE POLICY "Admins gerenciam arquivos de produtos" ON storage.objects 
FOR ALL USING (
  bucket_id = 'product-media' AND 
  (SELECT public.is_admin())
) WITH CHECK (
  bucket_id = 'product-media' AND 
  (SELECT public.is_admin())
);



-- BLOCO 8: REALTIME
-- Habilitar realtime para tabelas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_admin;


-- BLOCO 9: TRIGGERS DE MANUTENÇÃO
-- Automação de updated_at
CREATE TRIGGER tr_update_produtos BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_update_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_update_pedidos BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_update_aparencia BEFORE UPDATE ON public.aparencia FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criar perfil automaticamente ao cadastrar na auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
