import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, FileText, Gamepad2, HelpCircle, Loader2, Mic2, Presentation, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Topic = { title: string; explanation: string };
type Flashcard = { question: string; answer: string };
type Quiz = { question: string; options: string[]; answer: string; explanation: string };

function asTopics(value: Json): Topic[] {
  return Array.isArray(value) ? value.filter((item): item is { [key: string]: Json | undefined } => typeof item === "object" && item !== null).map((item) => ({ title: String(item["title"] ?? ""), explanation: String(item["explanation"] ?? "") })) : [];
}
function asFlashcards(value: Json): Flashcard[] {
  return Array.isArray(value) ? value.filter((item): item is { [key: string]: Json | undefined } => typeof item === "object" && item !== null).map((item) => ({ question: String(item["question"] ?? ""), answer: String(item["answer"] ?? "") })) : [];
}
function asQuiz(value: Json): Quiz[] {
  return Array.isArray(value) ? value.filter((item): item is { [key: string]: Json | undefined } => typeof item === "object" && item !== null).map((item) => ({ question: String(item["question"] ?? ""), options: Array.isArray(item["options"]) ? item["options"].map(String) : [], answer: String(item["answer"] ?? ""), explanation: String(item["explanation"] ?? "") })) : [];
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
    const { data: signedSource } = await supabase.storage.from("study-materials").createSignedUrl(materialData.storage_path, 60 * 60);
    setSourceUrl(signedSource?.signedUrl ?? null);
    setOutput(outputData);
    const savedProgress = Math.max(0, Math.min(100, progressData?.progress ?? 0));
    setProgress(savedProgress);
    void supabase.from("study_progress").upsert({
      user_id: user.id,
      material_id: materialId,
      progress: savedProgress,
      last_opened_at: new Date().toISOString(),
    }, { onConflict: "user_id,material_id" });
  }

  useEffect(() => {
    void load();
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
        () => resolve({ data: null, error: new Error("O processamento está demorando mais que o esperado.") }),
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

  if (loading) return <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-6 text-center"><Loader2 className="animate-spin text-primary" size={26} /><p className="text-sm font-medium text-muted-foreground">Carregando seu material...</p></div>;
  if (!material) return null;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-[72px] sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/library" })} aria-label="Voltar"><ArrowLeft size={20} /></Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-extrabold">{material.title}</h1>
            <p className="text-xs text-muted-foreground">{material.status === "ready" ? "Material organizado" : material.status === "processing" ? "Organizando conteúdo..." : "Pronto para organizar"}</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex"><span className="text-xs text-muted-foreground">{progress}%</span><div className="h-2 w-28 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-10 pt-4 sm:px-6 sm:py-8">
        {output && (
          <nav className="sticky top-[4.25rem] z-10 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1 shadow-soft backdrop-blur-xl sm:top-[4.75rem]" aria-label="Seções do material">
            {([
              ["resumo", "Resumo"],
              ...(output.transcript ? [["transcricao", "Transcrição"]] : []),
              ...(flashcards.length ? [["flashcards", "Flashcards"]] : []),
              ...(quiz.length ? [["quiz", "Quiz"]] : []),
            ] as [string, string][]).map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={`min-w-max rounded-lg px-3 py-2 text-xs font-bold transition ${activeSection === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
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
                        void navigator.share({ title: material.title, text: "Confira este material no Pineapple Note." });
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
              <div><p className="font-bold">Conteúdo original</p><p className="text-xs text-muted-foreground">Acesso privado e temporário</p></div>
              <Button variant="outline" onClick={() => window.open(sourceUrl, "_blank", "noopener,noreferrer")}>Abrir arquivo</Button>
            </div>
            {material.source_type === "audio" && <audio className="w-full" controls src={sourceUrl} />}
            {material.source_type === "video" && <video className="max-h-[60dvh] w-full rounded-xl bg-black" controls src={sourceUrl} />}
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
                  O arquivo continua salvo. Você pode tentar o processamento novamente sem precisar enviá-lo de novo.
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-violet text-brand-violet-foreground"><BookOpen size={22} /></div>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold">Transforme este conteúdo em estudo</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A organização inteligente transforma o arquivo em resumo, tópicos, flashcards e quiz. Para áudio e vídeo, primeiro fazemos a transcrição.</p>
                <Button className="mt-5" onClick={() => void processMaterial()} disabled={processing || material.status === "processing"}>
                  {(processing || material.status === "processing") && <Loader2 className="animate-spin" size={17} />}
                  {material.status === "processing"
                    ? "Processamento em andamento..."
                    : processing
                      ? "Transcrevendo e organizando..."
                      : (material.source_type === "audio" || material.source_type === "video" ? "Transcrever e organizar com IA" : "Organizar com IA")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {material.status === "processing" && !output && (
          <section aria-live="polite" className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="shrink-0 animate-spin text-primary" size={20} />
              <div>
                <p className="font-bold">Organizando seu material...</p>
                <p className="mt-1 text-xs text-muted-foreground">Você pode permanecer nesta página. Se sair, o processamento continua e retomamos quando voltar.</p>
              </div>
            </div>
          </section>
        )}

        {output && (
          <>
            {output?.transcript && (
              <section id="transcricao" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold"><FileText size={18} /> Transcrição</div>
                    <p className="mt-1 text-xs text-muted-foreground">Texto extraído do áudio ou vídeo para você revisar e estudar.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { if (!navigator.clipboard) { toast.error("Seu navegador não permite copiar automaticamente."); return; } void navigator.clipboard.writeText(output.transcript); toast.success("Transcrição copiada."); }}><Copy size={15} />Copiar</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const blob = new Blob([output.transcript], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `${material.title.replace(/[^a-z0-9-_]+/gi, "-")}-transcricao.txt`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}><Download size={15} />TXT</Button>
                  </div>
                </div>
                <div className="mt-5 max-h-[55dvh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-secondary p-5 text-sm leading-7 text-muted-foreground">{output.transcript}</div>
              </section>
            )}

            <section id="resumo" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
              <div className="flex items-center gap-2 text-sm font-bold text-brand-violet"><BookOpen size={18} /> Resumo</div>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{output.summary}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {topics.map((topic, index) => <article key={index} className="rounded-xl bg-secondary p-4"><h3 className="font-bold">{topic.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{topic.explanation}</p></article>)}
              </div>
            </section>

            {flashcards.length > 0 && (
              <section id="flashcards" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold"><BookOpen size={18} /> Flashcards</div><span className="text-xs text-muted-foreground">{flashcardIndex + 1} / {flashcards.length}</span></div>
                <button type="button" onClick={() => setShowAnswer((value) => !value)} aria-label={showAnswer ? "Mostrar pergunta do flashcard" : "Mostrar resposta do flashcard"}
                  className="mt-5 min-h-48 w-full rounded-2xl border border-primary/20 bg-green-soft/50 p-6 text-left transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
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
              <section id="quiz" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
                <div className="flex items-center gap-2 font-bold"><HelpCircle size={18} /> Quiz</div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-3 text-sm">
                  <span className="font-semibold">{answeredQuizCount} de {quiz.length} respondidas</span>
                  {quizSubmitted && quizCompleted && <span className="font-extrabold text-green-strong">Resultado: {correctQuizCount}/{quiz.length}</span>}
                </div>
                <div className="mt-5 space-y-6">
                  {quiz.map((item, index) => {
                    const selected = quizAnswers[index];
                    const correct = selected === item["answer"];
                    return <article key={index} className="rounded-xl border border-border p-4">
                      <p className="font-bold">{index + 1}. {item["question"]}</p>
                      <div className="mt-3 grid gap-2">
                        {item.options.map((option) => <button type="button" key={option} onClick={() => { setQuizAnswers((current) => ({ ...current, [index]: option })); setQuizSubmitted(false); }} aria-pressed={selected === option}
                          className={`min-h-11 rounded-lg border px-3 py-3 text-left text-sm transition ${selected === option ? (quizSubmitted ? (correct ? "border-primary bg-green-soft" : "border-destructive bg-destructive/10") : "border-primary bg-primary/5") : "border-border hover:bg-secondary"}`}>{option}</button>)}
                      </div>
                      {selected && quizSubmitted && <div className="mt-3 rounded-lg bg-secondary p-3 text-sm"><strong>{correct ? "Correto!" : `Resposta: ${item["answer"]}`}</strong><p className="mt-1 text-muted-foreground">{item["explanation"]}</p></div>}
                    </article>;
                  })}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={resetQuiz} disabled={answeredQuizCount === 0}>Refazer quiz</Button>
                  <Button className="w-full sm:w-auto" variant="secondary" onClick={() => { setQuizSubmitted(true); if (quizCompleted) void saveProgress(100); }} disabled={!quizCompleted}>
                    <CheckCircle2 size={17} />
                    {quizCompleted ? (quizSubmitted ? "Resultado atualizado" : "Ver resultado") : "Responda todas as questões"}
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
            <p className="mt-1 text-sm text-muted-foreground">Marque o material como concluído para salvar seu progresso.</p>
            <Button className="mt-4" onClick={() => void saveProgress(100)} disabled={progress >= 100}>
              {progress >= 100 ? "Material concluído" : "Concluir material"}
            </Button>
          </section>
        )}
        <footer className="mt-10 border-t border-border py-8 text-center text-xs text-muted-foreground">Pineapple Note · Desenvolvido pela Decode Analytics</footer>
      </main>
    </div>
  );
}
