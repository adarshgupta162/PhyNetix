export type AuthMode = "login" | "signup" | "forgot" | "recovery";
export function getAuthMode(pathname: string, value: string | null): AuthMode {
  if (value === "reset" || value === "forgot") return "forgot";
  if (value === "recovery" || value === "signup" || value === "login") return value;
  return pathname === "/signup" ? "signup" : "login";
}
export function safeReturnPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\u0000-\u0020\\]/.test(decoded) || decoded.startsWith("//")) return fallback;
    const url = new URL(value, "https://phynetix.me");
    if (url.origin !== "https://phynetix.me" || /^\/(auth|login|signup)(\/|$)/.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
