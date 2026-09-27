import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, FileText, HelpCircle, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Topic = { title: string; explanation: string };
type Flashcard = { question: string; answer: string };
type Quiz = { question: string; options: string[]; answer: string; explanation: string };

function asTopics(value: Json): Topic[] {
  return Array.isArray(value) ? value.filter((item): item is { [key: string]: Json | undefined } => typeof item === "object" && item !== null).map((item) => ({ title: String(item.title ?? ""), explanation: String(item.explanation ?? "") })) : [];
}
function asFlashcards(value: Json): Flashcard[] {
  return Array.isArray(value) ? value.filter((item): item is { [key: string]: Json | undefined } => typeof item === "object" && item !== null).map((item) => ({ question: String(item.question ?? ""), answer: String(item.answer ?? "") })) : [];
}
function asQuiz(value: Json): Quiz[] {
  return Array.isArray(value) ? value.filter((item): item is { [key: string]: Json | undefined } => typeof item === "object" && item !== null).map((item) => ({ question: String(item.question ?? ""), options: Array.isArray(item.options) ? item.options.map(String) : [], answer: String(item.answer ?? ""), explanation: String(item.explanation ?? "") })) : [];
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

  async function load() {
    setLoading(true);
    const [{ data: materialData, error: materialError }, { data: outputData }, { data: progressData }] = await Promise.all([
      supabase.from("study_materials").select("*").eq("id", materialId).eq("user_id", user.id).maybeSingle(),
      supabase.from("material_outputs").select("*").eq("material_id", materialId).eq("user_id", user.id).maybeSingle(),
      supabase.from("study_progress").select("*").eq("material_id", materialId).eq("user_id", user.id).maybeSingle(),
    ]);
    setLoading(false);
    if (materialError || !materialData) {
      toast.error("Material não encontrado.");
      navigate({ to: "/library" });
      return;
    }
    setMaterial(materialData);
    setOutput(outputData);
    setProgress(progressData?.progress ?? 0);
  }

  useEffect(() => { void load(); }, [materialId, user.id]);

  async function processMaterial() {
    if (!material || processing) return;
    setProcessing(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setProcessing(false);
      toast.error("Sua sessão expirou. Entre novamente.");
      return;
    }
    const { data, error } = await supabase.functions.invoke("process-material", { body: { materialId } });
    setProcessing(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível processar este material.");
      await load();
      return;
    }
    toast.success("Material organizado pela IA.");
    setOutput(data.output as Tables<"material_outputs">);
    setMaterial({ ...material, status: "ready" });
    setProgress(10);
    await saveProgress(10);
  }

  async function saveProgress(value: number) {
    const next = Math.max(0, Math.min(100, value));
    setProgress(next);
    await supabase.from("study_progress").upsert({
      user_id: user.id,
      material_id: materialId,
      progress: next,
      last_opened_at: new Date().toISOString(),
    }, { onConflict: "user_id,material_id" });
  }

  const topics = useMemo(() => output ? asTopics(output.topics) : [], [output]);
  const flashcards = useMemo(() => output ? asFlashcards(output.flashcards) : [], [output]);
  const quiz = useMemo(() => output ? asQuiz(output.quiz) : [], [output]);
  const currentFlashcard = flashcards[flashcardIndex];

  if (loading) return <div className="flex min-h-[100dvh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!material) return null;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-[72px] sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/library" })} aria-label="Voltar"><ArrowLeft size={20} /></Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-extrabold">{material.title}</h1>
            <p className="text-xs text-muted-foreground">{material.status === "ready" ? "Material organizado" : material.status === "processing" ? "Processando..." : "Aguardando processamento"}</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex"><span className="text-xs text-muted-foreground">{progress}%</span><div className="h-2 w-28 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {!output && (
          <section className="rounded-2xl border border-violet-border bg-violet-soft p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-violet text-brand-violet-foreground"><Sparkles size={22} /></div>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold">Transforme este conteúdo em estudo</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A Pineapple AI pode organizar o arquivo em resumo, tópicos, flashcards e quiz. Para áudio e vídeo, primeiro fazemos a transcrição.</p>
                <Button className="mt-5" onClick={() => void processMaterial()} disabled={processing}>
                  {processing && <Loader2 className="animate-spin" size={17} />}
                  {processing ? "Organizando..." : "Organizar com IA"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {output && (
          <>
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-violet"><BookOpen size={18} /> Resumo</div>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{output.summary}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {topics.map((topic, index) => <article key={index} className="rounded-xl bg-secondary p-4"><h3 className="font-bold">{topic.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{topic.explanation}</p></article>)}
              </div>
            </section>

            {flashcards.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold"><Sparkles size={18} /> Flashcards</div><span className="text-xs text-muted-foreground">{flashcardIndex + 1} / {flashcards.length}</span></div>
                <button type="button" onClick={() => setShowAnswer((value) => !value)} className="mt-5 min-h-48 w-full rounded-2xl border border-primary/20 bg-green-soft/50 p-6 text-left transition hover:border-primary/40">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-strong">{showAnswer ? "Resposta" : "Pergunta"}</p>
                  <p className="mt-3 text-lg font-bold leading-relaxed">{showAnswer ? currentFlashcard?.answer : currentFlashcard?.question}</p>
                </button>
                <div className="mt-4 flex justify-between gap-3">
                  <Button variant="outline" disabled={flashcardIndex === 0} onClick={() => { setFlashcardIndex((i) => i - 1); setShowAnswer(false); }}><ChevronLeft size={17} />Anterior</Button>
                  <Button onClick={() => { const next = Math.min(flashcards.length - 1, flashcardIndex + 1); setFlashcardIndex(next); setShowAnswer(false); void saveProgress(Math.max(progress, Math.round(((next + 1) / flashcards.length) * 70))); }} disabled={flashcardIndex === flashcards.length - 1}>Próximo<ChevronRight size={17} /></Button>
                </div>
              </section>
            )}

            {quiz.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
                <div className="flex items-center gap-2 font-bold"><HelpCircle size={18} /> Quiz</div>
                <div className="mt-5 space-y-6">
                  {quiz.map((item, index) => {
                    const selected = quizAnswers[index];
                    const correct = selected === item.answer;
                    return <article key={index} className="rounded-xl border border-border p-4">
                      <p className="font-bold">{index + 1}. {item.question}</p>
                      <div className="mt-3 grid gap-2">
                        {item.options.map((option) => <button type="button" key={option} onClick={() => setQuizAnswers((current) => ({ ...current, [index]: option }))} className={`rounded-lg border px-3 py-3 text-left text-sm transition ${selected === option ? (correct ? "border-primary bg-green-soft" : "border-destructive bg-destructive/10") : "border-border hover:bg-secondary"}`}>{option}</button>)}
                      </div>
                      {selected && <div className="mt-3 rounded-lg bg-secondary p-3 text-sm"><strong>{correct ? "Correto!" : `Resposta: ${item.answer}`}</strong><p className="mt-1 text-muted-foreground">{item.explanation}</p></div>}
                    </article>;
                  })}
                </div>
                <Button className="mt-5" variant="secondary" onClick={() => void saveProgress(100)}><CheckCircle2 size={17} />Concluir material</Button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
