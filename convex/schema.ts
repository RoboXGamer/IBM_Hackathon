import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({ authId: v.string(), name: v.string(), email: v.string(), grade: v.string(), level: v.number(), points: v.number(), streak: v.number(), avatarColor: v.string(), notificationCount: v.number(), createdAt: v.number(), updatedAt: v.number() })
    .index("by_auth_id", ["authId"]).index("by_email", ["email"]),
  notes: defineTable({ userId: v.id("profiles"), title: v.string(), fileName: v.string(), subject: v.string(), grade: v.string(), topic: v.optional(v.string()), tags: v.array(v.string()), storageId: v.optional(v.id("_storage")), fileType: v.union(v.literal("pdf"), v.literal("doc"), v.literal("slides"), v.literal("image"), v.literal("text")), sizeLabel: v.string(), progress: v.number(), status: v.union(v.literal("ready"), v.literal("processing"), v.literal("complete"), v.literal("failed")), uploadedAt: v.number() })
    .index("by_user", ["userId"]).index("by_user_and_subject", ["userId", "subject"]),
  studyTasks: defineTable({ userId: v.id("profiles"), time: v.string(), title: v.string(), detail: v.string(), kind: v.union(v.literal("Study"), v.literal("Quiz"), v.literal("Explain"), v.literal("Session")), target: v.union(v.literal("study"), v.literal("quiz"), v.literal("plan")), completed: v.boolean(), sortOrder: v.number() })
    .index("by_user_and_order", ["userId", "sortOrder"]),
  explanations: defineTable({ userId: v.id("profiles"), noteId: v.optional(v.id("notes")), title: v.string(), generatedBy: v.string(), subject: v.string(), topic: v.string(), grade: v.string(), introTitle: v.string(), introBody: v.string(), formula: v.string(), active: v.boolean() })
    .index("by_user_and_active", ["userId", "active"]),
  explanationSteps: defineTable({ explanationId: v.id("explanations"), order: v.number(), icon: v.string(), tone: v.union(v.literal("violet"), v.literal("green"), v.literal("blue"), v.literal("amber")), title: v.string(), body: v.string() })
    .index("by_explanation_and_order", ["explanationId", "order"]),
  keyPoints: defineTable({ explanationId: v.id("explanations"), order: v.number(), text: v.string() })
    .index("by_explanation_and_order", ["explanationId", "order"]),
  relatedTopics: defineTable({ explanationId: v.id("explanations"), order: v.number(), title: v.string() })
    .index("by_explanation_and_order", ["explanationId", "order"]),
  aiPrompts: defineTable({ explanationId: v.id("explanations"), order: v.number(), text: v.string() })
    .index("by_explanation_and_order", ["explanationId", "order"]),
  assistantMessages: defineTable({ userId: v.id("profiles"), explanationId: v.optional(v.id("explanations")), topic: v.string(), role: v.union(v.literal("user"), v.literal("assistant")), content: v.string(), createdAt: v.number() })
    .index("by_user_and_topic", ["userId", "topic"]),
  revisionPlans: defineTable({ userId: v.id("profiles"), noteId: v.optional(v.id("notes")), subject: v.string(), topic: v.string(), durationDays: v.number(), confidenceGoal: v.number(), active: v.boolean(), createdAt: v.number() })
    .index("by_user_and_active", ["userId", "active"]),
  revisionTasks: defineTable({ planId: v.id("revisionPlans"), day: v.number(), title: v.string(), topics: v.array(v.string()), durationMinutes: v.number(), completed: v.boolean(), completedAt: v.optional(v.number()) })
    .index("by_plan_and_day", ["planId", "day"]),
  quizSets: defineTable({ userId: v.id("profiles"), title: v.string(), subject: v.string(), topic: v.string(), questionCount: v.number(), durationMinutes: v.number(), difficulty: v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard")), recommended: v.boolean(), active: v.boolean() })
    .index("by_user", ["userId"]).index("by_user_and_active", ["userId", "active"]),
  quizQuestions: defineTable({ quizSetId: v.id("quizSets"), order: v.number(), subject: v.string(), topic: v.string(), question: v.string(), options: v.array(v.string()), answer: v.number(), explanation: v.string(), points: v.number() })
    .index("by_quiz_and_order", ["quizSetId", "order"]),
  quizAttempts: defineTable({ userId: v.id("profiles"), quizSetId: v.optional(v.id("quizSets")), subject: v.string(), topic: v.string(), title: v.string(), score: v.number(), total: v.number(), difficulty: v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard")), change: v.number(), completedAt: v.number() })
    .index("by_user", ["userId"]).index("by_user_and_topic", ["userId", "topic"]),
  dailyActivity: defineTable({ userId: v.id("profiles"), date: v.string(), label: v.string(), studyMinutes: v.number(), sessions: v.number(), points: v.number(), accuracy: v.number() })
    .index("by_user_and_date", ["userId", "date"]),
  topicMastery: defineTable({ userId: v.id("profiles"), name: v.string(), score: v.number(), trend: v.number(), icon: v.string() })
    .index("by_user_and_score", ["userId", "score"]),
  tips: defineTable({ userId: v.id("profiles"), title: v.string(), body: v.string(), icon: v.string(), active: v.boolean() })
    .index("by_user_and_active", ["userId", "active"]),
  uiItems: defineTable({ userId: v.id("profiles"), group: v.string(), order: v.number(), title: v.string(), detail: v.optional(v.string()), icon: v.optional(v.string()), tone: v.optional(v.union(v.literal("violet"), v.literal("green"), v.literal("blue"), v.literal("amber"), v.literal("rose"))), target: v.optional(v.union(v.literal("notes"), v.literal("study"), v.literal("quiz"), v.literal("plan"), v.literal("performance"))) })
    .index("by_user_and_group", ["userId", "group"]),
  leaderboardEntries: defineTable({ quizSetId: v.id("quizSets"), userId: v.optional(v.id("profiles")), name: v.string(), points: v.number(), color: v.string(), isCurrentUser: v.boolean(), online: v.boolean() })
    .index("by_quiz_and_points", ["quizSetId", "points"]),
  insights: defineTable({ userId: v.id("profiles"), order: v.number(), kind: v.union(v.literal("strength"), v.literal("attention"), v.literal("recommendation")), label: v.string(), title: v.string(), detail: v.string(), icon: v.string(), tone: v.union(v.literal("violet"), v.literal("green"), v.literal("amber")), actionLabel: v.optional(v.string()), target: v.optional(v.union(v.literal("quiz"), v.literal("plan"), v.literal("study"))) })
    .index("by_user_and_order", ["userId", "order"]),
  milestones: defineTable({ userId: v.id("profiles"), title: v.string(), body: v.string(), icon: v.string(), achievedAt: v.number() })
    .index("by_user", ["userId"]),
});
