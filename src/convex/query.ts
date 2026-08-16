import { createMemo, onCleanup, useContext, type Accessor } from "solid-js";
import { isServer } from "@solidjs/web";
import { ConvexHttpClient } from "convex/browser";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import { ConvexClientContext } from "./context";
import {
  resolveValue,
  toError,
  type CreateQueryOptions,
  type MaybeAccessor,
} from "./utils";

export async function prefetchQuery<Query extends FunctionReference<"query">>(
  client: ConvexHttpClient,
  query: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
  return client.query(query, args);
}

function hasOwnInitialValue<T>(
  options: CreateQueryOptions<T> | undefined,
): options is CreateQueryOptions<T> & { initialValue: T } {
  return (
    options != null &&
    Object.prototype.hasOwnProperty.call(options, "initialValue")
  );
}

function syncThenable<T>(value: T): PromiseLike<T> {
  return {
    then(onfulfilled?: ((current: T) => unknown) | null) {
      return syncThenable(onfulfilled ? onfulfilled(value) : value);
    },
  } as PromiseLike<T>;
}

export function createQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: MaybeAccessor<FunctionArgs<Query> | "skip">,
  options?: CreateQueryOptions<FunctionReturnType<Query> | undefined>,
): Accessor<FunctionReturnType<Query> | undefined> {
  const client = useContext(ConvexClientContext);

  const hasInitialValue = hasOwnInitialValue(options);
  const initialValue = hasInitialValue ? options.initialValue : undefined;

  if (!client && !isServer) {
    if (hasInitialValue) return () => initialValue;
    throw new Error(
      "createQuery needs VITE_CONVEX_URL or an initialValue for demo mode",
    );
  }

  let activeDispose: (() => void) | undefined;

  const value = createMemo<FunctionReturnType<Query> | undefined>(
    () => {
      if (!client)
        throw new Error("createQuery must be used within ConvexProvider");

      activeDispose?.();

      const queryArgs = resolveValue(args);

      if (queryArgs === "skip") {
        activeDispose = undefined;
        let yielded = false;
        return {
          [Symbol.asyncIterator]() {
            return {
              next() {
                if (yielded) {
                  return syncThenable({
                    value: undefined as FunctionReturnType<Query>,
                    done: true,
                  });
                }
                yielded = true;
                return syncThenable({
                  value: undefined as FunctionReturnType<Query>,
                  done: false,
                });
              },
            };
          },
        } as unknown as FunctionReturnType<Query> | undefined;
      }

      const queue: FunctionReturnType<Query>[] = [];
      let nextResolve:
        | ((result: IteratorResult<FunctionReturnType<Query>>) => void)
        | null = null;
      let nextReject: ((reason?: unknown) => void) | null = null;
      let pendingError: Error | null = null;
      let closed = false;

      const unsubscribe = client.onUpdate(
        query,
        queryArgs,
        (result) => {
          if (closed) return;
          if (nextResolve) {
            const resolve = nextResolve;
            nextResolve = null;
            nextReject = null;
            resolve({ value: result, done: false });
            return;
          }
          queue.push(result);
        },
        (reason) => {
          const error = toError(reason);
          if (closed) return;
          if (nextReject) {
            const reject = nextReject;
            nextResolve = null;
            nextReject = null;
            reject(error);
            return;
          }
          pendingError = error;
        },
      );

      const disposeQuery = () => {
        if (closed) return;
        closed = true;
        unsubscribe.unsubscribe();
        if (nextResolve) {
          nextResolve({
            value: undefined as FunctionReturnType<Query>,
            done: true,
          });
          nextResolve = null;
          nextReject = null;
        }
        if (activeDispose === disposeQuery) {
          activeDispose = undefined;
        }
      };
      activeDispose = disposeQuery;

      if (hasInitialValue && initialValue !== undefined) {
        queue.push(initialValue as FunctionReturnType<Query>);
      }
      const currentValue = unsubscribe.getCurrentValue();
      if (currentValue !== undefined) {
        queue.push(currentValue);
      }

      onCleanup(disposeQuery);

      return {
        [Symbol.asyncIterator]() {
          return {
            next() {
              if (pendingError) {
                const error = pendingError;
                pendingError = null;
                return Promise.reject(error);
              }
              if (queue.length > 0) {
                return syncThenable({ value: queue.shift()!, done: false });
              }
              if (closed) {
                return syncThenable({
                  value: undefined as FunctionReturnType<Query>,
                  done: true,
                });
              }
              return new Promise((resolve, reject) => {
                nextResolve = resolve;
                nextReject = reject;
              });
            },
            return() {
              disposeQuery();
              return syncThenable({
                value: undefined as FunctionReturnType<Query>,
                done: true,
              });
            },
          };
        },
      } as unknown as FunctionReturnType<Query> | undefined;
    },
    {
      name: "convex-query",
    },
  );

  onCleanup(() => activeDispose?.());

  return value;
}
