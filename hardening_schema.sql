-- Tabela de logs de checkout
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

-- Tabela de logs de webhooks
CREATE TABLE IF NOT EXISTS public.mercadopago_webhooks_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload_bruto JSONB,
    payment_id TEXT,
    status TEXT,
    order_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT now(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Adicionar chave de idempotência e metadados extras aos pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS mp_payment_data JSONB;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS payment_status_detail TEXT;

-- Habilitar RLS nas tabelas de log (apenas service_role)
ALTER TABLE public.checkout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_webhooks_logs ENABLE ROW LEVEL SECURITY;

-- Garantir que o service_role possa fazer tudo
CREATE POLICY "service_role_all" ON public.checkout_logs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_webhooks" ON public.mercadopago_webhooks_logs TO service_role USING (true) WITH CHECK (true);

-- Função para decrementar estoque de forma atômica
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.produtos
    SET estoque = estoque - p_quantity
    WHERE id = p_id AND (estoque >= p_quantity OR estoque IS NULL);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

