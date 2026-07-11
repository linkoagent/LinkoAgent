"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelAppointmentFromDashboard } from "@/lib/actions/agenda";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => cancelAppointmentFromDashboard(appointmentId))}
    >
      Cancelar
    </Button>
  );
}
