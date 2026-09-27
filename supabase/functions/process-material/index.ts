import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type StudyPayload = {
  summary: string;
  topics: Array<{ title: string; explanation: string }>;
  flashcards: Array<{ question: string; answer: string }>;
  quiz: Array<{ question: string; options: string[]; answer: string; explanation: string }>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJson(text: string): StudyPayload {
  const cleaned = text.trim().replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`\s*/i, "").replace(/\s*\`\`\`$/i, "");
  const parsed = JSON.parse(cleaned) as StudyPayload;
  if (!parsed.summary || !Array.isArray(parsed.topics) || !Array.isArray(parsed.flashcards) || !Array.isArray(parsed.quiz)) {
    throw new Error("Formato de resposta da IA inválido.");
  }
  return parsed;
}

async function openAiResponses(apiKey: string, input: unknown) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      input,
      text: {
        format: {
          type: "json_schema",
          name: "study_material",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              topics: { type: "array", items: { type: "object", additionalProperties: false, properties: { title: { type: "string" }, explanation: { type: "string" } }, required: ["title", "explanation"] } },
              flashcards: { type: "array", items: { type: "object", additionalProperties: false, properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"] } },
              quiz: { type: "array", items: { type: "object", additionalProperties: false, properties: { question: { type: "string" }, options: { type: "array", items: { type: "string" } }, answer: { type: "string" }, explanation: { type: "string" } }, required: ["question", "options", "answer", "explanation"] } },
            },
            required: ["summary", "topics", "flashcards", "quiz"],
          },
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha ao processar com a IA.");
  return data;
}

function responseText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  for (const item of data?.output ?? []) {
    for (const part of item?.content ?? []) {
      if (typeof part?.text === "string") return part.text;
    }
  }
  throw new Error("A IA não retornou conteúdo.");
}

async function transcribe(apiKey: string, bytes: ArrayBuffer, filename: string, mimeType: string) {
  const form = new FormData();
  form.append("file", new File([bytes], filename, { type: mimeType }));
  form.append("model", "gpt-4o-transcribe");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha na transcrição.");
  return String(data.text ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado." }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: "Sessão inválida." }, 401);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "Processamento IA não configurado no servidor." }, 503);

  try {
    const { materialId } = await req.json();
    if (typeof materialId !== "string") return json({ error: "materialId é obrigatório." }, 400);

    const { data: material, error: materialError } = await supabase
      .from("study_materials")
      .select("*")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (materialError || !material) return json({ error: "Material não encontrado." }, 404);

    await supabase.from("study_materials").update({ status: "processing" }).eq("id", material.id).eq("user_id", user.id);

    const { data: signed, error: signedError } = await supabase.storage
      .from("study-materials")
      .createSignedUrl(material.storage_path, 60 * 60);

    if (signedError || !signed?.signedUrl) throw new Error("Não foi possível acessar o arquivo.");

    let transcript = "";
    let input: unknown;

    if (material.source_type === "audio" || material.source_type === "video") {
      const fileResponse = await fetch(signed.signedUrl);
      if (!fileResponse.ok) throw new Error("Não foi possível baixar o arquivo para transcrição.");
      transcript = await transcribe(apiKey, await fileResponse.arrayBuffer(), material.title, material.mime_type);
      if (!transcript.trim()) throw new Error("Não foi possível encontrar fala no arquivo.");
      input = [{
        role: "user",
        content: [{
          type: "input_text",
          text: `Transforme esta transcrição em material de estudo. Gere um resumo claro, 5 a 10 tópicos, 8 a 15 flashcards e 5 a 10 questões de múltipla escolha. Preserve fatos e não invente informações. Transcrição:\n\n${transcript}`,
        }],
      }];
    } else if (material.mime_type === "text/plain") {
      const fileResponse = await fetch(signed.signedUrl);
      if (!fileResponse.ok) throw new Error("Não foi possível ler o documento.");
      const text = await fileResponse.text();
      input = [{ role: "user", content: [{ type: "input_text", text: `Transforme o conteúdo abaixo em material de estudo. Gere um resumo claro, 5 a 10 tópicos, 8 a 15 flashcards e 5 a 10 questões. Não invente fatos.\n\n${text}` }] }];
    } else {
      input = [{
        role: "user",
        content: [
          { type: "input_file", file_url: signed.signedUrl },
          { type: "input_text", text: "Analise este documento como material acadêmico. Gere um resumo claro, 5 a 10 tópicos, 8 a 15 flashcards e 5 a 10 questões de múltipla escolha. Preserve os fatos do documento e não invente informações." },
        ],
      }];
    }

    const aiData = await openAiResponses(apiKey, input);
    const output = extractJson(responseText(aiData));

    const { error: outputError } = await supabase.from("material_outputs").upsert({
      material_id: material.id,
      user_id: user.id,
      summary: output.summary,
      topics: output.topics,
      flashcards: output.flashcards,
      quiz: output.quiz,
      transcript,
    }, { onConflict: "material_id" });

    if (outputError) throw new Error("Não foi possível salvar o material processado.");

    await supabase.from("study_materials").update({ status: "ready" }).eq("id", material.id).eq("user_id", user.id);
    return json({ ok: true, output });
  } catch (error) {
    await supabase.from("study_materials").update({ status: "failed" }).eq("user_id", user.id).eq("status", "processing");
    return json({ error: error instanceof Error ? error.message : "Falha no processamento." }, 500);
  }
});
