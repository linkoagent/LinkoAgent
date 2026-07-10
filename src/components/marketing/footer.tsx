import Link from "next/link";
import { footerLinks, contactChannels } from "@/data/marketing";
import { Logomark, Wordmark } from "@/components/logomark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logomark size={26} />
              <Wordmark />
            </Link>
            <p className="mt-3 max-w-xs text-[12.5px] text-faint">
              La plataforma de agentes de IA que conecta empresas con clientes, automatiza conversaciones y convierte
              mensajes en ventas.
            </p>
          </div>

          <div>
            <div className="font-display text-[11px] uppercase tracking-wide text-faint">Producto</div>
            <ul className="mt-3 flex flex-col gap-2">
              {footerLinks.producto.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[13px] text-muted-foreground hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-display text-[11px] uppercase tracking-wide text-faint">Contacto</div>
            <ul className="mt-3 flex flex-col gap-2">
              {contactChannels.map((c) => (
                <li key={c.label}>
                  <a href={c.href} className="text-[13px] text-muted-foreground hover:text-foreground">
                    {c.value}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 font-display text-[11px] uppercase tracking-wide text-faint">Legal</div>
            <ul className="mt-3 flex flex-col gap-2">
              {footerLinks.legal.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[13px] text-muted-foreground hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center font-display text-[11px] text-faint">
          © {new Date().getFullYear()} Linko Agent. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
