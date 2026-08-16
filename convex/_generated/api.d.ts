/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appData from "../appData.js";
import type * as assistant from "../assistant.js";
import type * as auth from "../auth.js";
import type * as authOrigins from "../authOrigins.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_seedUserData from "../lib/seedUserData.js";
import type * as notes from "../notes.js";
import type * as plans from "../plans.js";
import type * as profiles from "../profiles.js";
import type * as quizzes from "../quizzes.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appData: typeof appData;
  assistant: typeof assistant;
  auth: typeof auth;
  authOrigins: typeof authOrigins;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/seedUserData": typeof lib_seedUserData;
  notes: typeof notes;
  plans: typeof plans;
  profiles: typeof profiles;
  quizzes: typeof quizzes;
  seed: typeof seed;
  tasks: typeof tasks;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
