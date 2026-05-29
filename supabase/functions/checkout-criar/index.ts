import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      cliente_nome,
      cliente_email,
      cliente_telefone,
      endereco_cep,
      endereco_rua,
      endereco_numero,
      endereco_bairro,
      endereco_cidade,
      endereco_estado,
      carrinho_itens,
      frete_preco
    } = await req.json();

    const produto_ids = carrinho_itens.map((item: any) => item.id);
    const { data: produtos, error: pError } = await supabase.from("produtos").select("*").in("id", produto_ids);

    if (pError) throw new Error("Erro ao buscar produtos: " + pError.message);

    let subtotal = 0;
    const itens_pedido = carrinho_itens.map((item: any) => {
      const p = produtos.find((prod: any) => prod.id === item.id);
      const preco = p?.preco_atual || p?.preco || 0;
      subtotal += preco * item.quantidade;
      return {
        id: item.id,
        nome: p?.nome || item.nome,
        quantidade: item.quantidade,
        preco: preco,
        imagem: p?.imagem_principal || item.imagem
      };
    });

    const total = subtotal + (frete_preco || 0);
    const codigo = `PED${Date.now()}`;

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        codigo,
        cliente_nome,
        cliente_email,
        cliente_telefone,
        endereco_entrega: {
          cep: endereco_cep,
          rua: endereco_rua,
          numero: endereco_numero,
          bairro: endereco_bairro,
          cidade: endereco_cidade,
          estado: endereco_estado
        },
        itens: itens_pedido,
        subtotal,
        frete: frete_preco,
        total,
        forma_pagamento: "mercado_pago",
        status: "pendente",
        status_pagamento: "pendente"
      })
      .select()
      .single();

    if (pedidoError) throw new Error("Erro ao criar pedido: " + pedidoError.message);

    const { data: mpIntegracao } = await supabase.from("integracoes").select("config").eq("chave", "mercadopago").single();
    const mpToken = mpIntegracao?.config?.accessTokenProducao || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!mpToken) return new Response(JSON.stringify({ sucesso: true, pedido_id: pedido.id, warning: "MP Token missing" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const notification_url = `${supabaseUrl}/functions/v1/webhook-mercadopago`;
    const external_reference = String(pedido.id);

    const payload = {
      items: itens_pedido.map(i => ({ title: i.nome, quantity: i.quantidade, unit_price: i.preco, currency_id: "BRL" })),
      shipments: { cost: frete_preco, mode: "not_specified" },
      external_reference: external_reference,
      notification_url: notification_url,
      back_urls: { 
        success: `${Deno.env.get("SITE_URL")}/checkout/sucesso`, 

        failure: `${Deno.env.get("SITE_URL")}/checkout/erro` 
      },
      auto_return: "approved"
    };

    console.log("MP PREFERENCE PAYLOAD", JSON.stringify(payload, null, 2));

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Authorization": `Bearer ${mpToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const mpData = await mpResponse.json();
    await supabase.from("pedidos").update({ mp_preference_id: mpData.id }).eq("id", pedido.id);

    return new Response(JSON.stringify({ 
      sucesso: true, 
      pedido_id: pedido.id, 
      payment_url: mpData.init_point,
      // Campos para auditoria temporária
      preference_id: mpData.id,
      init_point: mpData.init_point,
      notification_url: notification_url,
      external_reference: external_reference
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ erro: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});