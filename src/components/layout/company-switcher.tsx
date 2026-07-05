"use client";

import { useTransition } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { switchCompany } from "@/lib/actions/company";

interface MembershipOption {
  companyId: string;
  company: { name: string };
}

export function CompanySwitcher({
  memberships,
  activeCompanyId,
}: {
  memberships: MembershipOption[];
  activeCompanyId: string;
}) {
  const [pending, startTransition] = useTransition();
  const active = memberships.find((m) => m.companyId === activeCompanyId);

  if (memberships.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm sm:flex">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{active?.company.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {active?.company.name}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Cambiar de empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem key={m.companyId} onSelect={() => startTransition(() => switchCompany(m.companyId))}>
            {m.companyId === activeCompanyId ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5" />}
            {m.company.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
