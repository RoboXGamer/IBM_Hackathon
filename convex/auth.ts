import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import { convexSiteUrl, siteUrl, trustedOrigins } from "./authOrigins";

export const authComponent = createClient<DataModel>(components.betterAuth);
export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth({
  baseURL: convexSiteUrl,
  trustedOrigins,
  database: authComponent.adapter(ctx),
  emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 8 },
  plugins: [crossDomain({ siteUrl }), convex({ authConfig })],
});
export const { getAuthUser } = authComponent.clientApi();
