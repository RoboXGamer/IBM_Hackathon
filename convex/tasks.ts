import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

export const toggle = mutation({
  args: { taskId: v.id("studyTasks") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== profile._id) throw new Error("Task not found");
    const completed = !task.completed;
    await ctx.db.patch(task._id, { completed });
    const date = new Date().toISOString().slice(0, 10);
    const activity = await ctx.db.query("dailyActivity").withIndex("by_user_and_date", (query) => query.eq("userId", profile._id).eq("date", date)).first();
    const delta = completed ? 1 : -1;
    if (activity) await ctx.db.patch(activity._id, { sessions: Math.max(0, activity.sessions + delta), studyMinutes: Math.max(0, activity.studyMinutes + delta * 15), points: Math.max(0, activity.points + delta * 25) });
    else if (completed) await ctx.db.insert("dailyActivity", { userId: profile._id, date, label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(Date.now()), studyMinutes: 15, sessions: 1, points: 25, accuracy: 0 });
    await ctx.db.patch(profile._id, { points: Math.max(0, profile.points + delta * 25), updatedAt: Date.now() });
    return completed;
  },
});
