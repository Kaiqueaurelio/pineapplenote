import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/editor/$materialId")({
  head: () => ({ meta: [{ title: "Editar nota — Pineapple Note" }] }),
  component: EditorPage,
});

function EditorPage() {
  const { user } = Route.useRouteContext();
  const { materialId } = Route.useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("study_materials").select("title").eq("id", materialId).eq("user_id", user.id).maybeSingle(),
      supabase.from("material_outputs").select("summary,transcript").eq("material_id", materialId).eq("user_id", user.id).maybeSingle(),
    ]).then(([materialResult, outputResult]) => {
      setTitle(materialResult.data?.title ?? "");
      setSummary(outputResult.data?.summary ?? "");
      setTranscript(outputResult.data?.transcript ?? "");
    });
  }, [materialId, user.id]);

  async function save() {
    setSaving(true);
    const [materialResult, outputResult] = await Promise.all([
      supabase.from("study_materials").update({ title: title.trim() || "Nota sem título" }).eq("id", materialId).eq("user_id", user.id),
      supabase.from("material_outputs").update({ summary, transcript }).eq("material_id", materialId).eq("user_id", user.id),
    ]);
    setSaving(false);
    if (materialResult.error || outputResult.error) {
      toast.error("Não foi possível salvar todas as alterações.");
      return;
    }
    toast.success("Nota atualizada.");
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/material/$materialId", params: { materialId } })} aria-label="Voltar"><ArrowLeft size={21} /></Button>
          <h1 className="flex-1 text-lg font-black">Editar nota</h1>
          <Button onClick={() => void save()} disabled={saving}><Save size={17} />{saving ? "Salvando…" : "Salvar"}</Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <label className="text-sm font-bold">Título</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 font-bold outline-none focus:border-primary" />
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <label className="text-sm font-bold">Resumo</label>
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-2 min-h-56 rounded-2xl" />
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <label className="text-sm font-bold">Transcrição</label>
          <Textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} className="mt-2 min-h-[420px] rounded-2xl" />
        </section>
      </main>
    </div>
  );
}
