---
name: saas-launcher
description: >
  Build a production-ready SaaS application from scratch. Covers every layer
  including payments, authentication, database, email, landing page, SEO, and
  API security. Use this skill when the user wants to launch a SaaS, start a
  web app, build an AI tool, or ship an online product — including phrases like
  "start a project", "build an app", "launch a startup". For adding a single
  layer to an existing project (payments only, auth only, etc.), redirect to
  the relevant sub-skill.
---

# SaaS Launcher

This skill is the orchestrator for taking a SaaS application from zero to production. It does not generate code itself — it manages decisions, determines the sequence, and delegates each layer to the relevant specialist skill.

## Related Skills

This skill works alongside the following specialist skills. Each can also be used independently:

- **saas-database** — Supabase database infrastructure, schema design, and RLS
- **saas-auth** — Authentication and session management
- **saas-payments** — Payment system and subscription management
- **saas-email** — Transactional email and DNS infrastructure
- **saas-storage** — File storage and asset management (optional)
- **saas-landing-seo** — Landing page strategy and search engine optimisation
- **saas-legal** — GDPR/Privacy Act compliance and legal pages
- **saas-api-security** — API protection, rate limiting, and input validation
- **saas-testing** — Testing strategy and quality assurance
- **saas-analytics** — Product analytics and user tracking with PostHog
- **saas-deployment** — Taking to production and operational readiness

---

## Phase 0: Discovery Interview

Before making any technical decisions, run a thorough discovery interview with the user. The goal is to clarify the product, target audience, and technical requirements.

### Questions to Ask

**Product and Business Model:**
- What is the core function of the app? Can you describe it in one sentence?
- Who is your target audience? (individual users, small business, enterprise)
- What is your revenue model? (monthly subscription, annual subscription, one-time payment, freemium, usage-based)
- How many pricing tiers will there be?
- Will there be a free trial period?

**User Experience:**
- How will users sign up? (Google login, email/password, magic link, multiple options)
- Is multi-language support needed?
- Which devices will it be used on? (web, mobile web, native mobile)

**Technical Preferences:**
- Do you have a preferred tech stack? (framework, database, hosting)
- Are there existing tools or accounts you already use? (Stripe, Vercel, AWS, etc.)
- Team size? (solo founder, small team, large team)

**Time and Priority:**
- How quickly do you want to launch?
- MVP or full product?
- Which features are essential for Day 1, and which can be added later?

### Post-Discovery Output

Once the discovery interview is complete, summarise the following for the user:
- Chosen tech stack and the rationale for each choice
- Phase sequence and estimated timeline
- Day 1 feature list vs. deferred items
- List of external accounts that need to be created (Stripe, Google Cloud Console, email service, hosting, etc.)

---

## Phase 1: Tech Stack Decisions

For each decision, weigh the user's answers, project needs, and ecosystem maturity, then make a recommendation. If the user has already made decisions, confirm them and move on.

### Framework Selection

Our default recommendation is Next.js (App Router + TypeScript). Rationale: server and client rendering in the same project, built-in API routes, React ecosystem, zero-friction deployment with Vercel. TypeScript should be mandatory for every project — type safety saves you as the project grows.

Alternative evaluation points:
- Nuxt.js, only if the user is already deep in the Vue ecosystem and the cost of learning React is unacceptable
- SvelteKit, only if very small bundle size is critical
- Remix, only for form-heavy applications where nested routing is very complex

### Database Selection

Three main paths:

**Supabase (PostgreSQL)** — Our default recommendation. Auth, database, realtime, and storage under one roof. Visual management via dashboard. Generous free tier. Best choice: most SaaS projects, especially solo founders.

**MongoDB Atlas** — For projects requiring schema-less flexibility. If data structure changes frequently or nested document structures dominate. Fast prototyping with Mongoose. Best choice: content-driven apps, unstructured user-generated data.

**Prisma + PostgreSQL** — Type-safe database queries, migration history, schema versioning. With managed PostgreSQL like Railway or Neon. Best choice: projects with multiple developers, complex relational data.

### Payment Selection

For the detailed decision guide, delegate to the **saas-payments** skill. Short summary:

**Stripe** — Industry standard, lowest commission (2.9% + $0.30), best documentation. Tax management must be configured separately. Our default recommendation.

