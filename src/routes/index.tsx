import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pineapple Note — Sua aula. Organizada pela IA." },
      { name: "description", content: "Acesse sua central de estudos inteligente." },
      { property: "og:title", content: "Pineapple Note — Sua aula. Organizada pela IA." },
      { property: "og:description", content: "Transforme conteúdo em conhecimento com uma central de estudos inteligente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeRedirect,
});

function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      navigate({ to: data.user ? "/dashboard" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <img src={logoAsset.url} alt="Pineapple Note" className="mx-auto h-24 w-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Preparando seus estudos...</p>
      </div>
    </main>
  );
}