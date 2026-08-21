---
name: saas-deployment
description: >
  Move a SaaS application to production. Deployment with Vercel, Railway, or
  Fly.io, domain configuration, SSL, environment variables, CI/CD, monitoring,
  and operational readiness. Use this skill when the user wants anything
  related to deploy, publishing, production, hosting, domain, SSL, CI/CD,
  monitoring, or "going live". Phrases like "deploy", "publish", "go live",
  "put it on Vercel", "connect a domain" trigger this skill.
---

# SaaS Deployment — Moving to Production and Operations

This skill moves a SaaS application from the development environment to production and ensures its operational readiness. Deployment is not just "uploading code to a server" — it's switching all external services to production mode, verifying security, and setting up monitoring.

**Dependency:** This skill is Phase 8 of the **saas-launcher** orchestrator skill. It can also be used independently. Ideally applied after all other phases are complete.

**Related skills:** Production migration steps from all other skills are consolidated in this skill.
- **saas-auth** — Production OAuth callback URLs, production secret
- **saas-payments** — Live Stripe/LS keys, production webhook URL
- **saas-email** — DNS verification must be complete
- **saas-landing-seo** — SEO checklist must be reviewed
- **saas-api-security** — Security checklist must be reviewed

---

## Choosing a Hosting Platform

### Vercel — Our Default Recommendation

**When to choose:** For almost any project using Next.js.

Why: The hosting platform by the company that makes Next.js. Zero configuration — connect your repo, deploy, done. Automatic preview deployments (a separate URL for each PR), global low latency via edge network, built-in analytics and Web Vitals measurement, free SSL.

Free tier limits: 100 GB bandwidth/month, 100 hours build time, serverless functions with a 10-second timeout. More than enough for most early-stage SaaS.

When it falls short: Long-running background jobs (operations exceeding 10 seconds), applications requiring WebSockets (Vercel has limited WebSocket support), those who want their own database on the same platform.

### Railway

**When to choose:** For those who want database and application on a single platform.

Why: Hosts services like PostgreSQL, Redis, and MySQL on the same platform. Cron job and background worker support. Ability to run Docker containers.

Free tier: $5 credit/month. Sufficient for small projects but quickly requires a paid plan as traffic grows.

### Fly.io

**When to choose:** For projects requiring global distribution, container-based deployment, WebSockets, or long-lived connections.

Why: Runs containers across multiple regions. Persistent volume (persistent disk) support. WebSockets and long-polling are natively supported.

Extra overhead: Writing and managing a Dockerfile is required. Not as "zero configuration" as Vercel or Railway.

---

## Migration to Production Order

Deployment is not just "upload the code". Follow this order:

### Step 1: Production Environment Variables

Create the production counterpart of every variable used in development. These must be different:

**Auth:**
- `NEXTAUTH_SECRET` — Generate a new value for production (openssl rand -base64 32). Must not be the same as development.
- `NEXTAUTH_URL` — Production domain: `https://myapp.com`
- Google OAuth Client: The same client can be used but the production domain must be added to the callback URLs.

**Payment (see saas-payments):**
- Stripe/LS keys: Switch from test keys to live keys. `sk_test_` → `sk_live_`, `pk_test_` → `pk_live_`.
- Price IDs: IDs for products created in live mode are different from those in test mode. Update them.
- Webhook secret: A new secret is generated for the production webhook endpoint.

**Database:**
- Use a production database instance. Don't use the development DB in production.
- Add connection pooling parameters to the connection string (for serverless environments).

**Email:**
- The API key can remain the same but verify that domain verification is complete.

**General:**
- `NEXT_PUBLIC_SITE_URL` — Production domain: `https://myapp.com`

### Step 2: Platform Setup

On the chosen hosting platform:
1. Create a new project and connect the GitHub repo
2. Add environment variables (the production values from Step 1)
3. Trigger the first deploy
4. Verify the build succeeded

### Step 3: Domain Configuration

