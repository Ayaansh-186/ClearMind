// Simple in-memory rate limiter for single-instance deployments.
// For multi-instance/production scale, replace with a shared store (e.g. Upstash Redis).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodically clear stale entries to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}, 60_000)

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key Unique identifier for the caller (e.g. IP + route)
 * @param limit Max requests allowed within the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count++
  return true
}

/** Extract a best-effort client identifier from request headers */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
