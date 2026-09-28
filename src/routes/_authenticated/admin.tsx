import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Globe2,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (profile?.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Central de administração — Pineapple Note" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [materials, setMaterials] = useState<Tables<"study_materials">[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [adminName, setAdminName] = useState("Administrador");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: auth }, profileResult, materialResult, domainResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("study_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("signup_email_domains").select("domain").order("domain"),
    ]);
    setLoading(false);
    if (auth.user?.user_metadata.full_name) setAdminName(String(auth.user.user_metadata.full_name));
    if (profileResult.error || materialResult.error || domainResult.error)
      return toast.error("Não foi possível carregar a central administrativa.");
    setProfiles(profileResult.data ?? []);
    setMaterials(materialResult.data ?? []);
    setDomains((domainResult.data ?? []).map((item) => item.domain));
  }

  useEffect(() => {
    void load();
  }, []);

  async function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = normalizeDomain(String(new FormData(event.currentTarget).get("domain") ?? ""));
    const parsed = z
      .string()
      .min(3)
      .max(120)
      .regex(/^[a-z0-9.-]+$/, "Use apenas o domínio, como usp.br.")
      .safeParse(value);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0]?.message ?? "Informe um domínio válido.");
    setSaving(true);
    const { error } = await supabase.from("signup_email_domains").insert({ domain: parsed.data });
    setSaving(false);
    if (error)
      return toast.error("Não foi possível adicionar esse domínio. Ele pode já estar cadastrado.");
    event.currentTarget.reset();
    toast.success("Domínio institucional autorizado.");
    await load();
  }

  async function removeDomain(domain: string) {
    const { error } = await supabase.from("signup_email_domains").delete().eq("domain", domain);
    if (error) return toast.error("Não foi possível remover esse domínio.");
    toast.success("Domínio removido da lista.");
    await load();
  }

  const students = profiles.filter((profile) => profile.role === "user").length;
  const admins = profiles.filter((profile) => profile.role === "admin").length;
  const readyMaterials = materials.filter((material) => material.status === "ready").length;
  const failedMaterials = materials.filter((material) => material.status === "failed").length;
  const metrics = [
    {
      label: "Estudantes ativos",
      value: students,
      icon: Users,
      tone: "text-green-strong bg-green-soft",
    },
    {
      label: "Administradores",
      value: admins,
      icon: ShieldCheck,
      tone: "text-brand-violet bg-violet-soft",
    },
    {
      label: "Materiais prontos",
      value: readyMaterials,
      icon: BookOpen,
      tone: "text-yellow-strong bg-yellow-soft",
    },
    {
      label: "Atenção necessária",
      value: failedMaterials,
      icon: Activity,
      tone: failedMaterials
        ? "text-destructive bg-destructive/10"
        : "text-green-strong bg-green-soft",
    },
  ];

  return (
    <main className="min-h-[100dvh] bg-secondary/35 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-ink-foreground shadow-xl sm:px-9 sm:py-10">
          <div className="pineapple-grid absolute inset-0 opacity-20" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 bg-ink-foreground/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em]">
                <ShieldCheck size={15} /> Controle administrativo
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Olá, {adminName.split(" ")[0]}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
                Você está na central de governança do Pineapple Note. Gerencie acesso institucional
                e acompanhe a saúde da plataforma.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-ink-foreground/20 bg-ink-foreground/10 text-ink-foreground hover:bg-ink-foreground/20"
                onClick={() => void load()}
              >
                <RefreshCw size={16} /> Atualizar dados
              </Button>
              <Link to="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Abrir área do estudante <ArrowUpRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <article
              key={label}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={21} />
              </div>
              <p className="mt-5 text-3xl font-black">{loading ? "—" : value}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
            </article>
          ))}
        </section>
        <section className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.5fr]">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-brand-violet">
                <Globe2 size={20} />
              </div>
              <div>
                <h2 className="font-extrabold">Acesso institucional</h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Defina quais instituições podem criar contas de estudante.
                </p>
              </div>
            </div>
            <form onSubmit={addDomain} className="mt-6 flex gap-2">
              <div className="min-w-0 flex-1">
                <Label htmlFor="domain" className="sr-only">
                  Novo domínio
                </Label>
                <Input id="domain" name="domain" placeholder="ex.: usp.br" maxLength={120} />
              </div>
              <Button type="submit" disabled={saving}>
                Autorizar
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {domains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-bold"
                >
                  *.{domain}
                  <button
                    type="button"
                    onClick={() => void removeDomain(domain)}
                    className="rounded-full px-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remover ${domain}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {!loading && !domains.length && (
                <p className="text-sm text-muted-foreground">Nenhum domínio configurado.</p>
              )}
            </div>
          </article>
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-brand-violet">
                  <UserCog size={16} /> Gestão de acesso
                </p>
                <h2 className="mt-1 text-xl font-black">Pessoas na plataforma</h2>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {profiles.length} {profiles.length === 1 ? "perfil" : "perfis"}
              </span>
            </div>
            <div className="max-h-[30rem] overflow-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="sticky top-0 bg-secondary text-muted-foreground">
                  <tr>
                    <th className="p-4 font-bold">Perfil</th>
                    <th className="p-4 font-bold">Instituição</th>
                    <th className="p-4 font-bold">Curso</th>
                    <th className="p-4 font-bold">Permissão</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr
                      key={profile.user_id}
                      className="border-t border-border transition hover:bg-secondary/40"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${profile.role === "admin" ? "bg-violet-soft text-brand-violet" : "bg-green-soft text-green-strong"}`}
                          >
                            {(profile.display_name || "PN").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-bold">
                            {profile.display_name || "Perfil sem nome"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{profile.institution || "—"}</td>
                      <td className="p-4 text-muted-foreground">{profile.course || "—"}</td>
                      <td className="p-4">
                        <span
                          className={
                            profile.role === "admin"
                              ? "rounded-full bg-violet-soft px-2.5 py-1 text-xs font-black text-brand-violet"
                              : "rounded-full bg-green-soft px-2.5 py-1 text-xs font-black text-green-strong"
                          }
                        >
                          {profile.role === "admin" ? "Administrador" : "Estudante"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loading && !profiles.length && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-muted-foreground">
                        Nenhum perfil encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
