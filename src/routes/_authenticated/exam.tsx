import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";

type Question = { question: string; options: string[]; answer: string; explanation: string };
type Exam = { title: string; instructions: string; questions: Question[] };

export const Route = createFileRoute("/_authenticated/exam")({
  validateSearch: z.object({ materialId: z.string().min(1).catch("") }),
  head: () => ({ meta: [{ title: "Prova prática — Pineapple Note" }] }),
  component: ExamPage,
});

function ExamPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { materialId } = Route.useSearch();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!materialId) {
      toast.error("Material não informado.");
      navigate({ to: "/library" });
      return;
    }
    supabase.functions.invoke("ai-tools", { body: { action: "exam", materialId, count: 15 } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast.error(data?.error ?? "Não foi possível criar a prova.");
          return;
        }
        setExam(data as Exam);
      })
      .finally(() => setLoading(false));
  }, [materialId, navigate]);

  const score = exam ? exam.questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0) : 0;

  if (loading) {
    return (
      <>
        <div className="min-h-[100dvh] bg-background px-4 pb-28 pt-6">
          <div className="mx-auto max-w-3xl space-y-4" aria-label="Preparando prova">
            <div className="skeleton-shimmer h-8 w-2/3 rounded-lg" />
            <div className="skeleton-shimmer h-24 w-full rounded-3xl" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-3xl border border-border bg-card p-5">
                <div className="skeleton-shimmer h-5 w-4/5 rounded" />
                <div className="mt-5 space-y-2">
                  <div className="skeleton-shimmer h-12 w-full rounded-2xl" />
                  <div className="skeleton-shimmer h-12 w-full rounded-2xl" />
                  <div className="skeleton-shimmer h-12 w-full rounded-2xl" />
                </div>
              </div>
            ))}
            <p className="text-center text-sm font-semibold text-muted-foreground">Preparando sua revisão…</p>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }
  if (!exam) return <><div className="flex min-h-[100dvh] items-center justify-center p-6 pb-24 text-center"><p>Não foi possível criar esta prova.</p></div><MobileBottomNav /></>;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <button type="button" onClick={() => navigate({ to: "/material/$materialId", params: { materialId } })} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card" aria-label="Voltar"><ArrowLeft size={20} /></button>
          <h1 className="flex-1 text-center font-black">{exam.title}</h1>
          <div className="w-11" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-12 pt-6">
        <section className="rounded-3xl bg-violet-soft p-5">
          <p className="font-bold">{exam.instructions}</p>
          <p className="mt-2 text-sm text-muted-foreground">{exam.questions.length} questões · 4 alternativas por questão</p>
        </section>
        {exam.questions.map((question, index) => {
          const selected = answers[index];
          const correct = submitted && selected === question.answer;
          const wrong = submitted && selected && selected !== question.answer;
          return <section key={index} className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="font-black">{index + 1}. {question.question}</p>
            <div className="mt-4 space-y-2">
              {question.options.map((option) => <button key={option} type="button" onClick={() => !submitted && setAnswers((current) => ({ ...current, [index]: option }))} className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${selected === option ? "border-primary bg-green-soft" : "border-border hover:bg-secondary"} ${submitted && selected === option && correct ? "border-primary" : ""} ${submitted && selected === option && wrong ? "border-destructive bg-destructive/10" : ""}`}>{option}</button>)}
            </div>
            {submitted && <div className="mt-4 rounded-2xl bg-secondary p-4 text-sm leading-6"><strong>{correct ? "Correto." : `Resposta correta: ${question.answer}`}</strong><p className="mt-1 text-muted-foreground">{question.explanation}</p></div>}
          </section>;
        })}
        <div className="sticky bottom-3 flex flex-col gap-2 rounded-3xl border border-border bg-background/95 p-3 shadow-soft backdrop-blur-xl sm:flex-row">
          {submitted && <div className="flex flex-1 items-center gap-2 px-2 font-black"><CheckCircle2 className="text-green-strong" size={20} /> Resultado: {score}/{exam.questions.length}</div>}
          <button type="button" onClick={() => { setAnswers({}); setSubmitted(false); }} className="min-h-12 rounded-2xl border border-border px-5 font-bold"><RotateCcw size={17} className="mr-2 inline" />Refazer</button>
          <button type="button" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== exam.questions.length} className="min-h-12 rounded-2xl bg-foreground px-5 font-black text-background disabled:opacity-40">Ver resultado</button>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
