import { NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const MAX_STORE_SIZE = 5000;

const globalForRateLimit = globalThis as unknown as {
  __indraniRateLimitStore?: Map<string, RateLimitEntry>;
};

function getStore(): Map<string, RateLimitEntry> {
  if (!globalForRateLimit.__indraniRateLimitStore) {
    globalForRateLimit.__indraniRateLimitStore = new Map<
      string,
      RateLimitEntry
    >();
  }

  return globalForRateLimit.__indraniRateLimitStore;
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  // If still full under heavy load, evict the oldest entries.
  if (store.size >= MAX_STORE_SIZE) {
    const excess = store.size - MAX_STORE_SIZE + 1;
    let removed = 0;

    for (const key of store.keys()) {
      store.delete(key);
      removed += 1;

      if (removed >= excess) {
        break;
      }
    }
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    if (store.size >= MAX_STORE_SIZE) {
      pruneExpiredEntries(store, now);
    }

    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      resetAt,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    ),
  };
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  message = "Too many requests. Please try again shortly.",
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
