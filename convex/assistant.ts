import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/auth";

export const history = query({ args: { topic: v.string() }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  return ctx.db.query("assistantMessages").withIndex("by_user_and_topic", (q) => q.eq("userId", profile._id).eq("topic", args.topic)).order("asc").take(40);
} });

export const saveMessage = mutation({ args: { explanationId: v.optional(v.id("explanations")), topic: v.string(), role: v.union(v.literal("user"), v.literal("assistant")), content: v.string() }, handler: async (ctx, args) => {
  const profile = await requireProfile(ctx);
  return ctx.db.insert("assistantMessages", { ...args, userId: profile._id, createdAt: Date.now() });
} });

export const explain = action({
  args: { topic: v.string(), question: v.string(), context: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");
    const environment = (globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
    const apiUrl = environment.AI_API_URL;
    const apiKey = environment.AI_API_KEY;
    if (!apiUrl || !apiKey) return { answer: `${args.topic} becomes easier when you connect the process to its purpose. For “${args.question}”, start with the inputs, follow how energy or matter changes, and finish with the output.`, source: "fallback" as const };
    const response = await fetch(apiUrl, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: environment.AI_MODEL ?? "gpt-4.1-mini", messages: [{ role: "system", content: "You are Quizzly, a concise and encouraging tutor. Explain at the learner's grade level and never invent facts." }, { role: "user", content: `Topic: ${args.topic}\nContext: ${args.context ?? "No note context provided"}\nQuestion: ${args.question}` }] }) });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const result = await response.json() as { choices?: { message?: { content?: string } }[] };
    return { answer: result.choices?.[0]?.message?.content ?? "I could not generate an explanation.", source: "provider" as const };
  },
});