**DNS records:**
- Add the IP or CNAME record provided by the hosting platform in your domain registrar
- Configure www → non-www redirect (or vice versa — pick one and be consistent)
- Wait for the SSL certificate to be issued automatically (usually a few minutes)

**DNS propagation:** Can take anywhere from 15 minutes to 48 hours. Check propagation with `dig myapp.com A`. Be patient.

### Step 4: Payment System Production Migration

This step is critical and must be done carefully (details in the **saas-payments** skill):

1. Switch to live mode in the payment provider dashboard
2. Create products and prices in live mode
3. Add the production webhook endpoint: `https://myapp.com/api/stripe/webhook` (or Lemon Squeezy equivalent)
4. Select events to listen to
5. Add the webhook signing secret to environment variables
6. Configure the customer portal

### Step 5: Auth Provider Production Migration

Google OAuth (details in the **saas-auth** skill):
1. Set the OAuth Consent Screen to "Published" in Google Cloud Console
2. Add the production domain to callback URLs
3. If app review is required, apply a few days in advance

### Step 6: Email DNS Verification

Check that domain verification is complete in the email service dashboard (details in the **saas-email** skill). All three of SPF, DKIM, and DMARC records must show "verified".

### Step 7: Final Verification

After the deploy is complete, run these tests:

**Functional tests:**
- Is the signup/login flow working?
- Is the payment flow working? (Make a real payment with a test card in Stripe live mode, then refund it)
- Are emails being delivered? (Not landing in spam?)
- Are webhooks working? (Is the plan activating after payment?)
- Are protected pages inaccessible without logging in?

**SEO tests (see saas-landing-seo):**
- Is sitemap.xml accessible?
- Is robots.txt accessible?
- Are OG images rendering correctly?

**Performance test:**
- Is the Lighthouse score 90+?
- Is the initial load time acceptable?

---

## Monitoring and Operations

Once the application is in production, monitoring is vital. You can't fix an error you can't see, and you can't respond to an outage you don't know about.

### Uptime Monitoring

An external service that regularly checks whether your application is accessible. Point it to your health check endpoint (/api/health) to check every minute.

Recommended services: BetterStack (formerly Better Uptime), UptimeRobot. Both have sufficient free tiers.

You'll receive an email or SMS notification when there's an outage — you'll know before your customers do.

### Error Tracking

A service that collects, groups, and alerts on errors in your application. Users don't report errors — they leave silently.

Recommended: Sentry. Its free tier is sufficient for most early-stage SaaS. Integration is simple — just a few lines of configuration.

What Sentry provides:
- Error message and stack trace
- Which user experienced it
- Which browser/device
- Error frequency and trends
- Alert when a new error is detected

### Analytics

For understanding how users use the application.

To start: Vercel Analytics (free, built-in) or Plausible (privacy-focused, simple). Google Analytics is also an option but requires cookie consent for GDPR.

Key metrics to track:
- Monthly visitor count
- Signup rate (visitor → signup)
- Conversion rate (signup → payment)
- Active user count (daily/weekly/monthly)
- Churn rate (cancellations / total subscribers)

### Log Management

Vercel, Railway, and Fly.io all offer built-in log viewing. Sufficient to start. As you scale, move to a log aggregation service like Axiom, Datadog, or LogTail.

---

## CI/CD (Continuous Integration / Continuous Deployment)

### Simple Approach (Recommended to Start)

When Vercel or Railway is connected to your GitHub repo, CI/CD already happens:
- Push to `main` branch → automatic production deploy
- PR opened → automatic preview deploy (Vercel)

This is sufficient for most early-stage SaaS.

### Additional Checks with GitHub Actions

As you grow, add automated pre-deploy checks:
- Lint (code style check)
- Build test (does the build succeed?)
- Type check (any TypeScript errors?)
- Optional: test suite (unit and integration tests)

If these checks fail on a PR, the merge can be blocked — preventing broken code from reaching production.

---

## Backup Strategy

### Database Backup

