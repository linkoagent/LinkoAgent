import type { CompanyContext } from "@/lib/tenant";
import { MobileNav } from "./mobile-nav";
import { CompanySwitcher } from "./company-switcher";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Topbar({
  ctx,
  whatsappConnected,
}: {
  ctx: CompanyContext;
  whatsappConnected: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-sm sm:px-6">
      <MobileNav role={ctx.role} />
      <CompanySwitcher memberships={ctx.memberships} activeCompanyId={ctx.companyId} />

      <Badge variant={whatsappConnected ? "success" : "outline"} className="hidden sm:inline-flex">
        <span className={cn("h-1.5 w-1.5 rounded-full", whatsappConnected ? "bg-success" : "bg-muted-foreground")} />
        WhatsApp {whatsappConnected ? "conectado" : "sin conectar"}
      </Badge>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <UserMenu name={ctx.userName} role={ctx.role} />
      </div>
    </header>
  );
}
