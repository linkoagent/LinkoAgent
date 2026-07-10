"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/utils";

interface NotificationItem {
  conversationId: string;
  customerName: string;
  preview: string;
  createdAt: string;
}

const POLL_MS = 20_000;

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
      setItems(data.items ?? []);
    } catch {
      // silencioso: un fallo de polling no debería romper la UI
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleOpenChange(open: boolean) {
    if (open && count > 0) {
      setCount(0);
      await fetch("/api/notifications/seen", { method: "POST" });
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-heart text-[10px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Mensajes nuevos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">No hay mensajes nuevos.</p>
        )}
        {items.map((item) => (
          <DropdownMenuItem key={`${item.conversationId}-${item.createdAt}`} asChild>
            <Link href={`/inbox/${item.conversationId}`} className="flex flex-col items-start gap-0.5 whitespace-normal">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-medium text-foreground">{item.customerName}</span>
                <span className="shrink-0 text-[10.5px] text-muted-foreground">{formatDateTime(item.createdAt)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.preview}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
