import { useState } from "react";
import { AudioLines, FileText, Home, Library, Link2, Plus, Settings, Sparkles } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type QuickAction = "record" | "document" | "link";

export function MobileBottomNav({ onQuickAction }: { onQuickAction?: (action: QuickAction) => void }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");
  const openAction = (action: QuickAction) => {
    setSheetOpen(false);
    if (onQuickAction) return onQuickAction(action);
    navigate({ to: "/dashboard", search: { new: action } });
  };

  return (
    <>
      <nav className="mobile-native-nav fixed inset-x-0 bottom-0 z-40 grid h-[4.5rem] grid-cols-5 border-t border-border bg-card/95 px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:hidden" aria-label="Navegação móvel">
        <button type="button" className={`flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active("/dashboard") ? "text-brand-violet" : "text-muted-foreground"}`} onClick={() => navigate({ to: "/dashboard" })}><Home size={20} />Início</button>
        <button type="button" className={`flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active("/library") ? "text-brand-violet" : "text-muted-foreground"}`} onClick={() => navigate({ to: "/library" })}><Library size={20} />Biblioteca</button>
        <div className="flex items-center justify-center"><button type="button" aria-label="Criar novo material" onClick={() => setSheetOpen(true)} className="flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full bg-brand-violet text-brand-violet-foreground shadow-lg ring-4 ring-card transition-transform active:scale-95"><Plus size={25} strokeWidth={2.5} /></button></div>
        <button type="button" className={`flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active("/exam") ? "text-brand-violet" : "text-muted-foreground"}`} onClick={() => navigate({ to: "/exam" })}><Sparkles size={20} />Revisão</button>
        <button type="button" className={`flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active("/settings") ? "text-brand-violet" : "text-muted-foreground"}`} onClick={() => navigate({ to: "/settings" })}><Settings size={20} />Perfil</button>
      </nav>
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="pb-[calc(1rem+env(safe-area-inset-bottom))] sm:hidden">
          <DrawerHeader className="px-6 pb-3"><DrawerTitle className="text-xl font-black">O que você quer estudar?</DrawerTitle><DrawerDescription>Escolha uma forma de adicionar seu próximo material.</DrawerDescription></DrawerHeader>
          <div className="grid gap-3 px-5 pb-5">
            <Button variant="outline" className="h-16 justify-start gap-4 rounded-2xl px-4 text-left" onClick={() => openAction("record")}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><AudioLines size={21} /></span><span><strong className="block">Gravar aula ao vivo</strong><small className="text-muted-foreground">Use o microfone do celular</small></span></Button>
            <Button variant="outline" className="h-16 justify-start gap-4 rounded-2xl px-4 text-left" onClick={() => openAction("document")}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={21} /></span><span><strong className="block">Enviar PDF ou apresentação</strong><small className="text-muted-foreground">Escolha um arquivo do dispositivo</small></span></Button>
            <Button variant="outline" className="h-16 justify-start gap-4 rounded-2xl px-4 text-left" onClick={() => openAction("link")}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet"><Link2 size={21} /></span><span><strong className="block">Importar link</strong><small className="text-muted-foreground">Vídeo ou artigo da web</small></span></Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
