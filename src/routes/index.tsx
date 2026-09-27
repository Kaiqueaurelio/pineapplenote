import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, BrainCircuit, FileAudio, Languages, MessageCircleMore, PlayCircle, Sparkles, Upload, Youtube } from "lucide-react";
import { useEffect, useState } from "react";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: FileAudio, title: "Do conteúdo ao conhecimento", text: "Envie áudios, vídeos, PDFs, documentos ou grave uma aula diretamente no app." },
  { icon: BrainCircuit, title: "Estudo organizado por IA", text: "Receba resumo, tópicos essenciais, transcrição, flashcards e quiz em um só lugar." },
  { icon: MessageCircleMore, title: "Seu material, sempre acessível", text: "Revise na biblioteca, acompanhe o progresso e retome seus estudos de onde parou." },
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
      { title: "Pineapple Note — Estude melhor com IA" },
      { name: "description", content: "Transforme aulas, documentos e vídeos em materiais de estudo organizados pela IA." },
      { property: "og:title", content: "Pineapple Note — Estude melhor com IA" },
      { property: "og:description", content: "Sua aula organizada em resumo, flashcards e quiz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user?.email_confirmed_at)));
  }, []);

  const openApp = () => navigate({ to: signedIn ? "/dashboard" : "/auth" });

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6">
          <a href="#inicio" className="flex items-center" aria-label="Pineapple Note"><img src={logoAsset.url} alt="Pineapple Note" className="h-10 w-auto sm:h-12" /></a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex" aria-label="Navegação principal"><a href="#como-funciona" className="hover:text-foreground">Como funciona</a><a href="#recursos" className="hover:text-foreground">Recursos</a><a href="#sobre" className="hover:text-foreground">Sobre</a></nav>
          <Button size="sm" onClick={openApp}>{signedIn ? "Abrir meus estudos" : "Entrar"}<ArrowRight size={16} /></Button>
        </div>
      </header>

      <section id="inicio" className="relative"><div className="pineapple-grid absolute inset-0 -z-10 opacity-[0.05]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:py-28">
          <div><p className="inline-flex items-center gap-2 rounded-full border border-violet-border bg-violet-soft px-3 py-1.5 text-xs font-extrabold text-brand-violet"><Sparkles size={14} /> Estudo inteligente, do seu jeito</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">Sua aula vira um plano de estudo que realmente funciona.</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">O Pineapple Note transforma conteúdos longos em materiais claros para você compreender, revisar e avançar com confiança.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={openApp}>Começar gratuitamente <ArrowRight size={18} /></Button><Button size="lg" variant="outline" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>Ver como funciona <PlayCircle size={18} /></Button></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground"><span className="inline-flex items-center gap-2"><BadgeCheck className="text-green-strong" size={17} /> Perfil e materiais privados</span><span className="inline-flex items-center gap-2"><BadgeCheck className="text-green-strong" size={17} /> Feito para celular e computador</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-md"><div className="absolute inset-8 rounded-[2.5rem] bg-brand-yellow/30 blur-3xl" /><div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-7"><div className="flex items-center justify-between"><span className="rounded-full bg-green-soft px-3 py-1 text-xs font-bold text-green-strong">Pineapple AI</span><Sparkles className="text-brand-violet" size={21} /></div><div className="mt-6 rounded-2xl bg-secondary p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Seu material está pronto</p><h2 className="mt-2 text-xl font-extrabold">Biologia celular</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold"><div className="rounded-xl bg-card p-3 text-green-strong">Resumo</div><div className="rounded-xl bg-card p-3 text-brand-violet">Flashcards</div><div className="rounded-xl bg-card p-3 text-yellow-strong">Quiz</div></div></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-green-soft/50 p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Upload size={19} /></div><div><p className="font-bold">Importe seu conteúdo</p><p className="text-xs text-muted-foreground">Áudio, vídeo, PDF ou documento</p></div></div></div></div>
        </div>
      </section>

      <section id="recursos" className="border-y border-border bg-card py-16 sm:py-24"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="max-w-2xl"><p className="text-sm font-extrabold uppercase tracking-wider text-green-strong">Tudo no mesmo lugar</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Menos tempo organizando. Mais tempo aprendendo.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-border bg-background p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-green-soft text-green-strong"><Icon size={21} /></div><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>)}</div></div></section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"><div className="max-w-2xl"><p className="text-sm font-extrabold uppercase tracking-wider text-brand-violet">Como funciona</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Do conteúdo bruto à revisão em três passos.</h2></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{steps.map(([number, title, text]) => <article key={number} className="rounded-2xl border border-border bg-card p-6 shadow-card"><span className="text-4xl font-extrabold text-primary/30">{number}</span><h3 className="mt-8 text-xl font-extrabold">{title}</h3><p className="mt-2 leading-relaxed text-muted-foreground">{text}</p></article>)}</div></section>

      <section className="bg-ink py-16 text-ink-foreground sm:py-24"><div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-violet text-brand-violet-foreground"><Youtube size={25} /></div><h2 className="mt-6 text-3xl font-extrabold sm:text-4xl">Sua próxima revisão começa aqui.</h2><p className="mt-4 max-w-2xl text-ink-muted">Crie uma conta, envie seu primeiro conteúdo e transforme o jeito como você estuda.</p><Button size="lg" variant="violet" className="mt-8" onClick={openApp}>Criar minha conta <ArrowRight size={18} /></Button></div></section>

      <footer id="sobre" className="border-t border-border bg-background"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><img src={logoAsset.url} alt="Pineapple Note" className="h-9 w-auto" /><p className="mt-2 text-muted-foreground">Estudo organizado para caber na sua rotina.</p></div><p className="font-semibold text-muted-foreground">Um projeto criado por <span className="text-foreground">Decode Analytics</span>.</p></div></footer>
    </main>
  );
}
