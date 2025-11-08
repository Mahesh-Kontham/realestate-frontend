import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status: 200,
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { table, data } = await req.json();

    if (!table || !data) {
      return new Response(JSON.stringify({ error: "Missing table or data" }), {
        headers: { "Access-Control-Allow-Origin": "*" },
        status: 400,
      });
    }

    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Access-Control-Allow-Origin": "*" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ Edge Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});
