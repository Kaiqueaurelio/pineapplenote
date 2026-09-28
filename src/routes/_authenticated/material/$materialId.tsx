import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Gamepad2,
  HelpCircle,
  Languages,
  Loader2,
  MessageCircle,
  Mic2,
  Network,
  PenLine,
  Presentation,
  Share2,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Flag,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Topic = { title: string; explanation: string };
type Flashcard = { question: string; answer: string };
type Quiz = { question: string; options: string[]; answer: string; explanation: string };

function asTopics(value: Json): Topic[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is { [key: string]: Json | undefined } =>
            typeof item === "object" && item !== null,
        )
        .map((item) => ({
          title: String(item["title"] ?? ""),
          explanation: String(item["explanation"] ?? ""),
        }))
    : [];
}
function asFlashcards(value: Json): Flashcard[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is { [key: string]: Json | undefined } =>
            typeof item === "object" && item !== null,
        )
        .map((item) => ({
          question: String(item["question"] ?? ""),
          answer: String(item["answer"] ?? ""),
        }))
    : [];
}
function asQuiz(value: Json): Quiz[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is { [key: string]: Json | undefined } =>
            typeof item === "object" && item !== null,
        )
        .map((item) => ({
          question: String(item["question"] ?? ""),
          options: Array.isArray(item["options"]) ? item["options"].map(String) : [],
          answer: String(item["answer"] ?? ""),
          explanation: String(item["explanation"] ?? ""),
        }))
    : [];
}

export const Route = createFileRoute("/_authenticated/material/$materialId")({
  head: () => ({ meta: [{ title: "Material — Pineapple Note" }] }),
  component: MaterialPage,
});

