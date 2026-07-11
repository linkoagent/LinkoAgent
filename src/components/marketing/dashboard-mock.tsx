"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useLocale } from "./locale-provider";
import { HoverLift } from "./reveal";

const bars = [38, 52, 44, 61, 57, 82, 49, 65, 58, 71, 66, 90, 74, 80];

function CountUp({ target, inView }: { target: number; inView: boolean }) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v).toLocaleString("es-AR"));
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, target, { duration: 1.1, ease: [0.21, 0.47, 0.32, 0.98] });
    return controls.stop;
  }, [inView, target, value]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (spanRef.current) spanRef.current.textContent = v;
    });
  }, [rounded]);

  return <span ref={spanRef}>0</span>;
}

export function MarketingDashboardMock() {
  const { locale } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-40px" });

  const t =
    locale === "es"
      ? {
          path: "/dashboard",
          kpis: [
            { label: "Conversaciones", val: 312, delta: "↑ 12% vs ayer" },
            { label: "Activas ahora", val: 24, delta: "18 con IA · 6 con humano" },
            { label: "Resp. prom.", val: null, display: "00:42", delta: "↓ 9s" },
            { label: "Leads", val: 37, delta: "↑ 5" },
          ],
          chartTitle: "Conversaciones · últimos 14 días",
          channelTitle: "Por canal",
          live: "En vivo",
        }
      : {
          path: "/dashboard",
          kpis: [
            { label: "Conversations", val: 312, delta: "↑ 12% vs yesterday" },
            { label: "Active now", val: 24, delta: "18 with AI · 6 with human" },
            { label: "Avg. response", val: null, display: "00:42", delta: "↓ 9s" },
            { label: "Leads", val: 37, delta: "↑ 5" },
          ],
          chartTitle: "Conversations · last 14 days",
          channelTitle: "By channel",
          live: "Live",
        };

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      <div className="flex items-center gap-2 border-b border-border bg-card-soft px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <div className="ml-1 font-display text-[11px] text-faint">app.linkoagent.com{t.path}</div>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-success"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-display text-[10px] text-faint">{t.live}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          {t.kpis.map((k) => (
            <HoverLift key={k.label}>
              <div className="rounded-xl bg-card-soft p-3">
                <div className="font-display text-[10px] uppercase tracking-wide text-faint">{k.label}</div>
                <div className="mt-1 font-display text-lg text-foreground tabular-nums">
                  {k.val !== null ? <CountUp target={k.val} inView={inView} /> : k.display}
                </div>
                <div className="mt-0.5 text-[11px] text-success">{k.delta}</div>
              </div>
            </HoverLift>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <div className="rounded-xl bg-card-soft p-4">
            <div className="mb-3 font-display text-[11px] uppercase tracking-wide text-faint">{t.chartTitle}</div>
            <div className="flex h-24 items-end gap-1.5">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-t ${i === 5 || i === 11 ? "bg-star" : "bg-primary"} opacity-90`}
                  style={{ height: `${h}%`, transformOrigin: "bottom" }}
                  initial={{ scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-card-soft p-4">
            <div className="mb-3 font-display text-[11px] uppercase tracking-wide text-faint">{t.channelTitle}</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="w-16 shrink-0 text-muted-foreground">WhatsApp</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full bg-success"
                    initial={{ width: "0%" }}
                    animate={{ width: inView ? "100%" : "0%" }}
                    transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-display text-faint">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
