import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, UserRound, Users } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { normalizeDomain } from "@/lib/institutional-email";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
    if (profile?.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Administração — Pineapple Note" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [materials, setMaterials] = useState<Tables<"study_materials">[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [profileResult, materialResult, domainResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("study_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("signup_email_domains").select("domain").order("domain"),
    ]);
    setLoading(false);
    if (profileResult.error || materialResult.error || domainResult.error) {
      toast.error("Não foi possível carregar os dados administrativos.");
      return;
    }
    setProfiles(profileResult.data ?? []);
    setMaterials(materialResult.data ?? []);
    setDomains((domainResult.data ?? []).map((item) => item.domain));
  }

  useEffect(() => { void load(); }, []);

  async function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = z.string().min(3).max(120).regex(/^[a-z0-9.-]+$/, "Use somente o domínio, por exemplo usp.br.").safeParse(normalizeDomain(String(form.get("domain") ?? "")));
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Informe um domínio válido.");
    setSaving(true);
    const { error } = await supabase.from("signup_email_domains").insert({ domain: parsed.data });
    setSaving(false);
    if (error) return toast.error("Não foi possível adicionar esse domínio.");
    event.currentTarget.reset();
    toast.success("Domínio institucional adicionado.");
    await load();
  }

  async function removeDomain(domain: string) {
    const { error } = await supabase.from("signup_email_domains").delete().eq("domain", domain);
    if (error) return toast.error("Não foi possível remover esse domínio.");
    toast.success("Domínio removido.");
    await load();
  }

  const students = profiles.filter((profile) => profile.role === "user").length;
  const admins = profiles.filter((profile) => profile.role === "admin").length;

  return (
    <main className="min-h-[100dvh] bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-bold text-brand-violet">Área protegida</p><h1 className="mt-1 text-3xl font-extrabold">Painel administrativo</h1><p className="mt-2 text-muted-foreground">Visão geral dos usuários, materiais e domínios autorizados.</p></div>
          <Link to="/dashboard"><Button variant="outline">Voltar à central</Button></Link>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Estudantes", value: students, icon: Users },
            { label: "Administradores", value: admins, icon: ShieldCheck },
            { label: "Materiais", value: materials.length, icon: BookOpen },
          ].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-card p-5 shadow-card"><Icon className="text-green-strong" size={22} /><p className="mt-5 text-3xl font-extrabold">{loading ? "—" : value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></article>)}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
          <article className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold">Domínios institucionais</h2><p className="mt-1 text-sm text-muted-foreground">Somente estes domínios podem criar novas contas de estudante.</p><form onSubmit={addDomain} className="mt-5 flex gap-2"><div className="min-w-0 flex-1"><Label htmlFor="domain" className="sr-only">Novo domínio</Label><Input id="domain" name="domain" placeholder="ex.: usp.br" maxLength={120} /></div><Button type="submit" disabled={saving}>Adicionar</Button></form><div className="mt-5 flex flex-wrap gap-2">{domains.map((domain) => <span key={domain} className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">*.{domain}<button type="button" onClick={() => void removeDomain(domain)} className="text-muted-foreground hover:text-destructive" aria-label={`Remover ${domain}`}>×</button></span>)}</div></article>
          <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card"><div className="border-b border-border p-5 sm:p-6"><h2 className="text-xl font-bold">Usuários cadastrados</h2><p className="mt-1 text-sm text-muted-foreground">Perfis protegidos por permissões de administrador.</p></div><div className="max-h-[28rem] overflow-auto"><table className="w-full min-w-[36rem] text-left text-sm"><thead className="sticky top-0 bg-secondary text-muted-foreground"><tr><th className="p-4 font-semibold">Nome</th><th className="p-4 font-semibold">Instituição</th><th className="p-4 font-semibold">Curso</th><th className="p-4 font-semibold">Papel</th></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.user_id} className="border-t border-border"><td className="p-4 font-medium">{profile.display_name || "Sem nome"}</td><td className="p-4">{profile.institution || "—"}</td><td className="p-4">{profile.course || "—"}</td><td className="p-4"><span className={profile.role === "admin" ? "rounded-full bg-violet-soft px-2.5 py-1 text-xs font-bold text-brand-violet" : "rounded-full bg-green-soft px-2.5 py-1 text-xs font-bold text-green-strong"}>{profile.role === "admin" ? "Administrador" : "Estudante"}</span></td></tr>)}{!loading && profiles.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum perfil encontrado.</td></tr>}</tbody></table></div></article>
        </section>
      </div>
    </main>
  );
}
