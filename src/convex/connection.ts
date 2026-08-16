import { createSignal, onCleanup, type Accessor } from "solid-js";
import type { ConnectionState } from "convex/browser";
import { useConvexClient } from "./context";

export function createConnectionState(): Accessor<ConnectionState> {
  const client = useConvexClient();
  const [state, setState] = createSignal(client.connectionState());
  const unsubscribe = client.subscribeToConnectionState((next) =>
    setState(() => next),
  );
  onCleanup(unsubscribe);
  return state;
}
