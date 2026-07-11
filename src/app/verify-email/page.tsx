import type { Metadata } from "next";
import Link from "next/link";
import { consumePasswordToken } from "@/lib/email/tokens";
import { Logomark, Wordmark } from "@/components/logomark";

export const metadata: Metadata = {
  title: "Confirmar email — Linko Agent",
  robots: { index: false, follow: true },
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  const result = token
    ? await consumePasswordToken(token)
    : { ok: false as const, error: "Este enlace no es válido. Pedí uno nuevo iniciando sesión." };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Logomark size={40} />
          <Wordmark className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
          <h1 className="font-display text-lg font-semibold text-foreground">Confirmar email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {result.ok
              ? "Listo, tu email quedó confirmado. Ya podés iniciar sesión."
              : result.error}
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
