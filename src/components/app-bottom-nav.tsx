import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GraduationCap, Home, Library, Plus, UserRound } from "lucide-react";

type Tab = {
  label: string;
  icon: typeof Home;
  to: "/dashboard" | "/library" | "/study" | "/settings";
};

const tabs: Tab[] = [
  { label: "Início", icon: Home, to: "/dashboard" },
  { label: "Notas", icon: Library, to: "/library" },
  { label: "Estudar", icon: GraduationCap, to: "/study" },
  { label: "Perfil", icon: UserRound, to: "/settings" },
];

export function AppBottomNav({ onCreate }: { onCreate?: () => void }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const go = (tab: Tab) => {
    if (pathname === tab.to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void navigate({ to: tab.to });
  };

  const create = () => {
    if (onCreate) {
      onCreate();
      return;
    }
    void navigate({ to: "/dashboard", search: { novo: true } });
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_color-mix(in_oklab,var(--foreground)_8%,transparent)] backdrop-blur-xl md:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-[4.5rem] max-w-md items-center justify-between px-4">
        {tabs.slice(0, 2).map((tab) => (
          <TabButton key={tab.to} tab={tab} active={pathname === tab.to} onSelect={() => go(tab)} />
        ))}

        <button
          type="button"
          onClick={create}
          aria-label="Criar nova nota"
          className="-mt-9 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(145deg,var(--brand-violet),var(--primary))] text-primary-foreground shadow-[0_12px_28px_color-mix(in_oklab,var(--brand-violet)_38%,transparent)] ring-[6px] ring-background transition-transform duration-150 active:scale-90"
        >
          <Plus size={30} strokeWidth={2.6} />
        </button>

        {tabs.slice(2).map((tab) => (
          <TabButton key={tab.to} tab={tab} active={pathname === tab.to} onSelect={() => go(tab)} />
        ))}
      </div>
    </nav>
  );
}

function TabButton({
  tab,
  active,
  onSelect,
}: {
  tab: Tab;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-w-[3.75rem] flex-col items-center gap-1 rounded-xl px-1 py-1 text-[11px] transition-all duration-150 active:scale-90 ${
        active ? "font-extrabold text-primary" : "font-semibold text-muted-foreground"
      }`}
    >
      {active && (
        <span className="absolute -top-2.5 h-1 w-7 rounded-full bg-primary transition-all duration-200" />
      )}
      <tab.icon size={21} strokeWidth={active ? 2.5 : 2} />
      {tab.label}
    </button>
  );
}
