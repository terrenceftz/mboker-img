const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_ENTRIES = 10_000;

type RateLimitEntry = { failures: number; expiresAt: number };

export class LoginRateLimiter {
  private readonly attempts = new Map<string, RateLimitEntry>();

  constructor(private readonly options: { now?: () => number } = {}) {}

  private now() {
    return this.options.now?.() ?? Date.now();
  }

  private prune() {
    const now = this.now();
    for (const [ip, entry] of this.attempts) {
      if (entry.expiresAt <= now) this.attempts.delete(ip);
    }
    while (this.attempts.size >= MAX_ENTRIES) {
      const oldest = this.attempts.keys().next().value;
      if (!oldest) break;
      this.attempts.delete(oldest);
    }
  }

  isLimited(ip: string) {
    this.prune();
    return (this.attempts.get(ip)?.failures ?? 0) >= MAX_FAILURES;
  }

  recordFailure(ip: string) {
    this.prune();
    const now = this.now();
    const current = this.attempts.get(ip);
    this.attempts.set(ip, {
      failures: (current?.failures ?? 0) + 1,
      expiresAt: current?.expiresAt ?? now + WINDOW_MS,
    });
  }

  reset(ip: string) {
    this.attempts.delete(ip);
  }

  retryAfterSeconds(ip: string) {
    this.prune();
    const expiresAt = this.attempts.get(ip)?.expiresAt;
    return expiresAt ? Math.max(1, Math.ceil((expiresAt - this.now()) / 1000)) : 0;
  }
}

export const loginRateLimiter = new LoginRateLimiter();
