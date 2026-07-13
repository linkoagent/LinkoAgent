"use client";

import { useState } from "react";
import { useLocale, useMarketingContent } from "./locale-provider";
import { Reveal } from "./reveal";
import { contactIconFor } from "./contact-icons";

const initialForm = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  canal: "WhatsApp",
  mensajesPorMes: "",
  rubro: "",
  mensaje: "",
};

export function MarketingContact() {
  const [form, setForm] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();
  const { contactChannels } = useMarketingContent();

  const update = (field: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.nombre,
        company: form.empresa,
        email: form.email,
        phone: form.telefono,
        channel: form.canal,
        monthlyMessages: form.mensajesPorMes,
        industry: form.rubro,
        message: form.mensaje,
      }),
    });

    setSending(false);

    if (!res.ok) {
      setError(
        locale === "es"
          ? "No pudimos enviar tu consulta. Probá de nuevo o escribinos por WhatsApp."
          : "We couldn't send your request. Try again or message us on WhatsApp."
      );
      return;
    }
    setSent(true);
  };

  return (
    <section id="contacto" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">
            {locale === "es" ? "Contacto" : "Contact"}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {locale === "es" ? "Pidamos una demo con tu propio caso." : "Let's book a demo with your own use case."}
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {locale === "es"
              ? "Contanos qué canal querés automatizar y te mostramos el agente funcionando con tu negocio, no con un ejemplo genérico."
              : "Tell us which channel you want to automate and we'll show you the agent working with your own business, not a generic example."}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {contactChannels.map((c) => {
              const Icon = contactIconFor(c.label);
              return (
                <a
                  key={c.label}
                  href={c.href}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5 transition hover:border-faint"
                >
                  <span className="flex items-center gap-2.5">
                    {Icon && <Icon className="h-6 w-6 shrink-0" />}
                    <span className="font-display text-[12px] uppercase tracking-wide text-faint">{c.label}</span>
                  </span>
                  <span className="text-[13.5px] text-foreground">{c.value}</span>
                </a>
              );
            })}
            <p className="font-display text-[11px] text-faint">
              {locale === "es" ? "Respuesta en menos de 24hs." : "Response within 24 hours."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="font-display text-2xl text-success">✓</span>
              <p className="font-display text-[14px] text-foreground">
                {locale === "es" ? "Listo, recibimos tu consulta." : "Done, we received your request."}
              </p>
              <p className="max-w-sm text-[13px] text-muted-foreground">
                {locale === "es"
                  ? "Te vamos a escribir en menos de 24hs para coordinar la demo."
                  : "We'll reach out within 24 hours to schedule the demo."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                {locale === "es" ? "Nombre" : "Name"}
                <input
                  required
                  value={form.nombre}
                  onChange={update("nombre")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                {locale === "es" ? "Empresa" : "Company"}
                <input
                  required
                  value={form.empresa}
                  onChange={update("empresa")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                {locale === "es" ? "Teléfono" : "Phone"}
                <input
                  value={form.telefono}
                  onChange={update("telefono")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                {locale === "es" ? "Canal a automatizar" : "Channel to automate"}
                <select
                  value={form.canal}
                  onChange={update("canal")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                >
                  <option>WhatsApp</option>
                  <option>Instagram</option>
                  <option>{locale === "es" ? "Varios canales" : "Multiple channels"}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                {locale === "es" ? "Mensajes aprox. por mes" : "Approx. messages per month"}
                <input
                  value={form.mensajesPorMes}
                  onChange={update("mensajesPorMes")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground sm:col-span-2">
                {locale === "es" ? "Rubro" : "Industry"}
                <input
                  value={form.rubro}
                  onChange={update("rubro")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-muted-foreground sm:col-span-2">
                {locale === "es" ? "Mensaje" : "Message"}
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={update("mensaje")}
                  className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary"
                />
              </label>

              {error && <p className="text-[12.5px] text-destructive sm:col-span-2">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-brand-button px-5 py-3 font-display text-[13px] text-white transition hover:brightness-110 disabled:opacity-60 sm:col-span-2"
              >
                {sending ? (locale === "es" ? "Enviando..." : "Sending...") : locale === "es" ? "Solicitar demo" : "Request demo"}
              </button>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}
