import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

export const active = query({ args: {}, handler: async (ctx) => {
  const profile = await requireProfile(ctx);
  const plan = await ctx.db.query("revisionPlans").withIndex("by_user_and_active", (q) => q.eq("userId", profile._id).eq("active", true)).first();
  if (!plan) return null;
  const tasks = await ctx.db.query("revisionTasks").withIndex("by_plan_and_day", (q) => q.eq("planId", plan._id)).collect();
  return { ...plan, tasks };
} });

export const toggleTask = mutation({ args: { taskId: v.id("revisionTasks") }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  const task = await ctx.db.get(args.taskId);
  if (!task) throw new Error("Revision task not found");
  const plan = await ctx.db.get(task.planId);
  if (!plan || plan.userId !== profile._id) throw new Error("Revision task not found");
  const completed = !task.completed;
  await ctx.db.patch(args.taskId, { completed, completedAt: completed ? Date.now() : undefined });
  return completed;
} });

export const create = mutation({
  args: { noteId: v.optional(v.id("notes")), subject: v.string(), topic: v.string(), confidenceGoal: v.number(), tasks: v.array(v.object({ day: v.number(), title: v.string(), topics: v.array(v.string()), durationMinutes: v.number() })) },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const existing = await ctx.db.query("revisionPlans").withIndex("by_user_and_active", (q) => q.eq("userId", profile._id).eq("active", true)).collect();
    await Promise.all(existing.map((plan) => ctx.db.patch(plan._id, { active: false })));
    const planId = await ctx.db.insert("revisionPlans", { userId: profile._id, noteId: args.noteId, subject: args.subject, topic: args.topic, durationDays: args.tasks.length, confidenceGoal: args.confidenceGoal, active: true, createdAt: Date.now() });
    await Promise.all(args.tasks.map((task) => ctx.db.insert("revisionTasks", { planId, ...task, completed: false })));
    return planId;
  },
});
