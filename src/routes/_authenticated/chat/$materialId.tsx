import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Mic, Send, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/_authenticated/chat/$materialId")({
  head: () => ({ meta: [{ title: "Conversar com esta nota — Pineapple Note" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = Route.useRouteContext();
  const { materialId } = Route.useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Conversar com esta nota");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from("study_materials").select("title").eq("id", materialId).eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.title) setTitle(data.title);
    });
    const saved = localStorage.getItem(`pineapple-chat-${materialId}`);
    if (saved) {
      try { setMessages(JSON.parse(saved) as Message[]); } catch { /* ignore corrupt local history */ }
    }
  }, [materialId, user.id]);

  useEffect(() => {
    localStorage.setItem(`pineapple-chat-${materialId}`, JSON.stringify(messages));
  }, [materialId, messages]);

  async function sendQuestion() {
    const text = question.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setQuestion("");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("ai-tools", {
      body: { action: "chat", materialId, question: text },
    });
    setSending(false);
    if (error || data?.error) {
      toast.error(data?.error ?? "Não foi possível responder agora.");
      return;
    }
    setMessages([...next, { role: "assistant", content: String(data.answer ?? "") }]);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f2f7] text-black">
      <header className="sticky top-0 z-20 border-b border-[#d8d8dd] bg-[#f2f2f7]/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-[74px] max-w-3xl items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/material/$materialId", params: { materialId } })} aria-label="Voltar"><ArrowLeft size={21} /></Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brand-violet">Pineapple Tutor</p>
            <h1 className="truncate text-base font-black">{title}</h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm"><Bot size={20} /></span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 pb-28 pt-5">
        {messages.length === 0 && (
          <section className="my-auto rounded-[28px] bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f2f7] text-black"><Bot size={28} /></div>
            <h2 className="mt-5 text-2xl font-black">Converse com seu material</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Pergunte sobre conceitos, peça exemplos, compare ideias ou peça uma explicação mais simples.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Explique o assunto principal", "Quais pontos devo revisar?", "Dê um exemplo prático"].map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="rounded-full border border-[#d8d8dd] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f2f2f7]">{suggestion}</button>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-soft text-green-strong"><Bot size={18} /></span>}
              <div className={`max-w-[86%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md border border-border bg-card shadow-card"}`}>{message.content}</div>
              {message.role === "user" && <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-brand-violet"><UserRound size={18} /></span>}
            </div>
          ))}
          {sending && <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-soft text-green-strong"><Bot size={18} /></span>Pineapple está pensando…</div>}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8d8dd] bg-[#f2f2f7]/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
        <form onSubmit={(event) => { event.preventDefault(); void sendQuestion(); }} className="mx-auto flex max-w-3xl items-center gap-2">
          <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#636366]" aria-label="Entrada por voz" onClick={() => toast.info("A entrada por voz será ativada quando o navegador conceder acesso ao microfone.")}><Mic size={19} /></button>
          <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte algo sobre esta nota…" className="h-11 rounded-full border-0 bg-white px-5" disabled={sending} />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" disabled={sending || !question.trim()} aria-label="Enviar"><Send size={18} /></Button>
        </form>
      </div>
    </div>
  );
}
