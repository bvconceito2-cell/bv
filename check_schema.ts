import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
const { data: pData } = await supabase.from("pedidos").select("*").limit(1)
console.log("PEDIDO:", pData?.[0] ? Object.keys(pData[0]) : "No data")
const { data: prodData } = await supabase.from("produtos").select("*").limit(1)
console.log("PRODUTO:", prodData?.[0] ? Object.keys(prodData[0]) : "No data")
