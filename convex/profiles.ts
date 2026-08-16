import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { getProfile, publicProfile } from "./lib/auth";
import { seedUserData } from "./lib/seedUserData";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    return profile ? publicProfile(profile) : null;
  },
});

export const bootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new Error("Authentication required");
    const authId = String(authUser._id);
    let profile = await ctx.db.query("profiles").withIndex("by_auth_id", (query) => query.eq("authId", authId)).unique();
    if (!profile) {
      const now = Date.now();
      const id = await ctx.db.insert("profiles", { authId, name: String(authUser.name || "Student"), email: String(authUser.email || "").toLowerCase(), grade: "Class 11", level: 12, points: 2450, streak: 7, avatarColor: "#8b6cf7", notificationCount: 1, createdAt: now, updatedAt: now });
      profile = await ctx.db.get(id);
    }
    if (!profile) throw new Error("Could not create profile");
    await seedUserData(ctx, profile._id);
    return publicProfile(profile);
  },
});
