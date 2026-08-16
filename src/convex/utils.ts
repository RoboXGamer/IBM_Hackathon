import type { Accessor } from "solid-js";

export type MaybeAccessor<T> = T | Accessor<T>;

export function resolveValue<T>(value: MaybeAccessor<T>): T {
  return typeof value === "function" ? (value as Accessor<T>)() : value;
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export type QuerySsrSource = "server" | "hybrid" | "initial" | "client";

export interface CreateQueryOptions<T> {
  initialValue?: T;
  ssrSource?: QuerySsrSource;
}
