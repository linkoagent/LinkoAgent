import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logomark, Wordmark } from "@/components/logomark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Logomark size={40} />
          <Wordmark className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/20">
          <p className="font-display text-6xl font-bold text-primary">404</p>
          <h1 className="mt-3 font-display text-lg font-semibold text-foreground">Esta página no existe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Puede que el link esté roto o que la página se haya movido. Volvé al inicio para seguir desde ahí.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/dashboard">Ir al panel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
