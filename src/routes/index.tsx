import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  NotebookPen,
  FileText,
  Mic2,
  Play,
  Upload,
  GraduationCap,
  ChevronDown,
  CheckCircle2,
  MessageCircle,
  Languages,
  Gamepad2,
  Podcast,
  Smartphone,
  Monitor,
  Link2,
  Headphones,
  Share2,
  FileStack,
  Presentation,
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
    title: "Grave aulas e reuniões",
    description:
      "Capture o áudio direto pelo navegador e continue focado no que está sendo explicado.",
    status: "Disponível",
  },
  {
    icon: Upload,
    title: "Envie seus materiais",
    description:
      "Áudios, vídeos e documentos ficam no mesmo espaço para você estudar sem espalhar seus arquivos.",
    status: "Disponível",
  },
  {
    icon: FileText,
    title: "Notas e transcrições",
    description:
      "Transforme conteúdo bruto em transcrições, resumos, tópicos e pontos importantes.",
    status: "Disponível",
  },
  {
    icon: BookOpen,
    title: "Quizzes e flashcards",
    description:
      "Crie materiais de revisão a partir do conteúdo processado e acompanhe sua evolução.",
    status: "Disponível",
  },
  {
    icon: MessageCircle,
    title: "Converse com seu material",
    description:
      "Faça perguntas diretamente sobre suas notas e receba explicações baseadas no conteúdo.",
    status: "Disponível",
  },
  {
    icon: Languages,
    title: "Mais idiomas",
    description:
      "Amplie o estudo para conteúdos em diferentes idiomas, com suporte de processamento e tradução.",
    status: "Disponível",
  },
  {
    icon: Gamepad2,
    title: "Jogos de estudo",
    description:
      "Pratique com modos interativos baseados nos flashcards e quizzes do seu material.",
    status: "Disponível",
  },
  {
    icon: Podcast,
    title: "Podcasts de estudo",
    description:
      "Transforme o resumo em uma revisão falada e escolha uma voz para ouvir o conteúdo.",
    status: "Disponível",
  },
  {
    icon: Share2,
    title: "Compartilhe o que aprendeu",
    description:
      "Organize materiais de estudo em um espaço que pode evoluir para colaboração e compartilhamento.",
    status: "Disponível",
  },
];

const steps = [
  {
    number: "01",
    title: "Grave ou envie",
    description: "Comece com uma aula, reunião, áudio, vídeo ou documento.",
  },
  {
    number: "02",
    title: "Deixe a IA organizar",
    description: "O conteúdo é processado e transformado em uma base de estudo mais clara.",
  },
  {
    number: "03",
    title: "Revise e aprenda",
    description: "Leia, revise, responda quizzes e use flashcards para fixar o conteúdo.",
  },
];

const inputTypes = [
  { icon: Mic2, title: "Áudio", description: "Aulas, reuniões e gravações." },
  { icon: FileText, title: "Documentos", description: "Materiais para leitura e revisão." },
  { icon: Headphones, title: "Vídeo", description: "Conteúdo falado transformado em estudo." },
  { icon: Link2, title: "Links", description: "Importação de conteúdos por link em evolução." },
  { icon: FileStack, title: "Biblioteca", description: "Tudo organizado em um só lugar." },
];

const faqs = [
  {
    question: "O que é o Pineapple Note?",
    answer:
      "É uma plataforma de estudo com IA criada para transformar conteúdos como aulas, áudios, vídeos e documentos em materiais mais fáceis de entender e revisar.",
  },
  {
    question: "Posso usar pelo celular?",
    answer:
      "Sim. A interface é responsiva e foi construída com foco em uso confortável no celular e em telas maiores.",
  },
  {
    question: "Que tipos de conteúdo posso enviar?",
    answer:
      "O fluxo atual trabalha com gravações de áudio, vídeos e documentos compatíveis. Importação por links e outras fontes faz parte da evolução da plataforma.",
  },
  {
    question: "O Pineapple Note terá chat com os materiais?",
    answer:
      "Sim. O Pineapple Tutor permite conversar diretamente com uma nota processada e fazer perguntas sobre o conteúdo.",
  },
  {
    question: "O Pineapple Note terá jogos, podcasts e mais idiomas?",
    answer:
      "Sim. O Pineapple Note oferece jogos de estudo, podcasts e tradução para diferentes idiomas a partir dos materiais processados.",
  },
  {
    question: "O Pineapple Note é um projeto da Decode Analytics?",
    answer: "Sim. O Pineapple Note é desenvolvido pela Decode Analytics.",
  },
  {
    question: "Preciso anotar tudo durante a aula?",
    answer:
      "A proposta é justamente reduzir esse trabalho manual: você captura o conteúdo e usa o Pineapple Note para organizar e revisar depois.",
  },
];

