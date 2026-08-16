# Quizzly

Quizzly is a responsive AI study platform built as a Vite single-page app with Solid 2.0 RC, Tailwind CSS 4, and Convex.

## What is included

- Daily study dashboard with live Convex overview data
- Note upload flow backed by Convex File Storage
- AI study workspace with a provider-ready Convex action
- Interactive revision plan persisted per authenticated learner
- Secure quiz grading, saved attempts, points, and live Convex leaderboard data
- Performance analytics sourced from Convex with CSV export
- Better Auth email/password accounts connected to Convex authentication
- Desktop, tablet, and mobile navigation

All learner-specific content and sample records shown by the product are stored in Convex. The frontend only contains interface copy, layout, and controls.

## Draft 2 product flow

- New accounts begin with honest zero-state data and a short grade, subject, and daily-goal onboarding flow.
- Learners can upload their own notes or explicitly opt into the labeled sample workspace.
- Dashboard task completion updates Convex activity and profile points.
- Note rows expose processing readiness, search, safe opening, and deletion instead of sending every file to an unrelated explanation.
- AI conversations persist, related-topic prompts work, and explanations support browser speech and sharing.
- Plans support completion, progress reset, and CSV export.
- Quizzes use server-side answer grading, a live timer, saved attempts, point updates, and mastery updates.

## Setup

```bash
pnpm install
pnpm convex env set SITE_URL http://localhost:5173
pnpm convex env set BETTER_AUTH_SECRET your-long-random-secret
pnpm convex dev
```

Use a strong random value of at least 32 characters for `BETTER_AUTH_SECRET`. The Convex command creates the development deployment, installs the Better Auth component, generates types, and writes `VITE_CONVEX_URL` to `.env.local`. New accounts receive their initial study workspace automatically when they first sign in.

Then start the frontend when needed:

```bash
pnpm dev
```

## Optional AI provider

The assistant action works with a safe local fallback until an OpenAI-compatible provider is configured in Convex:

```bash
pnpm convex env set AI_API_URL https://your-provider.example/v1/chat/completions
pnpm convex env set AI_API_KEY your-key
pnpm convex env set AI_MODEL your-model
```

## Validation

```bash
pnpm run check
pnpm run build
pnpm exec tsc -p convex/tsconfig.json --pretty false
```
