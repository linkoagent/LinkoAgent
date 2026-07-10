import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Un solo family para todo el sitio: antes el display usaba Fredoka (redondeada, informal),
// que no encajaba con el look más corporativo que se busca ahora.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const title = "Linko Agent — Plataforma de agentes de IA para WhatsApp";
const description =
  "Creá, entrená y administrá agentes de IA que responden, venden y hacen seguimiento por WhatsApp, 24/7.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: "/favicon.png",
    apple: "/appletouchicon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Linko Agent",
    title,
    description,
    images: [{ url: "/appletouchicon.png", width: 180, height: 180, alt: "Linko, el agente de IA de Linko Agent" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/appletouchicon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="bg-brand-glow bg-fixed antialiased">{children}</body>
    </html>
  );
}
