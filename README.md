# PitchLayer

AI-enabled champion enablement platform for persona-tailored internal pitch decks. Built with Next.js 14, Supabase, NextAuth, and OpenAI.

## Features
- Google OAuth2 and email/password auth with lockout after 10 failed attempts.
- CSRF token middleware, HTTPS-only cookies, secure headers, and in-memory per-user rate limiting (20 req/min).
- Pitch generation via OpenAI with server-side only calls.
- Supabase persistence with RLS enforcing row ownership.
- PDF and Google Slides export hooks (Slides export requires configuring Google API credentials).
- Dashboard with saved pitches and detailed pitch views.

## Getting Started
1. Install dependencies:
```bash
npm install
```
2. Create `.env.local` based on `.env.example` and fill secrets (Supabase URL + service key, OpenAI key, NextAuth secrets, Google OAuth credentials, optional Slack webhook).
3. Run database migrations in Supabase (SQL below).
4. Start dev server:
```bash
npm run dev
```

## Supabase schema & security
```sql
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  mfa_secret text,
  locked_until timestamptz,
  failed_attempts int default 0
);

create table if not exists public.pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  company text not null,
  opportunity text not null,
  personas jsonb not null,
  pain_points text not null,
  benefits text not null,
  ai_output jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.pitches enable row level security;
create policy "Users can see their pitches" on public.pitches
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "Users can insert their pitches" on public.pitches
  for insert with check (auth.uid() = user_id);
create policy "Users can update their pitches" on public.pitches
  for update using (auth.uid() = user_id);
create policy "Users can delete their pitches" on public.pitches
  for update using (auth.uid() = user_id);
```

## Security notes
- CSRF token set in `middleware.ts` and validated in mutating API routes via `x-csrf-token` header.
- Secure headers (HSTS, CSP, frame deny, XSS) are applied by middleware and `next.config.mjs`.
- All API routes validate input with Zod and escape dynamic output in React.
- Passwords are hashed with bcryptjs (cost 12+) and failed attempts tracked for lockout.
- AI prompts and secrets are never logged; Slack alerts can be enabled for 500s.

## MFA
Add an `mfa_secret` to the `users` table and extend the credential flow to verify one-time codes (e.g., TOTP) before returning success. Hooks are provided in the schema for future expansion.

## Exports
- PDF export uses brand colors inside `PDFExport.tsx`.
- Slides export button is wired for future Google Slides API integration; populate OAuth credentials and replace the placeholder call with an authorized Slides API client.

## Deployment
- Vercel-ready: `vercel.json` sets security headers.
- Ensure environment variables are configured in Vercel project settings.

## Monitoring
- Fatal errors trigger optional Slack webhook alerts.
- API calls avoid logging PII; extend with your logging provider as needed.
