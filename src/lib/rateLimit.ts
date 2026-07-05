const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit simple en memoria (por proceso). Suficiente para el MVP corriendo en
 * una sola instancia; si se despliega con múltiples instancias conviene moverlo
 * a Redis u otro store compartido.
 */
export function rateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
