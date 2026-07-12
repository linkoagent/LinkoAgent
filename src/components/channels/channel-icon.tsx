import { Instagram, MessageCircle, Send } from "lucide-react";
import type { ChannelType } from "@prisma/client";
import { cn } from "@/lib/utils";

const ICONS: Record<ChannelType, typeof Instagram> = {
  WHATSAPP: MessageCircle,
  INSTAGRAM: Instagram,
  MESSENGER: Send,
};

const COLORS: Record<ChannelType, string> = {
  WHATSAPP: "text-success",
  INSTAGRAM: "text-primary",
  MESSENGER: "text-muted-foreground",
};

/** Diferenciación visual por canal en el Inbox — WhatsApp e Instagram no deben verse igual. */
export function ChannelIcon({ type, className }: { type: ChannelType; className?: string }) {
  const Icon = ICONS[type] ?? MessageCircle;
  return <Icon className={cn("h-4 w-4", COLORS[type], className)} />;
}
