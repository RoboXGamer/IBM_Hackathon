import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function ensureUserInterfaceData(ctx: MutationCtx, userId: Id<"profiles">) {
  const existing = await ctx.db.query("uiItems").withIndex("by_user_and_group", (query) => query.eq("userId", userId).eq("group", "quick-actions")).first();
  if (existing) return false;
  const tip = await ctx.db.query("tips").withIndex("by_user_and_active", (query) => query.eq("userId", userId).eq("active", true)).first();
  if (!tip) await ctx.db.insert("tips", { userId, title: "Daily tip", body: "Break big topics into 15–20 minute focused sessions. Your brain remembers beginnings and endings best.", icon: "✦", active: true });
  const uiItems = [
    ["quick-actions", 1, "Upload notes", "Add study material", "↑", "violet", "notes"],
    ["quick-actions", 2, "Start active quiz", "Practice what you know", "☷", "green", "quiz"],
    ["quick-actions", 3, "Open revision plan", "Continue your schedule", "◎", "amber", "plan"],
    ["quick-actions", 4, "Ask AI", "Clear a doubt", "✦", "violet", "study"],
    ["upload-workflow", 1, "Upload securely", "Your original file is stored in Convex File Storage.", "1", "violet", undefined],
    ["upload-workflow", 2, "Add learning context", "Subject, grade, and topic keep generated material relevant.", "2", "violet", undefined],
    ["upload-workflow", 3, "Build a study kit", "Explanations, practice, and revision tasks stay connected to the note.", "3", "violet", undefined],
    ["upload-workflow", 4, "Improve with activity", "Quiz results and completed tasks update your recommendations.", "4", "violet", undefined],
    ["plan-reviews", 1, "Chlorophyll", "Day 2", "↻", "green", "study"],
    ["plan-reviews", 2, "CO₂ fixation", "Day 3", "↻", "green", "study"],
  ] as const;
  await Promise.all(uiItems.map(([group, order, title, detail, icon, tone, target]) => ctx.db.insert("uiItems", { userId, group, order, title, detail, icon, tone, target })));
  return true;
}