**Lemon Squeezy** — As a Merchant of Record, the platform handles VAT/tax management. Commission is higher (5% + $0.50) but zero tax liability. A significant advantage if selling globally.

### Email Selection

For the detailed guide, delegate to the **saas-email** skill. Short summary:

**Resend** — Modern API, beautiful templates with React Email, excellent Next.js compatibility. Our default recommendation.

**Mailgun** — For projects requiring high volume, advanced routing, or inbound email processing.

### Hosting Selection

For the detailed guide, delegate to the **saas-deployment** skill. Short summary:

**Vercel** — Next.js's home, zero configuration. Our default recommendation.

**Railway** — For those who want database + backend + frontend on one platform.

**Fly.io** — For those who want global distribution and container-based deployment.

---

## Phase 2: Core Infrastructure

First technical steps. What to do in this phase:

1. **Project scaffold:** Create the project with the chosen framework. Set up TypeScript, Tailwind CSS, and a base UI library (shadcn/ui recommended). Create folder structure — route groups, lib directory, component directory, config directory, type definitions.

2. **Environment variable architecture:** Set up the `.env.local` structure. Group variables by service and add descriptive comments. Create the `.env.local.example` template. Don't forget to add to `.gitignore`.

3. **Database connection:** Activate the **saas-database** skill. Create the Supabase project, design the schema, set up RLS policies, configure connection pooling. Detailed guide in the **saas-database** skill.

4. **Base layout:** Create the root layout file — font loading, metadata, SessionProvider. Separate route groups for the public page group (landing, login) and the protected page group (dashboard).

When this phase is complete, there should be a running project with `npm run dev` — empty but structurally sound.

---

## Phase 3: Authentication

Activate the **saas-auth** skill. In this phase:

- Configure the chosen auth strategy (OAuth, Magic Link, email/password, or combination)
- Create login and registration pages
- Set up middleware for protected routes
- Make session data accessible on both server and client
- Integrate with the user model

Auth forms the foundation of every other layer. The payment system depends on user identity, email sending depends on user data, API protection depends on session. That's why auth must always be completed before payments.

---

## Phase 4: Payment System

Activate the **saas-payments** skill. In this phase:

- Define and configure pricing plans
- Set up the checkout flow (user → payment page → success/cancel)
- Create the webhook handler and implement signature verification
- Manage the subscription lifecycle (start, renewal, upgrade, cancellation, payment failure)
- Customer portal integration
- Plan-based access control (which features belong to which plan)

Payments are the heart of a SaaS. The webhook handler is the single most critical file — bugs here directly cause revenue loss. Don't rush this phase.

---

## Phase 5: Email Infrastructure

Activate the **saas-email** skill. In this phase:

- Configure the email service
- Set up DNS records (SPF, DKIM, DMARC) — guide the user step by step
- Create basic email templates (welcome, payment confirmation, payment failure)
- If Magic Link is used, customise the login email template

DNS changes can take 24–48 hours to propagate. That's why you should start the email phase as early as possible — add at least the DNS records on the first day of the project.

---

## Phase 6: Landing Page and SEO

Activate the **saas-landing-seo** skill. In this phase:

- Design the landing page flow and create its components
- Set up SEO fundamentals (metadata, sitemap, robots.txt, Open Graph)
- Performance optimisation (images, fonts, bundle size)
- Set up blog system if desired

The landing page is the shop window of the product. First impressions are formed here. The pricing section must align with the plan definitions from Phase 4.

---

## Phase 6.5: File Storage (Optional)

If the project requires file uploads (profile photos, user documents, images), activate the **saas-storage** skill. In this phase:

- Supabase Storage configuration
- File upload endpoints and security checks
- Image optimisation
- Plan-based storage limits

Not every SaaS needs this. Only implement if file upload is required.

---

## Phase 7: Legal Compliance

Activate the **saas-legal** skill. In this phase:

- Create the privacy policy page (also required for Google OAuth approval)
- Create the terms of service page
- Prepare data collection disclosure text
- Set up the cookie consent mechanism
- Implement the account deletion flow

Legal pages should appear in the landing page footer. The Google OAuth consent screen requires a privacy policy URL — so at minimum prepare a draft before auth.