const scrollChapters = [
  { id: "inicio", label: "Início" },
  { id: "como-funciona", label: "Fluxo" },
  { id: "recursos", label: "Recursos" },
  { id: "experiencia", label: "Experiência" },
  { id: "perguntas", label: "Dúvidas" },
];

function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const root = document.documentElement;
      const scrollable = root.scrollHeight - root.clientHeight;
      setScrollProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground scroll-smooth">
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary transition-transform duration-100"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="Pineapple Note — início">
            <img
              src={logoAsset.url}
              alt="Pineapple Note"
              className="h-14 w-auto origin-left scale-[1.12] object-contain mix-blend-multiply sm:h-16 sm:scale-[1.1]"
            />
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Como funciona
            </a>
            <a
              href="#recursos"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Recursos
            </a>
            <a
              href="#perguntas"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Dúvidas
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ mode: "login" }}>
              <Button variant="ghost" className="hidden sm:inline-flex">
                Entrar
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button className="rounded-xl px-4">
                Começar grátis <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <nav
          aria-label="Navegação pela página"
          className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-card backdrop-blur-xl xl:block"
        >
          {scrollChapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              title={chapter.label}
              className="group flex h-9 items-center justify-end"
            >
              <span className="mr-2 max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold text-muted-foreground opacity-0 transition-all group-hover:max-w-24 group-hover:opacity-100">
                {chapter.label}
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-border transition group-hover:scale-125 group-hover:bg-primary" />
            </a>
          ))}
        </nav>
        <section
          id="inicio"
          className="relative isolate scroll-mt-24 overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/0.20),transparent_58%)]" />
          <div className="pointer-events-none absolute left-1/2 top-40 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-2 text-xs font-bold text-primary shadow-sm">
              <NotebookPen size={15} strokeWidth={2} />
              Seu novo espaço de estudo com IA
            </div>

            <h1 className="mx-auto max-w-5xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Nunca mais passe a aula inteira
              <span className="block text-primary">tentando anotar tudo.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
              Grave, envie ou importe seu conteúdo. O Pineapple Note ajuda a transformar informação
              bruta em notas, transcrições e materiais de estudo organizados.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button
                  size="lg"
                  className="h-12 w-full rounded-xl px-7 text-base font-bold shadow-lg sm:w-auto"
                >
                  Começar grátis
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl px-7 text-base sm:w-auto"
                >
                  <Play size={17} />
                  Conhecer o Pineapple Note
                </Button>
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Desenvolvido pela <strong className="text-foreground">Decode Analytics</strong>.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-6xl sm:mt-20">
            <div className="relative rounded-[30px] border border-border bg-card p-1.5 shadow-[0_30px_90px_-35px_hsl(var(--foreground)/0.35)] sm:p-2.5">
              <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background">
                <div className="flex h-10 items-center gap-2 border-b border-border px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="ml-4 h-6 flex-1 rounded-md bg-secondary" />
                </div>
                <div className="grid min-h-[330px] md:grid-cols-[210px_1fr]">
                  <aside className="hidden border-r border-border bg-secondary/35 p-5 md:block">
                    <div className="mb-7 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-primary/15" />
                      <div className="h-4 w-24 rounded bg-foreground/10" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-10 rounded-xl bg-primary/10" />
                      <div className="h-10 rounded-xl bg-muted" />
                      <div className="h-10 rounded-xl bg-muted" />
                      <div className="h-10 rounded-xl bg-muted" />
                    </div>
                  </aside>

                  <div className="p-5 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="h-3 w-24 rounded bg-primary/20" />
                        <div className="mt-3 h-8 w-72 max-w-full rounded bg-foreground/10" />
                      </div>
                      <div className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                        Material pronto
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {[
                        { icon: FileText, label: "Notas organizadas" },
                        { icon: BookOpen, label: "Resumo com IA" },
                        { icon: CheckCircle2, label: "Revisão e progresso" },
                      ].map(({ icon: Icon, label }) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon size={20} />
                          </div>
                          <div className="mt-4 h-3 w-28 rounded bg-foreground/10" />
                          <div className="mt-3 h-2 w-full rounded bg-muted" />
                          <div className="mt-2 h-2 w-4/5 rounded bg-muted" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
                      <div className="rounded-2xl border border-border p-5">
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-32 rounded bg-foreground/10" />
                          <div className="h-7 w-20 rounded-lg bg-primary/10" />
                        </div>
                        <div className="mt-5 space-y-2.5">
                          <div className="h-2.5 w-full rounded bg-muted" />
                          <div className="h-2.5 w-11/12 rounded bg-muted" />
                          <div className="h-2.5 w-4/5 rounded bg-muted" />
                          <div className="h-2.5 w-9/12 rounded bg-muted" />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border p-5">
                        <div className="h-3 w-20 rounded bg-foreground/10" />
                        <div className="mt-4 flex items-end gap-2">
                          <div className="h-16 w-3 rounded-t bg-primary/20" />
                          <div className="h-24 w-3 rounded-t bg-primary/35" />
                          <div className="h-20 w-3 rounded-t bg-primary/25" />
                          <div className="h-28 w-3 rounded-t bg-primary/45" />
                          <div className="h-32 w-3 rounded-t bg-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <a
            href="#como-funciona"
            className="mx-auto mt-10 flex w-fit flex-col items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:text-primary"
          >
            <span>Continue explorando</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary">
              ↓
            </span>
          </a>
        </section>

        <section className="border-y border-border bg-secondary/30 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Feito para acompanhar sua rotina
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-semibold text-muted-foreground sm:grid-cols-5">
              {inputTypes.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card px-4 py-4 text-left"
                >
                  <Icon size={18} className="text-primary" />
                  <div className="mt-3 text-foreground">{title}</div>
                  <div className="mt-1 text-xs font-normal leading-5">{description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Como funciona
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                O processo é simples.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                A experiência foi pensada para acompanhar o caminho natural do estudo: capturar o
                conteúdo, organizar o que importa e voltar para revisar.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="relative rounded-3xl border border-border bg-card p-7 shadow-sm"
                >
                  <span className="text-sm font-black text-primary">{step.number}</span>
                  <h3 className="mt-10 text-2xl font-extrabold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="recursos"
          className="border-y border-border bg-secondary/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Tudo em um só lugar
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Do conteúdo bruto ao estudo.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A experiência reúne captura, organização e revisão em uma única jornada. O que já
                está disponível aparece pronto para usar; o restante entra no roadmap do produto.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                const available = feature.status === "Disponível";
                return (
                  <article
                    key={feature.title}
                    className="group rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={21} />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {feature.status}
                      </span>
                    </div>
                    <h3 className="mt-5 font-extrabold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="experiencia" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr]">
              <div>
                <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                  Experiência de estudo
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  Um material. Várias formas de aprender.
                </h2>
                <p className="mt-5 leading-7 text-muted-foreground">
                  O conteúdo não precisa terminar na transcrição. A ideia do Pineapple Note é levar
                  você da captura até a revisão, com notas, flashcards, quizzes e progresso no mesmo
                  fluxo.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    ["01", "Capturar", "Grave ou envie o conteúdo."],
                    ["02", "Organizar", "Receba notas e transcrição."],
                    ["03", "Praticar", "Use quiz e flashcards."],
                    ["04", "Revisar", "Acompanhe seu progresso."],
                  ].map(([number, title, description]) => (
                    <div key={number} className="rounded-2xl border border-border bg-card p-4">
                      <span className="text-xs font-black text-primary">{number}</span>
                      <h3 className="mt-2 font-extrabold">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-border bg-card p-4 shadow-[0_30px_90px_-35px_hsl(var(--foreground)/0.28)] sm:p-6">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">Aula de Ciência da Computação</p>
                      <p className="text-xs text-muted-foreground">Material pronto para revisão</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl bg-secondary/60 p-4">
                    <div className="h-2.5 w-11/12 rounded bg-foreground/10" />
                    <div className="mt-2.5 h-2.5 w-full rounded bg-muted" />
                    <div className="mt-2.5 h-2.5 w-4/5 rounded bg-muted" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { icon: FileText, label: "Notas" },
                      { icon: BookOpen, label: "Flashcards" },
                      { icon: CheckCircle2, label: "Quiz" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="rounded-xl border border-border p-3 text-center">
                        <Icon size={18} className="mx-auto text-primary" />
                        <p className="mt-2 text-xs font-bold">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Progresso de revisão</span>
                      <span className="text-primary">78%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full w-[78%] rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-7 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Smartphone size={22} />
                </div>
                <h2 className="mt-5 text-2xl font-black">Estude no celular.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  O Pineapple Note já foi construído com interface responsiva para funcionar bem no
                  celular, tablet e desktop pelo navegador.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Celular", "Tablet", "Web"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-7 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Monitor size={22} />
                </div>
                <h2 className="mt-5 text-2xl font-black">Uma experiência que cresce com você.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  O acesso web é o centro da experiência hoje. Aplicativos nativos e recursos
                  avançados entram como evolução do produto.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <CheckCircle2 size={15} className="text-primary" />
                  Web responsivo disponível
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-border bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-1.5 text-xs font-bold">
                  <ArrowRight size={14} />
                  Menos trabalho. Mais foco.
                </div>
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                  Sua atenção deve estar na aula — não no bloco de notas.
                </h2>
                <p className="mt-5 leading-7 text-background/70">
                  Capture o que importa e volte depois para revisar com calma. O Pineapple Note foi
                  pensado para transformar informação em uma experiência de estudo.
                </p>
              </div>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button
                  size="lg"
                  className="h-12 w-full rounded-xl bg-background px-7 text-foreground hover:bg-background/90 sm:w-auto"
                >
                  Criar minha conta
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border-y border-border bg-primary px-4 py-6 text-primary-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 text-center text-sm font-black uppercase tracking-[0.18em] sm:justify-between">
            <span>Capture</span>
            <span className="opacity-60">→</span>
            <span>Organize</span>
            <span className="opacity-60">→</span>
            <span>Pratique</span>
            <span className="opacity-60">→</span>
            <span>Revise</span>
            <span className="opacity-60">→</span>
            <span>Aprenda</span>
          </div>
        </section>

        <section
          id="perguntas"
          className="border-t border-border px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Perguntas frequentes
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Antes de começar.
              </h2>
            </div>

            <div className="mt-10 divide-y divide-border rounded-3xl border border-border bg-card">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5 sm:p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold">
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={19}
                      className="shrink-0 text-muted-foreground transition group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-4 max-w-3xl pr-8 text-sm leading-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="decode-analytics"
          className="border-t border-border bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-black">Desenvolvido pela Decode Analytics.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              O Pineapple Note faz parte do ecossistema de projetos da Decode Analytics, unindo
              tecnologia, dados e inteligência artificial para criar experiências digitais úteis.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <img
              src={logoAsset.url}
              alt=""
              className="h-10 w-auto object-contain mix-blend-multiply sm:h-11"
            />
            <span>© {new Date().getFullYear()} Pineapple Note</span>
          </div>
          <span>Desenvolvido pela Decode Analytics.</span>
        </div>
      </footer>
    </div>
  );
}
