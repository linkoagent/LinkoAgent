import { createHmac, timingSafeEqual } from "crypto";

/**
 * Valida la firma X-Hub-Signature-256 que Meta manda en cada webhook (HMAC-SHA256 del body
 * crudo con el App Secret). Sin esto, cualquiera que descubra la URL del webhook puede mandar
 * mensajes entrantes falsos y disparar respuestas de IA / consumo de plan como si vinieran de
 * un cliente real. Si no hay secret configurado (dev/mock), se deja pasar sin validar.
 */
export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null, appSecret: string | undefined): boolean {
  if (!appSecret) return true;
  if (!signatureHeader) return false;

  const [scheme, receivedSig] = signatureHeader.split("=");
  if (scheme !== "sha256" || !receivedSig) return false;

  const expectedSig = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const received = Buffer.from(receivedSig, "hex");
  const expected = Buffer.from(expectedSig, "hex");
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}
