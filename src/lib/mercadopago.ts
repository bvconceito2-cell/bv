// @ts-ignore
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { supabase } from '@/integrations/supabase/client';

let mpInstance: any = null;

export async function initMP() {
  if (mpInstance) return mpInstance;

  const { data, error } = await supabase
    .from('integracoes')
    .select('*')
    .eq('tipo', 'mercadopago')
    .single();

  if (error || !data) {
    throw new Error('Mercado Pago não configurado');
  }

  const publicKey =
    data.public_key_producao ||
    data.public_key ||
    '';

  if (!publicKey) {
    throw new Error('Public Key do Mercado Pago ausente');
  }

  await loadMercadoPago();

  mpInstance = new (window as any).MercadoPago(
    publicKey,
    {
      locale: 'pt-BR',
    }
  );

  return mpInstance;
}

export async function criarPreferencia(
  itens: any[],
  comprador: any,
  endereco: any
) {
  const { data, error } =
    await supabase.functions.invoke(
      'checkout-criar',
      {
        body: {
          itens,
          comprador,
          endereco,
        },
      }
    );

  if (error) {
    console.error(error);
    throw new Error(
      'Erro ao criar preferência Mercado Pago'
    );
  }

  return data;
}
