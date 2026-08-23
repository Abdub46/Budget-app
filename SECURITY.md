# Security Checklist

This documents how the app satisfies the security requirements, and where to
look if you're auditing or extending it.

## Authentication

- Credentials-based auth via **NextAuth (Auth.js)**, JWT session strategy,
  30-day max age. `src/lib/auth.ts`
- Passwords hashed with **bcrypt**, cost factor 12. `src/lib/password.ts`
- Login attempts are rate-limited per email (8 / 5 min) inside the
  `authorize()` callback, and registration is rate-limited per IP
  (10 / hour). `src/lib/rate-limit.ts`
- Session cookies are managed by NextAuth: `httpOnly`, `sameSite=lax`, and
  `secure` in production automatically — never touched manually.

## Authorization ("every query includes the authenticated user's ID")

- `requireUserId()` (`src/lib/session.ts`) is the **only** sanctioned way any
  API route obtains a user ID. It reads the server-side session — never a
  client-supplied field — and throws a 401 if there isn't one.
- Every Mongoose query that touches user-owned data (`MonthlyBudget`,
  `BudgetAddition`, `Category`, `Expense`, `Report`) includes `{ userId }` (or
  `{ _id, userId }` for single-document lookups) in its filter. A document
  that exists but belongs to another user resolves to "not found", not
  "forbidden" — this avoids leaking existence of other users' records.
- `src/middleware.ts` additionally gates entire route segments
  (`/dashboard`, `/budget`, `/assistant`, `/settings`) behind a valid
  session before any page code runs; the `(app)/layout.tsx` server layout
  re-checks the session as defense-in-depth.
- The AI Assistant's data context (`src/lib/ai-context.ts`) is built
  exclusively from the authenticated `userId` and is a computed aggregate,
  never a dump of raw collections — see spec item "AI Data Access".

## Input validation & sanitization

- Every mutating API route validates its body with a **Zod** schema
  (`src/lib/validations.ts`) before touching the database. Invalid input
  never reaches Mongoose.
- Free-text fields (expense description/notes/destination, budget-addition
  description, category name, employment/profile text fields) are passed
  through `sanitizeText()` (`src/lib/sanitize.ts`), which strips HTML tags
  and control characters at the point of entry — so malicious markup never
  persists, including in surfaces that don't go through React's escaping
  (the PDF renderer, emails, the AI context).
- Numeric fields use `z.coerce.number()` with explicit min/max bounds.

## Rate limiting

In-memory sliding-window limiter (`src/lib/rate-limit.ts`), applied to:
login, registration, password change, expense/budget/category creation, AI
chat, and report generation/resend. For a multi-instance production
deployment, swap the in-memory `Map` for Redis/Upstash — the function
signature is designed to make that a drop-in change.

## Database

- Every user-owned collection is indexed on `userId`, plus a compound index
  matching its primary query pattern:
  - `MonthlyBudget`: unique `(userId, year, month)` — also the mechanism
    that prevents duplicate monthly budgets.
  - `BudgetAddition`: `(userId, budgetId, date)`
  - `Expense`: `(userId, date)` and `(userId, categoryType, date)`
  - `Category`: unique `(userId, name)`
  - `Report`: unique `(userId, year, month)` — the mechanism that prevents
    duplicate monthly reports, backed up by an application-level check in
    `generateMonthlyReport()`.
- All list endpoints are paginated (`src/lib/api-helpers.ts`,
  `parsePagination` clamps `limit` to 100 max) — no endpoint can be made to
  return an unbounded result set.

## Transport & headers

- `next.config.mjs` sets `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, and a restrictive `Permissions-Policy` on every route.
- All external calls (MongoDB, Resend, the AI API) use secrets from
  environment variables only — never hard-coded, never sent to the client.

## Cron / scheduled jobs

- `/api/cron/month-end` requires `Authorization: Bearer $CRON_SECRET` and
  returns 401 immediately if `CRON_SECRET` isn't configured or doesn't
  match — it can't be triggered by an arbitrary request.

## Known trade-offs (documented, not hidden)

- The rate limiter is in-memory and per-instance; fine for a single-region
  deployment, not for multi-instance production traffic without a shared
  store.
- MongoDB multi-document transactions aren't used for the budget-addition
  write (create `BudgetAddition` + increment `MonthlyBudget`) — most
  MongoDB Atlas tiers run as a replica set where this would work, but the
  code avoids depending on it so it also runs against a standalone
  instance. The two writes are ordered so a failure after the first leaves
  data recoverable (an orphaned addition can be reconciled), never silently
  double-counted.
