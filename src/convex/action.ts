import { createSignal, useContext, type Accessor } from "solid-js";
import { isServer } from "@solidjs/web";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { ConvexClientContext } from "./context";

export type ConvexAction<ActionRef extends FunctionReference<"action">> = {
  (args: FunctionArgs<ActionRef>): Promise<FunctionReturnType<ActionRef>>;
  pending: Accessor<boolean>;
};

export function createConvexAction<
  ActionRef extends FunctionReference<"action">,
>(actionReference: ActionRef): ConvexAction<ActionRef> {
  const client = useContext(ConvexClientContext);

  if (!client) {
    if (!isServer)
      throw new Error("createConvexAction must be used within ConvexProvider");
    const stub = (async () => {
      throw new Error(
        "createConvexAction cannot execute during SSR without ConvexProvider",
      );
    }) as unknown as ConvexAction<ActionRef>;
    stub.pending = () => false;
    return stub;
  }

  const [inflight, setInflight] = createSignal(0);

  const call = ((args: FunctionArgs<ActionRef>) => {
    setInflight((n) => n + 1);
    return client
      .action(actionReference, args)
      .finally(() => setInflight((n) => n - 1));
  }) as ConvexAction<ActionRef>;

  call.pending = () => inflight() > 0;
  return call;
}
