---
name: saas-auth
description: >
  Set up the authentication layer of a SaaS application. Covers Google OAuth,
  Magic Link, email/password login, JWT session management, and middleware for
  protected routes. Use this skill when the user wants to add authentication,
  set up login, or configure user sessions.
---

# SaaS Auth

This skill covers authentication and session management for a SaaS application using Supabase Auth.

## Auth Strategy Selection

Choose based on your product's needs:

| Strategy | Best For | Friction |
|----------|----------|----------|
| Google OAuth | Consumer apps, B2C | Very low |
| Magic Link | B2B, technical users | Low |
| Email/Password | Full control needed | Medium |
| Combination | Maximum coverage | Low |

**Recommendation:** Google OAuth + Magic Link covers the vast majority of use cases with minimal friction.

## Supabase Auth Setup

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable desired providers
3. For Google OAuth:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
   - Add authorised redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
   - Add Client ID and Client Secret to Supabase

## Next.js Middleware

Create `middleware.ts` at the project root:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Auth Callback Route

Create `app/auth/callback/route.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

## Login Page

```typescript
// app/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const signInWithMagicLink = async (email: string) => {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div>
      <button onClick={signInWithGoogle}>Continue with Google</button>
      {/* Magic link form */}
    </div>
  )
}
```

## User Profile Sync

Create a database trigger to auto-create a profile when a user signs up:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Accessing Session Data

```typescript
// Server component
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function Dashboard() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  // user is available here
}
```

## Common Gotchas

- Always use `getUser()` on the server — never trust `getSession()` alone for auth checks
- Google OAuth requires the app to be verified for production use — start the verification process early
- Magic Link emails may land in spam — configure SPF/DKIM via saas-email skill
- The auth callback URL must be added to Supabase's allowed redirect URLs list
- Sign-out must clear cookies on both client and server
