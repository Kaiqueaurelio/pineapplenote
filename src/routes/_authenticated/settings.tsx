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
      className={`flex min-h-[72px] w-full items-center gap-4 border-b border-[#e5e5ea] px-5 text-left last:border-b-0 active:bg-[#f2f2f7] ${danger ? "text-[#ff453a]" : "text-black"}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${danger ? "bg-[#f2f2f7]" : "bg-[#f2f2f7]"}`}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <span className="flex-1 text-[17px] font-medium tracking-[-0.2px]">{label}</span>
      <ChevronRight className="shrink-0 text-[#8e8e93]" size={22} strokeWidth={2.2} />
    </button>
  );
}

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("pineapple-notifications") !== "off",
  );
  const [dialog, setDialog] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("pineapple-notifications", notifications ? "on" : "off");
  }, [notifications]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f7] text-black">
      <header className="sticky top-0 z-30 border-b border-[#d8d8dd] bg-[#f2f2f7]/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-[74px] max-w-3xl items-center px-4">
          <div className="h-11 w-11" aria-hidden="true" />
          <h1 className="flex-1 text-center text-[22px] font-bold tracking-[-0.5px]">Configurações</h1>
          <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d8dd] bg-[#f8f8fa]" aria-label="Fechar">
            <X size={25} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-0 sm:px-6">
        <section className="overflow-hidden rounded-[28px] bg-white">
          <Row icon={CircleHelp} label="Central de Ajuda" onClick={() => setDialog("help")} />
        </section>

        <h2 className="mb-2 mt-16 text-[32px] font-bold tracking-[-1px]">Conta</h2>
        <p className="mb-8 text-[17px]">{user.email}</p>

        <section className="overflow-hidden rounded-[28px] bg-white">
          <Row icon={Volume2} label="Gravações e materiais" onClick={() => navigate({ to: "/library" })} />
          <Row icon={Bell} label={"Notificações: " + (notifications ? "ativadas" : "desativadas")} onClick={() => setNotifications((value) => !value)} />
          <Row icon={RotateCcw} label="Restaurar compras" onClick={() => toast.info("Não há compras associadas a esta conta para restaurar.")} />
          <Row icon={Monitor} label="Termos de serviço" onClick={() => setDialog("terms")} />
          <Row icon={Shield} label="Política de Privacidade" onClick={() => setDialog("privacy")} />
          <Row icon={LogOut} label="Sair" danger onClick={() => void signOut()} />
          <Row icon={Trash2} label="Excluir conta" danger onClick={() => setDialog("delete")} />
        </section>

        <div className="mt-8 text-center text-xs text-[#8e8e93]">Pineapple Note · Desenvolvido pela Decode Analytics</div>
      </main>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-[28px] bg-[#f2f2f7] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-bold">{dialog === "help" ? "Central de Ajuda" : dialog === "terms" ? "Termos de serviço" : dialog === "privacy" ? "Política de Privacidade" : dialog === "delete" ? "Excluir conta" : dialog === "rating" ? "Avalie o Pineapple Note" : "Informações"}</h3>
              <button type="button" onClick={() => setDialog(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white"><X size={20} /></button>
            </div>
            <p className="mt-4 text-[15px] leading-7 text-[#636366]">
              {dialog === "help" && "Adicione um áudio, vídeo, documento ou link. O Pineapple Note organiza o conteúdo e prepara resumo, transcrição, flashcards, quiz, podcast, slides e jogos."}
              {dialog === "terms" && "O uso do Pineapple Note exige respeito às leis aplicáveis, aos direitos autorais e às regras de uso da plataforma. Este texto é informativo e não substitui os termos oficiais."}
              {dialog === "privacy" && "O Pineapple Note processa dados de conta e conteúdos enviados para oferecer os recursos da plataforma. Consulte a política oficial da Decode Analytics quando publicada para conhecer detalhes de retenção, segurança e direitos do usuário."}
              {dialog === "delete" && "A exclusão permanente precisa ser executada por uma rotina segura no backend. Nenhum dado será removido de forma incompleta."}
              {dialog !== "help" && dialog !== "terms" && dialog !== "privacy" && dialog !== "delete" && "Esta seção está preparada para receber o conteúdo oficial."}
            </p>
            <button type="button" onClick={() => setDialog(null)} className="mt-6 min-h-12 w-full rounded-full bg-black px-5 font-bold text-white">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
