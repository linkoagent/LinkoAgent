"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useMarketingContent } from "./locale-provider";
import { Reveal } from "./reveal";

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border py-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={open}>
        <span className="font-display text-[13.5px] text-foreground">{q}</span>
        <motion.span
          className="font-display text-lg text-faint"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MarketingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const { locale } = useLocale();
  const { faqs } = useMarketingContent();

  return (
    <section id="faq" className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal className="mb-10">
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">
            {locale === "es" ? "Preguntas frecuentes" : "Frequently asked questions"}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {locale === "es" ? "Todo lo que preguntan antes de empezar." : "Everything people ask before getting started."}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          {faqs.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
