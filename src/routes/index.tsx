import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Check,
  FileText,
  Headphones,
  Languages,
  MessageCircle,
  Mic2,
  Play,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
  Zap,
} from "lucide-react";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pineapple Note — Transforme conteúdo em conhecimento" },
      {
        name: "description",
        content:
          "Pineapple Note transforma aulas, áudios, vídeos e documentos em notas, transcrições e materiais de estudo com IA.",
      },
      { property: "og:title", content: "Pineapple Note — Transforme conteúdo em conhecimento" },
      {
        property: "og:description",
        content:
          "Grave, envie ou importe seu conteúdo. O Pineapple Note organiza, transcreve e cria materiais para você estudar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Mic2,
    title: "Grave suas aulas",
    description: "Capture uma explicação, reunião ou aula diretamente pelo navegador.",
  },
  {
    icon: Upload,
    title: "Envie seus arquivos",
    description: "Áudios, vídeos e documentos entram no mesmo fluxo de estudo.",
  },
  {
    icon: WandSparkles,
    title: "IA organiza tudo",
    description: "Transforme conteúdo bruto em notas estruturadas, tópicos e resumos.",
  },
  {
    icon: MessageCircle,
    title: "Converse com suas notas",
    description: "Faça perguntas sobre o conteúdo e aprofunde o que acabou de aprender.",
  },
  {
    icon: Brain,
    title: "Estude de verdade",
    description: "Crie flashcards, quizzes e outros materiais a partir da sua própria aula.",
  },
  {
    icon: Languages,
    title: "Aprenda em vários idiomas",
    description: "Prepare o conteúdo para estudar e revisar em diferentes idiomas.",
  },
];

const steps = [
  {
    number: "01",
    title: "Capture",
    description: "Grave ou envie uma aula, áudio, vídeo ou documento.",
  },
  {
    number: "02",
    title: "Organize",
    description: "A IA transcreve e transforma o conteúdo em uma nota clara.",
  },
  {
    number: "03",
    title: "Estude",
    description: "Revise, converse, faça quizzes e use flashcards para fixar.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="Pineapple Note — início">
            <img
              src={logoAsset.url}
              alt="Pineapple Note"
              className="h-10 w-auto object-contain sm:h-12"
            />
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#como-funciona" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Como funciona
            </a>
            <a href="#recursos" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Recursos
            </a>
            <a href="#decode-analytics" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Decode Analytics
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ mode: "login" }}>
              <Button variant="ghost" className="hidden sm:inline-flex">Entrar</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button className="rounded-xl px-4">Começar grátis <ArrowRight size={16} /></Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_55%)]" />
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-2 text-xs font-bold text-primary">
              <Sparkles size={14} />
              Inteligência artificial para aprender melhor
            </div>

            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Sua aula entra.
              <span className="block text-primary">Seu material de estudo sai.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
              Grave, envie ou importe seu conteúdo. O Pineapple Note transforma aulas,
              áudios, vídeos e documentos em notas, transcrições e materiais de estudo
              organizados por IA.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="h-12 w-full rounded-xl px-7 text-base font-bold shadow-lg sm:w-auto">
                  Começar agora
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline" className="h-12 w-full rounded-xl px-7 text-base sm:w-auto">
                  <Play size={17} />
                  Ver como funciona
                </Button>
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Um projeto criado por <strong className="text-foreground">Decode Analytics</strong>.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-6xl sm:mt-20">
            <div className="relative rounded-[28px] border border-border bg-card p-2 shadow-2xl sm:p-3">
              <div className="overflow-hidden rounded-[22px] border border-border/70 bg-background">
                <div className="flex h-10 items-center gap-2 border-b border-border px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="ml-4 h-6 flex-1 rounded-md bg-secondary" />
                </div>
                <div className="grid min-h-[300px] md:grid-cols-[190px_1fr]">
                  <aside className="hidden border-r border-border bg-secondary/35 p-5 md:block">
                    <div className="mb-7 h-7 w-28 rounded bg-primary/15" />
                    <div className="space-y-3">
                      <div className="h-9 rounded-lg bg-primary/12" />
                      <div className="h-9 rounded-lg bg-muted" />
                      <div className="h-9 rounded-lg bg-muted" />
                      <div className="h-9 rounded-lg bg-muted" />
                    </div>
                  </aside>
                  <div className="p-5 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="h-3 w-28 rounded bg-primary/20" />
                        <div className="mt-3 h-7 w-64 max-w-full rounded bg-foreground/10" />
                      </div>
                      <div className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                        Material pronto
                      </div>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border p-4">
                        <FileText className="text-primary" size={20} />
                        <div className="mt-4 h-3 w-20 rounded bg-foreground/10" />
                        <div className="mt-2 h-2 w-full rounded bg-muted" />
                        <div className="mt-2 h-2 w-4/5 rounded bg-muted" />
                      </div>
                      <div className="rounded-2xl border border-border p-4">
                        <Brain className="text-primary" size={20} />
                        <div className="mt-4 h-3 w-24 rounded bg-foreground/10" />
                        <div className="mt-2 h-2 w-full rounded bg-muted" />
                        <div className="mt-2 h-2 w-3/4 rounded bg-muted" />
                      </div>
                      <div className="rounded-2xl border border-border p-4">
                        <MessageCircle className="text-primary" size={20} />
                        <div className="mt-4 h-3 w-24 rounded bg-foreground/10" />
                        <div className="mt-2 h-2 w-full rounded bg-muted" />
                        <div className="mt-2 h-2 w-2/3 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-border p-5">
                      <div className="h-3 w-32 rounded bg-foreground/10" />
                      <div className="mt-4 space-y-2">
                        <div className="h-2 w-full rounded bg-muted" />
                        <div className="h-2 w-11/12 rounded bg-muted" />
                        <div className="h-2 w-4/5 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-border bg-secondary/35 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Como funciona</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Do conteúdo bruto ao estudo em poucos passos.</h2>
              <p className="mt-4 text-muted-foreground">
                O Pineapple Note tira o trabalho repetitivo da organização e deixa você concentrar energia em entender o conteúdo.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.number} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <span className="text-sm font-black text-primary">{step.number}</span>
                  <h3 className="mt-8 text-xl font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="px-4 py-20 sm:px-6 lg:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Recursos</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Tudo que você precisa para transformar conteúdo em conhecimento.</h2>
              <p className="mt-4 text-muted-foreground">
                Uma central de estudo construída para acompanhar seu fluxo, do primeiro áudio à revisão.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={21} />
                    </div>
                    <h3 className="mt-5 font-extrabold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 sm:pb-28">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-1.5 text-xs font-bold">
                  <Zap size={14} />
                  Feito para estudar
                </div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Pare de passar horas organizando a aula.</h2>
                <p className="mt-4 text-background/70">
                  Grave. Envie. Organize. Estude. O Pineapple Note cuida da parte repetitiva para você chegar mais rápido ao que importa.
                </p>
              </div>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="h-12 w-full rounded-xl bg-background px-7 text-foreground hover:bg-background/90 sm:w-auto">
                  Criar minha conta
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="decode-analytics" className="border-t border-border bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-black">Um projeto criado por Decode Analytics</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              O Pineapple Note faz parte do ecossistema de projetos da Decode Analytics, unindo tecnologia, dados e inteligência artificial para criar experiências digitais úteis.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <img src={logoAsset.url} alt="" className="h-8 w-auto" />
            <span>© {new Date().getFullYear()} Pineapple Note</span>
          </div>
          <span>Um projeto criado por Decode Analytics.</span>
        </div>
      </footer>
    </div>
  );
}
