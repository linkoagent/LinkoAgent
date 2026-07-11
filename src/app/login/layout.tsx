import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — Linko Agent",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
