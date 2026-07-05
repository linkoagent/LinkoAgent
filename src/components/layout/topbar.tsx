import { Bell } from "lucide-react";
import type { CompanyContext } from "@/lib/tenant";
import { MobileNav } from "./mobile-nav";
import { CompanySwitcher } from "./company-switcher";
import { UserMenu } from "./user-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Topbar({
  ctx,
  whatsappConnected,
  pendingCount,
}: {
  ctx: CompanyContext;
  whatsappConnected: boolean;
  pendingCount: number;
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
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-heart text-[10px] font-semibold text-white">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
        <UserMenu name={ctx.userName} role={ctx.role} />
      </div>
    </header>
  );
}
