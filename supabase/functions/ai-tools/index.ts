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

async function callOpenAI(apiKey: string, input: unknown, schema?: unknown) {
  const body: Record<string, unknown> = { model: "gpt-5", input };
  if (schema) {
    body.text = {
      format: {
        type: "json_schema",
        name: "pineapple_tool",
        strict: true,
        schema,
      },
    };
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha na IA.");
  return data;
}

function outputText(data: unknown) {
  if (!data || typeof data !== "object") throw new Error("Resposta vazia da IA.");
  const record = data as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  for (const item of Array.isArray(record.output) ? record.output : []) {
    if (!item || typeof item !== "object") continue;
    for (const part of Array.isArray((item as Record<string, unknown>).content)
      ? (item as Record<string, unknown>).content as unknown[]
      : []) {
      if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
        return (part as Record<string, unknown>).text as string;
      }
    }
  }
  throw new Error("A IA não retornou conteúdo.");
}

const chatSchema = {
  type: "object",
  additionalProperties: false,
  properties: { answer: { type: "string" }, citations: { type: "array", items: { type: "string" } } },
  required: ["answer", "citations"],
};
const podcastSchema = {
  type: "object",
  additionalProperties: false,
  properties: { title: { type: "string" }, script: { type: "string" }, duration: { type: "string" } },
  required: ["title", "script", "duration"],
};
const slidesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { title: { type: "string" }, body: { type: "string" }, takeaway: { type: "string" } },
        required: ["title", "body", "takeaway"],
      },
    },
  },
  required: ["slides"],
};
const mindmapSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    center: { type: "string" },
    branches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { title: { type: "string" }, children: { type: "array", items: { type: "string" } } },
        required: ["title", "children"],
      },
    },
  },
  required: ["center", "branches"],
};

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
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: "Sessão inválida." }, 401);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "Processamento IA não configurado no servidor." }, 503);

  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const materialId = String(body.materialId ?? "");
    if (!materialId) return json({ error: "materialId é obrigatório." }, 400);

    const { data: material } = await supabase
      .from("study_materials")
      .select("id,title")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!material) return json({ error: "Material não encontrado." }, 404);

    const { data: output } = await supabase
      .from("material_outputs")
      .select("summary,topics,flashcards,quiz,transcript")
      .eq("material_id", materialId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!output) return json({ error: "O material ainda não foi processado." }, 409);

    const context = JSON.stringify({
      title: material.title,
      summary: output.summary,
      topics: output.topics,
      flashcards: output.flashcards,
      quiz: output.quiz,
      transcript: output.transcript?.slice(0, 30000),
    });

    if (action === "chat") {
      const question = String(body.question ?? "").trim();
      if (!question) return json({ error: "Digite uma pergunta." }, 400);
      const data = await callOpenAI(apiKey, [
        { role: "system", content: [{ type: "input_text", text: "Você é o tutor do Pineapple Note. Responda em português brasileiro, usando somente o contexto fornecido. Se algo não estiver no material, diga claramente que não consta nele. Seja didático e objetivo." }] },
        { role: "user", content: [{ type: "input_text", text: `CONTEXTO:\n${context}\n\nPERGUNTA:\n${question}` }] },
      ], chatSchema);
      return json(JSON.parse(outputText(data)));
    }

    if (action === "translate") {
      const language = String(body.language ?? "English");
      const data = await callOpenAI(apiKey, [
        { role: "user", content: [{ type: "input_text", text: `Traduza o resumo e tópicos deste material para ${language}. Preserve termos técnicos e estrutura. Retorne apenas JSON com summary e topics. Contexto:\n${context}` }] },
      ], {
        type: "object", additionalProperties: false,
        properties: { summary: { type: "string" }, topics: { type: "array", items: { type: "object", additionalProperties: false, properties: { title: { type: "string" }, explanation: { type: "string" } }, required: ["title", "explanation"] } } },
        required: ["summary", "topics"],
      });
      return json(JSON.parse(outputText(data)));
    }

    if (action === "podcast") {
      const style = String(body.style ?? "duas vozes");
      const data = await callOpenAI(apiKey, [
        { role: "user", content: [{ type: "input_text", text: `Crie um roteiro de podcast de estudo em português brasileiro, estilo ${style}, sobre o material abaixo. Duas pessoas devem conversar de forma natural, explicando conceitos, fazendo perguntas e retomando pontos importantes. Não invente fatos. Contexto:\n${context}` }] },
      ], podcastSchema);
      return json(JSON.parse(outputText(data)));
    }

    if (action === "slides") {
      const style = String(body.style ?? "Pineapple Clean");
      const instructions = String(body.instructions ?? "");
      const data = await callOpenAI(apiKey, [
        { role: "user", content: [{ type: "input_text", text: `Crie uma apresentação de estudo em 7 a 10 slides. Estilo visual: ${style}. Instruções adicionais: ${instructions}. Cada slide deve ter título, corpo curto e takeaway. Contexto:\n${context}` }] },
      ], slidesSchema);
      return json(JSON.parse(outputText(data)));
    }

    if (action === "mindmap") {
      const data = await callOpenAI(apiKey, [
        { role: "user", content: [{ type: "input_text", text: `Converta o material em um mapa mental hierárquico. Use de 4 a 7 ramificações e 2 a 5 filhos por ramificação. Não invente fatos. Contexto:\n${context}` }] },
      ], mindmapSchema);
      return json(JSON.parse(outputText(data)));
    }

    return json({ error: "Ação de IA desconhecida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Falha na ferramenta de IA." }, 500);
  }
});
