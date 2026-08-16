import type { FunctionReturnType } from "convex/server";
import type { api } from "../../convex/_generated/api";
export type AppData = FunctionReturnType<typeof api.appData.get>;
