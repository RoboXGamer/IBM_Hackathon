import { query } from "./_generated/server";
import { publicProfile, requireProfile } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    const [notes, studyTasks, quizSets, attempts, activity, mastery, tip, plan, explanation, insights, milestones, quickActions, uploadWorkflow, planReviews] = await Promise.all([
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", profile._id)).order("desc").collect(),
      ctx.db.query("studyTasks").withIndex("by_user_and_order", (q) => q.eq("userId", profile._id)).collect(),
      ctx.db.query("quizSets").withIndex("by_user", (q) => q.eq("userId", profile._id)).collect(),
      ctx.db.query("quizAttempts").withIndex("by_user", (q) => q.eq("userId", profile._id)).order("desc").collect(),
      ctx.db.query("dailyActivity").withIndex("by_user_and_date", (q) => q.eq("userId", profile._id)).collect(),
      ctx.db.query("topicMastery").withIndex("by_user_and_score", (q) => q.eq("userId", profile._id)).collect(),
      ctx.db.query("tips").withIndex("by_user_and_active", (q) => q.eq("userId", profile._id).eq("active", true)).first(),
      ctx.db.query("revisionPlans").withIndex("by_user_and_active", (q) => q.eq("userId", profile._id).eq("active", true)).first(),
      ctx.db.query("explanations").withIndex("by_user_and_active", (q) => q.eq("userId", profile._id).eq("active", true)).first(),
      ctx.db.query("insights").withIndex("by_user_and_order", (q) => q.eq("userId", profile._id)).collect(),
      ctx.db.query("milestones").withIndex("by_user", (q) => q.eq("userId", profile._id)).order("desc").collect(),
      ctx.db.query("uiItems").withIndex("by_user_and_group", (q) => q.eq("userId", profile._id).eq("group", "quick-actions")).collect(),
      ctx.db.query("uiItems").withIndex("by_user_and_group", (q) => q.eq("userId", profile._id).eq("group", "upload-workflow")).collect(),
      ctx.db.query("uiItems").withIndex("by_user_and_group", (q) => q.eq("userId", profile._id).eq("group", "plan-reviews")).collect(),
    ]);

    const planTasks = plan ? await ctx.db.query("revisionTasks").withIndex("by_plan_and_day", (q) => q.eq("planId", plan._id)).collect() : [];
    const activeQuiz = quizSets.find((quiz) => quiz.active) ?? null;
    const quizQuestions = activeQuiz ? await ctx.db.query("quizQuestions").withIndex("by_quiz_and_order", (q) => q.eq("quizSetId", activeQuiz._id)).collect() : [];
    const leaderboard = activeQuiz ? await ctx.db.query("leaderboardEntries").withIndex("by_quiz_and_points", (q) => q.eq("quizSetId", activeQuiz._id)).order("desc").collect() : [];
    const [steps, keyPoints, relatedTopics, aiPrompts, messages] = explanation ? await Promise.all([
      ctx.db.query("explanationSteps").withIndex("by_explanation_and_order", (q) => q.eq("explanationId", explanation._id)).collect(),
      ctx.db.query("keyPoints").withIndex("by_explanation_and_order", (q) => q.eq("explanationId", explanation._id)).collect(),
      ctx.db.query("relatedTopics").withIndex("by_explanation_and_order", (q) => q.eq("explanationId", explanation._id)).collect(),
      ctx.db.query("aiPrompts").withIndex("by_explanation_and_order", (q) => q.eq("explanationId", explanation._id)).collect(),
      ctx.db.query("assistantMessages").withIndex("by_user_and_topic", (q) => q.eq("userId", profile._id).eq("topic", explanation.topic)).order("asc").take(30),
    ]) : [[], [], [], [], []];

    const completedPlanTasks = planTasks.filter((task) => task.completed).length;
    const planProgress = planTasks.length ? Math.round((completedPlanTasks / planTasks.length) * 100) : 0;
    const latestActivity = activity[activity.length - 1];
    const totalStudyMinutes = activity.reduce((sum, item) => sum + item.studyMinutes, 0);
    const totalSessions = activity.reduce((sum, item) => sum + item.sessions, 0);
    const totalPoints = activity.reduce((sum, item) => sum + item.points, 0);
    const averageAccuracy = activity.length ? Math.round(activity.reduce((sum, item) => sum + item.accuracy, 0) / activity.length) : 0;
    const sortedMastery = [...mastery].sort((a, b) => b.score - a.score);

    return {
      profile: publicProfile(profile),
      dashboard: {
        stats: [
          { label: "Study time", value: latestActivity ? `${Math.floor(latestActivity.studyMinutes / 60)}h ${latestActivity.studyMinutes % 60}m` : "0m", detail: "Daily goal: 2h", progress: latestActivity ? Math.min(100, Math.round((latestActivity.studyMinutes / 120) * 100)) : 0, tone: "violet" as const, icon: "◷" },
          { label: "Sessions done", value: `${latestActivity?.sessions ?? 0} / 7`, detail: "Daily goal: 7", progress: Math.min(100, Math.round(((latestActivity?.sessions ?? 0) / 7) * 100)), tone: "green" as const, icon: "✓" },
          { label: "Plan progress", value: `${planProgress}%`, detail: planProgress >= 50 ? "On track!" : "Keep going!", progress: planProgress, tone: "blue" as const, icon: "◎" },
          { label: "Points earned", value: String(latestActivity?.points ?? 0), detail: "Keep going!", progress: Math.min(100, Math.round(((latestActivity?.points ?? 0) / 500) * 100)), tone: "amber" as const, icon: "☆" },
        ],
        tasks: studyTasks,
        suggestedQuizzes: quizSets.filter((quiz) => quiz.recommended && !quiz.active),
        continueNote: notes[0] ?? null,
        quickActions,
        focusAreas: sortedMastery.slice(0, 3),
        tip,
      },
      notes: { items: notes, workflow: uploadWorkflow },
      study: explanation ? { ...explanation, steps, keyPoints, relatedTopics, prompts: aiPrompts, messages } : null,
      plan: plan ? { ...plan, tasks: planTasks, completedCount: completedPlanTasks, progress: planProgress, reviews: planReviews, nextTask: planTasks.find((task) => !task.completed) ?? null } : null,
      quiz: activeQuiz ? {
        ...activeQuiz,
        questions: quizQuestions.map(({ answer: _answer, explanation: _explanation, ...question }) => question),
        leaderboard,
        onlineCount: leaderboard.filter((entry) => entry.online).length,
      } : null,
      performance: {
        metrics: [
          { label: "Overall accuracy", value: `${averageAccuracy}%`, change: activity.length > 1 ? `${(latestActivity?.accuracy ?? 0) - activity[0].accuracy >= 0 ? "+" : ""}${(latestActivity?.accuracy ?? 0) - activity[0].accuracy}%` : "0%", tone: "violet" as const, icon: "◎", progress: averageAccuracy },
          { label: "Study time this week", value: `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`, change: `${totalSessions} sessions`, tone: "green" as const, icon: "◷", progress: Math.min(100, Math.round((totalStudyMinutes / 840) * 100)) },
          { label: "Quizzes completed", value: String(attempts.length), change: `${attempts.filter((attempt) => attempt.change > 0).length} improved`, tone: "blue" as const, icon: "✓", progress: Math.min(100, attempts.length * 10) },
          { label: "Current streak", value: `${profile.streak} days`, change: "Keep it up!", tone: "amber" as const, icon: "🔥", progress: Math.min(100, Math.round((profile.streak / 9) * 100)) },
        ],
        activity,
        mastery: sortedMastery,
        attempts,
        insights,
        milestone: milestones[0] ?? null,
        weekImprovement: activity.length > 1 ? (latestActivity?.accuracy ?? 0) - activity[0].accuracy : 0,
        totalPoints,
      },
    };
  },
});
