import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Gamepad2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

type Quiz = { question: string; options: string[]; answer: string };
type Flashcard = { question: string; answer: string };

function asQuiz(value: Json): Quiz[] {
  return Array.isArray(value)
    ? value
        .filter((x): x is Record<string, Json | undefined> => typeof x === "object" && x !== null)
        .map((x) => ({
          question: String(x.question ?? ""),
          options: Array.isArray(x.options) ? x.options.map(String) : [],
          answer: String(x.answer ?? ""),
        }))
    : [];
}
function asFlashcards(value: Json): Flashcard[] {
  return Array.isArray(value)
    ? value
        .filter((x): x is Record<string, Json | undefined> => typeof x === "object" && x !== null)
        .map((x) => ({ question: String(x.question ?? ""), answer: String(x.answer ?? "") }))
    : [];
}

export const Route = createFileRoute("/_authenticated/games/$materialId")({
  head: () => ({ meta: [{ title: "Jogos de estudo — Pineapple Note" }] }),
  component: GamesPage,
});

function GamesPage() {
  const { user } = Route.useRouteContext();
  const { materialId } = Route.useParams();
  const navigate = useNavigate();
  const [output, setOutput] = useState<Tables<"material_outputs"> | null>(null);
  const [mode, setMode] = useState<"match" | "run">("match");
  const [selected, setSelected] = useState<{ pair: number; side: "question" | "answer" } | null>(
    null,
  );
  const [matched, setMatched] = useState<number[]>([]);
  const [runIndex, setRunIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    void supabase
      .from("material_outputs")
      .select("*")
      .eq("material_id", materialId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setOutput(data));
  }, [materialId, user.id]);

  const cards = useMemo(
    () => (output ? asFlashcards(output.flashcards).slice(0, 6) : []),
    [output],
  );
  const quiz = useMemo(() => (output ? asQuiz(output.quiz).slice(0, 8) : []), [output]);

  function chooseCard(pair: number, side: "question" | "answer") {
    if (matched.includes(pair)) return;
    if (selected === null) {
      setSelected({ pair, side });
      return;
    }
    const correct = selected.pair === pair && selected.side !== side;
    if (correct) setMatched((items) => [...items, pair]);
    setSelected(null);
  }

  function answerRun(answer: string) {
    const item = quiz[runIndex];
    if (!item) return;
    if (answer === item.answer) setScore((s) => s + 1);
    setRunIndex((i) => Math.min(quiz.length, i + 1));
  }

  function reset() {
    setSelected(null);
    setMatched([]);
    setRunIndex(0);
    setScore(0);
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:h-[72px] sm:px-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/material/$materialId", params: { materialId } })}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-card"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-center text-lg font-black">Jogos de estudo</h1>
          <button
            type="button"
            onClick={reset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-card"
            aria-label="Reiniciar"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-soft text-yellow-strong shadow-card">
            <Gamepad2 size={30} />
          </div>
          <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Jogos para estudar
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Pratique o conteúdo de um jeito diferente usando os flashcards e quizzes do seu
            material.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setMode("match")}
            className={`rounded-xl py-3 text-sm font-black ${mode === "match" ? "bg-card shadow-card" : "text-muted-foreground"}`}
          >
            Card Match
          </button>
          <button
            type="button"
            onClick={() => setMode("run")}
            className={`rounded-xl py-3 text-sm font-black ${mode === "run" ? "bg-card shadow-card" : "text-muted-foreground"}`}
          >
            Study Run
          </button>
        </div>
        {mode === "match" && (
          <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-black">Card Match</h3>
                <p className="text-xs text-muted-foreground">Encontre pergunta e resposta.</p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {matched.length / 2} pares
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {cards
                .flatMap((card, pair) => [
                  { pair, side: "question" as const, text: card.question },
                  { pair, side: "answer" as const, text: card.answer },
                ])
                .map(({ pair, side, text }, index) => {
                  const isMatched = matched.includes(pair);
                  const isSelected = selected?.pair === pair && selected.side === side;
                  return (
                    <button
                      key={`${pair}-${side}`}
                      type="button"
                      onClick={() => chooseCard(pair, side)}
                      className={`min-h-36 rounded-2xl border p-4 text-left text-sm font-bold transition ${isMatched ? "border-primary/30 bg-green-soft text-green-strong" : isSelected ? "border-brand-violet bg-violet-soft" : "border-border bg-background hover:border-brand-violet/30"}`}
                    >
                      <span className="text-xs text-muted-foreground">Card {index + 1}</span>
                      <span className="mt-3 block line-clamp-5">{text}</span>
                    </button>
                  );
                })}
            </div>
            {!cards.length && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Gere os flashcards do material para jogar.
              </p>
            )}
          </section>
        )}
        {mode === "run" && (
          <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
            {runIndex < quiz.length ? (
              <>
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Questão {runIndex + 1}</span>
                  <span>{score} acertos</span>
                </div>
                <h3 className="mt-5 text-2xl font-black leading-tight">
                  {quiz[runIndex].question}
                </h3>
                <div className="mt-7 space-y-3">
                  {quiz[runIndex].options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answerRun(option)}
                      className="w-full rounded-2xl border border-border bg-background p-4 text-left font-bold transition hover:border-brand-violet/40 hover:bg-violet-soft"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-green-strong">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="mt-5 text-3xl font-black">Fim da rodada</h3>
                <p className="mt-2 text-muted-foreground">
                  Você acertou {score} de {quiz.length} questões.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 font-black text-brand-violet-foreground"
                >
                  Jogar novamente
                </button>
              </div>
            )}
            {!quiz.length && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <XCircle size={18} /> Gere o quiz do material para jogar.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
