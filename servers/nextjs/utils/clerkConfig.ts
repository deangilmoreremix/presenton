/**
 * Centralised Clerk feature flag. The whole Clerk integration is gated on the
 * presence of the publishable key so the app degrades gracefully to its
 * built-in basic auth when Clerk is not configured (e.g. local dev, Electron).
 */
export function isClerkEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return true;
  }
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).env) {
    const env = (window as unknown as Record<string, unknown>).env as Record<string, string>;
    if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return true;
  }
  return false;
}

export function getClerkPublishableKey(): string | undefined {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  if (typeof window !== "undefined") {
    const env = (window as unknown as Record<string, unknown>).env as Record<string, string> | undefined;
    return env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  return undefined;
}
