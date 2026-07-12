import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  subscribeInstagramWebhooks,
  fetchInstagramProfile,
  INSTAGRAM_OAUTH_STATE_COOKIE,
} from "@/lib/instagram/oauth";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const oauthError = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (oauthError) {
    return NextResponse.redirect(`${appUrl()}/channels?error=${encodeURIComponent(oauthError)}`);
  }

  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const stateCookie = req.cookies.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value;
  const [cookieState, cookieCompanyId] = (stateCookie ?? "").split(":");

  if (!code || !state || !stateCookie || cookieState !== state || cookieCompanyId !== ctx.companyId) {
    const response = NextResponse.redirect(`${appUrl()}/channels?error=state_mismatch`);
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    await subscribeInstagramWebhooks(longLived.access_token);
    const profile = await fetchInstagramProfile(longLived.access_token);

    const tokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000);
    const existing = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "INSTAGRAM" } });
    const data = {
      companyId: ctx.companyId,
      type: "INSTAGRAM" as const,
      accountId: profile.userId,
      accountName: profile.username,
      accessToken: longLived.access_token,
      tokenExpiresAt,
      scope: "instagram_business_basic,instagram_business_manage_messages",
      metadata: {
        username: profile.username,
        name: profile.name,
        followersCount: profile.followersCount,
        profilePictureUrl: profile.profilePictureUrl,
      },
      status: "CONNECTED" as const,
      connectedAt: new Date(),
      lastError: null,
    };

    if (existing) {
      await prisma.channel.update({ where: { id: existing.id }, data });
    } else {
      await prisma.channel.create({ data });
    }

    const response = NextResponse.redirect(`${appUrl()}/channels?instagramConnected=1`);
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const response = NextResponse.redirect(`${appUrl()}/channels?error=${encodeURIComponent(message)}`);
    response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
    return response;
  }
}
