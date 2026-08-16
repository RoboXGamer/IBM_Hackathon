import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { getProfile, publicProfile } from "./lib/auth";
import { ensureUserInterfaceData, seedUserData } from "./lib/seedUserData";
import { v } from "convex/values";

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
      const id = await ctx.db.insert("profiles", { authId, name: String(authUser.name || "Student"), email: String(authUser.email || "").toLowerCase(), grade: "", level: 1, points: 0, streak: 0, avatarColor: "#8b6cf7", notificationCount: 0, onboardingComplete: false, dailyGoalMinutes: 60, subjects: [], createdAt: now, updatedAt: now });
      profile = await ctx.db.get(id);
    }
    if (!profile) throw new Error("Could not create profile");
    await ensureUserInterfaceData(ctx, profile._id);
    return publicProfile(profile);
  },
});

export const completeOnboarding = mutation({
  args: { grade: v.string(), dailyGoalMinutes: v.number(), subjects: v.array(v.string()) },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) throw new Error("Authentication required");
    await ctx.db.patch(profile._id, { grade: args.grade, dailyGoalMinutes: Math.max(15, Math.min(240, args.dailyGoalMinutes)), subjects: args.subjects, onboardingComplete: true, updatedAt: Date.now() });
  },
});

export const loadSampleWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) throw new Error("Authentication required");
    const created = await seedUserData(ctx, profile._id);
    if (created) await ctx.db.patch(profile._id, { level: 12, points: 2450, streak: 7, notificationCount: 1, updatedAt: Date.now() });
    return created;
  },
});
