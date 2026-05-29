import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    console.log("ACTION:", action);

    // =========================
    // PING - testar se função está online
    // =========================
    if (action === "ping") {
      return new Response(
        JSON.stringify({ success: true, message: "Function online" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================
    // EXCHANGE-CODE - trocar código OAuth por token
    // =========================
    if (action === "exchange-code") {
      const { code, client_id, client_secret, redirect_uri, ambiente } = body;

      console.log("EXCHANGE CODE - ambiente:", ambiente);
      console.log("EXCHANGE CODE - client_id:", client_id);
      console.log("EXCHANGE CODE - redirect_uri:", redirect_uri);
      console.log("EXCHANGE CODE - code existe:", !!code);

      if (!code || !client_id || !client_secret || !redirect_uri) {
        return new Response(
          JSON.stringify({ success: false, message: "Parâmetros obrigatórios: code, client_id, client_secret, redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isSandbox = ambiente === "sandbox";
      const baseUrl = isSandbox
        ? "https://sandbox.melhorenvio.com.br"
        : "https://www.melhorenvio.com.br";

      const tokenUrl = `${baseUrl}/oauth/token`;

      console.log("TOKEN URL:", tokenUrl);

      const tokenPayload = {
        grant_type: "authorization_code",
        client_id,
        client_secret,
        redirect_uri,
        code,
      };

      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Loja Lumini/1.0",
        },
        body: JSON.stringify(tokenPayload),
      });

      const tokenText = await tokenResponse.text();
      console.log("TOKEN RESPONSE STATUS:", tokenResponse.status);
      console.log("TOKEN RESPONSE BODY:", tokenText);

      if (!tokenResponse.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Erro ao trocar código por token: ${tokenResponse.status}`,
            debug: tokenText,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let tokenData: any;
      try {
        tokenData = JSON.parse(tokenText);
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, message: "Resposta inválida do Melhor Envio", debug: tokenText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!tokenData.access_token) {
        return new Response(
          JSON.stringify({ success: false, message: "Token não retornado", debug: tokenData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("TOKEN RECEBIDO COM SUCESSO - expira em:", tokenData.expires_in, "segundos");

      // Buscar config atual para manter client_id, client_secret, cep_origem
      const { data: existing } = await supabase
        .from("integracoes")
        .select("config")
        .eq("chave", "melhorenvio")
        .single();

      const existingConfig = (existing?.config as any) || {};

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 2592000) * 1000).toISOString();

      // Salvar token no banco
      const newConfig = {
        ...existingConfig,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt,
        token_type: tokenData.token_type || "Bearer",
        connected: true,
        ambiente: isSandbox ? "sandbox" : "production",
      };

      const { error: saveError } = await supabase
        .from("integracoes")
        .upsert(
          { chave: "melhorenvio", config: newConfig, ativo: true },
          { onConflict: "chave" }
        );

      if (saveError) {
        console.error("ERRO AO SALVAR TOKEN:", saveError);
        return new Response(
          JSON.stringify({ success: false, message: "Erro ao salvar token: " + saveError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("TOKEN SALVO NO BANCO COM SUCESSO");

      return new Response(
        JSON.stringify({ success: true, message: "Melhor Envio conectado com sucesso!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================
    // TEST-APP - validar client_id e client_secret
    // =========================
    if (action === "test-app") {
      const { client_id, client_secret, ambiente } = body;

      if (!client_id || !client_secret) {
        return new Response(
          JSON.stringify({ success: false, message: "Client ID e Client Secret são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Credenciais recebidas. Clique em Conectar para autorizar." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================
    // TEST-TOKEN - verificar se token salvo funciona
    // =========================
    if (action === "test-token") {
      const { data: integracao, error } = await supabase
        .from("integracoes")
        .select("config")
        .eq("chave", "melhorenvio")
        .single();

      if (error || !integracao) {
        return new Response(
          JSON.stringify({ success: false, message: "Integração não encontrada no banco" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const config = integracao.config as any;
      const token = config?.access_token;

      console.log("TOKEN EXISTE:", !!token);
      console.log("CONNECTED:", config?.connected);

      if (!token) {
        return new Response(
          JSON.stringify({ success: false, message: "Token não encontrado. Conecte o Melhor Envio primeiro." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isSandbox = config?.ambiente === "sandbox";
      const baseUrl = isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";

      const response = await fetch(`${baseUrl}/api/v2/me/shipment/companies`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Loja Lumini/1.0",
        },
      });

      const text = await response.text();
      console.log("STATUS COMPANIES:", response.status);
      console.log("BODY COMPANIES:", text.substring(0, 500));

      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: false, message: `Token inválido ou sem permissão: ${response.status}`, debug: text }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Token válido! Melhor Envio conectado.", data: JSON.parse(text) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action não reconhecida
    return new Response(
      JSON.stringify({ success: false, message: `Action desconhecida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
