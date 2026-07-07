const MP_API = "https://api.mercadopago.com";

function accessToken() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN;
}

/**
 * Igual criterio que los mocks de IA/WhatsApp/email: sin MERCADOPAGO_ACCESS_TOKEN (o con
 * MERCADOPAGO_MOCK_MODE=true), el checkout queda simulado para poder probar el flujo de
 * upgrade de plan sin tener todavía una cuenta de Mercado Pago conectada.
 */
export function isMercadoPagoMock() {
  return !accessToken() || process.env.MERCADOPAGO_MOCK_MODE === "true";
}

export interface CreatePreapprovalParams {
  reason: string;
  payerEmail: string;
  amountArs: number;
  externalReference: string;
  backUrl: string;
}

export interface PreapprovalResult {
  id: string;
  initPoint: string;
  mocked: boolean;
}

export async function createPreapproval(params: CreatePreapprovalParams): Promise<PreapprovalResult> {
  const { reason, payerEmail, amountArs, externalReference, backUrl } = params;

  if (isMercadoPagoMock()) {
    return {
      id: `mock-preapproval-${Date.now()}`,
      initPoint: `${backUrl}${backUrl.includes("?") ? "&" : "?"}mock=1`,
      mocked: true,
    };
  }

  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason,
      external_reference: externalReference,
      payer_email: payerEmail,
      back_url: backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amountArs,
        currency_id: "ARS",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mercado Pago preapproval failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id as string,
    initPoint: (data.init_point ?? data.sandbox_init_point) as string,
    mocked: false,
  };
}

export interface PreapprovalStatus {
  id: string;
  status: string;
  externalReference: string | null;
}

export async function getPreapproval(id: string): Promise<PreapprovalStatus> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mercado Pago preapproval lookup failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id as string,
    status: data.status as string,
    externalReference: (data.external_reference as string | undefined) ?? null,
  };
}
