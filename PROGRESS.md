# Build Progress

- [x] **Part 1 — Scaffold & Data Models**
  - package.json, tsconfig, next.config, tailwind config + design tokens, global CSS
  - .env.example, .gitignore
  - MongoDB/Mongoose connection singleton (`src/lib/db.ts`)
  - Utils: currency/percent formatting, budget comparison math (`src/lib/utils.ts`)
  - Shared types + default categories (`src/types/index.ts`)
  - Models: User (conditional employment fields), MonthlyBudget (preserves
    initial vs additional vs total), BudgetAddition, Category, Expense, Report
    (unique per user/month, duplicate-report guard)
  - Zod validation schemas for registration, login, budgets, expenses,
    categories, profile/settings updates, AI chat

- [x] **Part 2 — Auth**
  - `src/lib/auth.ts` — NextAuth Credentials provider, JWT session w/ id+currency
  - `src/lib/password.ts` — bcrypt hash/verify
  - `src/lib/rate-limit.ts` — in-memory rate limiter for login/register
  - `src/lib/session.ts` — `getSession()` / `requireUserId()` server helpers
  - `src/lib/provision-categories.ts` — seeds default categories on signup
  - `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`
  - `src/middleware.ts` — protects `/dashboard`, `/budget`, `/assistant`, `/settings`
  - `src/types/next-auth.d.ts` — typed session (`id`, `currency`)
  - Root layout (fonts, theme + session providers, toaster), root `/` redirect
  - `(auth)` route group: layout, `/login`, `/register` pages + client forms
    with conditional Employed/Self-employed/Student fields
  - UI primitives: `Button`, `Input`, `Select`
  - Temporary placeholder `/dashboard` page + sign-out button, so the full
    auth flow (register → default categories provisioned → login → session →
    protected route → sign out) is testable before Part 4 lands
- [x] **Part 3 — Budget page & app shell**
  - `src/lib/api-helpers.ts` — jsonError, pagination parsing, error wrapper
  - APIs: `budgets` (list+create), `budgets/[id]` (detail+comparison),
    `budgets/[id]/additions` (top-ups, never overwrite initialAmount),
    `expenses` (list+create, filter by month/category), `expenses/[id]`
    (get/update/delete), `categories` (list+create), `categories/[id]`
    (rename/delete, blocked while expenses reference it)
  - Navigation shell: `src/lib/nav.ts`, `Sidebar`, `MobileNav`, `MobileTopBar`,
    `AppShell`, `(app)` route group layout — shared by Dashboard/Budget/
    Assistant/Settings without changing URLs
  - Moved placeholder Dashboard into `(app)` group, linked to `/budget`
  - Budget page (`(app)/budget`): month/year selector, budget summary card
    (initial/additional/spent/remaining, utilization bar, avg-budget
    comparison with icon+text, not color-only), create-budget modal,
    add-funds modal, expense form modal (create/edit), paginated expense
    list with category filter and edit/delete, inline category manager
  - `src/components/ui/Modal.tsx` — shared animated modal primitive
  - `src/lib/icon-map.ts`, `src/lib/category-options.ts`
- [x] **Part 4 — Dashboard**
  - `src/lib/period.ts` — resolves preset/custom periods into concrete month
    ranges (Current/Previous/Last 3/6/12 Months/All Months/Custom)
  - `src/lib/analytics.ts` — `computePeriodAnalytics()`: totals, category
    breakdown, highest/lowest category, average actual budget, monthly series
    for charts (reused later by the PDF report generator)
  - `src/lib/category-colors.ts` — shared category labels/colors for charts
  - APIs: `analytics/summary` (period-based totals + series),
    `analytics/current-month` (prominent status-card data)
  - `PeriodSelector`, `MonthlyStatusCard` (icon+text indicator, not color
    alone), `SummaryStats` (8 headline figures)
  - Charts (all titled, labeled, tooltipped, responsive, currency-formatted,
    with an `sr-only` accessible summary): `BudgetExpenseLineChart`,
    `BudgetVsExpenseBarChart`, `CategoryDonutChart`,
    `CategoryHorizontalBarChart`, `SavingsAreaChart`, `UtilizationGauge`
  - `DashboardClient` orchestrator; replaced the Part-3 placeholder
    `(app)/dashboard/page.tsx` with the real dashboard
