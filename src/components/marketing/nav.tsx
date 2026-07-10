"use client";

import { useState } from "react";
import Link from "next/link";
import { Logomark, Wordmark } from "@/components/logomark";
import { useLocale, useMarketingContent } from "./locale-provider";
import { LanguageSwitcher } from "./language-switcher";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const { nav: marketingNav } = useMarketingContent();
  const loginLabel = locale === "es" ? "Iniciar sesión" : "Log in";
  const demoLabel = locale === "es" ? "Agendar demo" : "Book a demo";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logomark size={28} />
          <Wordmark />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {marketingNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 font-display text-[12.5px] text-muted-foreground transition hover:bg-card hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link href="/login" className="font-display text-[12.5px] text-muted-foreground hover:text-foreground">
            {loginLabel}
          </Link>
          <a
            href="/#contacto"
            className="rounded-lg bg-brand-button px-4 py-2 font-display text-[12.5px] text-white shadow-[0_6px_20px_-6px_hsl(258_92%_71%/0.55)] transition hover:brightness-110"
          >
            {demoLabel}
          </a>
        </div>

        <button
          type="button"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border md:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="font-display text-foreground">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {marketingNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 font-display text-[13px] text-muted-foreground hover:bg-card"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-border px-3 py-2 text-center font-display text-[13px] text-foreground"
              onClick={() => setOpen(false)}
            >
              {loginLabel}
            </Link>
            <a
              href="/#contacto"
              className="rounded-lg bg-brand-button px-3 py-2 text-center font-display text-[13px] text-white"
              onClick={() => setOpen(false)}
            >
              {demoLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
