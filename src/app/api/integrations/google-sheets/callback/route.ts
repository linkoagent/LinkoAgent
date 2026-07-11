import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import {
  exchangeCodeForTokens,
  fetchAccountEmail,
  GOOGLE_SHEETS_PROVIDER,
  GOOGLE_SHEETS_OAUTH_STATE_COOKIE,
} from "@/lib/googleSheets/client";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const oauthError = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (oauthError) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=${encodeURIComponent(oauthError)}`);
  }

  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const stateCookie = req.cookies.get(GOOGLE_SHEETS_OAUTH_STATE_COOKIE)?.value;
  const [cookieState, cookieCompanyId] = (stateCookie ?? "").split(":");

  if (!code || !state || !stateCookie || cookieState !== state || cookieCompanyId !== ctx.companyId) {
    const response = NextResponse.redirect(`${appUrl()}/integrations?error=state_mismatch`);
    response.cookies.delete(GOOGLE_SHEETS_OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const accountEmail = await fetchAccountEmail(tokens.access_token);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.integration.upsert({
      where: { companyId_provider: { companyId: ctx.companyId, provider: GOOGLE_SHEETS_PROVIDER } },
      create: {
        companyId: ctx.companyId,
        provider: GOOGLE_SHEETS_PROVIDER,
        status: "CONNECTED",
        accountEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
        scope: tokens.scope,
        lastSyncAt: new Date(),
        lastError: null,
      },
      update: {
        status: "CONNECTED",
        accountEmail,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        tokenExpiresAt,
        scope: tokens.scope,
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    const response = NextResponse.redirect(`${appUrl()}/integrations?sheetsConnected=1`);
    response.cookies.delete(GOOGLE_SHEETS_OAUTH_STATE_COOKIE);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const response = NextResponse.redirect(`${appUrl()}/integrations?error=${encodeURIComponent(message)}`);
    response.cookies.delete(GOOGLE_SHEETS_OAUTH_STATE_COOKIE);
    return response;
  }
}
