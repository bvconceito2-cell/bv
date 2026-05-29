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
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apenas POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { cep, carrinho_itens } = await req.json();

    // Validar entrada
    if (!cep || !carrinho_itens || carrinho_itens.length === 0) {
      return new Response(
        JSON.stringify({ erro: "CEP e carrinho são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== INICIANDO CÁLCULO DE FRETE ===");
    console.log("CEP DESTINO:", cep);
    console.log("ITENS NO CARRINHO:", carrinho_itens);

    // ============================================
    // 1. BUSCAR DADOS DOS PRODUTOS
    // ============================================
    const produto_ids = carrinho_itens.map((item: any) => item.id);
    const { data: produtos, error: produtoError } = await supabase
      .from("produtos")
      .select("*")
      .in("id", produto_ids);

    if (produtoError) {
      console.error("Erro ao buscar produtos:", produtoError);
      return new Response(
        JSON.stringify({ erro: "Erro ao buscar produtos: " + produtoError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!produtos || produtos.length === 0) {
      return new Response(
        JSON.stringify({ erro: "Nenhum produto encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 2. CALCULAR PESO E DIMENSÕES TOTAIS
    // ============================================
    let peso_total = 0;
    let altura = 0;
    let largura = 0;
    let comprimento = 0;
    let valor_total = 0;

    for (const item of carrinho_itens) {
      const produto = produtos.find((p: any) => p.id === item.id);
      if (produto) {
        // Tentar pegar de colunas diretas ou de dentro de detalhes/metadata
        const peso = parseFloat(produto.peso || produto.detalhes?.peso || 0.3);
        const alt = parseFloat(produto.altura || produto.detalhes?.altura || 4);
        const larg = parseFloat(produto.largura || produto.detalhes?.largura || 12);
        const comp = parseFloat(produto.comprimento || produto.detalhes?.comprimento || 17);
        const preco = parseFloat(produto.preco_atual || produto.preco || 0);

        peso_total += peso * item.quantidade;
        valor_total += preco * item.quantidade;

        // Usar o maior de cada dimensão
        altura = Math.max(altura, alt);
        largura = Math.max(largura, larg);
        comprimento = Math.max(comprimento, comp);
      }
    }

    // Garantir mínimos (Melhor Envio exige)
    altura = Math.max(4, altura);
    largura = Math.max(12, largura);
    comprimento = Math.max(17, comprimento);
    peso_total = Math.max(0.5, peso_total);

    console.log("DIMENSÕES TOTAIS:", { peso_total, altura, largura, comprimento, valor_total });

    // ============================================
    // 3. BUSCAR CONFIGURAÇÃO DO MELHOR ENVIO
    // ============================================
    const { data: meIntegration, error: meError } = await supabase
      .from("integracoes")
      .select("config")
      .eq("chave", "melhorenvio")
      .single();

    if (meError || !meIntegration) {
      console.error("Erro ao buscar integração Melhor Envio:", meError);
      return new Response(
        JSON.stringify({ 
          erro: "Integração Melhor Envio não encontrada ou não configurada",
          debug: meError?.message 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 4. VALIDAR TOKENS E CREDENCIAIS
    // ============================================
    const config = meIntegration.config || {};
    const accessToken = config.access_token;
    const cepOrigem = config.cep_origem || Deno.env.get("ORIGIN_CEP");

    console.log("CONFIG MELHOR ENVIO:", {
      has_access_token: !!accessToken,
      cep_origem: cepOrigem,
      connected: config.connected,
      expires_at: config.expires_at
    });

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          erro: "Token Melhor Envio não configurado. Conecte a integração no admin.",
          debug: "access_token não encontrado em integracoes.config"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cepOrigem) {
      return new Response(
        JSON.stringify({ 
          erro: "CEP de origem não configurado. Configure nas integrações.",
          debug: "cep_origem não encontrado em integracoes.config"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("ORIGIN CEP:", cepOrigem);

    // ============================================
    // 5. PREPARAR PAYLOAD PARA MELHOR ENVIO
    // ============================================
    // Documentação: https://www.melhorenvio.com.br/docs
    // Endpoint: POST /api/v2/me/shipment/calculate
    const payload = {
      from: {
        postal_code: cepOrigem.replace(/\D/g, "") // Remove caracteres não numéricos
      },
      to: {
        postal_code: cep.replace(/\D/g, "")
      },
      products: [
        {
          id: "prod-1",
          width: largura, // em cm
          height: altura, // em cm
          length: comprimento, // em cm
          weight: peso_total, // em kg
          quantity: 1,
          insurance_value: Math.round(valor_total * 100) / 100 // Valor do produto para seguro
        }
      ],
      // Opcional: especificar serviços
      // services: "1,2,3" // 1=SEDEX, 2=PAC, 3=SEDEX12
    };

    console.log("PAYLOAD PARA MELHOR ENVIO:", JSON.stringify(payload, null, 2));

    // ============================================
    // 6. CHAMAR API DO MELHOR ENVIO
    // ============================================
    const isSandbox = config.ambiente === "sandbox";
    const melhorEnvioBaseUrl = isSandbox
      ? "https://sandbox.melhorenvio.com.br"
      : "https://www.melhorenvio.com.br";

    console.log("AMBIENTE:", isSandbox ? "sandbox" : "production");
    console.log("BASE URL:", melhorEnvioBaseUrl);

    const melhorEnvioResponse = await fetch(
      `${melhorEnvioBaseUrl}/api/v2/me/shipment/calculate`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Loja Lumini/1.0"
        },
        body: JSON.stringify(payload)
      }
    );

    const responseStatus = melhorEnvioResponse.status;
    const responseText = await melhorEnvioResponse.text();

    console.log("ME API STATUS:", responseStatus);
    console.log("ME API RESPONSE:", responseText);

    // ============================================
    // 7. PROCESSAR RESPOSTA
    // ============================================
    if (!melhorEnvioResponse.ok) {
      // Possíveis erros:
      // 401: Token inválido ou expirado
      // 403: Token não autorizado para este endpoint
      // 422: Payload inválido
      // 429: Rate limit excedido
      
      let errorMessage = "Erro ao calcular frete";
      
      if (responseStatus === 401) {
        errorMessage = "Token expirado ou inválido. Reconecte a integração.";
      } else if (responseStatus === 403) {
        errorMessage = "Token não autorizado. Verifique os escopos de permissão.";
      } else if (responseStatus === 422) {
        errorMessage = "Dados inválidos. Verifique CEPs, dimensões e peso.";
      }

      console.error(`Erro Melhor Envio (${responseStatus}):`, responseText);
      
      return new Response(
        JSON.stringify({ 
          erro: errorMessage,
          status: responseStatus,
          debug: responseText
        }),
        { status: responseStatus >= 500 ? 500 : responseStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 8. FORMATAR OPÇÕES DE FRETE
    // ============================================
    let fretesData;
    try {
      fretesData = JSON.parse(responseText);
    } catch (e) {
      console.error("Erro ao fazer parse da resposta:", e);
      return new Response(
        JSON.stringify({ erro: "Resposta inválida do Melhor Envio" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // A resposta da API é um array de opções de frete
    let opcoes: any[] = [];

    if (Array.isArray(fretesData)) {
      opcoes = fretesData
        .filter((frete: any) => !frete.error) // Remover erros
        .map((frete: any, index: number) => {
          // Extrator do nome do serviço baseado no ID
          const nomes_servicos: { [key: number]: string } = {
            1: "SEDEX (Contratado)",
            2: "PAC (Contratado)",
            3: "SEDEX 12",
            4: "SEDEX 40010",
            13: "PAC 40010",
            14: "Remoção com ar condicionado",
            15: "Motocicleta",
            16: "Moto Poupa",
            17: "Barco",
            18: "SEDEX Contratado",
            21: "Pick and Go",
            22: "Já Chegou",
            23: "Loggi",
            24: "Loggi Seguro"
          };

          return {
            id: frete.id || index,
            nome: nomes_servicos[frete.id] || frete.name || `Opção ${index + 1}`,
            preco: parseFloat(frete.price || frete.valor || 0),
            dias: parseInt(frete.delivery_time || frete.prazo || 0),
            servico_id: frete.id
          };
        });
    }

    if (opcoes.length === 0) {
      console.warn("Nenhuma opção de frete disponível");
      return new Response(
        JSON.stringify({ 
          sucesso: false,
          erro: "Nenhuma opção de frete disponível para este CEP",
          opcoes: []
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("OPÇÕES PROCESSADAS:", opcoes);

    // ============================================
    // 9. RETORNAR RESPOSTA FORMATADA
    // ============================================
    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        opcoes: opcoes
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Erro geral na função:", error);
    return new Response(
      JSON.stringify({ 
        erro: "Erro interno ao calcular frete",
        debug: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
