import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";

type DbCtx = QueryCtx | MutationCtx;
export async function getProfile(ctx: DbCtx): Promise<Doc<"profiles"> | null> {
  const authUser = await authComponent.getAuthUser(ctx);
  if (!authUser) return null;
  return ctx.db.query("profiles").withIndex("by_auth_id", (query) => query.eq("authId", String(authUser._id))).unique();
}
export async function requireProfile(ctx: DbCtx): Promise<Doc<"profiles">> {
  const profile = await getProfile(ctx);
  if (!profile) throw new Error("Authentication required");
  return profile;
}
export function publicProfile(profile: Doc<"profiles">) {
  return { id: profile._id, name: profile.name, email: profile.email, grade: profile.grade, level: profile.level, points: profile.points, streak: profile.streak, avatarColor: profile.avatarColor, notificationCount: profile.notificationCount };
}
