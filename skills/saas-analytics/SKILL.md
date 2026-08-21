---
name: saas-analytics
description: >
  Set up PostHog analytics and product analysis for a SaaS application.
  Event tracking, user identification, feature flags, session replay, funnel
  analysis, and privacy-compliant configuration. Use this skill when the user
  wants anything related to user analytics, PostHog, event tracking, user
  behaviour, feature flags, A/B testing, conversion analysis, or metric
  tracking. Phrases like "set up analytics", "track users", "add PostHog",
  "create a feature flag" trigger this skill.
---

# SaaS Analytics — Product Analysis with PostHog

This skill sets up the analytics layer for a SaaS application. You can't improve what you can't see — understanding how users use your product, where they get stuck, and why they leave is the foundation of growth.

**Dependency:** This skill is applied alongside or after the deployment phase of the **saas-launcher** orchestrator skill. It can also be used independently.

**Related skills:**
- **saas-auth** — User identity is linked to analytics.
- **saas-payments** — Revenue metrics and conversion funnels.
- **saas-legal** — Privacy-compliant tracking configuration.

---

## Why PostHog

### Comparison with Alternatives

**PostHog vs. Google Analytics:**
- PostHog is designed for product analytics (event-based); GA is for marketing analytics (pageview-based)
- PostHog can be self-hosted (data stays with you — GDPR/privacy advantage)
- PostHog includes session replay, feature flags, and A/B testing out of the box
- GA requires cookie consent (GDPR); PostHog can run in cookieless mode

**PostHog vs. Mixpanel:**
- PostHog is open source with a self-host option
- PostHog's free tier is very generous (1M events/month)
- Mixpanel's analytics interface is more mature but PostHog is catching up fast

**PostHog vs. Plausible:**
- Plausible only covers page analytics — no event tracking, funnels, or session replay
- Plausible is good for simple privacy-focused analytics but insufficient for SaaS product analysis

**Conclusion:** PostHog is the most balanced choice for SaaS — product analytics, feature flags, and session replay in one platform.

---

## PostHog Setup

### Cloud vs. Self-Host

**PostHog Cloud (recommended to start):** Sign up, create a project, get your API key. Free tier: 1M events/month, 5K session recordings, 1M feature flag evaluations.

**Self-host:** Run on your own server with Docker Compose. Advantage: data is entirely yours, zero privacy concerns. Disadvantage: server management and update responsibility. Consider when you scale or if there's a legal requirement.

### Next.js Integration

Install PostHog's official `posthog-js` library:

```
npm install posthog-js
```

**Create a PostHog Provider:** Write a provider as a client component. Add it to the root layout in the App Router. Environment variables:
- `NEXT_PUBLIC_POSTHOG_KEY` — project API key (public)
- `NEXT_PUBLIC_POSTHOG_HOST` — PostHog instance URL (`https://us.i.posthog.com` or `https://eu.i.posthog.com` for cloud)

**Use the EU instance** if you're working with GDPR compliance in mind — data stays in Europe.

### Server-Side Tracking

Use the `posthog-node` library to send events from API routes and server components. Server-side tracking is especially needed for payment events, webhook processing, and background tasks.

---

## Event Tracking Design

### Naming Conventions

Consistent event naming is critical. Chaotic names make analysis impossible.

Format: `object_action` — lowercase, separated by underscores.
- `user_signed_up`
- `plan_upgraded`
- `project_created`
- `checkout_started`
- `checkout_completed`

**Avoid:** `SignUp`, `user-sign-up`, `Signed Up`, `signup` — inconsistent naming prevents analysis.

### Core Events

Events every SaaS should track:

**Conversion funnel:**
1. `page_viewed` (properties: path, referrer)
2. `signup_started` (opened the signup form)
3. `user_signed_up` (registration complete, properties: method — google/magic_link)
4. `checkout_started` (selected a plan, properties: plan, period)
5. `checkout_completed` (payment successful, properties: plan, amount)

