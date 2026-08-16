const environment = (globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
export const siteUrl = environment.SITE_URL ?? "http://localhost:5173";
export const convexSiteUrl = environment.CONVEX_SITE_URL ?? "";
export const trustedOrigins = Array.from(new Set([siteUrl, "http://localhost:5173"]));
