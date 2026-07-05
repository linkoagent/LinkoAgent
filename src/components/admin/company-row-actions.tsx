"use client";

import { useTransition } from "react";
import type { PlanTier } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { toggleCompanyActive, changeCompanyPlan } from "@/lib/actions/admin";

export function CompanyRowActions({
  companyId,
  isActive,
  currentTier,
}: {
  companyId: string;
  isActive: boolean;
  currentTier: PlanTier;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <select
        defaultValue={currentTier}
        disabled={pending}
        onChange={(e) => startTransition(() => changeCompanyPlan(companyId, e.target.value as PlanTier))}
        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
      >
        <option value="STARTER">Starter</option>
        <option value="PRO">Pro</option>
        <option value="BUSINESS">Business</option>
        <option value="ENTERPRISE">Enterprise</option>
      </select>
      <div className="flex items-center gap-1.5 text-xs">
        <Switch
          checked={isActive}
          disabled={pending}
          onCheckedChange={(value) => startTransition(() => toggleCompanyActive(companyId, value))}
        />
        {isActive ? "Activa" : "Pausada"}
      </div>
    </div>
  );
}
