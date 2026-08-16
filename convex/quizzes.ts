import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

export const recentAttempts = query({ args: { limit: v.optional(v.number()) }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  return ctx.db.query("quizAttempts").withIndex("by_user", (q) => q.eq("userId", profile._id)).order("desc").take(args.limit ?? 10);
} });

export const submitAnswer = mutation({ args: { questionId: v.id("quizQuestions"), selected: v.number() }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  const question = await ctx.db.get(args.questionId);
  if (!question) throw new Error("Question not found");
  const quiz = await ctx.db.get(question.quizSetId);
  if (!quiz || quiz.userId !== profile._id) throw new Error("Question not found");
  return { correct: args.selected === question.answer, correctAnswer: question.answer, explanation: question.explanation, points: args.selected === question.answer ? question.points : 0 };
} });

export const recordAttempt = mutation({
  args: { quizSetId: v.id("quizSets"), score: v.number(), total: v.number() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const quiz = await ctx.db.get(args.quizSetId);
    if (!quiz || quiz.userId !== profile._id) throw new Error("Quiz not found");
    const previous = await ctx.db.query("quizAttempts").withIndex("by_user_and_topic", (q) => q.eq("userId", profile._id).eq("topic", quiz.topic)).order("desc").first();
    const currentPercent = Math.round((args.score / Math.max(1, args.total)) * 100);
    const previousPercent = previous ? Math.round((previous.score / Math.max(1, previous.total)) * 100) : currentPercent;
    const id = await ctx.db.insert("quizAttempts", { userId: profile._id, quizSetId: quiz._id, subject: quiz.subject, topic: quiz.topic, title: quiz.title, score: args.score, total: args.total, difficulty: quiz.difficulty, change: currentPercent - previousPercent, completedAt: Date.now() });
    await ctx.db.patch(profile._id, { points: profile.points + args.score * 100, updatedAt: Date.now() });
    const entry = await ctx.db.query("leaderboardEntries").withIndex("by_quiz_and_points", (q) => q.eq("quizSetId", quiz._id)).filter((q) => q.eq(q.field("userId"), profile._id)).first();
    if (entry) await ctx.db.patch(entry._id, { points: entry.points + args.score * 100 });
    return id;
  },
});
