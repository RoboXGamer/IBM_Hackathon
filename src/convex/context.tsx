import { createContext, useContext, type ParentProps } from "solid-js";
import { ConvexClient } from "convex/browser";

export const ConvexClientContext = createContext<ConvexClient | null>(null);

export function ConvexProvider(
  props: ParentProps<{ client: ConvexClient | null }>,
) {
  return (
    <ConvexClientContext value={props.client}>
      {props.children}
    </ConvexClientContext>
  );
}

export function useConvexClient(): ConvexClient {
  const client = useContext(ConvexClientContext);
  if (!client)
    throw new Error("useConvexClient must be used within ConvexProvider");
  return client;
}

export function useOptionalConvexClient(): ConvexClient | null {
  return useContext(ConvexClientContext);
}
