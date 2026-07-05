"use client";

import { useState } from "react";
import { faqs } from "@/data/marketing";

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
        <span className="font-display text-lg text-faint">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground">{a}</p>}
    </div>
  );
}

export function MarketingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10">
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">Preguntas frecuentes</span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Todo lo que preguntan antes de empezar.</h2>
        </div>
        <div>
          {faqs.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