export async function seedUserData(ctx: MutationCtx, userId: Id<"profiles">) {
  await ensureUserInterfaceData(ctx, userId);
  const existing = await ctx.db.query("notes").withIndex("by_user", (query) => query.eq("userId", userId)).first();
  if (existing) return false;

  const now = Date.now();
  const noteId = await ctx.db.insert("notes", { userId, title: "Photosynthesis Notes", fileName: "Photosynthesis Notes.pdf", subject: "Biology", grade: "Class 11", topic: "Photosynthesis", tags: ["biology", "chapter-6", "important"], fileType: "pdf", sizeLabel: "2.4 MB", progress: 65, status: "complete", uploadedAt: now - 120_000 });
  await Promise.all([
    ctx.db.insert("notes", { userId, title: "Organic Chemistry", fileName: "Organic Chemistry.docx", subject: "Chemistry", grade: "Class 12", topic: "Organic chemistry", tags: ["chemistry"], fileType: "doc", sizeLabel: "1.8 MB", progress: 100, status: "complete", uploadedAt: now - 3_600_000 }),
    ctx.db.insert("notes", { userId, title: "Cell Structure", fileName: "Cell Structure.pptx", subject: "Biology", grade: "Class 11", topic: "Cell structure", tags: ["biology", "cells"], fileType: "slides", sizeLabel: "4.1 MB", progress: 100, status: "complete", uploadedAt: now - 10_800_000 }),
    ctx.db.insert("notes", { userId, title: "Math Formulas", fileName: "Math Formulas.pdf", subject: "Mathematics", grade: "Class 10", topic: "Algebra", tags: ["maths", "formulas"], fileType: "pdf", sizeLabel: "1.2 MB", progress: 100, status: "complete", uploadedAt: now - 86_400_000 }),
  ]);

  const studyTasks = [
    ["9:00 AM", "Light-dependent Reactions", "Photosynthesis · Biology", "Study", "study", false],
    ["10:00 AM", "Quiz: Basics of Photosynthesis", "10 questions · Easy", "Quiz", "quiz", false],
    ["11:00 AM", "AI Explanation: Calvin Cycle", "Photosynthesis · Biology", "Explain", "study", false],
    ["12:00 PM", "Notes Review", "Photosynthesis Notes.pdf", "Study", "study", true],
    ["2:00 PM", "Revision Session", "45 min · Mixed topics", "Session", "plan", false],
  ] as const;
  await Promise.all(studyTasks.map(([time, title, detail, kind, target, completed], sortOrder) => ctx.db.insert("studyTasks", { userId, time, title, detail, kind, target, completed, sortOrder })));

  const explanationId = await ctx.db.insert("explanations", { userId, noteId, title: "Simplified explanation", generatedBy: "Quizzly AI Study Buddy", subject: "Biology", topic: "Photosynthesis", grade: "Class 11", introTitle: "Here’s the simple version, just for you ✨", introBody: "Photosynthesis is how green plants turn sunlight, water, and carbon dioxide into glucose—the food they use for growth. Oxygen is released along the way.", formula: "Sun + Water + CO₂ → Glucose + O₂", active: true });
  const explanationSteps = [
    [1, "☀", "amber", "Capture sunlight", "Chlorophyll in the leaves absorbs light energy from the sun."],
    [2, "💧", "blue", "Bring in water", "Roots take in water and carry it through the stem to the leaves."],
    [3, "CO₂", "green", "Collect carbon dioxide", "Tiny pores called stomata let carbon dioxide enter the leaf."],
    [4, "O₂", "violet", "Make food", "Light energy combines water and CO₂ into glucose, releasing oxygen."],
  ] as const;
  await Promise.all(explanationSteps.map(([order, icon, tone, title, body]) => ctx.db.insert("explanationSteps", { explanationId, order, icon, tone, title, body })));
  await Promise.all([
    "Plants make their own food.", "Sunlight, water, and CO₂ are needed.", "Glucose stores chemical energy.", "Oxygen returns to the air.",
  ].map((text, index) => ctx.db.insert("keyPoints", { explanationId, order: index + 1, text })));
  await Promise.all(["Chlorophyll", "Stomata", "Cellular respiration"].map((title, index) => ctx.db.insert("relatedTopics", { explanationId, order: index + 1, title })));
  await Promise.all(["Why do plants need sunlight?", "What happens if CO₂ is not available?", "Difference between photosynthesis and respiration?"].map((text, index) => ctx.db.insert("aiPrompts", { explanationId, order: index + 1, text })));

  const planId = await ctx.db.insert("revisionPlans", { userId, noteId, subject: "Biology", topic: "Photosynthesis", durationDays: 7, confidenceGoal: 90, active: true, createdAt: now - 86_400_000 });
  const planTasks = [
    [1, "Understand the Basics", ["What is photosynthesis?", "Raw materials", "Where it occurs"], 45, true],
    [2, "Light-dependent Reactions", ["Chlorophyll", "Light absorption", "ATP & NADPH"], 45, false],
    [3, "The Calvin Cycle", ["CO₂ fixation", "Glucose formation"], 45, false],
    [4, "Factors Affecting Photosynthesis", ["Light", "CO₂ concentration", "Temperature"], 45, false],
    [5, "Diagram Practice & Key Points", ["Label diagrams", "Important keywords"], 45, false],
    [6, "Practice Quiz", ["20 MCQs", "Check weak areas"], 45, false],
    [7, "Final Revision & Recall", ["Quick notes", "Mind map", "Flashcards"], 30, false],
  ] as const;
  await Promise.all(planTasks.map(([day, title, topics, durationMinutes, completed]) => ctx.db.insert("revisionTasks", { planId, day, title, topics: [...topics], durationMinutes, completed, completedAt: completed ? now - 3_600_000 : undefined })));

  const quizSetId = await ctx.db.insert("quizSets", { userId, noteId, title: "Photosynthesis Basics", subject: "Biology", topic: "Photosynthesis", questionCount: 5, durationMinutes: 8, difficulty: "Easy", recommended: true, active: true });
  const suggestedQuizIds = await Promise.all([
    ctx.db.insert("quizSets", { userId, title: "Chlorophyll & Its Role", subject: "Biology", topic: "Chlorophyll", questionCount: 10, durationMinutes: 8, difficulty: "Easy", recommended: true, active: false }),
    ctx.db.insert("quizSets", { userId, title: "Factors Affecting Photosynthesis", subject: "Biology", topic: "Photosynthesis factors", questionCount: 12, durationMinutes: 10, difficulty: "Medium", recommended: true, active: false }),
    ctx.db.insert("quizSets", { userId, title: "Calvin Cycle Deep Dive", subject: "Biology", topic: "Calvin cycle", questionCount: 15, durationMinutes: 12, difficulty: "Medium", recommended: true, active: false }),
  ]);
  void suggestedQuizIds;
  const questions = [
    ["Which molecule captures light energy during photosynthesis?", ["Chlorophyll", "Glucose", "Carbon dioxide", "Oxygen"], 0, "Chlorophyll pigments absorb light energy and begin the light-dependent reactions."],
    ["Where do the light-dependent reactions take place?", ["Stroma", "Thylakoid membranes", "Nucleus", "Cell wall"], 1, "The photosystems and electron transport chain sit in the thylakoid membranes."],
    ["What is the main purpose of the Calvin cycle?", ["Release oxygen", "Split water", "Build sugars from CO₂", "Absorb sunlight"], 2, "The Calvin cycle uses ATP and NADPH to fix carbon dioxide into carbohydrate molecules."],
    ["Which gas is released as a by-product of photosynthesis?", ["Nitrogen", "Hydrogen", "Carbon dioxide", "Oxygen"], 3, "Oxygen is released when water molecules are split during the light reactions."],
    ["Which pair carries energy into the Calvin cycle?", ["ATP and NADPH", "DNA and RNA", "O₂ and CO₂", "Water and glucose"], 0, "ATP supplies energy and NADPH supplies reducing power for carbon fixation."],
  ] as const;
  await Promise.all(questions.map(([question, options, answer, explanation], order) => ctx.db.insert("quizQuestions", { quizSetId, order: order + 1, subject: "Biology", topic: "Photosynthesis", question, options: [...options], answer, explanation, points: 100 })));

  const activity = [
    ["2026-08-10", "Mon", 52, 2, 180, 62], ["2026-08-11", "Tue", 64, 3, 220, 68], ["2026-08-12", "Wed", 70, 3, 260, 72], ["2026-08-13", "Thu", 82, 4, 300, 74], ["2026-08-14", "Fri", 76, 3, 280, 79], ["2026-08-15", "Sat", 88, 4, 310, 82], ["2026-08-16", "Sun", 80, 4, 320, 88],
  ] as const;
  await Promise.all(activity.map(([date, label, studyMinutes, sessions, points, accuracy]) => ctx.db.insert("dailyActivity", { userId, date, label, studyMinutes, sessions, points, accuracy })));
  const mastery = [["Photosynthesis", 92, 8, "⌁"], ["Cell Structure", 81, 5, "◉"], ["Chemical Bonding", 48, -6, "⌬"], ["Algebra Basics", 56, 3, "x²"], ["Atomic Structure", 74, 4, "✣"]] as const;
  await Promise.all(mastery.map(([name, score, trend, icon]) => ctx.db.insert("topicMastery", { userId, name, score, trend, icon })));
  const attempts = [
    ["Photosynthesis Basics", "Biology", "Photosynthesis", 9, 10, "Easy", 14, 3_600_000],
    ["Cell Structure Basics", "Biology", "Cell Structure", 8, 10, "Easy", 8, 86_400_000],
    ["Chemical Bonding Basics", "Chemistry", "Chemical Bonding", 5, 10, "Medium", -6, 172_800_000],
    ["Linear Equations", "Mathematics", "Algebra", 7, 10, "Medium", 3, 259_200_000],
  ] as const;
  await Promise.all(attempts.map(([title, subject, topic, score, total, difficulty, change, age]) => ctx.db.insert("quizAttempts", { userId, quizSetId: title === "Photosynthesis Basics" ? quizSetId : undefined, title, subject, topic, score, total, difficulty, change, completedAt: now - age })));

  await Promise.all([
    ["Ananya", 2450, "#f0a35a", false], ["Rohan", 2300, "#38b98a", false], ["You", 1950, "#7c5cff", true], ["Priya", 1750, "#ec6c8d", false], ["Arjun", 1600, "#4c92ed", false],
  ].map(([name, points, color, isCurrentUser]) => ctx.db.insert("leaderboardEntries", { quizSetId, userId: isCurrentUser ? userId : undefined, name: String(name), points: Number(points), color: String(color), isCurrentUser: Boolean(isCurrentUser), online: true })));
  await Promise.all([
    ctx.db.insert("insights", { userId, order: 1, kind: "strength", label: "Strongest topic", title: "Photosynthesis", detail: "92% accuracy", icon: "☆", tone: "green" }),
    ctx.db.insert("insights", { userId, order: 2, kind: "attention", label: "Needs attention", title: "Chemical Bonding", detail: "48% accuracy", icon: "◎", tone: "amber" }),
    ctx.db.insert("insights", { userId, order: 3, kind: "recommendation", label: "Recommended quiz", title: "Chemical Bonding Basics", detail: "10 questions · Medium", icon: "▤", tone: "violet", actionLabel: "Start quiz", target: "quiz" }),
  ]);
  await ctx.db.insert("milestones", { userId, title: "7-day streak!", body: "You’re building a powerful learning habit.", icon: "★", achievedAt: now });
  return true;
}
