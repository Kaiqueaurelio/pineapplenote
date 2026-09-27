import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  FolderOpen,
  Home,
  Library,
  Menu,
  Mic2,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings,
  LogOut,
  Save,
  KeyRound,
  UserRound,
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Pineapple Note — Sua aula. Organizada pela IA." },
      {
        name: "description",
        content:
          "Transforme aulas, áudios, vídeos e documentos em materiais de estudo organizados.",
      },
      { property: "og:title", content: "Pineapple Note — Sua aula. Organizada pela IA." },
      {
        property: "og:description",
        content: "Transforme conteúdo em conhecimento com uma central de estudos inteligente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const materials = [
  {
    title: "Introdução à Biologia Celular",
    subject: "Biologia",
    detail: "Resumo • 12 páginas",
    time: "Há 2 horas",
    progress: 72,
    icon: FileText,
    tone: "green",
  },
  {
    title: "Revolução Industrial",
    subject: "História",
    detail: "Áudio • 38 minutos",
    time: "Ontem",
    progress: 45,
    icon: AudioLines,
    tone: "violet",
  },
  {
    title: "Funções de Segundo Grau",
    subject: "Matemática",
    detail: "Videoaula • 24 minutos",
    time: "12 set",
    progress: 88,
    icon: Video,
    tone: "yellow",
  },
];

const navItems = [
  { label: "Início", icon: Home, active: true },
  { label: "Biblioteca", icon: Library },
  { label: "Minhas matérias", icon: FolderOpen },
];

