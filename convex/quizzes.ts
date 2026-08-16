import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

export const recentAttempts = query({ args: { limit: v.optional(v.number()) }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  return ctx.db.query("quizAttempts").withIndex("by_user", (q) => q.eq("userId", profile._id)).order("desc").take(args.limit ?? 10);
} });

export const activate = mutation({ args: { quizSetId: v.id("quizSets") }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  const selected = await ctx.db.get(args.quizSetId);
  if (!selected || selected.userId !== profile._id) throw new Error("Quiz not found");
  const quizzes = await ctx.db.query("quizSets").withIndex("by_user", (q) => q.eq("userId", profile._id)).collect();
  await Promise.all(quizzes.map((quiz) => ctx.db.patch(quiz._id, { active: quiz._id === selected._id })));
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
    const earnedPoints = args.score * 100;
    await ctx.db.patch(profile._id, { points: profile.points + earnedPoints, updatedAt: Date.now() });
    const date = new Date().toISOString().slice(0, 10);
    const activity = await ctx.db.query("dailyActivity").withIndex("by_user_and_date", (q) => q.eq("userId", profile._id).eq("date", date)).first();
    if (activity) await ctx.db.patch(activity._id, { sessions: activity.sessions + 1, points: activity.points + earnedPoints, accuracy: activity.sessions ? Math.round((activity.accuracy * activity.sessions + currentPercent) / (activity.sessions + 1)) : currentPercent });
    else await ctx.db.insert("dailyActivity", { userId: profile._id, date, label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(Date.now()), studyMinutes: 0, sessions: 1, points: earnedPoints, accuracy: currentPercent });
    const mastery = await ctx.db.query("topicMastery").withIndex("by_user_and_score", (q) => q.eq("userId", profile._id)).collect();
    const topic = mastery.find((item) => item.name.toLowerCase() === quiz.topic.toLowerCase());
    if (topic) await ctx.db.patch(topic._id, { score: Math.round(topic.score * .65 + currentPercent * .35), trend: currentPercent - topic.score });
    else await ctx.db.insert("topicMastery", { userId: profile._id, name: quiz.topic, score: currentPercent, trend: 0, icon: "◎" });
    const entry = await ctx.db.query("leaderboardEntries").withIndex("by_quiz_and_points", (q) => q.eq("quizSetId", quiz._id)).filter((q) => q.eq(q.field("userId"), profile._id)).first();
    if (entry) await ctx.db.patch(entry._id, { points: entry.points + args.score * 100 });
    return id;
  },
});
