import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Headphones,
  Home,
  Library,
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [progressByMaterial, setProgressByMaterial] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"todos" | "audio" | "video" | "documento" | "pendentes">(
    "todos",
  );
  const [deleteTarget, setDeleteTarget] = useState<Tables<"study_materials"> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sort, setSort] = useState<"recent" | "name">("recent");

  const loadMaterials = useCallback(async () => {
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
    if (data?.length) {
      const { data: progressRows } = await supabase
        .from("study_progress")
        .select("material_id, progress")
        .eq("user_id", user.id)
        .in(
          "material_id",
          data.map((item) => item.id),
        );

      setProgressByMaterial(
        Object.fromEntries((progressRows ?? []).map((row) => [row.material_id, row.progress])),
      );
    } else {
      setProgressByMaterial({});
    }
  }, [user.id]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return materials.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(query);
      const matchesFilter =
        filter === "todos" ||
        (filter === "audio" && item.source_type === "audio") ||
        (filter === "video" && item.source_type === "video") ||
        (filter === "documento" && item.source_type === "document") ||
        (filter === "pendentes" &&
          (item.status === "processing" || item.status === "failed" || item.status === "uploaded"));

      return matchesSearch && matchesFilter;
    });
  }, [materials, search, filter]);

  const sortedMaterials = useMemo(() => {
    const result = [...filtered];
    if (sort === "name") result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    return result;
  }, [filtered, sort]);

  function openMaterial(material: Tables<"study_materials">) {
    setOpeningId(material.id);
    navigate({ to: "/material/$materialId", params: { materialId: material.id } });
  }

  async function deleteMaterial(material: Tables<"study_materials">) {
    if (deleting) return;
    setDeleting(true);

    const { error: rowError } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", material.id)
      .eq("user_id", user.id);

    if (rowError) {
      setDeleting(false);
      toast.error("Não foi possível remover o material.");
      return;
    }

    let storageError: { message: string } | null = null;
    if (material.source_type !== "url") {
      const result = await supabase.storage.from("study-materials").remove([material.storage_path]);
      storageError = result.error;
    }

    setMaterials((current) => current.filter((item) => item.id !== material.id));
    setDeleteTarget(null);
    setDeleting(false);
    if (storageError) {
      toast.warning("Material removido da biblioteca. O arquivo temporário não pôde ser limpo.");
      return;
    }
    toast.success("Material removido.");
  }

  function requestDelete(material: Tables<"study_materials">) {
    if (!deleting) setDeleteTarget(material);
  }

  const iconFor = (type: Tables<"study_materials">["source_type"]) => {
    if (type === "audio") return Headphones;
    if (type === "video") return Video;
    return FileText;
  };

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f7] pb-32 text-black sm:pb-8">
      <header className="sticky top-0 z-20 border-b border-[#d8d8dd] bg-[#f2f2f7]/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-[74px] max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Pineapple Note</p>
            <p className="text-xs text-muted-foreground">Sua central de estudos</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto rounded-full border border-[#d8d8dd] bg-white/80"
            onClick={() => navigate({ to: "/settings" })}
            aria-label="Abrir configurações"
          >
            <Settings size={20} />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-[#8e8e93]">Sua biblioteca</p>
            <h1 className="mt-1 text-[34px] font-bold tracking-[-1.2px] sm:text-5xl">Minhas notas</h1>
          </div>
          <span className="hidden rounded-full bg-violet-soft px-3 py-1.5 text-xs font-bold text-brand-violet sm:block">
            {materials.length} {materials.length === 1 ? "nota" : "notas"}
          </span>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
            size={18}
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar materiais"
            aria-label="Buscar materiais"
            className="h-12 rounded-2xl border-0 bg-white pl-10 pr-10 text-[17px] shadow-none"
          />
          {search && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setSearch("")}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!loading && materials.length > 0 && (
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-5 flex w-full items-center gap-4 rounded-3xl bg-gradient-to-br from-violet-soft via-card to-yellow-soft p-5 text-left shadow-card transition hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-2xl shadow-card">
              🍍
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black text-brand-violet">Pronto para uma nova aula?</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Transforme áudio, vídeo, PDF ou link em material de estudo.
              </span>
            </span>
            <Plus className="shrink-0 text-brand-violet" size={22} />
          </button>
        )}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar biblioteca">
          {[
            ["todos", "Todos"],
            ["audio", "Áudios"],
            ["video", "Vídeos"],
            ["documento", "Documentos"],
            ["pendentes", "Pendentes"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as typeof filter)}
              className={`min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-bold transition ${
                filter === value
                  ? "border-black bg-black text-white"
                  : "border-[#d8d8dd] bg-white text-[#636366] hover:bg-[#e5e5ea]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {sortedMaterials.length}{" "}
              {sortedMaterials.length === 1 ? "material encontrado" : "materiais encontrados"}
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="sr-only">Ordenar biblioteca</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/50"
              >
                <option value="recent">Mais recentes</option>
                <option value="name">Nome A–Z</option>
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Carregando biblioteca">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-16 text-center">
            <FileText className="mx-auto text-muted-foreground" size={28} />
            <h2 className="mt-4 font-bold">
              {materials.length ? "Nenhum material encontrado" : "Sua biblioteca está vazia"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {materials.length
                ? "Tente buscar por outro nome."
                : "Salve um áudio, vídeo ou documento na página inicial para encontrá-lo aqui."}
            </p>
            {!materials.length && (
              <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
                Criar material
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {sortedMaterials.map((material) => {
              const Icon = iconFor(material.source_type);
              return (
                <article
                  key={material.id}
                  className="group rounded-[28px] border-0 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f2f2f7] text-black">
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[17px] font-extrabold">{material.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {material.source_type === "audio"
                          ? "Áudio"
                          : material.source_type === "video"
                            ? "Vídeo"
                            : "Documento"}{" "}
                        ·{" "}
                        {material.status === "ready"
                          ? "Pronto para estudar"
                          : material.status === "processing"
                            ? "Organizando conteúdo..."
                            : material.status === "failed"
                              ? "Não foi possível organizar"
                              : "Pronto para organizar"}
                      </p>
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Progresso</span>
                          <span>{progressByMaterial[material.id] ?? 0}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, progressByMaterial[material.id] ?? 0))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="w-full rounded-full bg-black text-white hover:bg-black/90 sm:w-auto"
                      onClick={() => void openMaterial(material)}
                      disabled={openingId === material.id}
                    >
                      {openingId === material.id && <Loader2 className="animate-spin" size={16} />}
                      Abrir
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full rounded-full text-[#ff453a] hover:text-[#ff453a] sm:w-auto"
                      onClick={() => requestDelete(material)}
                    >
                      <Trash2 size={16} />
                      Remover
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        >
          <DialogContent className="w-[calc(100%-1rem)] rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover material?</DialogTitle>
              <DialogDescription>
                {deleteTarget
                  ? `“${deleteTarget.title}” será removido da sua biblioteca. Esta ação não pode ser desfeita.`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => deleteTarget && void deleteMaterial(deleteTarget)}
                disabled={deleting}
              >
                {deleting && <Loader2 className="animate-spin" size={16} />}
                {deleting ? "Removendo..." : "Remover material"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          Pineapple Note · Desenvolvido pela Decode Analytics
        </footer>
      </main>

      <div className="fixed inset-x-4 bottom-[max(5.15rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-20 sm:hidden">
        <Button
          className="h-14 w-full rounded-[1.35rem] bg-[linear-gradient(135deg,var(--brand-violet),var(--primary))] text-base font-black shadow-soft"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          <Plus size={21} /> Nova nota
        </Button>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-[4.4rem] items-center justify-around border-t border-border bg-card/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        aria-label="Navegação móvel"
      >
        <button type="button" className="flex min-w-16 flex-col items-center gap-1 text-xs font-semibold text-muted-foreground" onClick={() => navigate({ to: "/dashboard" })}>
          <Home size={20} /> Início
        </button>
        <button type="button" className="flex min-w-16 flex-col items-center gap-1 text-xs font-bold text-brand-violet" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Library size={20} /> Notas
        </button>
        <button type="button" className="flex min-w-16 flex-col items-center gap-1 text-xs font-semibold text-muted-foreground" onClick={() => navigate({ to: "/settings" })}>
          <Settings size={20} /> Perfil
        </button>
      </nav>
    </div>
  );
}
