---
name: saas-payments
description: >
  Set up the payment layer of a SaaS application. Covers Stripe and Lemon
  Squeezy integration, checkout flow, webhook handling, subscription lifecycle
  management, and plan-based access control. Use this skill when the user wants
  to add payments, set up subscriptions, or integrate a payment provider.
---

# SaaS Payments

This skill covers payment systems for a SaaS application.

## Provider Selection

| | Stripe | Lemon Squeezy |
|---|--------|---------------|
| Commission | 2.9% + $0.30 | 5% + $0.50 |
| Tax/VAT | You manage | Platform manages (MoR) |
| Documentation | Excellent | Good |
| Global coverage | Excellent | Good |
| Best for | Maximum control, lowest fees | Simplicity, global tax compliance |

**Recommendation:** Stripe for most projects. Lemon Squeezy if you want zero tax administration overhead.

## Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Install:
   ```bash
   npm install stripe @stripe/stripe-js
   ```

## Define Pricing Plans

Create plans in Stripe Dashboard → Products, then reference in code:

```typescript
// lib/stripe/plans.ts
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['5 projects', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support'],
  },
} as const

export type Plan = keyof typeof PLANS
```

## Checkout Flow

```typescript
// app/api/stripe/checkout/route.ts
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { priceId } = await request.json()

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId: user.id },
  })

  return Response.json({ url: session.url })
}
```

## Webhook Handler

This is the most critical file. Handle all subscription lifecycle events:

```typescript
// app/api/stripe/webhook/route.ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      await supabase.from('subscriptions').upsert({
        user_id: session.metadata?.userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: 'pro',
        status: 'active',
      })
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions')
        .update({ status: 'cancelled', plan: 'free' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return new Response('OK')
}

export const config = { api: { bodyParser: false } }
```

## Plan-Based Access Control

```typescript
// lib/subscription.ts
export async function getUserPlan(userId: string): Promise<Plan> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  if (!data || data.status !== 'active') return 'free'
  return data.plan as Plan
}

// Usage in a server component or API route
const plan = await getUserPlan(user.id)
if (plan === 'free') {
  return new Response('Upgrade to Pro to access this feature', { status: 403 })
}
```

## Customer Portal

Allow users to manage their subscription:

```typescript
// app/api/stripe/portal/route.ts
export async function POST(request: Request) {
  // ... get user and their stripe_customer_id
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  })
  return Response.json({ url: portalSession.url })
}
```

## Testing Webhooks Locally

```bash
# Install Stripe CLI
npx stripe login
npx stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
npx stripe trigger checkout.session.completed
```

## Common Gotchas

- Always verify the webhook signature — never trust incoming webhook data without it
- Use the service role key in the webhook handler (not anon key) — it bypasses RLS
- Switch to live mode API keys before going to production — test keys won't charge real cards
- The webhook endpoint must not use Next.js body parsing — use `request.text()`
- Store `stripe_customer_id` on first checkout — needed for the customer portal and future lookups
- Handle `payment_intent.payment_failed` to notify users of failed payments
