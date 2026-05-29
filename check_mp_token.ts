import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
const { data, error } = await supabase.from("integracoes").select("config").eq("chave", "mercadopago").single()
if (data) {
  console.log("MP TOKEN IN DB:", !!data.config?.accessTokenProducao)
} else {
  console.log("MP INTEGRACAO NOT FOUND")
}