function Index() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Documento");
  const [selectedFile, setSelectedFile] = useState("");
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) setMobileMenuOpen(false);
    };
    closeOnDesktop();
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(async ({ data, error }) => {
      if (error) {
        toast.error("Não foi possível carregar seu perfil.");
        return;
      }
      if (data) return setProfile(data);
      const metadata = user.user_metadata;
      const initial = {
        user_id: user.id,
        display_name: typeof metadata['full_name'] === "string" ? metadata['full_name'].slice(0, 80) : "",
        institution: typeof metadata['institution'] === "string" ? metadata['institution'].slice(0, 120) : "",
        course: typeof metadata['course'] === "string" ? metadata['course'].slice(0, 120) : "",
      };
      const { data: created, error: createError } = await supabase.from("profiles").upsert(initial).select().single();
      if (createError) {
        toast.error("Não foi possível criar seu perfil.");
        return;
      }
      if (created) setProfile(created);
    });
  }, [user]);

  const displayName = profile?.display_name || (typeof user.user_metadata['full_name'] === "string" ? user.user_metadata['full_name'] : "Estudante");
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PN";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = z.object({
      display_name: z.string().trim().min(2, "Informe seu nome.").max(80),
      institution: z.string().trim().max(120),
      course: z.string().trim().max(120),
    }).safeParse({ display_name: String(form.get("display_name") ?? ""), institution: String(form.get("institution") ?? ""), course: String(form.get("course") ?? "") });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Revise seus dados.");
      return;
    }
    setSavingProfile(true);
    const { data, error } = await supabase.from("profiles").upsert({ user_id: user.id, ...result.data }).select().single();
    setSavingProfile(false);
    if (error || !data) {
      toast.error("Não foi possível salvar seu perfil.");
      return;
    }
    setProfile(data);
    setProfileOpen(false);
    toast.success("Perfil atualizado.");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = z.object({
      current_password: z.string().min(1, "Informe sua senha atual."),
      new_password: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(72),
      confirmation: z.string().min(1, "Confirme a nova senha."),
    }).safeParse({
      current_password: String(form.get("current_password") ?? ""),
      new_password: String(form.get("new_password") ?? ""),
      confirmation: String(form.get("confirmation") ?? ""),
    });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Revise os dados.");
      return;
    }
    if (result.data.new_password !== result.data.confirmation) {
      toast.error("As novas senhas não são iguais.");
      return;
    }
    if (!user.email) {
      toast.error("Sua conta não possui e-mail para validar a senha atual.");
      return;
    }
    setSavingPassword(true);
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: result.data.current_password,
    });
    if (reauthError) {
      setSavingPassword(false);
      toast.error("A senha atual está incorreta.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: result.data.new_password });
    setSavingPassword(false);
    if (updateError) {
      toast.error("Não foi possível alterar a senha. Tente novamente.");
      return;
    }
    setPasswordOpen(false);
    event.currentTarget.reset();
    toast.success("Senha alterada com sucesso.");
  }

  const filteredMaterials = materials.filter((material) =>
    `${material.title} ${material.subject}`.toLowerCase().includes(search.toLowerCase()),
  );

  const chooseFile = (type: string) => {
    setSelectedType(type);
    fileRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-[1480px] grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 px-3 sm:h-[72px] sm:flex sm:gap-4 sm:px-6 lg:h-[76px] lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </Button>

          <a href="/" className="flex min-w-0 items-center sm:mr-auto" aria-label="Pineapple Note — início">
            <img
              src={logoAsset.url}
              alt="Pineapple Note"
              className="h-10 max-w-[150px] w-auto object-contain object-left sm:h-12 sm:max-w-[190px] lg:h-14 lg:max-w-[230px]"
            />
          </a>

          <div className="hidden w-full max-w-md items-center lg:flex">
            <Search className="pointer-events-none relative left-9 z-10 text-muted-foreground" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar nos seus estudos"
              placeholder="Buscar nos seus estudos"
              className="h-11 w-full rounded-lg border border-border bg-secondary/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <Button variant="ghost" size="icon" aria-label="Notificações" className="relative max-[380px]:hidden" onClick={() => toast.info("As notificações serão exibidas aqui.")}>
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-yellow ring-2 ring-background" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-violet text-sm font-bold text-brand-violet-foreground ring-4 ring-violet-soft"
            aria-label={`Abrir perfil de ${displayName}`}
            onClick={() => setProfileOpen(true)}
          >
            {initials}
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px]">
        <aside
          className={`${mobileMenuOpen ? "flex" : "hidden"} fixed inset-x-0 top-16 z-30 h-[calc(100dvh-4rem)] sm:top-[72px] sm:h-[calc(100dvh-72px)] lg:top-[76px] lg:h-[calc(100dvh-76px)] w-full flex-col border-r border-border bg-background px-4 py-6 lg:sticky lg:top-[76px] lg:flex lg:h-[calc(100dvh-76px)] lg:w-60 lg:shrink-0 lg:px-5`}
        >
          <nav className="space-y-1" aria-label="Navegação principal">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  item.active
                    ? "bg-green-soft text-green-strong"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={19} strokeWidth={item.active ? 2.4 : 2} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-1 border-t border-border pt-5">
            <button type="button" onClick={() => toast.info("A central de ajuda será disponibilizada aqui.")} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
              <CircleHelp size={19} /> Ajuda
            </button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => setProfileOpen(true)}>
              <Settings size={19} /> Configurações
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut size={19} /> Sair
            </Button>
            <div className="mt-4 rounded-lg bg-secondary p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span>Plano gratuito</span>
                <span>3/5</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full w-3/5 rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">2 processamentos disponíveis</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-8 sm:py-8 sm:pb-28 lg:px-10 lg:py-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <section className="mb-7 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-strong">
                  <Sparkles size={16} /> Bom dia, {displayName.split(" ")[0]}
                </p>
                <h1 className="text-[1.75rem] font-extrabold leading-tight sm:text-4xl">O que vamos aprender hoje?</h1>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Sua aula. Organizada pela IA. Envie um conteúdo e receba um material pronto para estudar.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 size={17} /> Sequência de <strong className="text-foreground">7 dias</strong>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
              <div className="grid lg:grid-cols-[1.5fr_1fr]">
                <div className="p-5 sm:p-7 lg:p-8">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-soft text-green-strong">
                      <Plus size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Criar novo material</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Escolha de onde vem o seu conteúdo.</p>
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    className="sr-only"
                    accept="audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")}
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Gravar áudio", detail: "Aula ou explicação", icon: Mic2 },
                      { label: "Enviar vídeo", detail: "MP4 ou link", icon: Video },
                      { label: "Documento", detail: "PDF, DOC ou slides", icon: FileText },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => chooseFile(item.label)}
                        className={`group flex min-h-32 flex-col items-start justify-between rounded-lg border p-4 text-left transition ${
                          selectedType === item.label
                            ? "border-primary bg-green-soft/70"
                            : "border-border bg-background hover:border-primary/40 hover:bg-secondary/50"
                        }`}
                      >
                        <item.icon className="text-green-strong" size={23} />
                        <span>
                          <strong className="block text-sm">{item.label}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedFile && (
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/30 bg-green-soft px-4 py-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{selectedFile}</span>
                      <span className="ml-3 shrink-0 font-semibold text-green-strong">Pronto para organizar</span>
                    </div>
                  )}
                </div>

                <div className="relative flex min-h-56 flex-col justify-between overflow-hidden bg-ink p-6 text-ink-foreground sm:min-h-64 sm:p-7 lg:p-8">
                  <div className="pineapple-grid absolute inset-0 opacity-20" />
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 px-3 py-1 text-xs font-semibold">
                      <Sparkles size={14} /> Pineapple AI
                    </span>
                    <h2 className="mt-4 max-w-sm text-[1.35rem] font-bold leading-tight sm:mt-5 sm:text-2xl">Do conteúdo bruto ao estudo organizado.</h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                      Resumos, tópicos essenciais, perguntas e flashcards em poucos instantes.
                    </p>
                  </div>
                  <Button variant="violet" className="relative mt-6 w-fit" onClick={() => chooseFile("Documento")}>
                    <Upload size={17} /> Importar conteúdo
                  </Button>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Continue estudando</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Seus materiais mais recentes</p>
                </div>
                <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => toast.info("A biblioteca completa será aberta aqui.")}>
                  Ver biblioteca <ArrowRight size={16} />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((material) => (
                  <article key={material.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`material-icon material-icon-${material.tone}`}>
                        <material.icon size={21} />
                      </div>
                      <Button size="icon" variant="ghost" aria-label={`Mais opções para ${material.title}`} className="-mr-2 -mt-2" onClick={() => toast.info("Mais opções do material serão exibidas aqui.")}>
                        <MoreHorizontal size={19} />
                      </Button>
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase text-muted-foreground">{material.subject}</p>
                    <h3 className="mt-1 min-h-12 text-base font-bold leading-snug">{material.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{material.detail}</p>
                    <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{material.time}</span>
                      <strong className="text-foreground">{material.progress}%</strong>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${material.progress}%` }} />
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-5 w-full"
                      onClick={() => setActiveMaterial(material.title)}
                    >
                      <Play size={16} /> {activeMaterial === material.title ? "Material aberto" : "Continuar"}
                    </Button>
                  </article>
                ))}
              </div>

              {filteredMaterials.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-14 text-center">
                  <Search className="mx-auto text-muted-foreground" size={24} />
                  <p className="mt-3 font-semibold">Nenhum material encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tente buscar outro assunto.</p>
                </div>
              )}
            </section>

            <section className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-[1fr_1.4fr]">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Esta semana</p>
                    <p className="mt-1 text-3xl font-extrabold">4h 35min</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-soft text-yellow-strong">
                    <BookOpen size={22} />
                  </div>
                </div>
                <div className="mt-7 flex h-20 items-end gap-2" aria-label="Atividade de estudo semanal">
                  {[38, 64, 48, 78, 58, 92, 42].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div className="w-full rounded-sm bg-green-soft" style={{ height: `${height}%` }}>
                        <div className="h-full w-full rounded-sm bg-primary opacity-80" />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{["S", "T", "Q", "Q", "S", "S", "D"][index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-violet-border bg-violet-soft p-6 sm:flex-row sm:items-center sm:gap-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-violet text-brand-violet-foreground">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-violet">Dica da Pineapple</p>
                    <h3 className="mt-1 text-lg font-bold">Revise por poucos minutos todos os dias.</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Seus flashcards estão prontos para uma revisão rápida.</p>
                  </div>
                </div>
                <Button variant="violet" className="mt-5 w-full sm:mt-0 sm:w-auto" onClick={() => toast.info("A revisão rápida será aberta aqui.")}>
                  Revisar agora <ChevronRight size={16} />
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>

      <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 lg:hidden">
        <div className="flex min-h-12 items-center rounded-2xl border border-border bg-card/95 p-1.5 shadow-soft backdrop-blur-xl">
          <Search className="ml-2 text-muted-foreground" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar materiais"
            aria-label="Buscar materiais"
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl p-5 sm:w-[calc(100%-2rem)] sm:max-w-md sm:p-6">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-violet-soft text-brand-violet"><UserRound size={21} /></div>
            <DialogTitle>Seu perfil acadêmico</DialogTitle>
            <DialogDescription>Mantenha seus dados atualizados para personalizar seus estudos.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-green-soft p-3 text-sm text-green-strong">
            <div className="flex items-center justify-between gap-3">
              <strong className="block">E-mail confirmado</strong>
              {profile?.role === "admin" && (
                <span className="shrink-0 rounded-full bg-brand-violet px-2.5 py-1 text-[11px] font-bold text-brand-violet-foreground">
                  Administrador
                </span>
              )}
            </div>
            <span className="break-all text-xs">{user.email}</span>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="display_name">Nome completo</Label><Input id="display_name" name="display_name" defaultValue={profile?.display_name ?? displayName} maxLength={80} required className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="institution">Instituição</Label><Input id="institution" name="institution" defaultValue={profile?.institution ?? ""} maxLength={120} placeholder="Sua faculdade ou escola" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="course">Curso</Label><Input id="course" name="course" defaultValue={profile?.course ?? ""} maxLength={120} placeholder="Seu curso" className="h-11" /></div>
            <Button type="submit" className="w-full" disabled={savingProfile}><Save size={17} />{savingProfile ? "Salvando..." : "Salvar perfil"}</Button>
          </form>
          <Button type="button" variant="outline" className="w-full" onClick={() => { setProfileOpen(false); setPasswordOpen(true); }}>
            <KeyRound size={17} />Alterar senha
          </Button>
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}><LogOut size={17} />Sair da conta</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl p-5 sm:w-[calc(100%-2rem)] sm:max-w-md sm:p-6">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-violet-soft text-brand-violet"><KeyRound size={21} /></div>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Por segurança, informe sua senha atual antes de definir uma nova.</DialogDescription>
          </DialogHeader>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="current_password">Senha atual</Label><Input id="current_password" name="current_password" type="password" autoComplete="current-password" maxLength={72} required className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="new_password">Nova senha</Label><Input id="new_password" name="new_password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="confirmation">Confirmar nova senha</Label><Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={72} required className="h-11" /></div>
            <Button type="submit" className="w-full" disabled={savingPassword}>{savingPassword ? "Validando..." : "Alterar senha"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}