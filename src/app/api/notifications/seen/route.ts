import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/tenant";
import { markNotificationsSeen } from "@/lib/notifications";

export async function POST() {
  const ctx = await requireCompanyContext();
  await markNotificationsSeen(ctx.userId);
  return NextResponse.json({ ok: true });
}
