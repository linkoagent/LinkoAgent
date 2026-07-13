import type { CompanyContext } from "@/lib/tenant";
import { MobileNav } from "./mobile-nav";
import { CompanySwitcher } from "./company-switcher";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { Badge } from "@/components/ui/badge";

export function Topbar({
  ctx,
  whatsappConnected,
  instagramConnected,
}: {
  ctx: CompanyContext;
  whatsappConnected: boolean;
  instagramConnected: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-sm sm:px-6">
      <MobileNav role={ctx.role} />
      <CompanySwitcher memberships={ctx.memberships} activeCompanyId={ctx.companyId} />

      {whatsappConnected && (
        <Badge variant="success" className="hidden sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          WhatsApp conectado
        </Badge>
      )}
      {instagramConnected && (
        <Badge variant="success" className="hidden sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Instagram conectado
        </Badge>
      )}

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <UserMenu name={ctx.userName} role={ctx.role} />
      </div>
    </header>
  );
}
