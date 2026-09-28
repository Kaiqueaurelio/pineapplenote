import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, GraduationCap, Loader2, Mail } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";

import logoAsset from "@/assets/pineapple-note-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { formatAcceptedDomains, isInstitutionalEmail } from "@/lib/institutional-email";

const ADMIN_EMAIL = "decoanalytics@outlook.com.br";

const credentialsSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(255),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
});

const signupSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  institution: z.string().trim().max(120),
  course: z.string().trim().max(120),
}).refine(({ email }) => email.toLowerCase() === ADMIN_EMAIL || isInstitutionalEmail(email), {
  message: `Use um e-mail institucional aceito: ${formatAcceptedDomains()}.`,
  path: ["email"],
});

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional() }).catch({}),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Pineapple Note" },
      { name: "description", content: "Entre ou crie sua conta no Pineapple Note." },
      { property: "og:title", content: "Acesse o Pineapple Note" },
      { property: "og:description", content: "Sua aula. Organizada pela IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(searchParams.mode ?? "login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.mode) setMode(searchParams.mode);
  }, [searchParams.mode]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email_confirmed_at) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function resendConfirmation(email: string) {
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      setError("Informe um e-mail válido para reenviar a confirmação.");
      return;
    }
    setPending(true);
    setError("");
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setPending(false);
    if (resendError) return setError("Não foi possível reenviar agora. Aguarde um pouco e tente novamente.");
    setMessage("Novo link de confirmação enviado. Confira também a pasta de spam.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const raw = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      name: String(form.get("name") ?? ""),
      institution: String(form.get("institution") ?? ""),
      course: String(form.get("course") ?? ""),
    };
    const result = mode === "signup" ? signupSchema.safeParse(raw) : credentialsSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Revise os dados informados.");
      return;
    }

    setPending(true);
    if (mode === "signup") {
      const signupData = signupSchema.parse(raw);
      const { data, error: signupError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: signupData.name,
            institution: signupData.institution,
            course: signupData.course,
          },
        },
      });
      setPending(false);
      if (signupError) return setError(signupError.message);
      if (!data.user?.email_confirmed_at) {
        setMessage("Conta criada. Enviamos um link de confirmação para seu e-mail. Confirme o endereço antes de entrar.");
        return;
      }
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    const loginData = credentialsSchema.parse(raw);
    const { data, error: loginError } = await supabase.auth.signInWithPassword(loginData);
    setPending(false);
    if (loginError) {
      return setError("E-mail ou senha incorretos. Se a conta foi criada agora, confirme o e-mail antes de entrar.");
    }
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setError("Seu e-mail ainda não foi confirmado.");
      setMessage("Confirme o link enviado para seu e-mail antes de acessar a central de estudos.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signInWithGoogle() {
    setPending(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google. Tente novamente.");
      setPending(false);
      return;
    }
    if (!result.redirected) navigate({ to: "/dashboard", replace: true });
  }

  async function sendRecovery() {
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) return setError("Informe seu e-mail para receber o link de recuperação.");
    setPending(true);
    setError("");
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (recoveryError) return setError("Não foi possível enviar o link agora. Tente novamente.");
    setMessage("Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
  }

  return (
    <main className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pineapple-grid absolute inset-0 opacity-15" />
        <img src={logoAsset.url} alt="Pineapple Note" className="relative h-20 w-fit rounded-lg bg-background px-3" />
        <div className="relative max-w-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap size={28} /></div>
          <h1 className="text-4xl font-extrabold leading-tight">Sua aula.<br />Organizada pela IA.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">Transforme aulas, áudios, vídeos e documentos em materiais prontos para estudar.</p>
        </div>
        <p className="relative text-sm text-ink-muted">Estude com clareza. Revise com constância.</p>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center px-4 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10">
        <div className="w-full max-w-md px-0.5">
          <img src={logoAsset.url} alt="Pineapple Note" className="mx-auto mb-8 h-20 w-auto lg:hidden" />
          <div className="mb-8 grid grid-cols-2 rounded-lg bg-secondary p-1" aria-label="Escolher acesso ou cadastro">
            <Button type="button" variant={mode === "login" ? "secondary" : "ghost"} size="sm" onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Entrar</Button>
            <Button type="button" variant={mode === "signup" ? "secondary" : "ghost"} size="sm" onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Criar conta</Button>
          </div>

          <h2 className="text-3xl font-extrabold">{mode === "login" ? "Que bom ter você de volta" : "Comece a estudar melhor"}</h2>
          <p className="mt-2 text-muted-foreground">{mode === "login" ? "Entre para continuar de onde parou." : "Crie sua conta e confirme seu e-mail para começar."}</p>

          {message && <div className="mt-6 flex gap-3 rounded-lg border border-primary/30 bg-green-soft p-4 text-sm text-green-strong"><CheckCircle2 className="shrink-0" size={20} /><span>{message}</span></div>}
          {error && <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "signup" && <>
              <div className="space-y-2"><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" autoComplete="name" maxLength={80} required className="h-12 text-base" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="institution">Instituição</Label><Input id="institution" name="institution" maxLength={120} placeholder="Sua faculdade" className="h-12 text-base" /></div>
                <div className="space-y-2"><Label htmlFor="course">Curso</Label><Input id="course" name="course" maxLength={120} placeholder="Seu curso" className="h-12 text-base" /></div>
              </div>
            </>}
            <div className="space-y-2"><Label htmlFor="email">E-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 text-muted-foreground" size={18} /><Input id="email" name="email" type="email" autoComplete="email" maxLength={255} required className="h-11 pl-10" placeholder="voce@instituicao.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} /></div>{mode === "signup" && <p className="text-xs leading-relaxed text-muted-foreground">Aceitamos e-mails institucionais: <strong>{formatAcceptedDomains()}</strong>. Outras instituições podem ser incluídas pelo administrador.</p>}</div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Senha</Label>{mode === "login" && <button type="button" onClick={sendRecovery} className="text-xs font-semibold text-green-strong hover:underline">Esqueci minha senha</button>}</div><div className="relative"><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={72} required className="h-11 pr-11" /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</Button></div></div>
            <Button type="submit" className="w-full" disabled={pending}>{pending && <Loader2 className="animate-spin" size={17} />}{mode === "login" ? "Entrar" : "Criar conta"}</Button>
          </form>

          {mode === "login" && (
            <Button type="button" variant="ghost" className="mt-3 w-full text-sm" disabled={pending} onClick={() => resendConfirmation(email)}>
              Reenviar confirmação de e-mail
            </Button>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou continue com<span className="h-px flex-1 bg-border" /></div>
          <Button type="button" variant="outline" className="w-full" onClick={signInWithGoogle} disabled={pending}><span className="text-base font-extrabold">G</span> Google</Button>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">Ao continuar, você concorda com o uso seguro dos seus dados para manter sua conta e seus estudos.</p>
        </div>
      </section>
    </main>
  );
}
