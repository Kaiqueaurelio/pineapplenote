import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Headphones, Loader2, Search, Trash2, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Pineapple Note" },
      { name: "description", content: "Seus materiais salvos no Pineapple Note." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Tables<"study_materials">[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function loadMaterials() {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) {
      toast.error("Não foi possível carregar sua biblioteca.");
      return;
    }
    setMaterials(data ?? []);
  }

  useEffect(() => {
    void loadMaterials();
  }, [user.id]);

  const filtered = useMemo(
    () => materials.filter((item) => item.title.toLowerCase().includes(search.trim().toLowerCase())),
    [materials, search],
  );

  async function openMaterial(material: Tables<"study_materials">) {
    setOpeningId(material.id);
    navigate({ to: "/material/$materialId", params: { materialId: material.id } });
  }

  async function deleteMaterial(material: Tables<"study_materials">) {
    const { error: storageError } = await supabase.storage
      .from("study-materials")
      .remove([material.storage_path]);

    if (storageError) {
      toast.error("Não foi possível remover o arquivo.");
      return;
    }

    const { error: rowError } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", material.id)
      .eq("user_id", user.id);

    if (rowError) {
      toast.error("O arquivo foi removido, mas o registro não pôde ser atualizado.");
      return;
    }

    setMaterials((current) => current.filter((item) => item.id !== material.id));
    toast.success("Material removido.");
  }

  const iconFor = (type: Tables<"study_materials">["source_type"]) => {
    if (type === "audio") return Headphones;
    if (type === "video") return Video;
    return FileText;
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:h-[72px] sm:px-6">
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold sm:text-xl">Biblioteca</h1>
            <p className="text-xs text-muted-foreground">Seus materiais salvos</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={18} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar materiais"
            aria-label="Buscar materiais"
            className="h-11 pl-10"
          />
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-16 text-center">
            <FileText className="mx-auto text-muted-foreground" size={28} />
            <h2 className="mt-4 font-bold">{materials.length ? "Nenhum material encontrado" : "Sua biblioteca está vazia"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {materials.length ? "Tente buscar por outro nome." : "Salve um áudio, vídeo ou documento na página inicial para encontrá-lo aqui."}
            </p>
            {!materials.length && (
              <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
                Criar material
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {filtered.map((material) => {
              const Icon = iconFor(material.source_type);
              return (
                <article key={material.id} className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-soft text-green-strong">
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-bold">{material.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
{material.source_type === "audio" ? "Áudio" : material.source_type === "video" ? "Vídeo" : "Documento"} · {material.status === "ready" ? "Pronto para estudar" : material.status === "processing" ? "Organizando conteúdo..." : material.status === "failed" ? "Não foi possível organizar" : "Pronto para organizar"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button className="w-full sm:w-auto" onClick={() => void openMaterial(material)} disabled={openingId === material.id}>
                      {openingId === material.id && <Loader2 className="animate-spin" size={16} />}
                      Abrir
                    </Button>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive sm:w-auto" onClick={() => void deleteMaterial(material)}>
                      <Trash2 size={16} />
                      Remover
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">Pineapple Note · Desenvolvido pela Decode Analytics</footer>
      </main>
    </div>
  );
}