function MaterialPage() {
  const { user } = Route.useRouteContext();
  const { materialId } = Route.useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Tables<"study_materials"> | null>(null);
  const [output, setOutput] = useState<Tables<"material_outputs"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [progress, setProgress] = useState(0);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("resumo");
  const [retrying, setRetrying] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [chatMessages, setChatMessages] = useState<Tables<"material_chat_messages">[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const [translated, setTranslated] = useState<{ summary: string; topics: Topic[] } | null>(null);
  const [mindMap, setMindMap] = useState<{
    center: string;
    branches: { title: string; children: string[] }[];
  } | null>(null);
  const [mindMapLoading, setMindMapLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [
      { data: materialData, error: materialError },
      { data: outputData },
      { data: progressData },
    ] = await Promise.all([
      supabase
        .from("study_materials")
        .select("*")
        .eq("id", materialId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("material_outputs")
        .select("*")
        .eq("material_id", materialId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("study_progress")
        .select("*")
        .eq("material_id", materialId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setLoading(false);
    if (materialError || !materialData) {
      toast.error("Material não encontrado.");
      navigate({ to: "/library" });
      return;
    }
    setMaterial(materialData);
    const { data: signedSource } = await supabase.storage
      .from("study-materials")
      .createSignedUrl(materialData.storage_path, 60 * 60);
    setSourceUrl(signedSource?.signedUrl ?? null);
    setOutput(outputData);
    const savedProgress = Math.max(0, Math.min(100, progressData?.progress ?? 0));
    setProgress(savedProgress);
    void supabase.from("study_progress").upsert(
      {
        user_id: user.id,
        material_id: materialId,
        progress: savedProgress,
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: "user_id,material_id" },
    );
  }

  useEffect(() => {
    void load();
  }, [materialId, user.id]);

  useEffect(() => {
    void supabase
      .from("material_chat_messages")
      .select("*")
      .eq("material_id", materialId)
      .eq("user_id", user.id)
      .order("created_at")
      .then(({ data }) => setChatMessages(data ?? []));
  }, [materialId, user.id]);

  useEffect(() => {
    if (!output) return;

    const sectionIds = ["resumo", "transcricao", "flashcards", "quiz"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [output]);

  useEffect(() => {
    if (material?.status !== "processing" || output) return;

    const interval = window.setInterval(async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("status")
        .eq("id", materialId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) return;

      if (data.status === "ready" || data.status === "failed") {
        await load();
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [material?.status, output, materialId, user.id]);

  async function processMaterial() {
    if (!material || processing || material.status === "processing") return;

    setProcessing(true);
    setMaterial({ ...material, status: "processing" });

    const timeout = new Promise<{ data: null; error: Error }>((resolve) =>
      window.setTimeout(
        () =>
          resolve({
            data: null,
            error: new Error("O processamento está demorando mais que o esperado."),
          }),
        90_000,
      ),
    );

    const request = supabase.functions.invoke("process-material", { body: { materialId } });
    const { data, error } = await Promise.race([request, timeout]);

    setProcessing(false);

    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível processar este material.");
      await load();
      return;
    }

    toast.success("Pronto para estudar.");
    setOutput(data.output as Tables<"material_outputs">);
    setMaterial({ ...material, status: "ready" });
    setProgress(10);
    await saveProgress(10);
  }

  async function retryProcessing() {
    if (!material || retrying) return;
    setRetrying(true);
    await processMaterial();
    setRetrying(false);
  }

  async function generateMindMap() {
    if (!output || mindMapLoading) return;
    setMindMapLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-tools", {
      body: { action: "mindmap", materialId },
    });
    setMindMapLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível gerar o mapa mental.");
      return;
    }
    setMindMap(data);
    setShowMindMap(true);
  }

  async function translateNote() {
    if (!output) return;
    const { data, error } = await supabase.functions.invoke("ai-tools", {
      body: { action: "translate", materialId, language },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível traduzir a nota.");
      return;
    }
    setTranslated(data);
    toast.success(`Nota traduzida para ${language}.`);
  }

  async function deleteMaterial() {
    if (!material) return;
    const confirmed = window.confirm(
      "Excluir esta nota? O arquivo e os dados deste material serão removidos.",
    );
    if (!confirmed) return;
    const { error: storageError } = await supabase.storage
      .from("study-materials")
      .remove([material.storage_path]);
    if (storageError) {
      toast.error("Não foi possível remover o arquivo original.");
      return;
    }
    const { error } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", materialId)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Não foi possível excluir a nota.");
      return;
    }
    toast.success("Nota excluída.");
    navigate({ to: "/library" });
  }

  function shareMaterial() {
    if (navigator.share) {
      void navigator.share({
        title: material?.title ?? "Pineapple Note",
        text: "Confira esta nota no Pineapple Note.",
      });
    } else {
      void navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copiado.");
    }
  }

  async function saveProgress(value: number) {
    const next = Math.max(0, Math.min(100, value));
    setProgress(next);
    await supabase.from("study_progress").upsert(
      {
        user_id: user.id,
        material_id: materialId,
        progress: next,
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: "user_id,material_id" },
    );
  }

  async function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatText.trim();
    if (!message || sendingChat) return;
    setSendingChat(true);
    const { data, error } = await supabase.functions.invoke("study-chat", {
      body: { materialId, message },
    });
    setSendingChat(false);
    if (error || data?.error)
      return toast.error(data?.error ?? "Não foi possível responder agora.");
    const now = new Date().toISOString();
    setChatMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        material_id: materialId,
        user_id: user.id,
        role: "user",
        content: message,
        created_at: now,
      },
      {
        id: crypto.randomUUID(),
        material_id: materialId,
        user_id: user.id,
        role: "assistant",
        content: String(data.answer),
        created_at: new Date().toISOString(),
      },
    ]);
    setChatText("");
    setChatOpen(true);
  }

  const topics = useMemo(() => (output ? asTopics(output.topics) : []), [output]);
  const flashcards = useMemo(() => (output ? asFlashcards(output.flashcards) : []), [output]);
  const quiz = useMemo(() => (output ? asQuiz(output.quiz) : []), [output]);
  const currentFlashcard = flashcards[flashcardIndex];
  const answeredQuizCount = Object.keys(quizAnswers).length;
  const correctQuizCount = quiz.reduce(
    (total, item, index) => total + (quizAnswers[index] === item.answer ? 1 : 0),
    0,
  );
  const quizCompleted = quiz.length > 0 && answeredQuizCount === quiz.length;

  function resetQuiz() {
    setQuizAnswers({});
    setQuizSubmitted(false);
  }

  if (loading)
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="animate-spin text-primary" size={26} />
        <p className="text-sm font-medium text-muted-foreground">Carregando seu material...</p>
      </div>
    );
  if (!material) return null;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-[72px] sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/library" })}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-extrabold">{material.title}</h1>
            <p className="text-xs text-muted-foreground">
              {material.status === "ready"
                ? "Material organizado"
                : material.status === "processing"
                  ? "Organizando conteúdo..."
                  : "Pronto para organizar"}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-muted-foreground">{progress}%</span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-28 pt-4 sm:px-6 sm:py-8">
        {output && (
          <nav
            className="sticky top-[4.25rem] z-10 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1 shadow-soft backdrop-blur-xl sm:top-[4.75rem]"
            aria-label="Seções do material"
          >
            {(
              [
                ["resumo", "Resumo"],
                ...(output.transcript ? [["transcricao", "Transcrição"]] : []),
                ...(flashcards.length ? [["flashcards", "Flashcards"]] : []),
                ...(quiz.length ? [["quiz", "Quiz"]] : []),
              ] as [string, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveSection(id);
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`min-w-max rounded-lg px-3 py-2 text-xs font-bold transition ${activeSection === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        {output && (
          <section aria-label="Ferramentas de estudo" className="-mx-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Podcast", icon: Mic2, to: "/podcast/$materialId" as const },
                { label: "Criar slides", icon: Presentation, to: "/slides/$materialId" as const },
                { label: "Jogos de estudo", icon: Gamepad2, to: "/games/$materialId" as const },
                { label: "Compartilhar", icon: Share2, to: null },
              ].map(({ label, icon: Icon, to }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (to) {
                      navigate({ to, params: { materialId } });
                    } else {
                      if (navigator.share) {
                        void navigator.share({
                          title: material.title,
                          text: "Confira este material no Pineapple Note.",
                        });
                      } else {
                        void navigator.clipboard?.writeText(window.location.href);
                        toast.success("Link copiado.");
                      }
                    }
                  }}
                  className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-violet/35 hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-brand-violet transition group-hover:scale-105">
                    <Icon size={20} />
                  </span>
                  <span className="text-sm font-extrabold">{label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {sourceUrl && (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">Conteúdo original</p>
                <p className="text-xs text-muted-foreground">Acesso privado e temporário</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(sourceUrl, "_blank", "noopener,noreferrer")}
              >
                Abrir arquivo
              </Button>
            </div>
            {material.source_type === "audio" && (
              <audio className="w-full" controls src={sourceUrl} />
            )}
            {material.source_type === "video" && (
              <video
                className="max-h-[60dvh] w-full rounded-xl bg-black"
                controls
                src={sourceUrl}
              />
            )}
          </section>
        )}
        {!output && material.status === "failed" && (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <HelpCircle size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold">Não conseguimos organizar este material</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  O arquivo continua salvo. Você pode tentar o processamento novamente sem precisar
                  enviá-lo de novo.
                </p>
                <Button className="mt-5" onClick={() => void retryProcessing()} disabled={retrying}>
                  {retrying && <Loader2 className="animate-spin" size={17} />}
                  {retrying ? "Tentando novamente..." : "Tentar novamente"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {!output && material.status !== "failed" && (
          <section className="rounded-2xl border border-violet-border bg-violet-soft p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-violet text-brand-violet-foreground">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold">Transforme este conteúdo em estudo</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  A organização inteligente transforma o arquivo em resumo, tópicos, flashcards e
                  quiz. Para áudio e vídeo, primeiro fazemos a transcrição.
                </p>
                <Button
                  className="mt-5"
                  onClick={() => void processMaterial()}
                  disabled={processing || material.status === "processing"}
                >
                  {(processing || material.status === "processing") && (
                    <Loader2 className="animate-spin" size={17} />
                  )}
                  {material.status === "processing"
                    ? "Processamento em andamento..."
                    : processing
                      ? "Transcrevendo e organizando..."
                      : material.source_type === "audio" || material.source_type === "video"
                        ? "Transcrever e organizar com IA"
                        : "Organizar com IA"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {material.status === "processing" && !output && (
          <section
            aria-live="polite"
            className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="shrink-0 animate-spin text-primary" size={20} />
              <div>
                <p className="font-bold">Organizando seu material...</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Você pode permanecer nesta página. Se sair, o processamento continua e retomamos
                  quando voltar.
                </p>
              </div>
            </div>
          </section>
        )}

        {output && (
          <>
            {output?.transcript && (
              <section
                id="transcricao"
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold">
                      <FileText size={18} /> Transcrição
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Texto extraído do áudio ou vídeo para você revisar e estudar.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!navigator.clipboard) {
                          toast.error("Seu navegador não permite copiar automaticamente.");
                          return;
                        }
                        void navigator.clipboard.writeText(output.transcript);
                        toast.success("Transcrição copiada.");
                      }}
                    >
                      <Copy size={15} />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([output.transcript], {
                          type: "text/plain;charset=utf-8",
                        });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.download = `${material.title.replace(/[^a-z0-9-_]+/gi, "-")}-transcricao.txt`;
                        anchor.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download size={15} />
                      TXT
                    </Button>
                  </div>
                </div>
                <div className="mt-5 max-h-[55dvh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-secondary p-5 text-sm leading-7 text-muted-foreground">
                  {output.transcript}
                </div>
              </section>
            )}

            <section
              id="resumo"
              className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-brand-violet">
                <BookOpen size={18} /> Resumo
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                {output.summary}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {topics.map((topic, index) => (
                  <article key={index} className="rounded-xl bg-secondary p-4">
                    <h3 className="font-bold">{topic.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {topic.explanation}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {flashcards.length > 0 && (
              <section
                id="flashcards"
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold">
                    <BookOpen size={18} /> Flashcards
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {flashcardIndex + 1} / {flashcards.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnswer((value) => !value)}
                  aria-label={
                    showAnswer ? "Mostrar pergunta do flashcard" : "Mostrar resposta do flashcard"
                  }
                  className="mt-5 min-h-48 w-full rounded-2xl border border-primary/20 bg-green-soft/50 p-6 text-left transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-green-strong">
                    {showAnswer ? "Resposta" : "Pergunta"}
                  </p>
                  <p className="mt-3 text-lg font-bold leading-relaxed">
                    {showAnswer ? currentFlashcard?.answer : currentFlashcard?.question}
                  </p>
                </button>
                <div className="mt-4 flex justify-between gap-3">
                  <Button
                    variant="outline"
                    disabled={flashcardIndex === 0}
                    onClick={() => {
                      setFlashcardIndex((i) => i - 1);
                      setShowAnswer(false);
                    }}
                  >
                    <ChevronLeft size={17} />
                    Anterior
                  </Button>
                  <Button
                    onClick={() => {
                      const next = Math.min(flashcards.length - 1, flashcardIndex + 1);
                      setFlashcardIndex(next);
                      setShowAnswer(false);
                      void saveProgress(
                        Math.max(progress, Math.round(((next + 1) / flashcards.length) * 70)),
                      );
                    }}
                    disabled={flashcardIndex === flashcards.length - 1}
                  >
                    Próximo
                    <ChevronRight size={17} />
                  </Button>
                </div>
              </section>
            )}

            {quiz.length > 0 && (
              <section
                id="quiz"
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7"
              >
                <div className="flex items-center gap-2 font-bold">
                  <HelpCircle size={18} /> Quiz
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-3 text-sm">
                  <span className="font-semibold">
                    {answeredQuizCount} de {quiz.length} respondidas
                  </span>
                  {quizSubmitted && quizCompleted && (
                    <span className="font-extrabold text-green-strong">
                      Resultado: {correctQuizCount}/{quiz.length}
                    </span>
                  )}
                </div>
                <div className="mt-5 space-y-6">
                  {quiz.map((item, index) => {
                    const selected = quizAnswers[index];
                    const correct = selected === item["answer"];
                    return (
                      <article key={index} className="rounded-xl border border-border p-4">
                        <p className="font-bold">
                          {index + 1}. {item["question"]}
                        </p>
                        <div className="mt-3 grid gap-2">
                          {item.options.map((option) => (
                            <button
                              type="button"
                              key={option}
                              onClick={() => {
                                setQuizAnswers((current) => ({ ...current, [index]: option }));
                                setQuizSubmitted(false);
                              }}
                              aria-pressed={selected === option}
                              className={`min-h-11 rounded-lg border px-3 py-3 text-left text-sm transition ${selected === option ? (quizSubmitted ? (correct ? "border-primary bg-green-soft" : "border-destructive bg-destructive/10") : "border-primary bg-primary/5") : "border-border hover:bg-secondary"}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {selected && quizSubmitted && (
                          <div className="mt-3 rounded-lg bg-secondary p-3 text-sm">
                            <strong>{correct ? "Correto!" : `Resposta: ${item["answer"]}`}</strong>
                            <p className="mt-1 text-muted-foreground">{item["explanation"]}</p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={resetQuiz}
                    disabled={answeredQuizCount === 0}
                  >
                    Refazer quiz
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    variant="secondary"
                    onClick={() => {
                      setQuizSubmitted(true);
                      if (quizCompleted) void saveProgress(100);
                    }}
                    disabled={!quizCompleted}
                  >
                    <CheckCircle2 size={17} />
                    {quizCompleted
                      ? quizSubmitted
                        ? "Resultado atualizado"
                        : "Ver resultado"
                      : "Responda todas as questões"}
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
        {output && !quiz.length && (
          <section className="rounded-2xl border border-primary/20 bg-green-soft/50 p-5 text-center sm:p-6">
            <CheckCircle2 className="mx-auto text-green-strong" size={24} />
            <h2 className="mt-3 font-bold">Terminou de estudar?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Marque o material como concluído para salvar seu progresso.
            </p>
            <Button
              className="mt-4"
              onClick={() => void saveProgress(100)}
              disabled={progress >= 100}
            >
              {progress >= 100 ? "Material concluído" : "Concluir material"}
            </Button>
          </section>
        )}
        {output && (
          <section className="mt-8 space-y-3" aria-label="Ações da nota">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xl font-black">Está satisfeito com esta nota?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-label="Não gostei"
                    onClick={() => {
                      setFeedback("down");
                      toast.success("Obrigado pelo feedback.");
                    }}
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition ${feedback === "down" ? "bg-destructive/15 text-destructive" : "bg-destructive/10 text-destructive"}`}
                  >
                    <ThumbsDown size={23} />
                  </button>
                  <button
                    type="button"
                    aria-label="Gostei"
                    onClick={() => {
                      setFeedback("up");
                      toast.success("Obrigado pelo feedback.");
                    }}
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition ${feedback === "up" ? "bg-primary/20 text-primary" : "bg-green-soft text-green-strong"}`}
                  >
                    <ThumbsUp size={23} />
                  </button>
                </div>
              </div>
            </div>

            {[
              { label: "Ver mapa mental", icon: Network, action: () => void generateMindMap() },
              {
                label: "Editar nota e transcrição",
                icon: PenLine,
                action: () => navigate({ to: "/editor/$materialId", params: { materialId } }),
              },
              {
                label: "Traduzir anotação",
                icon: Languages,
                action: () => setTranslateOpen(true),
              },
              {
                label: "Conversar com esta nota",
                icon: Mic2,
                action: () => navigate({ to: "/chat/$materialId", params: { materialId } }),
              },
              {
                label: "Denunciar nota",
                icon: Flag,
                action: () => toast.success("Sua denúncia foi registrada para análise."),
              },
              {
                label: "Excluir nota",
                icon: Trash2,
                action: () => void deleteMaterial(),
                danger: true,
              },
            ].map(({ label, icon: Icon, action, danger }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className={`flex min-h-[78px] w-full items-center gap-4 rounded-3xl border border-border bg-card px-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${danger ? "text-destructive" : "text-foreground"}`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border ${danger ? "bg-destructive/10" : "bg-secondary"}`}
                >
                  <Icon size={22} />
                </span>
                <span className="flex-1 text-lg font-semibold">{label}</span>
                <ChevronRight className="text-muted-foreground" size={23} />
              </button>
            ))}
          </section>
        )}

        {translateOpen && output && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-lg rounded-[2rem] border border-border bg-background p-6 shadow-soft sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-brand-violet">Pineapple Languages</p>
                  <h2 className="text-2xl font-black">Traduzir anotação</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setTranslateOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
                >
                  ×
                </button>
              </div>
              <label className="mt-6 block text-sm font-bold" htmlFor="translation-language">
                Idioma
              </label>
              <select
                id="translation-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-card px-4"
              >
                {["English", "Español", "Français", "Deutsch", "Italiano", "日本語", "한국어"].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
              </select>
              <Button className="mt-4 w-full" onClick={() => void translateNote()}>
                Traduzir com IA
              </Button>
              {translated && (
                <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl bg-secondary p-4 text-sm leading-6">
                  <strong>Resumo</strong>
                  <p className="mt-2 whitespace-pre-line">{translated.summary}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showMindMap && output && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center">
            <div className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-background p-6 shadow-soft sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-brand-violet">Pineapple Note</p>
                  <h2 className="text-2xl font-black">Mapa mental</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMindMap(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
                >
                  ×
                </button>
              </div>
              <div className="mt-7 rounded-3xl bg-secondary p-5 text-center">
                <div className="mx-auto max-w-xs rounded-2xl bg-card p-5 shadow-card">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Tema central
                  </p>
                  <p className="mt-2 text-xl font-black">{material.title}</p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {mindMapLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Gerando seu mapa mental…
                    </div>
                  ) : (
                    (
                      mindMap?.branches ??
                      topics.map((topic) => ({
                        title: topic.title,
                        explanation: topic.explanation,
                        children: [],
                      }))
                    ).map((topic) => (
                      <div
                        key={topic.title}
                        className="rounded-2xl border border-border bg-card p-4 text-left"
                      >
                        <p className="font-black text-brand-violet">{topic.title}</p>
                        {"children" in topic && Array.isArray(topic.children) ? (
                          <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
                            {topic.children.map((child) => (
                              <li key={child}>• {child}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {topic.explanation}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
          Pineapple Note · Desenvolvido pela Decode Analytics
        </footer>
      </main>
      {output && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:left-1/2 sm:max-w-3xl sm:-translate-x-1/2 sm:rounded-t-3xl sm:border-x">
          <div className="mx-auto max-w-3xl">
            {chatOpen && chatMessages.length > 0 && (
              <div className="mb-3 max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-card">
                {chatMessages.slice(-4).map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "assistant"
                        ? "rounded-xl bg-violet-soft p-3 text-sm"
                        : "ml-8 rounded-xl bg-secondary p-3 text-sm"
                    }
                  >
                    <strong className="block text-xs text-brand-violet">
                      {message.role === "assistant" ? "Pineapple IA" : "Você"}
                    </strong>
                    <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={sendChat} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChatOpen((open) => !open)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-card"
                aria-label="Abrir conversa"
              >
                <MessageCircle size={21} />
              </button>
              <input
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                maxLength={8000}
                placeholder="Pergunte sobre este material"
                className="h-12 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatText.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50"
                aria-label="Enviar pergunta"
              >
                {sendingChat ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
