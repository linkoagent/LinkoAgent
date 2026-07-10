"use client";

import { useLocale } from "./locale-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-label="Español"
        aria-pressed={locale === "es"}
        className={`flex h-7 w-9 items-center justify-center rounded-full text-[15px] transition ${
          locale === "es" ? "bg-secondary" : "opacity-50 hover:opacity-100"
        }`}
      >
        🇦🇷
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-label="English"
        aria-pressed={locale === "en"}
        className={`flex h-7 w-9 items-center justify-center rounded-full text-[15px] transition ${
          locale === "en" ? "bg-secondary" : "opacity-50 hover:opacity-100"
        }`}
      >
        🇺🇸
      </button>
    </div>
  );
}
