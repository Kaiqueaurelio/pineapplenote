import { createFileRoute } from "@tanstack/react-router";
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
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Documento");
  const [selectedFile, setSelectedFile] = useState("");
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </Button>

          <a href="/" className="flex min-w-0 items-center" aria-label="Pineapple Note — início">
            <img
              src={logoAsset.url}
              alt="Pineapple Note"
              className="h-14 w-auto object-contain object-left sm:h-16"
            />
          </a>

          <div className="ml-auto hidden w-full max-w-md items-center md:flex">
            <Search className="pointer-events-none relative left-9 z-10 text-muted-foreground" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar nos seus estudos"
              placeholder="Buscar nos seus estudos"
              className="h-11 w-full rounded-lg border border-border bg-secondary/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-yellow ring-2 ring-background" />
          </Button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-violet text-sm font-bold text-brand-violet-foreground ring-4 ring-violet-soft"
            aria-label="Abrir perfil de Marina"
          >
            MA
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px]">
        <aside
          className={`${mobileMenuOpen ? "flex" : "hidden"} fixed inset-x-0 top-[76px] z-30 h-[calc(100vh-76px)] w-full flex-col border-r border-border bg-background px-4 py-6 lg:sticky lg:top-[76px] lg:flex lg:h-[calc(100vh-76px)] lg:w-60 lg:shrink-0 lg:px-5`}
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
            <button className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
              <CircleHelp size={19} /> Ajuda
            </button>
            <button className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Settings size={19} /> Configurações
            </button>
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

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-strong">
                  <Sparkles size={16} /> Bom dia, Marina
                </p>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">O que vamos aprender hoje?</h1>
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

                <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-ink p-7 text-ink-foreground lg:p-8">
                  <div className="pineapple-grid absolute inset-0 opacity-20" />
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 px-3 py-1 text-xs font-semibold">
                      <Sparkles size={14} /> Pineapple AI
                    </span>
                    <h2 className="mt-5 max-w-sm text-2xl font-bold leading-tight">Do conteúdo bruto ao estudo organizado.</h2>
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
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Ver biblioteca <ArrowRight size={16} />
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {filteredMaterials.map((material) => (
                  <article key={material.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`material-icon material-icon-${material.tone}`}>
                        <material.icon size={21} />
                      </div>
                      <Button size="icon" variant="ghost" aria-label={`Mais opções para ${material.title}`} className="-mr-2 -mt-2">
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

            <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
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
                <Button variant="violet" className="mt-5 w-full sm:mt-0 sm:w-auto">
                  Revisar agora <ChevronRight size={16} />
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-20 md:hidden">
        <div className="flex items-center rounded-xl border border-border bg-card p-2 shadow-soft">
          <Search className="ml-2 text-muted-foreground" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar materiais"
            aria-label="Buscar materiais"
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          />
        </div>
      </div>
    </div>
  );
}