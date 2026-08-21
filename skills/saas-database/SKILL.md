---
name: saas-database
description: >
  Set up the database layer of a SaaS application. Covers Supabase project
  creation, schema design, Row Level Security (RLS), migrations, and connection
  pooling. Use this skill when the user wants to set up a database, design a
  schema, or configure Supabase.
---

# SaaS Database

This skill covers the database infrastructure for a SaaS application using Supabase (PostgreSQL).

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Note the project URL and anon key from Project Settings → API
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Install the Supabase client:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

## Schema Design Principles

- Always include `id` (uuid), `created_at`, and `updated_at` columns
- Use `user_id` foreign key to link records to auth.users
- Enable RLS on every table that contains user data
- Design with normalisation in mind — avoid duplicating data
- Use enums for status fields (e.g. subscription status)

## Core Tables for SaaS

```sql
-- User profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscription plans
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  plan text not null default 'free', -- 'free', 'pro', 'enterprise'
  status text not null default 'active', -- 'active', 'cancelled', 'past_due'
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Row Level Security (RLS)

Enable RLS and create policies for every user-facing table:

```sql
-- Enable RLS
alter table profiles enable row level security;
alter table subscriptions enable row level security;

-- Users can only see their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Users can only see their own subscription
create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);
```

## Migrations

Use Supabase CLI for migrations:

```bash
npx supabase init
npx supabase migration new create_profiles
# Edit the migration file in supabase/migrations/
npx supabase db push
```

## Connection Pooling

For production, use the pooler connection string (Transaction mode) from Supabase dashboard → Settings → Database → Connection pooling.

Set in `.env.local`:
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Supabase Client Setup

Create `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server) using `@supabase/ssr`.

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Common Gotchas

- Always use the service role key on the server for admin operations — never expose it to the client
- RLS policies must be tested thoroughly — a missing policy can expose all users' data
- The anon key is safe to expose publicly — it respects RLS policies
- Run `supabase db push` after every schema change in development
- Use `generated always as identity` for integer primary keys, `gen_random_uuid()` for uuid
