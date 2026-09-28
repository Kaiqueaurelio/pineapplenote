import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
  transcript: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractText(data: unknown) {
  const candidates = (data as { candidates?: unknown[] })?.candidates;
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const parts = (candidate as { content?: { parts?: unknown[] } })?.content?.parts;
    for (const part of Array.isArray(parts) ? parts : []) {
      const text = (part as { text?: unknown })?.text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  throw new Error("O Gemini não retornou conteúdo.");
}

const studySchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["title", "explanation"],
      },
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
      },
    },
    quiz: {
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
    transcript: { type: "string" },
  },
  required: ["summary", "topics", "flashcards", "quiz", "transcript"],
};

async function uploadToGemini(apiKey: string, bytes: Uint8Array, mimeType: string, displayName: string) {
  const start = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files", {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mimeType || "application/octet-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: displayName.slice(0, 512) } }),
  });
  if (!start.ok) {
    const error = await start.text();
    throw new Error(`Falha ao iniciar upload no Gemini: ${error.slice(0, 500)}`);
  }
  const uploadUrl = start.headers.get("x-goog-upload-url") ?? start.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) throw new Error("O Gemini não retornou a URL de upload.");

  const upload = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  });
  const data = await upload.json();
  if (!upload.ok) throw new Error(data?.error?.message ?? "Falha ao enviar arquivo ao Gemini.");
  return String(data?.file?.uri ?? "");
}

async function generateStudy(apiKey: string, contents: unknown[]) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          thinkingConfig: { thinkingLevel: "medium" },
          responseMimeType: "application/json",
          responseSchema: studySchema,
        },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? "Falha ao processar com o Gemini.");
  return JSON.parse(extractText(data)) as StudyPayload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const publishableKey =
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default;
  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: "Sessão inválida." }, 401);

  const { data: actor } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  const isAdmin = actor?.role === "admin";
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? secretKeys.default;
  const db = isAdmin && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : supabase;

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY não configurada no servidor." }, 503);

  let processingMaterialId: string | null = null;
  let materialOwnerId = user.id;

  try {
    const { materialId } = await req.json();
    processingMaterialId = materialId;
    if (typeof materialId !== "string") return json({ error: "materialId é obrigatório." }, 400);

    const materialQuery = db.from("study_materials").select("*").eq("id", materialId);
    if (!isAdmin) materialQuery.eq("user_id", user.id);
    const { data: material, error: materialError } = await materialQuery.maybeSingle();

    if (materialError || !material) return json({ error: "Material não encontrado." }, 404);
    materialOwnerId = material.user_id;

    await db
      .from("study_materials")
      .update({ status: "processing" })
      .eq("id", material.id)
      .eq("user_id", materialOwnerId);

    let contents: unknown[];

    if (material.source_type === "url") {
      const url = material.storage_path;
      if (!/^https?:\/\//i.test(url)) throw new Error("URL de origem inválida.");
      const pageResponse = await fetch(url, { headers: { "User-Agent": "PineappleNote/1.0" } });
      if (!pageResponse.ok) throw new Error(`Não foi possível acessar a URL (${pageResponse.status}).`);
      const contentType = pageResponse.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        throw new Error("Esta URL não retornou uma página de texto compatível.");
      }
      const raw = await pageResponse.text();
      const textContent = raw
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180000);
      if (!textContent) throw new Error("Não encontramos texto suficiente nesta página.");
      contents = [{
        role: "user",
        parts: [{
          text: `Transforme o conteúdo abaixo em um material de estudo completo. Gere um resumo claro, 5 a 10 tópicos, 8 a 15 flashcards e 5 a 10 questões de múltipla escolha. O campo transcript deve conter o texto-fonte quando aplicável. Preserve fatos e não invente informações. Responda em português brasileiro.

URL: ${url}

CONTEÚDO:
${textContent}`,
        }],
      }];
    } else {
      const { data: signed, error: signedError } = await db.storage
        .from("study-materials")
        .createSignedUrl(material.storage_path, 60 * 60);
      if (signedError || !signed?.signedUrl) throw new Error("Não foi possível acessar o arquivo.");

      const fileResponse = await fetch(signed.signedUrl);
      if (!fileResponse.ok) throw new Error("Não foi possível baixar o arquivo para análise.");
      const bytes = new Uint8Array(await fileResponse.arrayBuffer());
      const fileUri = await uploadToGemini(
        apiKey,
        bytes,
        material.mime_type || "application/octet-stream",
        material.title,
      );
      if (!fileUri) throw new Error("O Gemini não retornou o arquivo processado.");

      const kind = material.source_type === "audio"
        ? "áudio"
        : material.source_type === "video"
          ? "vídeo"
          : "documento";

      contents = [{
        role: "user",
        parts: [
          {
            file_data: {
              mime_type: material.mime_type || "application/octet-stream",
              file_uri: fileUri,
            },
          },
          {
            text: `Analise este ${kind} como material acadêmico. Gere um resumo claro, 5 a 10 tópicos, 8 a 15 flashcards e 5 a 10 questões de múltipla escolha. Se houver fala, transcreva-a no campo transcript. Preserve fatos, nomes, fórmulas e termos técnicos; não invente informações. Responda em português brasileiro.`,
          },
        ],
      }];
    }

    const output = await generateStudy(apiKey, contents);

    const { error: outputError } = await db.from("material_outputs").upsert(
      {
        material_id: material.id,
        user_id: materialOwnerId,
        summary: output.summary,
        topics: output.topics,
        flashcards: output.flashcards,
        quiz: output.quiz,
        transcript: output.transcript ?? "",
      },
      { onConflict: "material_id" },
    );

    if (outputError) throw new Error("Não foi possível salvar o material processado.");

    await db
      .from("study_materials")
      .update({ status: "ready" })
      .eq("id", material.id)
      .eq("user_id", materialOwnerId);

    return json({ ok: true, output });
  } catch (error) {
    if (processingMaterialId) {
      await db
        .from("study_materials")
        .update({ status: "failed" })
        .eq("id", processingMaterialId)
        .eq("user_id", materialOwnerId ?? user.id);
    }
    return json({ error: error instanceof Error ? error.message : "Falha no processamento." }, 500);
  }
});
