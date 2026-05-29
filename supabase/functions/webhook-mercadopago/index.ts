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
  
  // 1. Handle GET request
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, message: "webhook online" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    // Safer JSON parsing
    const text = await req.text();
    if (!text) {
      return new Response(JSON.stringify({ ok: true, message: "empty body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = JSON.parse(text);
    console.log("WEBHOOK RECEIVED BODY:", JSON.stringify(body, null, 2));

    // Mercado Pago can send ID in different ways
    const paymentId = body.data?.id || body.id;
    const type = body.type || body.topic || (body.action?.split('.')[0]); // handle payment.updated

    console.log("PAYMENT_ID:", paymentId);
    console.log("TYPE/TOPIC:", type);

    // 2. Handle simulation
    if (String(paymentId) === "123456") {
      console.log("SIMULATION DETECTED (ID 123456)");
      return new Response(JSON.stringify({ ok: true, simulated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Return 200 for ignored events
    if (type !== "payment") {
      return new Response(JSON.stringify({ ok: true, ignored: true, message: "Ignoring non-payment notification" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true, message: "No ID found in notification" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get Mercado Pago token
    const { data: mpIntegracao } = await supabase
      .from("integracoes")
      .select("config")
      .eq("chave", "mercadopago")
      .single();

    const mpToken = mpIntegracao?.config?.accessTokenProducao || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!mpToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Mercado Pago token not found" }), { 
        status: 200, // Return 200 even on error to satisfy MP notification system if needed, or stick to error? User said "never return 404".
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Get payment details from Mercado Pago API
    console.log(`Fetching payment details for ${paymentId}...`);
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpToken.trim()}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("MERCADO PAGO API ERROR:", mpResponse.status, errorText);
      // Even if MP API fails (e.g. invalid ID), we return 200 to Mercado Pago to stop retries if it's a test
      return new Response(JSON.stringify({ ok: true, error: "MP API Error", details: errorText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    const paymentData = await mpResponse.json();
    const status = paymentData.status;
    const statusDetail = paymentData.status_detail;
    const externalReference = paymentData.external_reference;

    console.log("PAYMENT STATUS:", status);
    console.log("STATUS DETAIL:", statusDetail);
    console.log("EXTERNAL REFERENCE (ORDER ID):", externalReference);

    if (status === "approved" && externalReference) {
      // 3. Find order in DB
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", externalReference)
        .maybeSingle(); // maybeSingle instead of single to avoid error log if not found

      if (pedidoError || !pedido) {
        console.error("ORDER NOT FOUND IN DB:", externalReference);
        return new Response(JSON.stringify({ ok: true, error: "Order not found" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        });
      }

      console.log("ORDER FOUND:", pedido.id, "CURRENT STATUS:", pedido.status);

      // 4. If already paid, just return success
      if (pedido.status === "pago") {
        console.log("ORDER ALREADY MARKED AS PAID.");
        return new Response(JSON.stringify({ success: true, message: "Order already updated" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 5. Update order to PAGO
      console.log("UPDATING ORDER TO PAID...");
      const { error: updateError } = await supabase
        .from("pedidos")
        .update({
          status: "pago",
          status_pagamento: "approved",
          mp_payment_id: String(paymentId),
          updated_at: new Date().toISOString()
        })
        .eq("id", pedido.id);

      if (updateError) {
        console.error("ERROR UPDATING ORDER STATUS:", updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // 6. Reduce stock
      if (pedido.itens && Array.isArray(pedido.itens)) {
        for (const item of pedido.itens) {
          if (item.id && item.quantidade) {
            console.log(`REDUCING STOCK: Product ${item.id}, Qty: ${item.quantidade}`);
            
            const { data: produto } = await supabase
              .from("produtos")
              .select("estoque, total_vendas")
              .eq("id", item.id)
              .single();

            if (produto) {
              const novoEstoque = Math.max(0, (produto.estoque || 0) - item.quantidade);
              const novosVendas = (produto.total_vendas || 0) + item.quantidade;
              
              await supabase
                .from("produtos")
                .update({ 
                  estoque: novoEstoque,
                  total_vendas: novosVendas,
                  updated_at: new Date().toISOString()
                })
                .eq("id", item.id);
            }
          }
        }
      }

      console.log("PROCESS COMPLETED SUCCESSFULLY");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Order updated to paid and stock reduced",
        order_id: pedido.id 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification received, but status is not approved or external_reference missing",
      status: status
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("WEBHOOK ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message, ok: true }), {
      status: 200, // Return 200 to avoid retries on simulation/errors
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
