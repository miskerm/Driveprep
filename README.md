# DrivoPrep

Learner-licence study app built with Next.js 16, Auth.js (NextAuth v5), and Turso/libSQL.

## Features

- **Accounts** — sign up with a full name plus an email address **or** phone number. Passwords are hashed with Node `scrypt`; duplicates are rejected by database constraints.
- **Sessions** — Auth.js JWT sessions. Every protected page, server action, and API route re-reads the user from the database, so terminating an account or changing its payment status takes effect immediately, even for an existing session.
- **Manual payments** — learners see bank details from environment variables, upload a payment screenshot, and wait for admin approval. The image is sent straight to Telegram; only Telegram file metadata and payment details are stored in the database.
- **Premium gating** — Study, Practice, Full Mock Tests, Quick Quizzes, and the study-module download API require an active account with an approved payment and premium entitlement. Admins bypass the payment requirement.
- **Admin dashboard** — `/admin/users` lists name, contact, registration date, account status, payment status, premium state, and tracked devices, with activate/terminate and restrict/restore actions plus a status-change history. `/admin/payments` reviews pending screenshots, approves or rejects payments, and shows payment history.
- **Admin seeding** — the admin account is created/updated from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` on server start. Public signup is blocked from claiming the configured admin identity.

## Getting started

```bash
pnpm install
cp .env.example .env.local
# fill in the values in .env.local
pnpm dev
```

Open <http://localhost:3000>. Schema migrations run automatically on the first database access (`lib/schema.ts`), including admin seeding.

### Required environment variables

See `.env.example` for the full list and comments.

| Variable | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Turso/libSQL database |
| `AUTH_SECRET` | Auth.js signing secret (`openssl rand -base64 48`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin bootstrap credentials |
| `PAYMENT_AMOUNT`, `PAYMENT_CURRENCY` | Price shown to learners |
| `PAYMENT_BANK_NAME`, `PAYMENT_ACCOUNT_NAME`, `PAYMENT_ACCOUNT_NUMBER` | Bank transfer details |
| `PAYMENT_REFERENCE_NOTE` | Optional note about the payment reference |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Bot/chat that receives screenshots |

> `PAYMENT_ACCOUNT_NUMBER` ships as a placeholder in the local environment. Replace it (and the other `PAYMENT_*` values) with the real receiving account before accepting payments.

## Payment flow

1. A new learner signs up and is redirected to `/payment`.
2. `/payment` shows the amount and bank details from the environment.
3. `/payment/verify` validates the screenshot (JPEG/PNG/WebP, max 5 MB, magic-byte check) and sends it to Telegram as a document via `lib/telegram.ts`.
4. A row is written to `payments` with `status = 'pending'`, Telegram message/file ids, and reference. The learner's `payment_status` becomes `pending`.
5. An admin opens `/admin/payments`, views the screenshot through the protected `/api/admin/payments/[id]/screenshot` route (fetched from Telegram on demand), and approves or rejects it.
6. Approval sets `payment_status = 'approved'`, `premium_entitlement = 1`, and unlocks premium pages. Rejection stores a reason and lets the learner resubmit.
7. Terminating an account sets `status = 'terminated'`; the next request from that session is redirected to `/account/terminated`.

## Access control

`lib/session.ts` is the single source of truth:

- `requireUser()` — authentication, plus termination check.
- `requirePremium()` — authentication, active account, approved payment, premium entitlement, and no admin restriction.
- `requireAdmin()` — authentication plus active admin role.

`proxy.ts` only performs a fast signed-out redirect based on session-cookie presence; it is not an authorization boundary.

## Security notes

- Secrets live in `.env.local` and are never committed. Do not hardcode credentials or bot tokens.
- Payment screenshots are never written to the database or filesystem; only Telegram metadata is stored.
- Rate limits are in-process (`lib/rate-limit.ts`). For multi-instance/serverless deployments, put a shared limiter (Redis/Upstash) in front of login, signup, and payment endpoints.
- `getRequestIp()` trusts `x-forwarded-for`; deploy behind a proxy that overwrites this header.
- Use HTTPS in production so Auth.js can set secure cookies.

## Development notes

- **RSC performance guard** — React's development-only Server Components timing track can produce a negative `end` timestamp when a server component awaits work and then redirects (for example `/payment`). Chromium then throws `'​PaymentRoute' cannot have a negative time stamp` inside `performance.measure`, which breaks the dev overlay. `app/layout.tsx` injects a small script in development only that clamps non-finite/negative timestamps. The production HTML does not include it. Upstream: [facebook/react#37561](https://github.com/facebook/react/issues/37561), [vercel/next.js#99032](https://github.com/vercel/next.js/issues/99032). Remove the guard once the fix ships in a stable Next.js release.
- **Turso latency** — schema migrations and session checks query Turso on every protected request. A slow or unreachable Turso endpoint appears as a 500 with `ConnectTimeoutError`; retry or check network access to the database host.

## Scripts

```bash
pnpm dev      # development server
pnpm build    # production build
pnpm start    # production server
```
