import Image from "next/image";
import { cn } from "@/lib/utils";

/** Linko, nuestro personaje: robot violeta multi-brazos con pañuelo y medallón "L". Fondo transparente, sin placa de color detrás. */
export function Logomark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <Image src="/linkomascot.png" alt="Linko" fill sizes="128px" className="object-contain" priority />
    </div>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight text-foreground", className)}>
      Link<span className="text-primary">o</span> Agent
    </span>
  );
}
