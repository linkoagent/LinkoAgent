"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logomark, Wordmark } from "@/components/logomark";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear la cuenta.");
      return;
    }

    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Logomark size={40} />
          <Wordmark className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
          <h1 className="font-display text-lg font-semibold text-foreground">Creá tu cuenta</h1>

          {done ? (
            <p className="mt-3 text-sm text-muted-foreground">
              ¡Listo! Te mandamos un email a <strong className="text-foreground">{form.email}</strong> para confirmar
              tu cuenta — abrilo y confirmá para poder iniciar sesión.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Empezá gratis con el plan Starter.</p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Tu nombre</Label>
                  <Input id="name" required value={form.name} onChange={update("name")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="companyName">Nombre de la empresa</Label>
                  <Input id="companyName" required value={form.companyName} onChange={update("companyName")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={update("email")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    minLength={8}
                    required
                    value={form.password}
                    onChange={update("password")}
                  />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="mt-2">
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
