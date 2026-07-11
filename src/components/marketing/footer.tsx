"use client";

import Link from "next/link";
import { Logomark, Wordmark } from "@/components/logomark";
import { useLocale, useMarketingContent } from "./locale-provider";
import { contactIconFor } from "./contact-icons";

export function MarketingFooter() {
  const { locale } = useLocale();
  const { footerLinks, contactChannels, footerTagline, copyright } = useMarketingContent();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Logomark size={26} />
              <Wordmark />
            </Link>
            <p className="mt-3 max-w-xs text-[12.5px] text-faint">{footerTagline}</p>
          </div>

          <div>
            <div className="font-display text-[11px] uppercase tracking-wide text-faint">
              {locale === "es" ? "Producto" : "Product"}
            </div>
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
            <div className="font-display text-[11px] uppercase tracking-wide text-faint">
              {locale === "es" ? "Contacto" : "Contact"}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {contactChannels.map((c) => {
                const Icon = contactIconFor(c.label);
                return (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {c.value}
                    </a>
                  </li>
                );
              })}
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
          {copyright(new Date().getFullYear())}
        </div>
      </div>
    </footer>
  );
}
