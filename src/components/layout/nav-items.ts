import { LayoutDashboard, Inbox, Bot, BookOpen, Radio, Plug, Package, Users, BarChart3, Gauge, Settings, ShieldCheck } from "lucide-react";
import type { Role } from "@prisma/client";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT_HUMAN"] },
  { href: "/inbox", label: "Inbox", icon: Inbox, roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT_HUMAN"] },
  { href: "/agents", label: "Agentes IA", icon: Bot, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/knowledge", label: "Base de conocimiento", icon: BookOpen, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/channels", label: "Canales", icon: Radio, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/integrations", label: "Integraciones", icon: Plug, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/products", label: "Productos", icon: Package, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/customers", label: "Clientes", icon: Users, roles: ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT_HUMAN"] },
  { href: "/metrics", label: "Métricas", icon: BarChart3, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/usage", label: "Uso y plan", icon: Gauge, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/settings", label: "Configuración", icon: Settings, roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
  { href: "/admin", label: "Panel Super Admin", icon: ShieldCheck, roles: ["SUPER_ADMIN"] },
];
