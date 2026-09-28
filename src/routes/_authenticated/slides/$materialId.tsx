import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, Presentation } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

const styles = [
  {
    id: "pineapple",
    name: "Pineapple Clean",
    description: "Clareza, blocos limpos e acentos da identidade Pineapple.",
    classes: "bg-green-soft",
  },
  {
    id: "violet",
    name: "Pineapple Focus",
    description: "Mais contraste e destaque para conceitos-chave.",
    classes: "bg-violet-soft",
  },
  {
    id: "paper",
    name: "Papel de estudo",
    description: "Visual editorial para matérias teóricas.",
    classes: "bg-yellow-soft",
  },
  {
    id: "dark",
    name: "Pineapple Night",
    description: "Fundo escuro para apresentações mais imersivas.",
    classes: "bg-foreground text-background",
  },
];

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
  }, [materialId, user.id]);

  function downloadOutline() {
    const summary = output?.summary ?? "Sem resumo disponível.";
    const safe = summary.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pineapple Note</title><style>body{font-family:Arial,sans-serif;margin:0;padding:48px;background:#fff}.slide{min-height:520px;padding:48px;margin-bottom:28px;border-radius:28px;border:1px solid #ddd;page-break-after:always}h1{font-size:42px}h2{font-size:28px}p{font-size:20px;line-height:1.6}</style></head><body><div class="slide"><h1>${material?.title ?? "Material"}</h1><p>Gerado pelo Pineapple Note · Decode Analytics</p></div><div class="slide"><h2>Resumo</h2><p>${safe}</p></div></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pineapple-note-slides.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Prévia dos slides exportada.");
  }

  if (!material)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
        Carregando slides...
      </div>
    );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/material/$materialId", params: { materialId } })}
            className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 shadow-card"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <h1 className="text-lg font-black">Criar slides</h1>
          <button
            type="button"
            onClick={downloadOutline}
            className="flex h-11 items-center gap-2 rounded-full bg-brand-violet px-5 font-black text-brand-violet-foreground"
          >
            <Download size={17} /> Gerar
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-7 sm:px-6 sm:pt-10">
        <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Escolha um estilo</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Transforme seu material em uma apresentação visual. Escolha uma direção antes de gerar a
          prévia.
        </p>
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {styles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStyle(item)}
              className={`rounded-3xl border p-3 text-left shadow-card transition hover:-translate-y-0.5 ${style.id === item.id ? "border-brand-violet ring-2 ring-brand-violet/25" : "border-border"}`}
            >
              <div
                className={`flex aspect-[3/2] items-center justify-center rounded-2xl p-6 ${item.classes}`}
              >
                <div className="w-full max-w-xs">
                  <p className="text-sm font-black opacity-70">PINEAPPLE NOTE</p>
                  <div className="mt-3 h-5 w-3/4 rounded bg-foreground/10" />
                  <div className="mt-2 h-3 w-full rounded bg-foreground/10" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-foreground/10" />
                </div>
              </div>
              <div className="flex items-start gap-3 p-3">
                <div
                  className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${style.id === item.id ? "border-brand-violet bg-brand-violet text-brand-violet-foreground" : "border-border"}`}
                >
                  {style.id === item.id && <Check size={14} />}
                </div>
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </section>
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-soft text-brand-violet">
              <Presentation size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                Prévia
              </p>
              <h3 className="font-black">{material.title}</h3>
            </div>
          </div>
          <div className="mt-6 rounded-3xl bg-secondary p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-violet">
              {style.name}
            </p>
            <h4 className="mt-3 text-3xl font-black">{material.title}</h4>
            <p className="mt-4 line-clamp-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {output?.summary ?? "O resumo aparecerá aqui quando o material estiver processado."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
