import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Linko Agent",
  robots: { index: false, follow: true },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
