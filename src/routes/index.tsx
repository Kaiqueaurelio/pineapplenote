import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileAudio2,
  FileText,
  Gamepad2,
  Headphones,
  Languages,
  MessageCircle,
  Mic2,
  NotebookPen,
  Play,
  Podcast,
  Sparkles,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pineapple Note — Nunca mais anote tudo sozinho" },
      {
        name: "description",
        content:
          "Grave aulas, envie arquivos e transforme seu conteúdo em notas, transcrições e materiais de estudo com o Pineapple Note.",
      },
      { property: "og:title", content: "Pineapple Note — Nunca mais anote tudo sozinho" },
      {
        property: "og:description",
        content: "Notas, transcrições e materiais de estudo organizados com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const previews = [
  {
    eyebrow: "NOTAS DA AULA",
    title: "Fundamentos de biologia celular",
    summary:
      "A célula é a unidade estrutural e funcional dos seres vivos. Suas organelas trabalham em conjunto para manter o metabolismo e a reprodução celular.",
    tag: "Resumo pronto",
    icon: FileText,
    cards: ["Resumo organizado", "12 flashcards", "Quiz com 8 questões"],
  },
  {
    eyebrow: "REVISÃO INTELIGENTE",
    title: "O que você já aprendeu",
    summary:
      "Revise os conceitos principais em pequenas etapas. Suas respostas ajudam a escolher o próximo tópico para estudar.",
    tag: "Flashcards",
    icon: BookOpen,
    cards: ["Membrana plasmática", "Organelas celulares", "Síntese de proteínas"],
  },
  {
    eyebrow: "CONVERSE COM O MATERIAL",
    title: "Pergunte sobre a sua aula",
    summary:
      "Por que as mitocôndrias são chamadas de usinas de energia? Elas produzem a maior parte do ATP usado pela célula.",
    tag: "Tutor IA",
    icon: MessageCircle,
    cards: ["Respostas baseadas nas notas", "Citações do conteúdo", "Explicações passo a passo"],
  },
];

const workflow = [
  {
    number: "01",
    title: "Grave ou envie",
    description: "Use uma aula, reunião, áudio, vídeo ou documento.",
    icon: Mic2,
  },
  {
    number: "02",
    title: "Receba suas notas",
    description: "A IA organiza o conteúdo e cria uma transcrição clara.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Revise e aprenda",
    description: "Pratique com flashcards, quizzes e seu tutor de IA.",
    icon: BookOpen,
  },
];

const featureItems = [
  {
    icon: Upload,
    title: "Grave ou envie",
    description: "Aulas, reuniões, PDFs, documentos, áudios e vídeos no mesmo lugar.",
  },
  {
    icon: NotebookPen,
    title: "Notas e transcrições",
    description: "Conteúdo organizado para encontrar os pontos principais rapidamente.",
  },
  {
    icon: MessageCircle,
    title: "Converse com suas notas",
    description: "Pergunte ao seu material e receba respostas baseadas no conteúdo.",
  },
  {
    icon: BookOpen,
    title: "Quizzes e flashcards",
    description: "Transforme cada aula em atividades de revisão para praticar.",
  },
  {
    icon: Podcast,
    title: "Podcasts de estudo",
    description: "Ouça uma revisão falada a partir do material que você enviou.",
  },
  {
    icon: Languages,
    title: "Estude em outros idiomas",
    description: "Traduza seus materiais e continue estudando no idioma que preferir.",
  },
  {
    icon: Gamepad2,
    title: "Jogos de estudo",
    description: "Pratique os conceitos com atividades rápidas e interativas.",
  },
  {
    icon: Headphones,
    title: "No seu ritmo",
    description: "Acesse seus materiais pelo navegador no computador ou celular.",
  },
];

