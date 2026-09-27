import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  FileAudio,
  FileText,
  Headphones,
  Image,
  Languages,
  MessageCircle,
  Mic2,
  Play,
  Upload,
  Video,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";

const features = [
  { icon: FileAudio, title: "Do conteúdo ao conhecimento", text: "Envie áudios, vídeos, PDFs, documentos ou grave uma aula diretamente no app." },
  { icon: BookOpen, title: "Estudo organizado por IA", text: "Receba resumo, tópicos essenciais, transcrição, flashcards e quiz em um só lugar." },
  { icon: MessageCircle, title: "Seu material, sempre acessível", text: "Revise na biblioteca, acompanhe o progresso e retome seus estudos de onde parou." },
  { icon: Languages, title: "Feito para aprender melhor", text: "Uma experiência clara, responsiva e preparada para ferramentas de estudo inteligente." },
];

const steps = [
  ["01", "Envie ou grave", "Escolha um arquivo, documento ou uma nova gravação."],
  ["02", "Deixe a IA organizar", "A Pineapple transforma conteúdo bruto em um material de estudo estruturado."],
  ["03", "Revise e avance", "Use resumos, flashcards e quiz para estudar com mais constância."],
];

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
    description: "Capture o áudio direto pelo navegador e continue focado no que está sendo explicado.",
  },
  {
    icon: Upload,
    title: "Envie qualquer material",
    description: "Áudios, vídeos e documentos entram no mesmo espaço para você não perder nada.",
  },
  {
    icon: FileText,
    title: "Receba notas organizadas",
    description: "Transcrições, resumos, tópicos e pontos importantes ficam estruturados para revisão.",
  },
  {
    icon: MessageCircle,
    title: "Converse com o conteúdo",
    description: "Use suas próprias notas como contexto para encontrar respostas e esclarecer dúvidas.",
  },
  {
    icon: BookOpen,
    title: "Crie materiais de estudo",
    description: "Transforme o conteúdo em flashcards, quizzes e outros formatos de revisão.",
  },
  {
    icon: Languages,
    title: "Estude em outros idiomas",
    description: "Transcreva e prepare conteúdos para revisão em diferentes idiomas.",
  },
  {
    icon: Gamepad2,
    title: "Aprenda de forma ativa",
    description: "Recursos interativos ajudam a transformar revisão passiva em prática.",
  },
  {
    icon: Headphones,
    title: "Transforme notas em áudio",
    description: "A experiência também foi pensada para revisar conteúdos enquanto você escuta.",
  },
  {
    icon: GraduationCap,
    title: "Tudo no seu espaço",
    description: "Biblioteca, materiais e progresso reunidos em uma experiência simples.",
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
    description: "Leia, escute, pesquise, converse e use materiais de revisão.",
  },
];

const faqs = [
  {
    question: "O que é o Pineapple Note?",
    answer: "É uma plataforma de estudo com IA criada para transformar conteúdos como aulas, áudios, vídeos e documentos em materiais mais fáceis de entender e revisar.",
  },
  {
    question: "Posso usar pelo celular?",
    answer: "Sim. A experiência do Pineapple Note está sendo construída com foco mobile-first e também funciona em telas maiores.",
  },
  {
    question: "Que tipos de conteúdo posso enviar?",
    answer: "O fluxo foi projetado para trabalhar com gravações, áudios, vídeos e documentos, além de evoluir para outros formatos de conteúdo.",
  },
  {
    question: "O Pineapple Note é um projeto da Decode Analytics?",
    answer: "Sim. O Pineapple Note é mais um projeto criado pela Decode Analytics, dentro da sua linha de produtos e experiências digitais com tecnologia e inteligência artificial.",
  },
  {
    question: "Preciso anotar tudo durante a aula?",
    answer: "A proposta é justamente reduzir esse trabalho manual: você captura o conteúdo e usa o Pineapple Note para organizar e revisar depois.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="Pineapple Note — início">
            <img
              src={logoAsset.url}
              alt="Pineapple Note"
              className="h-10 w-auto object-contain sm:h-12"
            />
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#como-funciona" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Como funciona</a>
            <a href="#recursos" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Recursos</a>
            <a href="#perguntas" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Dúvidas</a>
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
        <section className="relative isolate overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/0.20),transparent_58%)]" />
          <div className="pointer-events-none absolute left-1/2 top-40 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-2 text-xs font-bold text-primary">
              <ArrowRight size={14} />
              Seu novo espaço de estudo com IA
            </div>

            <h1 className="mx-auto max-w-5xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Nunca mais passe a aula inteira
              <span className="block text-primary">tentando anotar tudo.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
              Grave, envie ou importe seu conteúdo. O Pineapple Note ajuda a transformar
              informação bruta em notas, transcrições e materiais de estudo organizados.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="h-12 w-full rounded-xl px-7 text-base font-bold shadow-lg sm:w-auto">
                  Começar grátis
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button size="lg" variant="outline" className="h-12 w-full rounded-xl px-7 text-base sm:w-auto">
                  <Play size={17} />
                  Conhecer o Pineapple Note
                </Button>
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Um projeto criado por <strong className="text-foreground">Decode Analytics</strong>.
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
                      <div className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Material pronto</div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {[
                        { icon: FileText, label: "Notas organizadas" },
                        { icon: BookOpen, label: "Resumo com IA" },
                        { icon: MessageCircle, label: "Pergunte ao conteúdo" },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
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
        </section>

        <section className="border-y border-border bg-secondary/30 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Feito para acompanhar sua rotina
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-semibold text-muted-foreground sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card px-4 py-4">Estudantes</div>
              <div className="rounded-xl border border-border bg-card px-4 py-4">Profissionais</div>
              <div className="rounded-xl border border-border bg-card px-4 py-4">Professores</div>
              <div className="rounded-xl border border-border bg-card px-4 py-4">Pesquisadores</div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Como funciona</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">O processo é simples.</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                A referência do Coconote é direta: capturar, organizar e estudar. O Pineapple Note segue essa mesma lógica, com identidade própria.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.number} className="relative rounded-3xl border border-border bg-card p-7 shadow-sm">
                  <span className="text-sm font-black text-primary">{step.number}</span>
                  <h3 className="mt-10 text-2xl font-extrabold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="border-y border-border bg-secondary/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Recursos</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Capture. Organize. Aprenda.</h2>
              <p className="mt-4 text-muted-foreground">
                A landing do Pineapple Note agora apresenta o produto como uma experiência completa, seguindo o mesmo raciocínio de descoberta usado pelo Coconote.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="group rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
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

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-border bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/10 px-3 py-1.5 text-xs font-bold">
                  <ArrowRight size={14} />
                  Menos trabalho. Mais foco.
                </div>
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Sua atenção deve estar na aula — não no bloco de notas.</h2>
                <p className="mt-5 leading-7 text-background/70">
                  Capture o que importa e volte depois para revisar com calma. O Pineapple Note foi pensado para transformar informação em uma experiência de estudo.
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

        <section id="perguntas" className="border-t border-border px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Perguntas frequentes</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Antes de começar.</h2>
            </div>

            <div className="mt-10 divide-y divide-border rounded-3xl border border-border bg-card">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-5 sm:p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold">
                    <span>{faq.question}</span>
                    <ChevronDown size={19} className="shrink-0 text-muted-foreground transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 max-w-3xl pr-8 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="decode-analytics" className="border-t border-border bg-secondary/30 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-black">Mais um projeto criado por Decode Analytics.</h2>
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
