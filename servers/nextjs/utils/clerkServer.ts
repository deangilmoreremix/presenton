import "server-only";

/**
 * Server-side Clerk helpers. Returns the current Clerk user id (sub) or null.
 * Used by route handlers (e.g. /api/user-config) to scope data per user when
 * Clerk is the auth provider.
 */
export async function getClerkUserIdOrNull(): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}