const faqs = [
  {
    question: "O que é o Pineapple Note?",
    answer:
      "É um espaço de estudo com IA que transforma aulas, gravações e documentos em notas, transcrições e atividades de revisão.",
  },
  {
    question: "Que tipos de conteúdo posso enviar?",
    answer:
      "Você pode gravar áudio ou enviar arquivos de áudio, vídeo e documentos compatíveis. A importação de páginas por link ainda está em evolução.",
  },
  {
    question: "Posso conversar com o meu material?",
    answer:
      "Sim. Depois que o material for processado, você pode perguntar sobre o conteúdo e receber respostas baseadas nas suas notas.",
  },
  {
    question: "Funciona no celular?",
    answer: "Sim. O Pineapple Note funciona no navegador do celular, tablet e computador.",
  },
];

function LandingPage() {
  const [previewIndex, setPreviewIndex] = useState(0);
  const preview = previews[previewIndex];
  const PreviewIcon = preview.icon;

  const movePreview = (direction: number) => {
    setPreviewIndex((index) => (index + direction + previews.length) % previews.length);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f1e9] text-[#191815] selection:bg-[#d9c6ff] selection:text-[#191815]">
      <header className="sticky top-0 z-50 border-b border-[#191815]/[0.06] bg-[#f4f1e9]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-9 lg:px-14">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Pineapple Note — início">
            <img
              src="/pineapple-note-app-icon.png"
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="text-[17px] font-bold tracking-[-0.04em]">Pineapple Note</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-black/5 sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171714] px-5 text-sm font-semibold text-white transition hover:bg-[#35342f]"
            >
              Começar grátis <ArrowRight size={15} />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100svh-76px)] max-w-[1440px] items-center gap-8 px-5 pb-14 pt-8 sm:px-9 sm:pb-20 sm:pt-12 lg:grid-cols-[1.06fr_.94fr] lg:gap-10 lg:px-14 lg:py-12">
          <div className="relative z-10 max-w-[670px]">
            <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-[#77746d] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#8071a2]" /> Áudios
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#8071a2]" /> Notas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#8071a2]" /> Flashcards
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-[#8071a2]" /> Quizzes
              </span>
            </div>

            <p className="mb-3 text-sm font-semibold tracking-wide text-[#736b5c] sm:text-base">
              Seu assistente de estudos
            </p>
            <h1 className="max-w-[680px] text-[clamp(3.5rem,7.35vw,7.25rem)] font-medium leading-[.88] tracking-[-0.075em]">
              Nunca mais
              <br />
              anote tudo.
            </h1>
            <p className="mt-7 max-w-[520px] text-base leading-7 text-[#66635d] sm:mt-8 sm:text-lg sm:leading-8">
              Grave aulas, envie seus arquivos e receba notas, transcrições e materiais para estudar
              sem perder o fio da explicação.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#171714] px-6 text-sm font-semibold text-white transition hover:bg-[#35342f]"
              >
                Começar grátis <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth"
                search={{ mode: "login" }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#191815]/15 px-6 text-sm font-semibold transition hover:bg-white/60"
              >
                <Play size={14} fill="currentColor" /> Entrar na minha conta
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-[#77746d]">
              <Sparkles size={14} className="text-[#8b6cc2]" />
              Feito para você prestar atenção na aula.
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[550px] lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -inset-5 rounded-[42%] bg-[#e7dfcf] blur-3xl"
            />
            <div className="relative overflow-hidden rounded-[28px] border border-[#29251f]/10 bg-[#fffefa] p-3 shadow-[0_28px_90px_-38px_rgba(35,30,20,.32)] sm:rounded-[34px] sm:p-4">
              <div className="flex items-center justify-between gap-4 px-2 pb-3 pt-1 sm:px-3 sm:pb-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0ebf7] text-[#74638e]">
                    <PreviewIcon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold tracking-wide text-[#827f77]">
                      {preview.eyebrow}
                    </p>
                    <p className="truncate text-sm font-semibold">Seu material de estudo</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#edf3e9] px-2.5 py-1.5 text-[10px] font-semibold text-[#58684d] sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#779568]" /> Pronto
                </span>
              </div>

              <div className="relative overflow-hidden rounded-[21px] bg-[#f5f2ea] p-4 sm:min-h-[410px] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-[330px]">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#827c70]">
                      {preview.tag}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-.04em] sm:text-[27px]">
                      {preview.title}
                    </h2>
                  </div>
                  <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#74638e] shadow-sm sm:flex">
                    <Sparkles size={16} />
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4 shadow-[0_8px_25px_-20px_rgba(0,0,0,.45)] sm:mt-6 sm:p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#5d5850]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f2edf8] text-[#74638e]">
                      <NotebookPen size={14} />
                    </span>
                    Resumo inteligente
                  </div>
                  <p className="text-[13px] leading-[1.7] text-[#706c65] sm:text-sm sm:leading-6">
                    {preview.summary}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-[#eeeae2] pt-3 text-[10px] font-medium text-[#8a857a]">
                    <FileAudio2 size={13} /> Transcrição e tópicos organizados
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-3">
                  {preview.cards.map((card, index) => (
                    <div key={card} className="rounded-xl border border-[#eae6dd] bg-white/85 p-3">
                      <span className="text-[10px] font-bold text-[#8b7ca5]">0{index + 1}</span>
                      <p className="mt-1.5 text-[11px] font-semibold leading-4 text-[#514e48]">
                        {card}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#e5dfd3] pt-3">
                  <div className="flex items-center gap-1.5">
                    {previews.map((item, index) => (
                      <button
                        key={item.eyebrow}
                        type="button"
                        aria-label={`Mostrar prévia ${index + 1}`}
                        aria-current={index === previewIndex}
                        onClick={() => setPreviewIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${index === previewIndex ? "w-7 bg-[#77658f]" : "w-1.5 bg-[#d3cec3] hover:bg-[#a9a294]"}`}
                      />
                    ))}
                    <span className="ml-2 text-[10px] text-[#827d72]">
                      {previewIndex + 1} / {previews.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      aria-label="Prévia anterior"
                      onClick={() => movePreview(-1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8d2c8] bg-white transition hover:bg-[#f8f6f1]"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Próxima prévia"
                      onClick={() => movePreview(1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8d2c8] bg-white transition hover:bg-[#f8f6f1]"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-[#2b251c]/[0.08] bg-white px-4 py-3 shadow-[0_15px_45px_-25px_rgba(0,0,0,.4)] sm:flex lg:-left-10">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1edf7] text-[#74638e]">
                <Check size={17} />
              </span>
              <span>
                <span className="block text-xs font-semibold">Material organizado</span>
                <span className="mt-0.5 block text-[10px] text-[#827d72]">Pronto para revisar</span>
              </span>
            </div>
          </div>
        </section>

        <section className="border-y border-[#201e19]/[0.08] bg-[#eeeae0] px-5 py-7 sm:px-9 sm:py-9 lg:px-14">
          <div className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center sm:justify-between">
            <p className="w-full text-xs font-semibold text-[#827d72] sm:w-auto sm:text-left">
              Tudo para estudar melhor
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#59564f]">
              <Mic2 size={16} className="text-[#82709e]" /> Grave aulas
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#59564f]">
              <Upload size={16} className="text-[#82709e]" /> Envie arquivos
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#59564f]">
              <BookOpen size={16} className="text-[#82709e]" /> Revise com IA
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#59564f]">
              <Languages size={16} className="text-[#82709e]" /> Estude em outros idiomas
            </span>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 px-5 py-20 sm:px-9 sm:py-28 lg:px-14">
          <div className="mx-auto max-w-[1260px]">
            <div className="max-w-[620px]">
              <p className="text-sm font-semibold text-[#82709e]">Como funciona</p>
              <h2 className="mt-3 text-4xl font-medium leading-[1.04] tracking-[-.06em] sm:text-6xl">
                Do conteúdo à revisão, sem complicar.
              </h2>
              <p className="mt-5 max-w-[520px] leading-7 text-[#706c65]">
                Capture o que está sendo explicado. O Pineapple Note organiza o material para você
                voltar, praticar e aprender no seu ritmo.
              </p>
            </div>
            <div className="mt-12 grid gap-3 md:grid-cols-3 md:gap-4">
              {workflow.map(({ number, title, description, icon: Icon }) => (
                <article
                  key={number}
                  className="rounded-[22px] border border-[#25221d]/[0.09] bg-[#faf8f3] p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8c877d]">{number}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee9f5] text-[#74638e]">
                      <Icon size={18} />
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold tracking-[-.035em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#706c65]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="recursos"
          className="scroll-mt-24 bg-[#ebe7dd] px-5 py-20 sm:px-9 sm:py-28 lg:px-14"
        >
          <div className="mx-auto max-w-[1260px]">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-[680px]">
                <p className="text-sm font-semibold text-[#82709e]">Recursos</p>
                <h2 className="mt-3 text-4xl font-medium leading-[1.04] tracking-[-.06em] sm:text-6xl">
                  Capture, organize e aprenda.
                </h2>
              </div>
              <p className="max-w-[390px] leading-7 text-[#706c65]">
                Suas aulas viram uma base de estudo que você pode consultar de vários jeitos.
              </p>
            </div>

            <div className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
              {featureItems.map(({ icon: Icon, title, description }) => (
                <article key={title} className="border-t border-[#24211c]/15 py-6 sm:py-7">
                  <Icon size={19} strokeWidth={1.7} className="text-[#77658f]" />
                  <h3 className="mt-5 text-base font-semibold tracking-[-.02em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#706c65]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dispositivos" className="px-5 py-20 sm:px-9 sm:py-28 lg:px-14">
          <div className="mx-auto grid max-w-[1260px] items-center gap-10 rounded-[28px] bg-[#1d1c19] px-6 py-9 text-[#f4f1e9] sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">
            <div className="max-w-[680px]">
              <p className="text-sm font-medium text-[#c5b4e1]">Para computador e celular</p>
              <h2 className="mt-3 text-4xl font-medium leading-[1.03] tracking-[-.06em] sm:text-6xl">
                Sua atenção fica na aula. Suas notas ficam com você.
              </h2>
              <p className="mt-5 max-w-[560px] leading-7 text-white/65">
                Acesse seus materiais pelo navegador e continue de onde parou, no seu próprio ritmo.
              </p>
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[#f4f1e9] px-6 text-sm font-semibold text-[#191815] transition hover:bg-white lg:self-center"
            >
              Criar minha conta <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section
          id="perguntas"
          className="scroll-mt-24 border-t border-[#201e19]/[0.08] px-5 py-20 sm:px-9 sm:py-24 lg:px-14"
        >
          <div className="mx-auto grid max-w-[1260px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-[#82709e]">Dúvidas</p>
              <h2 className="mt-3 text-4xl font-medium leading-[1.04] tracking-[-.06em] sm:text-6xl">
                Perguntas frequentes.
              </h2>
            </div>
            <div className="divide-y divide-[#201e19]/[0.12] border-y border-[#201e19]/[0.12]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[15px] font-semibold">
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-[#77736c] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 max-w-[700px] pr-8 text-sm leading-6 text-[#706c65]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#201e19]/[0.08] px-5 py-7 sm:px-9 lg:px-14">
        <div className="mx-auto flex max-w-[1260px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Pineapple Note — início">
            <img
              src="/pineapple-note-app-icon.png"
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="text-sm font-semibold tracking-[-.03em]">Pineapple Note</span>
          </Link>
          <span className="text-xs text-[#77736c]">
            © {new Date().getFullYear()} Pineapple Note · Desenvolvido pela Decode Analytics
          </span>
          <a
            href="#inicio"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5c5952] transition hover:text-black"
          >
            Voltar ao topo <ArrowDown size={13} className="rotate-180" />
          </a>
        </div>
      </footer>
    </div>
  );
}
