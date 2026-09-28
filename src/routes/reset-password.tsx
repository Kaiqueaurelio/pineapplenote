import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Pineapple Note" },
      { name: "description", content: "Crie uma nova senha para sua conta Pineapple Note." },
      { property: "og:title", content: "Criar nova senha — Pineapple Note" },
      { property: "og:description", content: "Recupere o acesso à sua conta com segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setRecoveryReady(hash.get("type") === "recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    // A normal authenticated session is not enough to authorize a password reset.
    // Supabase emits PASSWORD_RECOVERY after the recovery link establishes the reset session.
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    const parsed = z.string().min(8, "Use pelo menos 8 caracteres.").max(72).safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Senha inválida.");
    if (password !== confirmation) return setError("As senhas não são iguais.");
    setPending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) return setError("O link expirou ou não é mais válido. Solicite outro link.");
    setDone(true);
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
        <img src={logoAsset.url} alt="Pineapple Note" className="mx-auto h-20 w-auto" />
        {done ? (
          <div className="mt-8 text-center">
            <CheckCircle2 className="mx-auto text-green-strong" size={42} />
            <h1 className="mt-4 text-2xl font-extrabold">Senha atualizada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você já pode continuar seus estudos.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => navigate({ to: "/dashboard", replace: true })}
            >
              Ir para meus estudos
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-lg bg-green-soft text-green-strong">
              <KeyRound size={22} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold">Crie uma nova senha</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha uma senha forte e diferente das anteriores.
            </p>
            {!recoveryReady && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                Abra esta página pelo link enviado ao seu e-mail.
              </p>
            )}
            {error && (
              <p role="alert" className="mt-5 text-sm text-destructive">
                {error}
              </p>
            )}
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation">Confirmar nova senha</Label>
                <Input
                  id="confirmation"
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!recoveryReady || pending}>
                {pending && <Loader2 className="animate-spin" size={17} />}Salvar nova senha
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
