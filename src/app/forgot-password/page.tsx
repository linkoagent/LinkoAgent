"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logomark, Wordmark } from "@/components/logomark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Logomark size={40} />
          <Wordmark className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
          <h1 className="font-display text-lg font-semibold text-foreground">Recuperar contraseña</h1>

          {sent ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Si ese email está registrado, te llegó un enlace para elegir una nueva contraseña. Revisá tu bandeja de
              entrada.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Te mandamos un enlace a tu email para restablecerla.</p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="mt-2">
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
