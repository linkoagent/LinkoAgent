"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MarketingDashboardMock } from "./dashboard-mock";
import { useLocale, useMarketingContent } from "./locale-provider";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

export function MarketingHero() {
  const { locale } = useLocale();
  const { hero } = useMarketingContent();

  return (
    <section id="top" className="bg-brand-glow px-6 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="inline-flex items-center rounded-full bg-primary-soft/15 px-3 py-1 font-display text-[11px] uppercase tracking-wide text-primary">
            {hero.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl">{hero.title}</h1>
          <p className="mt-4 font-display text-lg text-foreground">{hero.subtitle}</p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{hero.body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="inline-block rounded-lg bg-brand-button px-6 py-3 font-display text-[13px] text-white shadow-[0_10px_30px_-8px_hsl(258_92%_71%/0.6)] transition hover:brightness-110"
              >
                {locale === "es" ? "Crear cuenta gratis" : "Create free account"}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <a
                href="https://wa.me/5493516362806"
                className="inline-block rounded-lg border border-border bg-card px-6 py-3 font-display text-[13px] text-foreground transition hover:border-faint"
              >
                {locale === "es" ? "Hablar por WhatsApp" : "Chat on WhatsApp"}
              </a>
            </motion.div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {hero.chips.map((c) => (
              <span key={c} className="rounded-full border border-border px-3 py-1 font-display text-[11px] text-faint">
                {c}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
        >
          <MarketingDashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
