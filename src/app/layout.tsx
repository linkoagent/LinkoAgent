import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const title = "Linko Agent — Plataforma de agentes de IA para WhatsApp, Instagram y Messenger";
const description =
  "Creá, entrená y administrá agentes de IA que responden, venden y hacen seguimiento por WhatsApp, Instagram y Messenger, 24/7.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Linko Agent",
    title,
    description,
    images: [{ url: "/apple-touch-icon.png", width: 180, height: 180, alt: "Linko, el agente de IA de Linko Agent" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/apple-touch-icon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fredoka.variable} ${jakarta.variable}`}>
      <body className="bg-brand-glow bg-fixed antialiased">{children}</body>
    </html>
  );
}