**Product usage:**
- `feature_used` (properties: feature_name)
- `project_created` / `project_deleted`
- `settings_updated`

**Churn signals:**
- `plan_cancelled`
- `plan_downgraded`
- `account_deleted`

### Properties

Metadata that adds context to each event:
- **User properties:** plan, signup date, country
- **Event properties:** page path, button position, selected plan
- **Super properties:** common data automatically appended to every event

---

## User Identification

### Anonymous → Identified Transition

PostHog assigns an anonymous ID to every visitor. When a user logs in, link their real identity with `posthog.identify()`. This merges pre-login and post-login behaviour into a single profile.

Properties to send on identify:
- email
- name
- plan
- created_at
- stripe_customer_id (optional)

**Call identify in the auth callback** — after a successful login, before redirecting to the dashboard.

### Group Analytics

In team/organisation-based SaaS, link users to groups. This lets you answer questions like "how many active users does this company have?" Not needed for single-user SaaS.

---

## Feature Flags

### Why PostHog Feature Flags

Use PostHog's built-in feature flags instead of a separate service (LaunchDarkly, Flagsmith) — no extra cost, naturally integrated with analytics, managed in the same dashboard.

### Use Cases

- **Gradual rollout:** Open a new feature to 10% of users first, then roll out to 100% if stable
- **Beta testing:** Exclusive feature access for specific users or plans
- **A/B testing:** Compare two UI variants and measure conversion rates
- **Kill switch:** Instantly disable a problematic feature — no deploy required

### Server-Side Flag Checks

Check feature flags in API routes as well as the UI. Client-side flag checks are for UX (hide/show UI); server-side checks are mandatory for security — client-side checks can be bypassed.

---

## Session Replay

PostHog's session replay records a video of what the user did. A powerful tool for understanding bug reports, identifying UX issues, and observing user behaviour.

### Privacy Settings

- Automatically mask sensitive inputs (passwords, card details, personal data)
- Add the `data-posthog-mask` attribute to mask specific elements
- For GDPR/privacy compliance, tie session replay to cookie consent or disable it entirely

**Warning:** Session replay consumes a lot of quota. The free plan includes 5K recordings/month — enabling it for all traffic will drain quickly. Lower the sampling rate or activate only on specific pages.

---

## Dashboard and Metrics

### Metrics Every SaaS Should Track

**Growth:**
- Weekly/monthly signup count (trend)
- Signup → activation rate (users who complete a meaningful first action)
- Organic vs. referral vs. direct traffic breakdown

**Revenue:**
- MRR (Monthly Recurring Revenue)
- New MRR vs. Churned MRR
- Plan distribution (free/starter/pro)
- Average revenue per user (ARPU)

**Engagement:**
- Daily/weekly/monthly active users (DAU/WAU/MAU)
- Core feature usage frequency
- Session duration and depth

**Churn:**
- Churn rate (monthly cancellations / total subscribers)
- Behaviour patterns before cancellation
- Cancellation reasons (survey integration)

### Building PostHog Dashboards

Create insights on your dashboard: trend graphs, funnels, retention analysis, user paths. Share with your team and establish a weekly review ritual.

---

## Gotchas

- **Event spam:** Don't track every click and mouse movement. Only send meaningful actions as events — otherwise you'll needlessly burn through your event quota.
- **Privacy laws:** GDPR and similar regulations require informing users before collecting their data. At a minimum, disclose analytics use in your privacy policy. If cookie consent is required, consider PostHog's cookieless mode.
- **Adblockers block PostHog.** 20–30% of users use adblockers. Supplement with server-side tracking or use PostHog's reverse proxy approach.
- **Separate development events.** Events from your development environment pollute production data. Use a separate PostHog project or an environment filter.
- **Too many dashboards, too little action.** Building dashboards is easy; turning insights into actions is hard. For every metric, answer "what will we do if this drops/rises?"
- **Don't send events before identify.** After a user logs in, call `identify()` first, then send events. If the order is wrong, events remain anonymous and won't merge with the profile.
