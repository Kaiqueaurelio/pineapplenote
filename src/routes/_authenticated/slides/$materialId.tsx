import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, Presentation } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

const styles = [
  { id: "pineapple", name: "Pineapple Clean", description: "Clareza e blocos limpos.", classes: "bg-green-soft" },
  { id: "violet", name: "Pineapple Focus", description: "Contraste para conceitos-chave.", classes: "bg-violet-soft" },
  { id: "paper", name: "Papel de estudo", description: "Visual editorial para teoria.", classes: "bg-yellow-soft" },
  { id: "dark", name: "Pineapple Night", description: "Apresentação com fundo escuro.", classes: "bg-foreground text-background" },
];

type Slide = { title: string; body: string; takeaway: string };

export const Route = createFileRoute("/_authenticated/slides/$materialId")({
  head: () => ({ meta: [{ title: "Criar slides — Pineapple Note" }] }),
  component: SlidesPage,
});

function SlidesPage() {
  const { user } = Route.useRouteContext();
  const { materialId } = Route.useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Tables<"study_materials"> | null>(null);
  const [output, setOutput] = useState<Tables<"material_outputs"> | null>(null);
  const [style, setStyle] = useState(styles[0]);
  const [instructions, setInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    void (async () => {
      const [{ data: materialData }, { data: outputData }] = await Promise.all([
        supabase.from("study_materials").select("*").eq("id", materialId).eq("user_id", user.id).maybeSingle(),
        supabase.from("material_outputs").select("*").eq("material_id", materialId).eq("user_id", user.id).maybeSingle(),
      ]);
      setMaterial(materialData);
      setOutput(outputData);
    })();
  }, [materialId, user.id]);

  async function generate() {
    if (!material || generating) return;
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("ai-tools", {
      body: { action: "slides", materialId, style: style.name, instructions },
    });
    setGenerating(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível gerar os slides.");
      return;
    }
    setSlides(Array.isArray(data.slides) ? data.slides : []);
    toast.success("Slides gerados.");
  }

  function downloadOutline() {
    if (!material) return;
    const source = slides.length ? slides : [{ title: material.title, body: output?.summary ?? "", takeaway: "Revisar os conceitos principais." }];
    const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(material.title)}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:32px;background:#f7f7f7}.slide{min-height:480px;padding:48px;margin-bottom:24px;border-radius:28px;background:white;border:1px solid #ddd;page-break-after:always}h1{font-size:42px}h2{font-size:30px}p{font-size:20px;line-height:1.6}.takeaway{padding:16px;border-radius:16px;background:#eef8f0;font-weight:bold}</style></head><body>${source.map((slide, index) => `<section class="slide"><p>Slide ${index + 1} · Pineapple Note</p><h2>${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.body)}</p><p class="takeaway">${escapeHtml(slide.takeaway)}</p></section>`).join("")}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "pineapple-note-slides.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Apresentação exportada.");
  }

  if (!material) return <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">Carregando slides...</div>;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <button type="button" onClick={() => navigate({ to: "/material/$materialId", params: { materialId } })} className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 shadow-card"><ArrowLeft size={18} /> Voltar</button>
          <h1 className="text-lg font-black">Criar slides</h1>
          <button type="button" onClick={downloadOutline} disabled={generating} className="flex h-11 items-center gap-2 rounded-full bg-brand-violet px-5 font-black text-brand-violet-foreground"><Download size={17} /> Exportar</button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-7 sm:px-6 sm:pt-10">
        <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Escolha um estilo</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">O Pineapple monta a estrutura da apresentação a partir do seu material.</p>
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {styles.map((item) => (
            <button key={item.id} type="button" onClick={() => setStyle(item)} className={`rounded-3xl border p-3 text-left shadow-card transition ${style.id === item.id ? "border-brand-violet ring-2 ring-brand-violet/25" : "border-border"}`}>
              <div className={`flex aspect-[3/2] items-center justify-center rounded-2xl p-6 ${item.classes}`}><div className="w-full max-w-xs"><p className="text-sm font-black opacity-70">PINEAPPLE NOTE</p><div className="mt-3 h-5 w-3/4 rounded bg-foreground/10" /><div className="mt-2 h-3 w-full rounded bg-foreground/10" /><div className="mt-2 h-3 w-5/6 rounded bg-foreground/10" /></div></div>
              <div className="flex items-start gap-3 p-3"><span className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${style.id === item.id ? "border-brand-violet bg-brand-violet text-brand-violet-foreground" : "border-border"}`}>{style.id === item.id && <Check size={14} />}</span><span><strong>{item.name}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span></span></div>
            </button>
          ))}
        </section>
        <label className="mt-8 block text-sm font-black" htmlFor="slide-instructions">Instruções personalizadas</label>
        <textarea id="slide-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Ex.: use exemplos práticos, destaque fórmulas e deixe o último slide para revisão." className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary" />
        <button type="button" onClick={() => void generate()} disabled={generating} className="mt-4 min-h-12 w-full rounded-2xl bg-brand-violet px-5 font-black text-brand-violet-foreground">{generating ? "Gerando apresentação…" : "Gerar apresentação"}</button>

        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-soft text-brand-violet"><Presentation size={20} /></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Prévia</p><h3 className="font-black">{material.title}</h3></div></div>
          <div className="mt-6 space-y-4 rounded-3xl bg-secondary p-5 sm:p-8">
            {(slides.length ? slides : [{ title: material.title, body: output?.summary ?? "Gere a apresentação para criar os slides.", takeaway: "Resumo do material." }]).map((slide, index) => (
              <article key={index} className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-black uppercase text-brand-violet">Slide {index + 1}</p><h4 className="mt-2 text-xl font-black">{slide.title}</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{slide.body}</p><p className="mt-3 rounded-xl bg-secondary p-3 text-xs font-bold">{slide.takeaway}</p></article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