- MongoDB Atlas: Automatic daily backup (included on the free tier)
- Supabase: Point-in-time recovery included on the Pro plan; weekly backup on the free plan
- Railway PostgreSQL: Manual backup with pg_dump or automatic backup (paid plan)

### Code Backup

Git already versions all code. Code is safe as long as the GitHub/GitLab repo isn't deleted. Extra precaution: keep a local clone up to date.

### Environment Variable Backup

If the platform (Vercel, Railway) crashes, your environment variables may be lost. Keep a copy in a secure place (a password manager like 1Password or Bitwarden).

---

## Scaling Considerations (As You Grow)

Don't think about scaling in the early stage — avoid premature optimisation. But keep these points in mind:

**As you grow on Vercel:**
- Function timeout (hobby: 10s, pro: 60s) can become a bottleneck → move heavy processing to background jobs (Inngest, Trigger.dev)
- If bandwidth limit is exceeded → move to the Pro plan
- Global distribution for Edge Functions is automatic

**As you grow on the database:**
- Connection pooling: connections are quickly exhausted on serverless → use a pooler
- Indexes: create them when queries slow down, not upfront
- Read replica: distributes database load in read-heavy applications

**General principle:** "Measure before optimising." Unless you've experienced a bottleneck, your current setup is sufficient.

---

## Production Migration Master Checklist

### Security
- [ ] `NEXTAUTH_SECRET` generated uniquely for production
- [ ] Payment keys switched to live mode
- [ ] Webhook URLs updated to production domain
- [ ] Webhook signature verification active
- [ ] `.env.local` and sensitive files in `.gitignore`
- [ ] Rate limiting active at least on login and webhook endpoints
- [ ] Error tracking (Sentry) set up

### Infrastructure
- [ ] Production database instance created and connected
- [ ] Connection pooling configured (serverless environment)
- [ ] Domain DNS records configured
- [ ] SSL certificate active (HTTPS working)
- [ ] www → non-www redirect configured

### Email
- [ ] Email DNS records (SPF, DKIM, DMARC) verified
- [ ] Email domain verified by the service
- [ ] Test email sent and confirmed to arrive in inbox

### Payment
- [ ] Products and prices created in live mode
- [ ] Production webhook endpoint added and tested
- [ ] Customer portal configured
- [ ] Test payment made and plan activation confirmed (then refund)

### SEO
- [ ] sitemap.xml accessible
- [ ] robots.txt accessible
- [ ] OG images tested
- [ ] Site added to Google Search Console
- [ ] Lighthouse score 90+

### Monitoring
- [ ] Uptime monitoring set up (BetterStack / UptimeRobot)
- [ ] Error tracking set up (Sentry)
- [ ] Analytics active

### Final Functional Test
- [ ] Signup/login flow working
- [ ] Payment flow working
- [ ] Emails being delivered
- [ ] Webhooks working
- [ ] Protected pages are protected
- [ ] Health check endpoint responding
- [ ] Build completing without errors

---

## Gotchas

- **Build error on first deploy.** Code that works locally can break on Vercel — client-only code in server components, missing environment variables, and case-sensitive filenames (Linux is case-sensitive, macOS is not) are the most common causes.
- **Vercel build cache.** Stale build cache sometimes causes issues. Clear it with Dashboard → "Redeploy" → "Clear Build Cache".
- **Preview vs. production environment variables.** In Vercel, each environment (Production, Preview, Development) can have its own variable set. Use test keys in Preview deploys and live keys in production.
- **DNS propagation requires patience.** Can take 24–48 hours. Don't panic when you "deployed but the site won't load" — wait for DNS propagation.
- **First test in Stripe live mode.** Make a small test payment with a real card in live mode, verify the webhook fired, then refund it from the Stripe dashboard. Don't say "I assume it works in production" — verify it.
- **Don't launch at night.** Launch at a time when you can respond to issues. Ideal: weekday morning.
- **Rollback plan.** If something goes wrong, you need to be able to revert to the previous deploy. On Vercel this is done with a single click (instant rollback to a previous deployment). Check for this capability when choosing a platform.
