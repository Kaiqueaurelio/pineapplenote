import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleHelp,
  Download,
  Gift,
  Heart,
  Info,
  KeyRound,
  LogOut,
  Monitor,
  Plus,
  RotateCcw,
  Shield,
  Smartphone,
  Star,
  Trash2,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — Pineapple Note" }] }),
  component: SettingsPage,
});

function Row({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: typeof Bell;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[76px] w-full items-center gap-4 border-b border-border/80 px-4 text-left last:border-b-0 hover:bg-secondary/60 ${danger ? "text-destructive" : "text-foreground"}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${danger ? "bg-destructive/10" : "bg-secondary"}`}>
        <Icon size={21} />
      </span>
      <span className="flex-1 text-[17px] font-semibold">{label}</span>
      <ChevronRight className="text-muted-foreground" size={22} />
    </button>
  );
}

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(() => localStorage.getItem("pineapple-notifications") !== "off");
  const [dialog, setDialog] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("pineapple-notifications", notifications ? "on" : "off");
  }, [notifications]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function unsupported(label: string) {
    toast.info(`${label} estará disponível em uma próxima versão.`);
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:h-[72px] sm:px-6">
          <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-card" aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-center text-lg font-black">Configurações</h1>
          <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-card" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Configurações</h2>

        <button type="button" onClick={() => unsupported("Notas ilimitadas")} className="mt-7 w-full rounded-3xl bg-gradient-to-r from-brand-violet to-primary px-6 py-5 text-center text-lg font-black text-white shadow-soft">
          Obtenha notas ilimitadas
        </button>

        <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <Row icon={Gift} label="Ganhe um presente do Pineapple Note" onClick={() => setDialog("gift")} />
        </section>

        <h3 className="mb-3 mt-9 px-1 text-2xl font-black">Para você</h3>
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <Row icon={Star} label="Dê 5 estrelas para o Pineapple Note" onClick={() => setDialog("rating")} />
          <Row icon={Plus} label="Convidar um amigo" onClick={() => unsupported("Convites")} />
          <Row icon={Bell} label={`Notificações · ${notifications ? "ativadas" : "desativadas"}`} onClick={() => setNotifications((value) => !value)} />
          <Row icon={Smartphone} label="Bloqueio de aplicativos" onClick={() => unsupported("Bloqueio de aplicativos")} />
        </section>

        <h3 className="mb-3 mt-9 px-1 text-2xl font-black">Suporte e feedback</h3>
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <Row icon={CircleHelp} label="Central de Ajuda" onClick={() => setDialog("help")} />
          <Row icon={Info} label="Enviar feedback" onClick={() => setDialog("feedback")} />
        </section>

        <h3 className="mb-1 mt-9 px-1 text-2xl font-black">Conta</h3>
        <p className="mb-3 px-1 text-base text-muted-foreground">{user.email}</p>
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <Row icon={Volume2} label="Gravações salvas" onClick={() => navigate({ to: "/library" })} />
          <Row icon={Users} label="Plano Familiar" onClick={() => unsupported("Plano Familiar")} />
          <Row icon={RotateCcw} label="Restaurar compras" onClick={() => toast.success("Não há compras pendentes para restaurar nesta versão.")} />
          <Row icon={Monitor} label="Termos de serviço" onClick={() => setDialog("terms")} />
          <Row icon={Shield} label="Política de Privacidade" onClick={() => setDialog("privacy")} />
          <Row icon={Heart} label="Trabalhe no Pineapple Note" onClick={() => unsupported("Página de carreiras")} />
          <Row icon={LogOut} label="Sair" danger onClick={() => void signOut()} />
          <Row icon={Trash2} label="Excluir conta" danger onClick={() => setDialog("delete")} />
        </section>

        <div className="mt-8 text-center text-xs text-muted-foreground">Pineapple Note · Desenvolvido pela Decode Analytics</div>
      </main>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-[2rem] border border-border bg-background p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-black">
                {dialog === "help" ? "Central de Ajuda" : dialog === "feedback" ? "Feedback" : dialog === "terms" ? "Termos de serviço" : dialog === "privacy" ? "Política de Privacidade" : dialog === "delete" ? "Excluir conta" : dialog === "rating" ? "Avalie o Pineapple Note" : "Presente"}
              </h3>
              <button type="button" onClick={() => setDialog(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border"><X size={19} /></button>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {dialog === "help" && "Adicione um áudio, vídeo ou documento, processe o material e use resumo, transcrição, flashcards, quiz, podcast, slides e jogos para estudar."}
              {dialog === "feedback" && "Conte o que funcionou, o que está faltando ou onde encontrou um problema. Esta versão registra o feedback apenas nesta tela; a integração com suporte pode ser conectada depois."}
              {dialog === "terms" && "Os termos completos devem ser publicados pela Decode Analytics antes do lançamento público. Esta área já está preparada para receber o documento oficial."}
              {dialog === "privacy" && "A política de privacidade oficial deve ser publicada pela Decode Analytics antes do lançamento público. Esta área está preparada para receber o documento final."}
              {dialog === "delete" && "A exclusão permanente de uma conta precisa de uma rotina segura no backend. Por enquanto, não vamos apagar seus dados de forma incompleta pelo aplicativo."}
              {dialog === "rating" && "Obrigado por apoiar o Pineapple Note. A avaliação na App Store/Play Store será conectada quando o aplicativo estiver publicado."}
              {dialog === "gift" && "Convites e presentes podem ser ativados quando o sistema de planos e benefícios estiver conectado."}
            </p>
            <button type="button" onClick={() => setDialog(null)} className="mt-6 min-h-12 w-full rounded-2xl bg-foreground px-5 font-black text-background">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
