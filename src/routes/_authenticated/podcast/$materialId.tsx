import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pause, Play, RotateCcw, Users, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

const voices = [
  { id: "astra", name: "Astra", tone: "Clara e objetiva", pitch: 1.05 },
  { id: "kira", name: "Kira", tone: "Calma e acolhedora", pitch: 0.95 },
  { id: "pip", name: "Pip", tone: "Leve e didática", pitch: 1.15 },
  { id: "bella", name: "Bella", tone: "Natural e expressiva", pitch: 1 },
];

export const Route = createFileRoute("/_authenticated/podcast/$materialId")({
  head: () => ({ meta: [{ title: "Podcast — Pineapple Note" }] }),
  component: PodcastPage,
});

function PodcastPage() {
  const { user } = Route.useRouteContext();
  const { materialId } = Route.useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Tables<"study_materials"> | null>(null);
  const [output, setOutput] = useState<Tables<"material_outputs"> | null>(null);
  const [voice, setVoice] = useState(voices[0]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [twoVoices, setTwoVoices] = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data: materialData }, { data: outputData }] = await Promise.all([
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
      ]);
      setMaterial(materialData);
      setOutput(outputData);
    })();
    return () => window.speechSynthesis.cancel();
  }, [materialId, user.id]);

  const baseScript = useMemo(() => {
    if (!output) return "";
    const summary = output.summary?.trim() ?? "";
    return summary ? `Olá! Vamos revisar ${material?.title ?? "este material"}. ${summary}` : "";
  }, [material?.title, output]);

  const script = generatedScript || baseScript;

  async function generatePodcast() {
    if (generating || !output) return;
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("ai-tools", {
      body: { action: "podcast", materialId, style: twoVoices ? "duas vozes, conversa natural e didática" : voice.tone },
    });
    setGenerating(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível gerar o podcast.");
      return;
    }
    setGeneratedScript(String(data.script ?? ""));
    toast.success("Roteiro do podcast gerado.");
  }

  function speak() {
    if (!("speechSynthesis" in window) || !script) {
      toast.error("A reprodução de voz não está disponível neste navegador.");
      return;
    }
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setSpeaking(true);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = voice.pitch;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
      toast.error("Não foi possível reproduzir o podcast.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }

  if (!material)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
        Carregando podcast...
      </div>
    );

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
          <h1 className="flex-1 text-center text-lg font-black">Podcast</h1>
          <div className="w-11" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <p className="text-lg font-black text-brand-violet sm:text-xl">Criar um novo podcast</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">
          Escolha sua voz ou estilo
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Transforme o resumo do seu material em uma revisão falada, mantendo a identidade do
          Pineapple Note.
        </p>

        <section className="mt-10">
          <h3 className="text-2xl font-black">Podcast</h3>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {voices.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVoice(item)}
                className={`overflow-hidden rounded-3xl border bg-card text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${voice.id === item.id ? "border-brand-violet ring-2 ring-brand-violet/25" : "border-border"}`}
              >
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-green-soft via-violet-soft to-yellow-soft">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/70 bg-card/80 text-brand-violet shadow-soft backdrop-blur sm:h-32 sm:w-32">
                    <Volume2 size={38} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.tone}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
                    <Play size={15} fill="currentColor" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-soft text-brand-violet">
              <Users size={21} />
            </div>
            <div>
              <p className="font-black">Duas vozes {twoVoices ? "· ativado" : ""}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Modo de conversa para transformar a revisão em um diálogo entre dois apresentadores.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setTwoVoices((value) => !value); void generatePodcast(); }}
            className="mt-5 w-full rounded-2xl border border-border bg-secondary p-5 text-left transition hover:border-brand-violet/30"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-violet text-brand-violet-foreground">
                <Volume2 size={23} />
              </div>
              <div>
                <p className="font-extrabold">Conversa de estudo</p>
                <p className="text-xs text-muted-foreground">
                  Duas perspectivas sobre o mesmo conteúdo
                </p>
              </div>
            </div>
          </button>
        </section>

        <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            Prévia
          </p>
          <h3 className="mt-2 text-xl font-black">{material.title}</h3>
          <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {script || "Processe o material para gerar o roteiro do podcast."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void generatePodcast()}
              disabled={generating}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-brand-violet/30 bg-violet-soft px-5 font-extrabold text-brand-violet"
            >
              <Users size={18} /> {generating ? "Gerando roteiro…" : "Gerar roteiro"}
            </button>
            <button
              type="button"
              onClick={
                speaking
                  ? () => {
                      window.speechSynthesis.pause();
                      setPaused(true);
                      setSpeaking(false);
                    }
                  : speak
              }
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand-violet px-5 font-extrabold text-brand-violet-foreground"
            >
              {speaking ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              {speaking ? "Pausar" : "Reproduzir podcast"}
            </button>
            <button
              type="button"
              onClick={stop}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-border px-5 font-bold"
            >
              <RotateCcw size={17} /> Parar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
