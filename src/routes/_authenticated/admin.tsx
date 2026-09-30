import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  ServerCog,
  Settings2,
  TrendingUp,
  Trash2,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileText,
  Globe2,
  LayoutDashboard,
  RefreshCw,
  RotateCcw,
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

type AdminTab = "overview" | "users" | "materials" | "access" | "operations" | "reports" | "settings";

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
  const [progressCount, setProgressCount] = useState(0);
  const [outputCount, setOutputCount] = useState(0);
  const [adminName, setAdminName] = useState("Administrador");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Tables<"study_materials"> | null>(null);
  const [courseFilter, setCourseFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [materialSourceFilter, setMaterialSourceFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<Tables<"profiles"> | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [busyMaterialId, setBusyMaterialId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: auth }, profileResult, materialResult, domainResult, progressResult, outputResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("study_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("signup_email_domains").select("domain").order("domain"),
      supabase.from("study_progress").select("id", { count: "exact", head: true }),
      supabase.from("material_outputs").select("id", { count: "exact", head: true }),
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
    setProgressCount(progressResult.count ?? 0);
    setOutputCount(outputResult.count ?? 0);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  async function deleteMaterial(material: Tables<"study_materials">) {
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action: "delete_materials", materialIds: [material.id] },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível excluir o material.");
      return;
    }
    setConfirmDelete(null);
    toast.success("Material excluído.");
    await load();
  }

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
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action: "set_role", userId: profile.user_id, role: nextRole },
    });
    if (error || data?.error) return toast.error(data?.error ?? "A permissão não pôde ser alterada.");
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
        const matchesCourse = courseFilter === "all" || profile.course === courseFilter;
        const matchesInstitution = institutionFilter === "all" || profile.institution === institutionFilter;
        const query = userSearch.trim().toLowerCase();
        const idQuery = profileSearch.trim().toLowerCase();
        const matchesQuery = (!idQuery || profile.user_id.toLowerCase().includes(idQuery)) && (
          !query ||
          profile.display_name.toLowerCase().includes(query) ||
          profile.institution.toLowerCase().includes(query) ||
          profile.course.toLowerCase().includes(query) ||
          profile.user_id.toLowerCase().includes(query));
        return matchesRole && matchesCourse && matchesInstitution && matchesQuery;
      }),
    [profiles, roleFilter, userSearch, profileSearch, courseFilter, institutionFilter],
  );

  const institutions = useMemo(() => Array.from(new Set(profiles.map((p) => p.institution).filter(Boolean))).sort(), [profiles]);
  const courses = useMemo(() => Array.from(new Set(profiles.map((p) => p.course).filter(Boolean))).sort(), [profiles]);

  const filteredMaterials = useMemo(
    () =>
      materials.filter((material) => {
        const matchesStatus = statusFilter === "all" || material.status === statusFilter;
        const matchesSource = materialSourceFilter === "all" || material.source_type === materialSourceFilter;
        const query = materialSearch.trim().toLowerCase();
        return matchesStatus && matchesSource && (!query || material.title.toLowerCase().includes(query) || material.source_type.toLowerCase().includes(query));
      }),
    [materials, materialSearch, statusFilter, materialSourceFilter],
  );

  const recentUsers = useMemo(() => profiles.slice(0, 6), [profiles]);
  const materialSuccessRate = materials.length ? Math.round((readyMaterials / materials.length) * 100) : 0;
  const averageMaterialsPerUser = profiles.length ? (materials.length / profiles.length).toFixed(1) : "0";
  const activeMaterialOwners = new Set(materials.map((material) => material.user_id)).size;
  const sourceRows = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const monthlyMaterials = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
      const count = materials.filter((material) => {
        const created = new Date(material.created_at);
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
      }).length;
      return { label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), count };
    });
  }, [materials]);

  function exportCsv(filename: string, rows: string[][]) {
    const csv = rows.map((row) => row.map((cell) => {
      const value = String(cell ?? "").replace(/"/g, '""');
      return `"${value}"`;
    }).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação iniciada.");
  }

  function exportUsers() {
    exportCsv("pineapple-usuarios.csv", [
      ["Nome", "Instituição", "Curso", "Função", "Criado em", "ID"],
      ...profiles.map((profile) => [profile.display_name, profile.institution, profile.course, profile.role, profile.created_at, profile.user_id]),
    ]);
  }

  function exportMaterials() {
    exportCsv("pineapple-materiais.csv", [
      ["Título", "Fonte", "Status", "Criado em", "Usuário", "ID"],
      ...materials.map((material) => [material.title, material.source_type, material.status, material.created_at, material.user_id, material.id]),
    ]);
  }

  async function retryMaterial(material: Tables<"study_materials">) {
    setBusyMaterialId(material.id);
    const { error } = await supabase
      .from("study_materials")
      .update({ status: "processing" })
      .eq("id", material.id);
    if (error) {
      setBusyMaterialId(null);
      toast.error("Não foi possível colocar o material novamente na fila.");
      return;
    }
    const { error: functionError } = await supabase.functions.invoke("process-material", { body: { materialId: material.id } });
    setBusyMaterialId(null);
    if (functionError) {
      toast.error("O material foi marcado para processamento, mas a função não respondeu.");
    } else {
      toast.success("Material reenviado para processamento.");
    }
    await load();
  }

  async function deleteSelectedMaterials() {
    if (!selectedMaterials.length) return;
    if (!window.confirm(`Excluir ${selectedMaterials.length} material(is) selecionado(s)?`)) return;
    const { data, error } = await supabase.functions.invoke("admin-actions", {
      body: { action: "delete_materials", materialIds: selectedMaterials },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível excluir os materiais selecionados.");
      return;
    }
    setSelectedMaterials([]);
    toast.success("Materiais selecionados excluídos.");
    await load();
  }

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "materials", label: "Materiais", icon: BookOpen },
    { id: "access", label: "Acesso", icon: Globe2 },
    { id: "operations", label: "Operações", icon: ServerCog },
    { id: "reports", label: "Relatórios", icon: TrendingUp },
    { id: "settings", label: "Configurações", icon: Settings2 },
  ];

  return (
    <main className="min-h-[100dvh] overflow-x-clip bg-secondary/35 pb-[env(safe-area-inset-bottom)] text-foreground">
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
              <button key={id} type="button" onClick={() => setTab(id)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${tab === id ? "bg-violet-soft text-brand-violet" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
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
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button className="min-h-11 w-full sm:w-auto" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /> Atualizar tudo</Button>
              <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={exportMaterials}><Download size={16} /> Exportar</Button>
            </div>
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

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Usuários", "Gerenciar contas e permissões", () => setTab("users"), Users],
              ["Materiais", "Buscar, revisar e remover", () => setTab("materials"), BookOpen],
              ["Acesso", "Domínios institucionais", () => setTab("access"), Globe2],
              ["Operações", "Fila e manutenção", () => setTab("operations"), ServerCog],
            ].map(([label, description, action, IconValue]) => { const Icon = IconValue as typeof Users; return (
              <button key={String(label)} type="button" onClick={action as () => void} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary/50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Icon size={18} /></span>
                <span className="min-w-0"><strong className="block text-sm">{String(label)}</strong><span className="mt-0.5 block truncate text-xs text-muted-foreground">{String(description)}</span></span>
                <ArrowUpRight className="ml-auto shrink-0 text-muted-foreground" size={16} />
              </button>
            ); })}
          </section>

          {tab === "overview" && (
            <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.3fr_.7fr]">
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
                  <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Gestão de acesso</p><h3 className="mt-1 text-xl font-black">Usuários e permissões</h3><p className="mt-1 text-sm text-muted-foreground">{filteredUsers.length} perfis encontrados</p></div>
                  <Button variant="outline" className="min-h-11" onClick={exportUsers}><Download size={16} /> Exportar CSV</Button>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar pessoa, instituição..." className="pl-9 sm:w-72" /></div>
                    <Input value={profileSearch} onChange={(event) => setProfileSearch(event.target.value)} placeholder="ID do usuário..." className="sm:w-44" />
                    <select value={institutionFilter} onChange={(event) => setInstitutionFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Instituições</option>{institutions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                    <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Cursos</option>{courses.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                    <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Todos</option><option value="user">Estudantes</option><option value="admin">Administradores</option></select>
                  </div>
                </div>
              </div>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary text-muted-foreground"><tr><th className="p-4">Perfil</th><th className="p-4">Instituição</th><th className="p-4">Curso</th><th className="p-4">Criado</th><th className="p-4">Permissão</th><th className="p-4">Ação</th></tr></thead>
                  <tbody>{filteredUsers.map((profile) => (
                    <tr key={profile.user_id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${profile.role === "admin" ? "bg-violet-soft text-brand-violet" : "bg-green-soft text-green-strong"}`}>{(profile.display_name || "PN").slice(0,2).toUpperCase()}</span><span className="font-bold">{profile.display_name || "Perfil sem nome"}</span></div></td>
                      <td className="p-4 text-muted-foreground">{profile.institution || "—"}</td><td className="p-4 text-muted-foreground">{profile.course || "—"}</td><td className="p-4 text-muted-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${profile.role === "admin" ? "bg-violet-soft text-brand-violet" : "bg-green-soft text-green-strong"}`}>{profile.role === "admin" ? "Administrador" : "Estudante"}</span></td>
                      <td className="p-4"><Button variant="outline" size="sm" onClick={() => setSelectedUser(profile)}><UserCog size={15} /> Alterar</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="space-y-2 p-3 lg:hidden">
                {filteredUsers.map((profile) => (
                  <button key={profile.user_id} type="button" onClick={() => setSelectedUser(profile)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black ${profile.role === "admin" ? "bg-violet-soft text-brand-violet" : "bg-green-soft text-green-strong"}`}>{(profile.display_name || "PN").slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate">{profile.display_name || "Perfil sem nome"}</strong><span className="mt-0.5 block truncate text-xs text-muted-foreground">{profile.institution || "Sem instituição"} · {profile.course || "Sem curso"}</span><span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black">{profile.role === "admin" ? "Administrador" : "Estudante"}</span></span>
                    <ArrowUpRight size={17} className="shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <div className="border-t border-border p-4 text-xs font-bold text-muted-foreground">{filteredUsers.length} resultado(s) · {students} estudantes · {admins} administradores</div>
            </section>
          )}

          {tab === "materials" && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Conteúdo</p><h3 className="mt-1 text-xl font-black">Todos os materiais</h3><p className="mt-1 text-sm text-muted-foreground">{filteredMaterials.length} materiais encontrados</p></div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="min-h-11" onClick={exportMaterials}><Download size={16} /> CSV</Button>
                    {selectedMaterials.length > 0 && <Button variant="destructive" className="min-h-11" onClick={() => void deleteSelectedMaterials()}><Trash2 size={16} /> Excluir {selectedMaterials.length}</Button>}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><Input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Buscar material..." className="pl-9 sm:w-64" /></div>
                    <select value={materialSourceFilter} onChange={(event) => setMaterialSourceFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Todas as fontes</option>{Array.from(new Set(materials.map((item) => item.source_type))).map((item) => <option key={item} value={item}>{item}</option>)}</select>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="all">Todos os status</option><option value="ready">Prontos</option><option value="processing">Processando</option><option value="uploaded">Enviados</option><option value="failed">Falhos</option></select>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-border">{filteredMaterials.map((material) => (
                <div key={material.id} className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/35 sm:gap-4 sm:p-5">
                  <input type="checkbox" aria-label={`Selecionar ${material.title}`} checked={selectedMaterials.includes(material.id)} onChange={(event) => setSelectedMaterials((current) => event.target.checked ? [...current, material.id] : current.filter((id) => id !== material.id))} className="h-5 w-5 shrink-0 accent-[var(--primary)]" />
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary"><FileText size={19} /></span>
                  <button type="button" onClick={() => navigate({ to: "/material/$materialId", params: { materialId: material.id } })} className="min-w-0 flex-1 text-left"><strong className="block truncate">{material.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{material.source_type} · {new Date(material.created_at).toLocaleString("pt-BR")}</span></button>
                  <span className={`hidden rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${material.status === "failed" ? "bg-destructive/10 text-destructive" : material.status === "ready" ? "bg-green-soft text-green-strong" : "bg-yellow-soft text-yellow-strong"}`}>{material.status}</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); setConfirmDelete(material); }} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Excluir material"><Trash2 size={17} /><ArrowUpRight size={17} className="shrink-0 text-muted-foreground" />
                </button>
                </div>
              ))}</div>
              {!filteredMaterials.length && <p className="p-10 text-center text-sm text-muted-foreground">Nenhum material encontrado.</p>}
            </section>
          )}

          {tab === "operations" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3"><ServerCog className="text-brand-violet" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Operações</p><h3 className="text-xl font-black">Saúde do Pineapple</h3></div></div>
                <div className="mt-6 space-y-3">
                  {[
                    ["Autenticação", "Supabase Auth", "Ativo"],
                    ["Banco de dados", "Supabase PostgreSQL", "Conectado"],
                    ["Processamento", "Edge Functions", processingMaterials ? `${processingMaterials} na fila` : "Sem fila"],
                    ["IA", "Pipeline de estudo", "Configurado pelo servidor"],
                  ].map(([name, service, state]) => <div key={name} className="flex items-center justify-between rounded-xl border border-border p-4"><div><p className="font-black">{name}</p><p className="text-xs text-muted-foreground">{service}</p></div><span className="rounded-full bg-green-soft px-3 py-1 text-xs font-black text-green-strong">{state}</span></div>)}
                </div>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3"><BarChart3 className="text-green-strong" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-green-strong">Indicadores</p><h3 className="text-xl font-black">Distribuição da plataforma</h3></div></div>
                <div className="mt-6 space-y-4">
                  <div><div className="mb-1 flex justify-between text-sm font-bold"><span>Estudantes</span><span>{students}</span></div><div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${profiles.length ? students / profiles.length * 100 : 0}%` }} /></div></div>
                  <div><div className="mb-1 flex justify-between text-sm font-bold"><span>Administradores</span><span>{admins}</span></div><div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-brand-violet" style={{ width: `${profiles.length ? admins / profiles.length * 100 : 0}%` }} /></div></div>
                  <div><div className="mb-1 flex justify-between text-sm font-bold"><span>Materiais prontos</span><span>{readyMaterials}</span></div><div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${materials.length ? readyMaterials / materials.length * 100 : 0}%` }} /></div></div>
                </div>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 xl:col-span-2">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-destructive">Ações de manutenção</p><h3 className="text-xl font-black">Materiais com falha</h3><p className="mt-1 text-sm text-muted-foreground">Revise ou remova registros que não conseguiram ser processados.</p></div><span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-black text-destructive">{failedMaterials}</span></div>
                <div className="mt-5 divide-y divide-border">{materials.filter((m) => m.status === "failed").map((material) => <div key={material.id} className="flex flex-wrap items-center gap-3 py-3"><FileText size={18} className="shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{material.title}</p><p className="text-xs text-muted-foreground">{new Date(material.created_at).toLocaleString("pt-BR")}</p></div><Button variant="outline" size="sm" className="min-h-10" onClick={() => void retryMaterial(material)} disabled={busyMaterialId === material.id}><RotateCcw className={busyMaterialId === material.id ? "animate-spin" : ""} size={15} /> Tentar novamente</Button><Button variant="ghost" size="icon" onClick={() => navigate({ to: "/material/$materialId", params: { materialId: material.id } })} aria-label="Abrir material"><ArrowUpRight size={16} /></Button><Button variant="ghost" size="icon" onClick={() => setConfirmDelete(material)} aria-label="Excluir material"><Trash2 size={16} /></Button></div>)}</div>
              </article>
            </section>
          )}

          {tab === "reports" && (
            <section className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Materiais por usuário", averageMaterialsPerUser, BookOpen],
                  ["Usuários com conteúdo", activeMaterialOwners, Users],
                  ["Sessões de estudo", progressCount, Activity],
                  ["Saídas de IA", outputCount, CheckCircle2],
                  ["Taxa de sucesso", materialSuccessRate + "%", CheckCircle2],
                  ["Falhas atuais", failedMaterials, AlertTriangle],
                ].map(([label, value, IconValue]) => { const Icon = IconValue as typeof Users; return (
                  <article key={String(label)} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"><Icon size={18} /></div>
                    <p className="mt-4 text-2xl font-black">{String(value)}</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">{String(label)}</p>
                  </article>
                ); })}
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                  <div className="flex items-center gap-3"><TrendingUp className="text-brand-violet" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Tendência</p><h3 className="text-xl font-black">Materiais por mês</h3></div></div>
                  <div className="mt-7 grid grid-cols-6 items-end gap-2">
                    {monthlyMaterials.map((item) => {
                      const max = Math.max(...monthlyMaterials.map((row) => row.count), 1);
                      return <div key={item.label} className="flex min-w-0 flex-col items-center gap-2"><span className="text-[10px] font-bold text-muted-foreground">{item.count}</span><div className="flex h-32 w-full items-end rounded-xl bg-secondary p-1"><div className="w-full rounded-lg bg-primary" style={{ height: `${Math.max(item.count / max * 100, item.count ? 8 : 2)}%` }} /></div><span className="truncate text-[10px] font-bold text-muted-foreground">{item.label}</span></div>;
                    })}
                  </div>
                </article>
                <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                  <div className="flex items-center gap-3"><Database className="text-green-strong" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-green-strong">Distribuição</p><h3 className="text-xl font-black">Fontes utilizadas</h3></div></div>
                  <div className="mt-6 space-y-3">{sourceRows.map(([source, count]) => <div key={source}><div className="mb-1 flex justify-between text-sm font-bold"><span className="capitalize">{source}</span><span>{count}</span></div><div className="h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${materials.length ? count / materials.length * 100 : 0}%` }} /></div></div>)}{!sourceRows.length && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}</div>
                </article>
              </div>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Exportação</p><h3 className="text-xl font-black">Dados administrativos</h3><p className="mt-1 text-sm text-muted-foreground">Baixe os dados que já estão disponíveis para auditoria e análise.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button className="min-h-11" variant="outline" onClick={exportUsers}><Download size={16} /> Usuários CSV</Button><Button className="min-h-11" variant="outline" onClick={exportMaterials}><Download size={16} /> Materiais CSV</Button></div></div>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3"><Users className="text-brand-violet" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Cadastros recentes</p><h3 className="text-xl font-black">Últimos usuários</h3></div></div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{recentUsers.map((profile) => <button key={profile.user_id} type="button" onClick={() => setSelectedUser(profile)} className="min-h-14 rounded-xl bg-secondary p-3 text-left"><strong className="block truncate text-sm">{profile.display_name || "Perfil sem nome"}</strong><span className="text-xs text-muted-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")} · {profile.role === "admin" ? "Admin" : "Estudante"}</span></button>)}</div>
              </article>
            </section>
          )}

          {tab === "settings" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3"><Settings2 className="text-brand-violet" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Painel</p><h3 className="text-xl font-black">Preferências administrativas</h3></div></div>
                <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border p-4"><span><strong className="block">Atualização automática</strong><span className="text-xs text-muted-foreground">Atualiza os indicadores a cada 30 segundos.</span></span><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} /></label>
                <div className="mt-3 rounded-2xl bg-secondary p-4 text-sm"><strong>Atualização manual</strong><p className="mt-1 text-muted-foreground">Use “Atualizar tudo” para consultar imediatamente os dados disponíveis.</p></div>
              </article>
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3"><ShieldCheck className="text-green-strong" size={21} /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-green-strong">Segurança</p><h3 className="text-xl font-black">Controle de acesso</h3></div></div>
                <div className="mt-6 space-y-3 text-sm"><div className="rounded-xl bg-secondary p-4"><strong>Proteção de rota</strong><p className="mt-1 text-muted-foreground">Somente perfis com papel de administrador entram nesta central.</p></div><div className="rounded-xl bg-secondary p-4"><strong>Alteração de permissões</strong><p className="mt-1 text-muted-foreground">As alterações dependem das políticas RLS configuradas no Supabase.</p></div></div>
              </article>
            </section>
          )}

          {tab === "access" && (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-soft text-brand-violet"><Globe2 size={20} /></div><div><h3 className="font-black">Domínios institucionais</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Controle quais domínios podem criar contas.</p></div></div>
                <form onSubmit={addDomain} className="mt-6 flex flex-col gap-2 sm:flex-row"><div className="min-w-0 flex-1"><Label htmlFor="domain" className="sr-only">Novo domínio</Label><Input id="domain" name="domain" placeholder="ex.: usp.br" maxLength={120} /></div><Button type="submit" disabled={saving}>Autorizar</Button></form>
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
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-[28px] border border-border bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-soft sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-violet">Perfil administrativo</p><h2 className="mt-1 text-2xl font-black">{selectedUser.display_name || "Sem nome"}</h2></div><button type="button" onClick={() => setSelectedUser(null)} className="h-9 w-9 rounded-full border border-border">×</button></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[["ID", selectedUser.user_id],["Instituição", selectedUser.institution || "—"],["Curso", selectedUser.course || "—"],["Função", selectedUser.role === "admin" ? "Administrador" : "Estudante"],["Criado", new Date(selectedUser.created_at).toLocaleString("pt-BR")]].map(([label,value]) => <div key={label} className="rounded-xl bg-secondary p-4"><p className="text-xs font-bold text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-black">{value}</p></div>)}
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelectedUser(null)}>Fechar</Button><Button onClick={() => { setSelectedUser(null); void toggleRole(selectedUser); }}><UserCog size={15} /> Alterar permissão</Button></div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-[28px] border border-border bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-soft sm:rounded-3xl sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-destructive">Ação administrativa</p>
            <h2 className="mt-2 text-2xl font-black">Excluir material?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">“{confirmDelete.title}” será removido. Essa ação não deve ser usada para corrigir problemas de processamento sem necessidade.</p>
            <div className="mt-6 flex gap-2 justify-end"><Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="destructive" onClick={() => void deleteMaterial(confirmDelete)}>Excluir</Button></div>
          </div>
        </div>
      )}
    </main>
  );
}