- [x] **Part 5 — AI Financial Assistant**
  - `src/lib/ai-context.ts` — `getFinancialContext()`: aggregated, per-user
    snapshot (current month, previous month, 6-month rollup, YTD savings/
    investments) built from `computePeriodAnalytics()`; every query scoped to
    the authenticated `userId`, never raw per-expense rows, never another
    user's data
  - `src/lib/insights.ts` — `generateInsights()`: proactive insights computed
    directly from real figures (budget vs. average, biggest MoM category
    change, highest category, savings/investment allocation, utilization) —
    no AI call involved, so numbers can never be invented
  - `src/lib/ai-client.ts` — OpenAI-compatible chat wrapper with a
    safety-scoped system prompt (budgeting assistant, not a regulated
    advisor; answers only from the provided FINANCIAL_DATA; distinguishes
    recorded investment activity from general education)
  - APIs: `assistant/chat` (rate-limited per user), `assistant/insights`
  - `aiChatSchema` updated to carry the full message array (client keeps
    conversation state; nothing is persisted server-side yet)
  - UI: `AssistantClient` (chat thread + input), `ChatMessageBubble`,
    `SuggestedQuestions` (spec's example prompts), `InsightsPanel`
  - `(app)/assistant/page.tsx`
- [x] **Part 6 — PDF + Email**
  - `src/models/Report.ts` — added `savingsDestinations` to the snapshot
  - `src/lib/ai-context.ts` — refactored `getFinancialContext()` to accept an
    optional target month, so it powers both the AI Assistant (now) and
    monthly reports (any past month)
  - `src/lib/reports.ts` — `buildReportSnapshot()`, `generateMonthlyReport()`
    (idempotent — checks for an existing report before creating, unique
    index is the hard backstop), `renderReportPDF()` (always renders from
    the stored snapshot, never live data), `generateAndSendMonthlyReport()`
    (respects the user's email-reports setting)
  - `src/lib/pdf/filename.ts` (`"August Budget Summary.pdf"` format),
    `MonthlyReportDocument.tsx` (full report layout per spec §19),
    `render.tsx` (renders to Buffer)
  - `src/lib/email.ts` — Resend wrapper, PDF attached, short in-body summary
  - APIs: `reports` (history, paginated), `reports/generate` (manual
    generate + email), `reports/[id]/download` (streams PDF from snapshot),
    `reports/[id]/resend`
  - `src/app/api/cron/month-end/route.ts` — processes the just-completed
    month for every user (skips if no budget, already reported, or reports
    disabled), protected by `CRON_SECRET`, supports GET (Vercel Cron) + POST
  - `scripts/month-end.ts` — standalone runner for self-hosted cron, same
    core logic; `vercel.json` schedules the hosted cron for the 1st of each
    month
  - UI: `ReportHistory` (view/download/resend, paginated),
    `GenerateReportControl` — mounted at the bottom of the Dashboard for now;
    Part 7 relocates this into Settings → Monthly Reports
  - `package.json` — added `dotenv` for the standalone script
- [x] **Part 7 — Settings**
  - APIs: `settings` (GET, full profile hydration), `settings/account`
    (name/email/phone), `settings/profile` (employment status + conditional
    fields, only touches fields actually sent), `settings/financial`
    (average monthly budget + currency), `settings/password` (verifies
    current password), `settings/notifications` (email-reports toggle,
    budget/monthly/spending notification prefs, appearance)
  - `src/lib/validations.ts` — exported `PasswordChangeInput` type
  - UI: `SettingsSection` wrapper, `Toggle` primitive, `AccountSection`,
    `PasswordSection`, `ProfileSection` (same conditional-field pattern as
    registration), `FinancialSection`, `CategoriesSection` (reuses
    `CategoryManager` from Part 3), `MonthlyReportsSection` (reuses
    `ReportHistory`/`GenerateReportControl` from Part 6 — relocated here from
    the Dashboard, plus the email-reports toggle), `NotificationsSection`,
    `AppearanceSection` (synced with `next-themes`, persisted server-side)
  - `SettingsClient` orchestrator + `(app)/settings/page.tsx`
  - Removed the temporary Monthly Reports block from `DashboardClient`
- [x] **Part 8 — Polish (final)**
  - `next.config.mjs` — security headers (`X-Content-Type-Options`,
    `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)
  - `src/lib/sanitize.ts` — strips HTML/control characters from free text;
    wired into `validations.ts` for every user-editable text field (expense
    description/notes/destination, budget-addition description, category
    name, profile/employment fields)
  - `src/components/providers/MotionProvider.tsx` — `MotionConfig
    reducedMotion="user"` at the root, so every Framer Motion animation in
    the app now honors `prefers-reduced-motion` (not just the CSS-only
    override from Part 1)
  - `src/components/layout/PageTransition.tsx` — subtle fade/slide between
    Dashboard/Budget/Assistant/Settings, wired into `AppShell`
  - Rate limiting added to `budgets` POST and `expenses` POST (chat, reports,
    password-change, login, and registration were already covered)
  - `(app)/loading.tsx`, `(app)/error.tsx`, `not-found.tsx`,
    `global-error.tsx` — loading skeletons and error boundaries
  - Fixed an invalid Tailwind class (`h-4.5`/`w-4.5` isn't in the default
    spacing scale) used in `Sidebar`, `ExpenseList`, `ReportHistory`,
    `Toggle` — replaced with `h-[18px] w-[18px]`
  - `SECURITY.md` — full checklist of what's implemented and why, plus
    documented trade-offs (in-memory rate limiter, no multi-doc transactions)
  - `README.md` — complete setup/deployment instructions and a feature
    checklist mapped to the product spec

**This completes all 8 parts.** The app is a real full-stack implementation:
auth, MongoDB persistence, budgeting with preserved initial/additional
amounts, expenses, categories, savings/investments (via category type),
dashboard analytics across 7 period presets + custom range, the AI
Financial Assistant with a controlled per-user data context, PDF generation
+ email delivery + report history + month-end automation with duplicate
prevention, full Settings, pagination throughout, and the security measures
documented in `SECURITY.md`.

## Notes for next parts

- Sandbox has no network access, so nothing here has been `npm install`ed or
  compiled — code is written to be correct on inspection. Run `npm run build`
  locally after each part lands to catch anything.
