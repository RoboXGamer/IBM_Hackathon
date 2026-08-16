import { mutation } from "./_generated/server";
import { requireProfile } from "./lib/auth";
import { seedUserData } from "./lib/seedUserData";
export const run = mutation({ args: {}, handler: async (ctx) => {
  const profile = await requireProfile(ctx);
  return { seeded: await seedUserData(ctx, profile._id) };
} });
