"use client";

import { useLocale } from "./locale-provider";
import { FlagAR, FlagUS } from "./flag-icons";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-label="Español"
        aria-pressed={locale === "es"}
        className={`flex h-7 w-9 items-center justify-center rounded-full transition ${
          locale === "es" ? "bg-secondary" : "opacity-50 hover:opacity-100"
        }`}
      >
        <FlagAR className="h-3.5 w-5 rounded-[2px]" />
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-label="English"
        aria-pressed={locale === "en"}
        className={`flex h-7 w-9 items-center justify-center rounded-full transition ${
          locale === "en" ? "bg-secondary" : "opacity-50 hover:opacity-100"
        }`}
      >
        <FlagUS className="h-3.5 w-5 rounded-[2px]" />
      </button>
    </div>
  );
}
