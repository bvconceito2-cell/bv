-- 1. TABELAS DE LOGS E WEBHOOKS
CREATE TABLE IF NOT EXISTS public.checkout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa TEXT NOT NULL,
    endpoint TEXT,
    request_payload JSONB,
    response_payload JSONB,
    status_http INTEGER,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mercadopago_webhooks_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload_bruto JSONB,
    payment_id TEXT UNIQUE,
    status TEXT,
    order_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT now(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- 2. FUNÇÕES ATÔMICAS E AUXILIARES
CREATE OR REPLACE FUNCTION public.decrement_stock_atomic(p_id BIGINT, p_quantity INTEGER) 
RETURNS void AS $$ 
BEGIN 
    UPDATE public.produtos 
    SET estoque = estoque - p_quantity 
    WHERE id = p_id 
    AND (estoque IS NULL OR estoque >= p_quantity);
    
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Estoque insuficiente para o produto %', p_id; 
    END IF; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_columns_exist(t_name TEXT, c_names TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    found_cols TEXT[];
BEGIN
    SELECT array_agg(column_name::text) INTO found_cols
    FROM information_schema.columns
    WHERE table_name = t_name 
    AND column_name = ANY(c_names)
    AND table_schema = 'public';
    RETURN found_cols;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS E SEGURANÇA
ALTER TABLE public.checkout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_webhooks_logs ENABLE ROW LEVEL SECURITY;

-- Permite anon/authed inserir logs mas não ler (write-only por segurança)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir inserção de logs') THEN
        CREATE POLICY "Permitir inserção de logs" ON public.checkout_logs FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir inserção de webhooks') THEN
        CREATE POLICY "Permitir inserção de webhooks" ON public.mercadopago_webhooks_logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 4. ÍNDICES PARA PERFORMANCE E IDEMPOTÊNCIA
CREATE INDEX IF NOT EXISTS idx_pedidos_idempotency ON public.pedidos(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_pref ON public.pedidos(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_webhook_payment_id ON public.mercadopago_webhooks_logs(payment_id);

-- 5. GRANTS
GRANT ALL ON public.checkout_logs TO anon, authenticated, service_role;
GRANT ALL ON public.mercadopago_webhooks_logs TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_columns_exist TO anon, authenticated, service_role;
