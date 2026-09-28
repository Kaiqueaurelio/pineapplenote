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

function textFromGemini(data: unknown) {
  const candidates = (data as { candidates?: unknown[] })?.candidates;
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const parts = (candidate as { content?: { parts?: unknown[] } })?.content?.parts;
    for (const part of Array.isArray(parts) ? parts : []) {
      const text = (part as { text?: unknown })?.text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  throw new Error("O Gemini não retornou texto.");
}

async function callGemini(apiKey: string, contents: unknown[], schema?: unknown) {
  const generationConfig: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: "low" },
  };
  if (schema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = schema;
  }
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha no Gemini.");
  return data;
}

async function callGeminiTts(apiKey: string, turns: Array<{ text: string; speaker?: string; style?: string }>) {
  const multi = turns.some((turn) => turn.speaker);
  const input = [{
    type: "user_input",
    content: turns.map((turn) => ({
      type: "text",
      text: turn.text,
      annotations: [{
        type: "speech_metadata",
        ...(turn.speaker ? { speaker: turn.speaker } : {}),
        style: turn.style ?? "natural, didático e amigável em português brasileiro",
      }],
    })),
  }];

  const body: Record<string, unknown> = {
    model: "gemini-3.8-flash-tts",
    input,
    response_format: { type: "audio" },
    generation_config: {
      speech_config: multi
        ? {
            mode: "conversational",
            speakers: [
              { speaker: "Kai", voice: "Puck" },
              { speaker: "Lia", voice: "Kore" },
            ],
          }
        : [{ voice: "Kore" }],
    },
  };

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha ao gerar o áudio.");
  const audio = data?.output_audio?.data ??
    data?.steps?.flatMap((step: { content?: unknown[] }) => Array.isArray(step.content) ? step.content : [])
      .reverse().find((part: { type?: string; data?: string }) => part?.type === "audio")?.data;
  if (!audio) throw new Error("O Gemini não retornou o áudio.");
  return audio;
}

const chatSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    citations: { type: "array", items: { type: "string" } },
  },
  required: ["answer", "citations"],
};

const podcastSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    turns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          speaker: { type: "string" },
          text: { type: "string" },
        },
        required: ["speaker", "text"],
      },
    },
  },
  required: ["title", "turns"],
};

const slidesSchema = {
  type: "object",
  properties: {
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          takeaway: { type: "string" },
        },
        required: ["title", "body", "takeaway"],
      },
    },
  },
  required: ["slides"],
};

const mindmapSchema = {
  type: "object",
  properties: {
    center: { type: "string" },
    branches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          children: { type: "array", items: { type: "string" } },
        },
        required: ["title", "children"],
      },
    },
  },
  required: ["center", "branches"],
};

const examSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    instructions: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["question", "options", "answer", "explanation"],
      },
    },
  },
  required: ["title", "instructions", "questions"],
};

const translateSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, explanation: { type: "string" } },
        required: ["title", "explanation"],
      },
    },
  },
  required: ["summary", "topics"],
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

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY não configurada no servidor." }, 503);

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
      const data = await callGemini(apiKey, [{
        role: "user",
        parts: [{ text: `Você é o tutor do Pineapple Note. Responda em português brasileiro, usando somente o material abaixo. Se a resposta não estiver no material, diga isso claramente. Seja didático, objetivo e não invente fatos.

MATERIAL:
${context}

PERGUNTA:
${question}` }],
      }], chatSchema);
      return json(JSON.parse(textFromGemini(data)));
    }

    if (action === "translate") {
      const language = String(body.language ?? "English");
      const data = await callGemini(apiKey, [{
        role: "user",
        parts: [{ text: `Traduza o resumo e os tópicos do material para ${language}. Preserve nomes próprios, termos técnicos e estrutura. Retorne somente JSON.

MATERIAL:
${context}` }],
      }], translateSchema);
      return json(JSON.parse(textFromGemini(data)));
    }

    if (action === "podcast" || action === "podcast-audio") {
      const style = String(body.style ?? "conversa natural e didática");
      const scriptData = await callGemini(apiKey, [{
        role: "user",
        parts: [{ text: `Crie um roteiro de podcast educacional em português brasileiro sobre o material abaixo. Estilo: ${style}. Use duas pessoas chamadas Kai e Lia, com perguntas, explicações e retomadas naturais. Seja fiel ao material e não invente fatos. Produza 8 a 14 turnos curtos.

MATERIAL:
${context}` }],
      }], podcastSchema);
      const script = JSON.parse(textFromGemini(scriptData)) as {
        title: string;
        turns: Array<{ speaker: string; text: string }>;
      };
      if (action === "podcast") return json(script);
      const audio = await callGeminiTts(apiKey, script.turns.map((turn) => ({
        text: turn.text,
        speaker: turn.speaker === "Lia" ? "Lia" : "Kai",
        style: "conversa natural, clara e agradável para estudo",
      })));
      return json({ ...script, audio, mimeType: "audio/wav" });
    }

    if (action === "slides") {
      const style = String(body.style ?? "Pineapple Clean");
      const instructions = String(body.instructions ?? "");
      const data = await callGemini(apiKey, [{
        role: "user",
        parts: [{ text: `Crie uma apresentação de estudo em 7 a 10 slides. Identidade visual: Pineapple Note. Estilo escolhido: ${style}. Instruções: ${instructions}. Cada slide deve ter título, corpo curto e takeaway. Não invente informações.

MATERIAL:
${context}` }],
      }], slidesSchema);
      return json(JSON.parse(textFromGemini(data)));
    }

    if (action === "mindmap") {
      const data = await callGemini(apiKey, [{
        role: "user",
        parts: [{ text: `Converta o material em um mapa mental hierárquico. Use 4 a 7 ramificações e 2 a 5 filhos por ramificação. Não invente fatos.

MATERIAL:
${context}` }],
      }], mindmapSchema);
      return json(JSON.parse(textFromGemini(data)));
    }

    if (action === "exam") {
      const count = Math.min(30, Math.max(5, Number(body.count ?? 15)));
      const data = await callGemini(apiKey, [{
        role: "user",
        parts: [{ text: `Crie uma prova prática com exatamente ${count} questões de múltipla escolha sobre o material. Misture dificuldade fácil, média e difícil. Cada questão deve ter 4 alternativas, uma resposta correta e uma explicação. Não invente fatos e não repita perguntas.

MATERIAL:
${context}` }],
      }], examSchema);
      return json(JSON.parse(textFromGemini(data)));
    }

    return json({ error: "Ação de IA desconhecida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Falha na ferramenta de IA." }, 500);
  }
});
