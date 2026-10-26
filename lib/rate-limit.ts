import 'server-only'

import { headers } from 'next/headers'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastCleanup = Date.now()

function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Small in-process fixed-window limiter. It is intentionally dependency-free.
 * In a multi-instance deployment put a shared limiter (Redis/Upstash) in front
 * of the same endpoints; this still protects a single instance from bursts.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

export async function getRequestIp() {
  const store = await headers()
  const forwarded = store.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || store.get('x-real-ip') || store.get('cf-connecting-ip') || 'unknown'
}

export function safeCallbackUrl(value: unknown, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.includes('\\') || trimmed.includes('\n') || trimmed.includes('\r')) return fallback
  return trimmed.slice(0, 500) || fallback
}
