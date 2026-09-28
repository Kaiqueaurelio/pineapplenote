import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Globe2,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { normalizeDomain } from "@/lib/institutional-email";

type AdminTab = "overview" | "users" | "materials" | "access";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (profile?.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Administração — Pineapple Note" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [materials, setMaterials] = useState<Tables<"study_materials">[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [adminName, setAdminName] = useState("Administrador");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: auth }, profileResult, materialResult, domainResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("study_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("signup_email_domains").select("domain").order("domain"),
    ]);
    setLoading(false);
    if (auth.user?.user_metadata.full_name) setAdminName(String(auth.user.user_metadata.full_name));
    if (profileResult.error || materialResult.error || domainResult.error) {
      toast.error("Não foi possível carregar todos os dados administrativos.");
      return;
    }
    setProfiles(profileResult.data ?? []);
    setMaterials(materialResult.data ?? []);
    setDomains((domainResult.data ?? []).map((item) => item.domain));
    setLastUpdated(new Date());
  }

  useEffect(() => {
    void load();
  }, []);

  async function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = normalizeDomain(String(new FormData(event.currentTarget).get("domain") ?? ""));
    const parsed = z.string().min(3).max(120).regex(/^[a-z0-9.-]+$/, "Use apenas o domínio, como usp.br.").safeParse(value);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Informe um domínio válido.");
    setSaving(true);
    const { error } = await supabase.from("signup_email_domains").insert({ domain: parsed.data });
    setSaving(false);
    if (error) return toast.error("Não foi possível adicionar esse domínio. Ele pode já estar cadastrado.");
    event.currentTarget.reset();
    toast.success("Domínio institucional autorizado.");
    await load();
  }

  async function removeDomain(domain: string) {
    const { error } = await supabase.from("signup_email_domains").delete().eq("domain", domain);
    if (error) return toast.error("Não foi possível remover esse domínio.");
    toast.success("Domínio removido.");
    await load();
  }

  async function toggleRole(profile: Tables<"profiles">) {
    const nextRole = profile.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Alterar ${profile.display_name || "este perfil"} para ${nextRole === "admin" ? "Administrador" : "Estudante"}?`)) return;
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("user_id", profile.user_id);
    if (error) return toast.error("A permissão não pôde ser alterada. Verifique a política de acesso do Supabase.");
    toast.success(`Permissão alterada para ${nextRole === "admin" ? "Administrador" : "Estudante"}.`);
    await load();
  }

  const students = profiles.filter((profile) => profile.role === "user").length;
  const admins = profiles.filter((profile) => profile.role === "admin").length;
  const readyMaterials = materials.filter((material) => material.status === "ready").length;
  const processingMaterials = materials.filter((material) => ["uploaded", "processing"].includes(material.status)).length;
  const failedMaterials = materials.filter((material) => material.status === "failed").length;
  const sourceCounts = materials.reduce<Record<string, number>>((acc, material) => {
    acc[material.source_type] = (acc[material.source_type] ?? 0) + 1;
    return acc;
  }, {});

  const filteredUsers = useMemo(
    () =>
      profiles.filter((profile) => {
        const matchesRole = roleFilter === "all" || profile.role === roleFilter;
        const query = userSearch.trim().toLowerCase();
        const matchesQuery =
          !query ||
          profile.display_name.toLowerCase().includes(query) ||
          profile.institution.toLowerCase().includes(query) ||
          profile.course.toLowerCase().includes(query);
        return matchesRole && matchesQuery;
      }),
    [profiles, roleFilter, userSearch],
  );

  const filteredMaterials = useMemo(
    () =>
      materials.filter((material) => {
        const matchesStatus = statusFilter === "all" || material.status === statusFilter;
        const query = materialSearch.trim().toLowerCase();
        return matchesStatus && (!query || material.title.toLowerCase().includes(query) || material.source_type.toLowerCase().includes(query));
      }),
    [materials, materialSearch, statusFilter],
  );

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "materials", label: "Materiais", icon: BookOpen },
    { id: "access", label: "Acesso", icon: Globe2 },
  ];

  return (
    <main className="min-h-[100dvh] bg-secondary/35 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1480px] items-center gap-3 px-4 sm:min-h-[72px] sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })} aria-label="Voltar ao dashboard">
            <ArrowUpRight className="rotate-[225deg]" size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-violet">Decode Analytics · Pineapple Note</p>
            <h1 className="truncate text-lg font-black sm:text-xl">Central de Administração</h1>
          </div>
          <span className="hidden rounded-full bg-violet-soft px-3 py-1.5 text-xs font-black text-brand-violet sm:inline-flex">
            <ShieldCheck className="mr-1.5" size={14} /> Admin
          </span>
          <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar dados">
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px] flex-col lg:flex-row">
        <aside className="border-b border-border bg-background lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1 lg:p-5" aria-label="Administração">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-bold transition lg:w-full ${tab === id ? "bg-violet-soft text-brand-violet" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon size={19} /> {label}
              </button>
            ))}
          </nav>
          <div className="hidden border-t border-border p-5 lg:block">
            <p className="text-xs font-bold text-muted-foreground">Última atualização</p>
            <p className="mt-1 text-sm font-black">{lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
            <Link to="/dashboard" className="mt-4 flex items-center gap-2 text-sm font-bold text-brand-violet">Área do estudante <ArrowUpRight size={15} /></Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-green-strong">Governança da plataforma</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Olá, {adminName.split(" ")[0]}.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Aqui você acompanha usuários, materiais, processamento, acesso institucional e os principais indicadores do Pineapple Note.</p>
            </div>
            <Button onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /> Atualizar tudo</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Usuários", value: profiles.length, icon: Users, tone: "bg-green-soft text-green-strong" },
              { label: "Administradores", value: admins, icon: ShieldCheck, tone: "bg-violet-soft text-brand-violet" },
              { label: "Materiais", value: materials.length, icon: BookOpen, tone: "bg-yellow-soft text-yellow-strong" },
              { label: "Com problema", value: failedMaterials, icon: XCircle, tone: failedMaterials ? "bg-destructive/10 text-destructive" : "bg-green-soft text-green-strong" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={21} /></div>
                <p className="mt-5 text-3xl font-black">{loading ? "—" : value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
              </article>
            ))}
          </div>

          {tab === "overview" && (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
              <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Saúde</p><h3 className="mt-1 text-xl font-black">Status do processamento</h3></div>
                  <Activity className="text-muted-foreground" size={20} />
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Prontos", value: readyMaterials, icon: CheckCircle2, tone: "text-green-strong bg-green-soft" },
                    { label: "Processando", value: processingMaterials, icon: Clock3, tone: "text-yellow-strong bg-yellow-soft" },
                    { label: "Falhos", value: failedMaterials, icon: XCircle, tone: "text-destructive bg-destructive/10" },
                  ].map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="rounded-2xl border border-border p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></div>
                      <p className="mt-4 text-2xl font-black">{value}</p><p className="text-xs font-bold text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs font-bold"><span>Taxa de materiais prontos</span><span>{materials.length ? Math.round((readyMaterials / materials.length) * 100) : 0}%</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${materials.length ? (readyMaterials / materials.length) * 100 : 0}%` }} /></div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3"><Database className="text-brand-violet" size={20} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Fontes</p><h3 className="font-black">Origem dos materiais</h3></div></div>
                <div className="mt-5 space-y-3">
                  {Object.entries(sourceCounts).sort((a,b) => b[1]-a[1]).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"><span className="font-bold capitalize">{source}</span><span className="rounded-full bg-card px-2.5 py-1 text-xs font-black">{count}</span></div>
                  ))}
                  {!Object.keys(sourceCounts).length && <p className="text-sm text-muted-foreground">Nenhum material registrado.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5 shadow-card xl:col-span-2 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Atividade recente</p><h3 className="mt-1 text-xl font-black">Últimos materiais criados</h3></div><Button variant="outline" onClick={() => setTab("materials")}>Ver todos</Button></div>
                <div className="mt-5 divide-y divide-border">
                  {materials.slice(0, 8).map((material) => (
                    <button key={material.id} type="button" onClick={() => navigate({ to: "/material/$materialId", params: { materialId: material.id } })} className="flex w-full items-center gap-3 py-3 text-left hover:bg-secondary/40">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><FileText size={18} /></span>
                      <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{material.title}</strong><span className="text-xs text-muted-foreground">{new Date(material.created_at).toLocaleString("pt-BR")} · {material.source_type}</span></span>
                      <span className="text-xs font-black capitalize text-muted-foreground">{material.status}</span>
                    </button>
                  ))}
                  {!materials.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum material.</p>}
                </div>
              </section>
            </div>
          )}

          {tab === "users" && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Gestão de acesso</p><h3 className="mt-1 text-xl font-black">Usuários e permissões</h3></div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar pessoa, instituição..." className="pl-9 sm:w-72" /></div>
                    <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Todos</option><option value="user">Estudantes</option><option value="admin">Administradores</option></select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-secondary text-muted-foreground"><tr><th className="p-4">Perfil</th><th className="p-4">Instituição</th><th className="p-4">Curso</th><th className="p-4">Criado</th><th className="p-4">Permissão</th><th className="p-4">Ação</th></tr></thead>
                  <tbody>{filteredUsers.map((profile) => (
                    <tr key={profile.user_id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${profile.role === "admin" ? "bg-violet-soft text-brand-violet" : "bg-green-soft text-green-strong"}`}>{(profile.display_name || "PN").slice(0,2).toUpperCase()}</span><span className="font-bold">{profile.display_name || "Perfil sem nome"}</span></div></td>
                      <td className="p-4 text-muted-foreground">{profile.institution || "—"}</td><td className="p-4 text-muted-foreground">{profile.course || "—"}</td><td className="p-4 text-muted-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${profile.role === "admin" ? "bg-violet-soft text-brand-violet" : "bg-green-soft text-green-strong"}`}>{profile.role === "admin" ? "Administrador" : "Estudante"}</span></td>
                      <td className="p-4"><Button variant="outline" size="sm" onClick={() => void toggleRole(profile)}><UserCog size={15} /> Alterar</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="border-t border-border p-4 text-xs font-bold text-muted-foreground">{filteredUsers.length} resultado(s) · {students} estudantes · {admins} administradores</div>
            </section>
          )}

          {tab === "materials" && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Conteúdo</p><h3 className="mt-1 text-xl font-black">Todos os materiais</h3></div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><Input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Buscar material..." className="pl-9 sm:w-64" /></div>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Todos os status</option><option value="ready">Prontos</option><option value="processing">Processando</option><option value="uploaded">Enviados</option><option value="failed">Falhos</option></select>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-border">{filteredMaterials.map((material) => (
                <button key={material.id} type="button" onClick={() => navigate({ to: "/material/$materialId", params: { materialId: material.id } })} className="flex w-full items-center gap-4 p-4 text-left hover:bg-secondary/35 sm:p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary"><FileText size={19} /></span>
                  <span className="min-w-0 flex-1"><strong className="block truncate">{material.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{material.source_type} · {new Date(material.created_at).toLocaleString("pt-BR")}</span></span>
                  <span className={`hidden rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${material.status === "failed" ? "bg-destructive/10 text-destructive" : material.status === "ready" ? "bg-green-soft text-green-strong" : "bg-yellow-soft text-yellow-strong"}`}>{material.status}</span>
                  <ArrowUpRight size={17} className="text-muted-foreground" />
                </button>
              ))}</div>
              {!filteredMaterials.length && <p className="p-10 text-center text-sm text-muted-foreground">Nenhum material encontrado.</p>}
            </section>
          )}

          {tab === "access" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-soft text-brand-violet"><Globe2 size={20} /></div><div><h3 className="font-black">Domínios institucionais</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Controle quais domínios podem criar contas.</p></div></div>
                <form onSubmit={addDomain} className="mt-6 flex gap-2"><div className="min-w-0 flex-1"><Label htmlFor="domain" className="sr-only">Novo domínio</Label><Input id="domain" name="domain" placeholder="ex.: usp.br" maxLength={120} /></div><Button type="submit" disabled={saving}>Autorizar</Button></form>
                <div className="mt-5 space-y-2">{domains.map((domain) => <div key={domain} className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2.5"><span className="text-sm font-bold">*.{domain}</span><button type="button" onClick={() => void removeDomain(domain)} className="rounded-lg px-2 py-1 text-sm font-black text-muted-foreground hover:bg-destructive/10 hover:text-destructive">Remover</button></div>)}{!loading && !domains.length && <p className="text-sm text-muted-foreground">Nenhum domínio configurado.</p>}</div>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-soft text-green-strong"><Database size={20} /></div><div><h3 className="font-black">Resumo operacional</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Indicadores disponíveis com os dados atuais da plataforma.</p></div></div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between rounded-xl bg-secondary p-4"><span className="font-bold">Taxa de sucesso</span><strong>{materials.length ? Math.round((readyMaterials / materials.length) * 100) : 0}%</strong></div>
                  <div className="flex justify-between rounded-xl bg-secondary p-4"><span className="font-bold">Fila atual</span><strong>{processingMaterials}</strong></div>
                  <div className="flex justify-between rounded-xl bg-secondary p-4"><span className="font-bold">Domínios autorizados</span><strong>{domains.length}</strong></div>
                  <div className="flex justify-between rounded-xl bg-secondary p-4"><span className="font-bold">Última atualização</span><strong>{lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</strong></div>
                </div>
              </article>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
