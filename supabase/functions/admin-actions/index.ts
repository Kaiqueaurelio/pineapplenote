import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Não autenticado." }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey =
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !publishableKey || !serviceRoleKey) {
    return json({ error: "Configuração segura do servidor incompleta." }, 503);
  }

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return json({ error: "Sessão inválida." }, 401);

  const { data: actor, error: actorError } = await userClient
    .from("profiles")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (actorError || actor?.role !== "admin") return json({ error: "Acesso administrativo negado." }, 403);

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "set_role") {
      const userId = typeof body?.userId === "string" ? body.userId : "";
      const role = body?.role === "admin" ? "admin" : body?.role === "user" ? "user" : "";
      if (!userId || !role) return json({ error: "Usuário e função são obrigatórios." }, 400);
      if (userId === auth.user.id && role !== "admin") {
        return json({ error: "Você não pode remover sua própria permissão de administrador." }, 400);
      }

      const { error } = await adminClient.from("profiles").update({ role }).eq("user_id", userId);
      if (error) return json({ error: "Não foi possível alterar a função do usuário." }, 500);
      return json({ ok: true });
    }

    if (action === "delete_materials") {
      const materialIds = Array.isArray(body?.materialIds)
        ? body.materialIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 100)
        : [];
      if (!materialIds.length) return json({ error: "Nenhum material selecionado." }, 400);

      const { data: materials, error: readError } = await adminClient
        .from("study_materials")
        .select("id,source_type,storage_path")
        .in("id", materialIds);

      if (readError) return json({ error: "Não foi possível localizar os materiais." }, 500);

      const storagePaths = (materials ?? [])
        .filter((item) => item.source_type !== "url")
        .map((item) => item.storage_path)
        .filter(Boolean);

      if (storagePaths.length) {
        await adminClient.storage.from("study-materials").remove(storagePaths);
      }

      const { error } = await adminClient.from("study_materials").delete().in("id", materialIds);
      if (error) return json({ error: "Não foi possível excluir os materiais." }, 500);

      return json({ ok: true, deleted: materials?.length ?? 0 });
    }

    return json({ error: "Ação administrativa desconhecida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Falha administrativa." }, 500);
  }
});
