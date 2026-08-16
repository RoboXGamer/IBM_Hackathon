import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/client";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexSiteUrl = (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined)
  ?? convexUrl?.replace(".convex.cloud", ".convex.site");

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient(), crossDomainClient()],
});
