# Budget — Premium Personal Finance Manager

A full-stack, production-ready personal budgeting and finance management
application built with Next.js (App Router), TypeScript, MongoDB, and an
OpenAI-compatible AI Financial Assistant.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   |---|---|
   | `MONGODB_URI` | MongoDB Atlas (or self-hosted) connection string |
   | `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `RESEND_API_KEY`, `EMAIL_FROM` | From [resend.com](https://resend.com), for monthly PDF emails |
   | `AI_API_KEY`, `AI_API_BASE_URL`, `AI_MODEL` | Any OpenAI-compatible provider, for the AI Financial Assistant |
   | `CRON_SECRET` | Random string authorizing `/api/cron/month-end` |
   | `NEXT_PUBLIC_APP_URL` | App URL, used in a couple of client-side links |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional for local dev (falls back to in-memory), required in production — from [console.upstash.com](https://console.upstash.com/), used for rate limiting |

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   App runs at http://localhost:3000. Registering an account provisions
   default expense categories automatically.

## Deployment (Vercel + MongoDB Atlas)

1. Push this repo to GitHub/GitLab, import it into Vercel.
2. Add all variables from `.env.example` as Vercel Environment Variables.
3. `vercel.json` already schedules `/api/cron/month-end` for 06:00 UTC on
   the 1st of each month via Vercel Cron — no extra setup needed once
   `CRON_SECRET` is set as an env var.
4. If you're **not** on Vercel, run `npm run cron:month-end` from any
   scheduler (system crontab, GitHub Actions, etc.) — it shares the exact
   same report-generation logic as the hosted cron route.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · MongoDB + Mongoose ·
NextAuth (Auth.js) · Zod · React Hook Form · Recharts · Framer Motion ·
Lucide React · date-fns · Resend · @react-pdf/renderer · OpenAI-compatible API

## Project structure

```
src/
  app/
    (auth)/          Login, register (public)
    (app)/            Dashboard, Budget, AI Assistant, Settings (protected)
    api/              All route handlers — auth, budgets, expenses,
                      categories, analytics, assistant, reports, cron
  components/
    auth/ budget/ dashboard/ assistant/ reports/ settings/ layout/ ui/
  lib/                db, auth, session, validations, analytics, period,
                      ai-context, ai-client, insights, reports, email,
                      pdf/, rate-limit, sanitize, api-helpers, utils
  models/             User, MonthlyBudget, BudgetAddition, Category,
                      Expense, Report
  types/               Shared TypeScript types
scripts/
  month-end.ts        Standalone report runner for self-hosted cron
```

## Feature checklist (matches the product spec)

- [x] Auth: registration (name/email/phone/password/country/currency),
      login, protected routes, password hashing, rate limiting
- [x] Employment status (Employed/Self-employed/Student) with conditional
      fields, cleared server-side when status changes
- [x] Average monthly budget stored separately from actual monthly budgets
- [x] Budget vs. average comparison (amount + percentage, icon + text, not
      color alone) — both on the Dashboard's monthly status card and every
      budget in the Budget page / history
- [x] Initial budget + additions preserved separately, total always derived
      — never overwritten
- [x] Expenses: CRUD, categories (default + custom), payment method,
      destination, notes, pagination, filtering
- [x] Dashboard: period selector (Current/Previous/Last 3/6/12
      Months/All Months/Custom), 8 summary stats, 6 chart types (line, bar,
      donut, horizontal bar, area, utilization gauge) — all titled, labeled,
      tooltipped, responsive, with an accessible text summary
- [x] AI Financial Assistant: scoped per-user data context (never a raw DB
      dump, never another user's data), chat UI, proactive insights
      computed from real figures (not AI-generated, so numbers can't be
      invented)
- [x] Monthly PDF report (`"August Budget Summary.pdf"` naming), emailed via
      Resend with a short in-body summary, report history with
      view/download/resend, month-end job with duplicate prevention
      (unique DB index + idempotent generation)
- [x] Settings: Account, Personal Profile, Financial Profile, Categories,
      Monthly Reports, Notifications, Appearance (light/dark/system)
- [x] Security: server-side ownership checks on every query, Zod validation
      everywhere, bcrypt hashing, rate limiting, input sanitization, secure
      cookies (via NextAuth), security headers, DB indexes — see
      `SECURITY.md`
- [x] Framer Motion throughout (cards, modals, page transitions, chart
      entrances), `prefers-reduced-motion` respected globally via
      `MotionConfig`
- [x] Fully responsive, mobile-first bottom nav distinct from the desktop
      sidebar
- [x] Loading skeletons and error boundaries for the protected route group,
      global 404 page
