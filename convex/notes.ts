import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

export const list = query({ args: {}, handler: async (ctx) => {
  const profile = await requireProfile(ctx);
  return ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", profile._id)).order("desc").collect();
} });

export const generateUploadUrl = mutation({ args: {}, handler: async (ctx) => {
  await requireProfile(ctx);
  return ctx.storage.generateUploadUrl();
} });

export const create = mutation({
  args: { title: v.string(), fileName: v.string(), subject: v.string(), grade: v.string(), topic: v.optional(v.string()), tags: v.array(v.string()), storageId: v.optional(v.id("_storage")), fileType: v.union(v.literal("pdf"), v.literal("doc"), v.literal("slides"), v.literal("image"), v.literal("text")), sizeLabel: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    return ctx.db.insert("notes", { ...args, userId: profile._id, progress: 100, status: "ready", uploadedAt: Date.now() });
  },
});

export const markComplete = mutation({ args: { noteId: v.id("notes") }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  const note = await ctx.db.get(args.noteId);
  if (!note || note.userId !== profile._id) throw new Error("Note not found");
  await ctx.db.patch(args.noteId, { status: "complete", progress: 100 });
} });

export const activate = mutation({ args: { noteId: v.id("notes") }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  const note = await ctx.db.get(args.noteId);
  if (!note || note.userId !== profile._id) throw new Error("Note not found");
  const explanations = await ctx.db.query("explanations").withIndex("by_user", (q) => q.eq("userId", profile._id)).collect();
  const selected = explanations.find((item) => item.noteId === note._id);
  if (!selected) throw new Error("This note does not have a study kit yet");
  await Promise.all(explanations.map((item) => ctx.db.patch(item._id, { active: item._id === selected._id })));
  const plans = await ctx.db.query("revisionPlans").withIndex("by_user_and_active", (q) => q.eq("userId", profile._id)).collect();
  await Promise.all(plans.map((item) => ctx.db.patch(item._id, { active: item.noteId === note._id })));
  const quizzes = await ctx.db.query("quizSets").withIndex("by_user", (q) => q.eq("userId", profile._id)).collect();
  await Promise.all(quizzes.map((item) => ctx.db.patch(item._id, { active: item.noteId === note._id || (!item.noteId && Boolean(note.topic) && item.topic.toLowerCase() === note.topic?.toLowerCase()) })));
} });

export const remove = mutation({ args: { noteId: v.id("notes") }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  const note = await ctx.db.get(args.noteId);
  if (!note || note.userId !== profile._id) throw new Error("Note not found");
  if (note.storageId) await ctx.storage.delete(note.storageId);
  await ctx.db.delete(args.noteId);
} });
