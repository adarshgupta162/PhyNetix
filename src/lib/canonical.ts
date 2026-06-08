// Canonical domain helpers
// Keep all user-facing auth flows on the custom domain in production.

export const CANONICAL_ORIGIN = "https://phynetix.me";

const STAGING_HOST = "phynetix.lovable.app";
export const STAGING_ORIGIN = `https://${STAGING_HOST}`;
const CANONICAL_HOSTS = new Set(["phynetix.me", "www.phynetix.me"]);

/** Check if we're running on a Lovable-served domain (preview or published) */
export function isLovableDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === STAGING_HOST ||
    hostname.includes("lovable.app") ||
    hostname.includes("lovableproject.com")
  );
}

/**
 * Returns an absolute URL for auth redirects.
 * Always points to the canonical domain in production contexts.
 */
export function getAuthRedirectTo(path: string): string {
  const hostname = window.location.hostname;
  // On canonical, staging, or any external deployment (Vercel etc.) → always canonical
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const origin = isLocal ? window.location.origin : CANONICAL_ORIGIN;

  if (path.startsWith("https://") || path.startsWith("http://")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Safety net: if anyone hits the published Lovable domain, forward them to the canonical domain.
 * Skips redirect when an OAuth callback is in progress (access_token in hash or ~oauth path).
 */
export function maybeRedirectToCanonical(): void {
  if (window.location.hostname !== STAGING_HOST) return;

  // Don't redirect during OAuth callbacks
  const hash = window.location.hash;
  const path = window.location.pathname;
  if (hash.includes("access_token") || path.startsWith("/~oauth")) return;

  const target = `${CANONICAL_ORIGIN}${path}${window.location.search}${hash}`;
  if (window.location.href === target) return;

  window.location.replace(target);
}

/** Check if we're on a custom domain (not lovable, not localhost) */
export function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    !hostname.includes("lovable.app") &&
    !hostname.includes("lovableproject.com") &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1"
  );
}
