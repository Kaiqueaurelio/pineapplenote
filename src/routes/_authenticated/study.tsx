import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brain, Flame, Layers, ListChecks, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { MaterialListSkeleton } from "@/components/study-skeletons";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ensureDemoMaterial } from "@/lib/demo-material";
import { computeStreak, streakMessage } from "@/lib/streak";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({
    meta: [
      { title: "Estudar — Pineapple Note" },
      { name: "description", content: "Revise flashcards, faça simulados e mantenha sua sequência de estudos." },
      { property: "og:title", content: "Estudar — Pineapple Note" },
      { property: "og:description", content: "Sua revisão do dia, sequência de estudos e metas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudyPage,
});

const DAILY_GOAL = 3;

function StudyPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Tables<"study_materials">[]>([]);
  const [progress, setProgress] = useState<Tables<"study_progress">[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [mats, prog] = await Promise.all([
        supabase
          .from("study_materials")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "ready")
          .order("updated_at", { ascending: false }),
        supabase.from("study_progress").select("*").eq("user_id", user.id),
      ]);
      if (!active) return;
      setMaterials(mats.data ?? []);
      setProgress(prog.data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user.id]);

  const streak = useMemo(() => computeStreak(progress.map((row) => row.last_opened_at)), [progress]);
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return progress.filter((row) => row.last_opened_at && new Date(row.last_opened_at).toDateString() === today).length;
  }, [progress]);
  const progressById = useMemo(
    () => Object.fromEntries(progress.map((row) => [row.material_id, row.progress])),
    [progress],
  );
  const goalPct = Math.min(100, Math.round((todayCount / DAILY_GOAL) * 100));
  const queue = [...materials].sort((a, b) => (progressById[a.id] ?? 0) - (progressById[b.id] ?? 0));

  async function openDemo() {
    setDemoLoading(true);
    try {
      const materialId = await ensureDemoMaterial(user.id);
      navigate({ to: "/material/$materialId", params: { materialId } });
    } catch {
      toast.error("Não foi possível carregar a aula exemplo.");
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-36 md:pb-10">
      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <p className="text-[15px] font-semibold text-muted-foreground">Revisão do dia</p>
        <h1 className="mt-1 text-[34px] font-bold tracking-[-1.2px]">Estudar</h1>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[28px] bg-[linear-gradient(150deg,var(--yellow-soft),var(--card))] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-brand-orange shadow-sm">
                <Flame size={24} className={streak > 0 ? "text-[#f97316]" : "text-muted-foreground"} />
              </span>
              <div>
                <p className="text-3xl font-black tabular-nums">{loading ? "–" : streak}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {streak === 1 ? "dia seguido" : "dias seguidos"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/80">{streakMessage(streak)}</p>
          </div>

          <div className="rounded-[28px] bg-[linear-gradient(150deg,var(--violet-soft),var(--card))] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-brand-violet">
                <Target size={18} /> Meta de hoje
              </span>
              <span className="text-sm font-black tabular-nums">
                {Math.min(todayCount, DAILY_GOAL)}/{DAILY_GOAL}
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-violet),var(--primary))] transition-all duration-700"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-foreground/80">
              {goalPct >= 100 ? "Meta batida! Descanse ou adiante a revisão de amanhã." : `Revise ${DAILY_GOAL} materiais hoje.`}
            </p>
          </div>
        </section>

        <h2 className="mt-9 text-lg font-bold">Fila de revisão</h2>
        <div className="mt-3">
          {loading ? (
            <MaterialListSkeleton count={2} />
          ) : queue.length === 0 ? (
            <div className="rounded-[28px] bg-card px-6 py-10 text-center shadow-sm">
              <span className="text-4xl">🍍</span>
              <h3 className="mt-3 text-lg font-bold">Nada para revisar ainda</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Teste tudo com uma aula pronta de Neurociência — resumo, flashcards e simulado incluídos.
              </p>
              <Button className="mt-5 rounded-full" onClick={() => void openDemo()} disabled={demoLoading}>
                <Sparkles size={16} /> {demoLoading ? "Preparando…" : "Abrir aula exemplo"}
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {queue.map((material) => {
                const pct = progressById[material.id] ?? 0;
                return (
                  <li key={material.id} className="rounded-[24px] bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                        <Brain size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{material.title}</p>
                        <p className="text-xs text-muted-foreground">{pct}% revisado</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => navigate({ to: "/material/$materialId", params: { materialId: material.id } })}
                      >
                        <Layers size={16} /> Flashcards
                      </Button>
                      <Button
                        className="rounded-full"
                        onClick={() => navigate({ to: "/games/$materialId", params: { materialId: material.id } })}
                      >
                        <ListChecks size={16} /> Praticar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <AppBottomNav />
    </div>
  );
}
