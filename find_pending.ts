import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
const { data } = await supabase.from("pedidos").select("id, status").eq("status", "pendente").limit(1)
console.log(JSON.stringify(data))