---

## Phase 8: API Security

Activate the **saas-api-security** skill. In this phase:

- Implement rate limiting
- Set up plan-based API protection
- Add the input validation layer
- Standardise error handling
- Create a health check endpoint

This phase is typically added as a final security and quality layer on top of the other phases.

---

## Phase 9: Testing

Activate the **saas-testing** skill. In this phase:

- Set up unit and integration tests with Vitest
- Write webhook handler tests (the most critical tests)
- Set up E2E tests with Playwright (auth and checkout flows)
- Add test steps to the CI pipeline

At minimum, the webhook handler and auth flow should be tested before deployment.

---

## Phase 10: Analytics

Activate the **saas-analytics** skill. In this phase:

- Set up PostHog integration
- Configure basic event tracking (signup, login, checkout, feature usage)
- Set up user identification (identify) connection
- Create conversion funnel and basic dashboard
- Set up feature flag infrastructure (optional)

Analytics can be set up in parallel with or immediately after deployment.

---

## Phase 11: Deployment

Activate the **saas-deployment** skill. In this phase:

- Prepare the production environment
- Update environment variables with production values
- Configure domain and SSL
- Switch the payment system to live mode
- Complete DNS records
- Run final verification tests
- Set up monitoring and error tracking

---

## Inter-Phase Dependencies

```
Phase 0 (Discovery) → Phase 1 (Tech Stack)
                            ↓
                   Phase 2 (Infrastructure + DB) ←── saas-database
                            ↓
                   Phase 3 (Auth) ←── Phase 5 (Email) may be needed (Magic Link)
                            ↓
                   Phase 4 (Payments) ←── Auth must be complete
                            ↓
                   Phase 5 (Email) ←── DNS records can be started early
                            ↓
                   Phase 6 (Landing) ←── Pricing section must align with Phase 4
                      ↓           ↓
       Phase 6.5 (Storage)   Phase 7 (Legal) ←── Privacy policy needed for OAuth too
                      ↓           ↓
                   Phase 8 (API Security)
                            ↓
                   Phase 9 (Testing) ←── Quality assurance before deployment
                            ↓
                   Phase 10 (Analytics)
                            ↓
                   Phase 11 (Deployment) ←── All phases must be complete
```

**Phases that can run in parallel:**
- DNS records (part of Phase 5) can be started in parallel with Phase 2
- Landing page design (Phase 6) can progress in parallel with Phase 4
- Google OAuth application (part of Phase 3) should be started early due to approval process
- Legal pages (Phase 7) and Storage (Phase 6.5) can progress in parallel with Landing
- Analytics (Phase 10) can be set up in parallel with Deployment

---

## MVP vs. Full Product Strategy

If the user wants to launch fast, suggest the MVP sequence:

**MVP (Week 1):** Phase 0 + 1 + 2 + 3 + 4 + 7 (legal draft) + 11 — Working auth, payments, privacy policy draft, and empty dashboard. Landing page can be a simple hero + pricing.

**Second Wave (Weeks 2–3):** Phase 5 + 6 + 8 + 9 — Proper email infrastructure, conversion-focused landing page, API security layer, basic tests.

**Third Wave (Weeks 3–4):** Phase 6.5 + 10 — File storage (if needed), analytics, feature flags.

**Continuous Improvement:** Blog, A/B testing, customer feedback loop, legal documents reviewed by a lawyer.

---

## General Gotchas

- **Create external service accounts early.** Google OAuth approval, DNS propagation, Stripe account review — these can take days. Open accounts on day one.
- **Environment variable discipline.** Variables without the `NEXT_PUBLIC_` prefix are not visible on the client. Sensitive keys must never have the public prefix.
- **Webhooks are the nervous system of a SaaS.** If the payment webhook doesn't work, you take money but the plan doesn't activate. If the email webhook fails, support requests disappear. Test, log, and monitor webhooks.
- **Build test.** Always run a build test before every deployment. Server-side render errors only appear during build.
- **Cost control.** All services have a free tier: Vercel, Supabase, Resend, Stripe (no charge beyond commission). You can run at $0/month until your first paying customer.
- **Security is never done "later".** Auth and payments must be set up correctly from day one. "Let's keep it simple for now and add security later" is a recipe for disaster.
