type TokenBucket = { count: number; reset: number };

const WINDOW = 60 * 1000; // 1 minute
const MAX = 20;
const buckets = new Map<string, TokenBucket>();

export function rateLimit(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + WINDOW });
    return { success: true };
  }
  if (bucket.count >= MAX) {
    return { success: false, reset: bucket.reset };
  }
  bucket.count += 1;
  return { success: true };
}
