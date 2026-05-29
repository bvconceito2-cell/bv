import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { data: orders } = await supabase
    .from("pedidos")
    .select("id, status, status_pagamento, mp_payment_id")
    .order("created_at", { ascending: false })
    .limit(5);

  return new Response(JSON.stringify({ orders }), { headers: { "Content-Type": "application/json" } });
});
