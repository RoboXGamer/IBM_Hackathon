import { createSignal, useContext, type Accessor } from "solid-js";
import { isServer } from "@solidjs/web";
import { ConvexClient } from "convex/browser";
import type { OptimisticUpdate } from "convex/browser";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { ConvexClientContext } from "./context";

export type ConvexMutation<Mutation extends FunctionReference<"mutation">> = {
  (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>>;
  withOptimisticUpdate(
    update: OptimisticUpdate<FunctionArgs<Mutation>>,
  ): ConvexMutation<Mutation>;
  pending: Accessor<boolean>;
};

export function createMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
): ConvexMutation<Mutation> {
  const client = useContext(ConvexClientContext);

  if (!client) {
    if (!isServer)
      throw new Error("createMutation must be used within ConvexProvider");
    const stub = (async () => {
      throw new Error(
        "createMutation cannot execute during SSR without ConvexProvider",
      );
    }) as unknown as ConvexMutation<Mutation>;
    stub.withOptimisticUpdate = () => stub;
    stub.pending = () => false;
    return stub;
  }

  return buildMutation(client, mutation, undefined);
}

function buildMutation<Mutation extends FunctionReference<"mutation">>(
  client: ConvexClient,
  mutation: Mutation,
  optimisticUpdate: OptimisticUpdate<FunctionArgs<Mutation>> | undefined,
): ConvexMutation<Mutation> {
  const [inflight, setInflight] = createSignal(0);

  const call = ((args: FunctionArgs<Mutation>) => {
    setInflight((n) => n + 1);
    const promise = optimisticUpdate
      ? client.mutation(mutation, args, { optimisticUpdate })
      : client.mutation(mutation, args);
    return promise.finally(() => setInflight((n) => n - 1));
  }) as ConvexMutation<Mutation>;

  call.withOptimisticUpdate = (update) =>
    buildMutation(client, mutation, update);
  call.pending = () => inflight() > 0;

  return call;
}
