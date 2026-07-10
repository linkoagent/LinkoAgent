import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/tenant";
import { getUnreadNotifications } from "@/lib/notifications";

export async function GET() {
  const ctx = await requireCompanyContext();
  const result = await getUnreadNotifications(ctx.userId, ctx.companyId);
  return NextResponse.json(result);
}
