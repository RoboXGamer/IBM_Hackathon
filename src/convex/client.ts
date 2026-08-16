import { ConvexClient, ConvexHttpClient } from "convex/browser";
import type { ConvexClientOptions } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
export const convex = convexUrl ? new ConvexClient(convexUrl) : null;

export const isConvexConfigured = Boolean(convexUrl);

export function createConvexClient(
  address: string,
  options?: ConvexClientOptions,
): ConvexClient {
  return new ConvexClient(address, options);
}

export function createConvexHttpClient(
  address: string,
  options?: ConstructorParameters<typeof ConvexHttpClient>[1],
): ConvexHttpClient {
  return new ConvexHttpClient(address, options);
}
