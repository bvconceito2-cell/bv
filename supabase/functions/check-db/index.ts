import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { data, error } = await supabase.from("integracoes").select("config").eq("chave", "mercadopago").single();
  return new Response(JSON.stringify({ 
    token_in_db: !!data?.config?.accessTokenProducao,
    config: data?.config,
    error: error?.message 
  }), { headers: { "Content-Type": "application/json" } });
});
