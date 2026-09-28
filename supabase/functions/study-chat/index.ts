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

async function askGemini(apiKey: string, prompt: string) {
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Você é o assistente do Pineapple Note. Responda somente usando o material fornecido. Se a resposta não estiver no material, diga isso claramente. Responda em português brasileiro, de forma didática e concisa.",
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { thinkingConfig: { thinkingLevel: "low" }, maxOutputTokens: 1200 },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha ao consultar o Gemini.");
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("O Gemini não retornou uma resposta.");
  return text.slice(0, 8000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado." }, 401);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: "Sessão inválida." }, 401);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "Gemini não está configurado no servidor." }, 503);
  try {
    const { materialId, message } = await req.json();
    if (typeof materialId !== "string" || typeof message !== "string" || !message.trim())
      return json({ error: "Material e pergunta são obrigatórios." }, 400);
    const [{ data: material }, { data: output }] = await Promise.all([
      supabase
        .from("study_materials")
        .select("id,title")
        .eq("id", materialId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("material_outputs")
        .select("summary,topics,flashcards,quiz,transcript")
        .eq("material_id", materialId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    if (!material || !output)
      return json({ error: "Processe este material antes de conversar com ele." }, 400);
    const context = JSON.stringify(
      {
        title: material.title,
        summary: output.summary,
        topics: output.topics,
        transcript: output.transcript,
      },
      null,
      2,
    ).slice(0, 100000);
    const { error: questionError } = await supabase
      .from("material_chat_messages")
      .insert({
        material_id: materialId,
        user_id: user.id,
        role: "user",
        content: message.trim().slice(0, 8000),
      });
    if (questionError) throw new Error("Não foi possível salvar sua pergunta.");
    const answer = await askGemini(
      apiKey,
      `MATERIAL:\n${context}\n\nPERGUNTA DO ESTUDANTE:\n${message.trim()}`,
    );
    const { error: answerError } = await supabase
      .from("material_chat_messages")
      .insert({ material_id: materialId, user_id: user.id, role: "assistant", content: answer });
    if (answerError) throw new Error("Não foi possível salvar a resposta.");
    return json({ answer });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Falha no chat." }, 500);
  }
});
