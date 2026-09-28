import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Pineapple Note" },
      {
        name: "description",
        content: "Acompanhe estudantes, instituições e materiais enviados ao Pineapple Note.",
      },
      { property: "og:title", content: "Painel administrativo — Pineapple Note" },
      { property: "og:description", content: "Gestão da plataforma de estudos Pineapple Note." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPanel,
});

type RoleRow = Pick<Tables<"user_roles">, "user_id" | "role">;

function AdminPanel() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole(user.id);

  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [materials, setMaterials] = useState<Tables<"study_materials">[]>([]);
  const [outputsCount, setOutputsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) navigate({ to: "/dashboard", replace: true });
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setLoadingData(true);
    Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("study_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("material_outputs").select("id", { count: "exact", head: true }),
    ]).then(([profileRes, roleRes, materialRes, outputRes]) => {
      if (!active) return;
      setProfiles(profileRes.data ?? []);
      setRoles((roleRes.data ?? []) as RoleRow[]);
      setMaterials(materialRes.data ?? []);
      setOutputsCount(outputRes.count ?? 0);
      setLoadingData(false);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const roleByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of roles) {
      if (row.role === "admin" || !map.has(row.user_id)) map.set(row.user_id, row.role);
    }
    return map;
  }, [roles]);

  const institutions = useMemo(
    () => new Set(profiles.map((item) => item.institution.trim()).filter(Boolean)).size,
    [profiles],
  );

  const materialsByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of materials) map.set(item.user_id, (map.get(item.user_id) ?? 0) + 1);
    return map;
  }, [materials]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((item) =>
      [item.display_name, item.institution, item.course].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [profiles, search]);

  const stats = [
    { label: "Estudantes cadastrados", value: profiles.length, icon: Users, tone: "green" },
    { label: "Instituições", value: institutions, icon: GraduationCap, tone: "violet" },
    { label: "Materiais enviados", value: materials.length, icon: FileText, tone: "green" },
    { label: "Materiais processados pela IA", value: outputsCount, icon: Sparkles, tone: "violet" },
  ] as const;

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" aria-label="Voltar para a central" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft size={20} />
          </Button>
          <img
            src={logoAsset.url}
            alt="Pineapple Note"
            className="h-10 w-auto max-w-[150px] object-contain object-left mix-blend-multiply sm:h-12 sm:max-w-[190px]"
          />
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-violet">
            <ShieldCheck size={13} /> Administrador
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8">
          <h1 className="text-[1.75rem] font-extrabold leading-tight sm:text-4xl">Painel administrativo</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Acompanhe quem estuda na plataforma e o que está sendo enviado. O acesso é liberado apenas para contas com
            permissão de administrador.
          </p>
        </section>

        <section className="mb-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                  item.tone === "green" ? "bg-green-soft text-green-strong" : "bg-violet-soft text-brand-violet"
                }`}
              >
                <item.icon size={19} />
              </div>
              <p className="text-3xl font-extrabold">{loadingData ? "—" : item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="mb-9 rounded-xl border border-border bg-card shadow-soft">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Estudantes</h2>
              <p className="text-sm text-muted-foreground">Perfis acadêmicos e permissões.</p>
            </div>
            <div className="flex items-center sm:w-72">
              <Search className="pointer-events-none relative left-9 z-10 text-muted-foreground" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar estudante"
                placeholder="Buscar por nome, curso ou instituição"
                className="h-11 w-full rounded-lg border border-border bg-secondary/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} /> Carregando estudantes...
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">Nenhum estudante encontrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((item) => {
                const role = roleByUser.get(item.user_id) ?? "student";
                return (
                  <li key={item.user_id} className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-violet text-sm font-bold text-brand-violet-foreground">
                      {(item.display_name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.display_name || "Sem nome definido"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[item.course, item.institution].filter(Boolean).join(" · ") || "Perfil ainda não preenchido"}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <BookOpen size={15} /> {materialsByUser.get(item.user_id) ?? 0}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        role === "admin"
                          ? "bg-brand-violet text-brand-violet-foreground"
                          : "bg-green-soft text-green-strong"
                      }`}
                    >
                      {role === "admin" ? "Administrador" : "Estudante"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card shadow-soft">
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-bold">Materiais recentes</h2>
            <p className="text-sm text-muted-foreground">Últimos conteúdos enviados na plataforma.</p>
          </div>
          {loadingData ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} /> Carregando materiais...
            </div>
          ) : materials.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">Nenhum material enviado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {materials.slice(0, 12).map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-soft text-green-strong">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")} · {item.source_type}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
