# Tezgah

[![npm version](https://img.shields.io/npm/v/tezgah.svg)](https://www.npmjs.com/package/tezgah)
[![CI](https://github.com/komunite/tezgah/actions/workflows/ci.yml/badge.svg)](https://github.com/komunite/tezgah/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Build production-ready SaaS with Claude Code.**

Tezgah is a skill kit written for [Claude Code](https://claude.ai/claude-code). It covers every step of building a working SaaS application from scratch — database, authentication, payments, email, landing page, legal compliance, API security, testing, analytics, and deployment.

Designed for solopreneurs. Uses standard global Stripe, GDPR/Australian Privacy Act compliance, and Lemon Squeezy as a Merchant of Record alternative.

> **Note:** Originally written in Turkish for the Turkish market — this is an English translation for personal use.

---

## Quick Start

```bash
npx tezgah init
```

This command installs 12 skill files into the `skills/` folder. Then in Claude Code:

```
/saas-launcher
```

Start the orchestrator. It will ask you questions, make tech stack decisions, and build each layer step by step.

## CLI Commands

```bash
npx tezgah init                        # Install all skills
npx tezgah add saas-auth               # Add a single skill
npx tezgah remove saas-storage         # Remove a skill
npx tezgah update                      # Update installed skills
npx tezgah doctor                      # Check installation
npx tezgah list                        # List available skills

# Options
npx tezgah init --dir .claude/skills   # Install to a different folder
npx tezgah init --force                # Overwrite existing files
npx tezgah list --no-color             # Output without colour
```

## Skills

### Orchestrator

| Skill | Description |
|-------|-------------|
| `saas-launcher` | The main skill that manages the entire process. Runs a discovery interview, makes tech stack decisions, and delegates each layer to the relevant specialist skill. |

### Specialist Skills

Each can also be used independently:

| Skill | Phase | Scope |
|-------|-------|-------|
| `saas-database` | 2 | Supabase setup, schema design, RLS, migration, connection pooling |
| `saas-auth` | 3 | Google OAuth, Magic Link, email/password, JWT session, middleware |
| `saas-payments` | 4 | Stripe / Lemon Squeezy, checkout, webhook, subscription management |
| `saas-email` | 5 | Resend / Mailgun, DNS (SPF, DKIM, DMARC), email templates |
| `saas-storage` | 6.5 | Supabase Storage, file upload, RLS security, image optimisation |
| `saas-landing-seo` | 6 | Landing page components, SEO, sitemap, Open Graph, blog |
| `saas-legal` | 7 | GDPR/Privacy Act, privacy policy, terms of service, cookie consent |
| `saas-api-security` | 8 | Rate limiting, plan-based access, input validation, CORS |
| `saas-testing` | 9 | Vitest, Playwright E2E, webhook testing, CI integration |
| `saas-analytics` | 10 | PostHog, event tracking, feature flags, session replay |
| `saas-deployment` | 11 | Vercel / Railway / Fly.io, domain, SSL, CI/CD, monitoring |

### Phase Flow

```
Phase 0   Discovery Interview       ─── saas-launcher
Phase 1   Tech Stack Decisions      ─── saas-launcher
Phase 2   Infrastructure + Database ─── saas-database
Phase 3   Authentication            ─── saas-auth
Phase 4   Payment System            ─── saas-payments
Phase 5   Email Infrastructure      ─── saas-email
Phase 6   Landing Page & SEO        ─── saas-landing-seo
Phase 6.5 File Storage              ─── saas-storage (optional)
Phase 7   Legal Compliance          ─── saas-legal
Phase 8   API Security              ─── saas-api-security
Phase 9   Testing                   ─── saas-testing
Phase 10  Analytics                 ─── saas-analytics
Phase 11  Deployment                ─── saas-deployment
```

## Default Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js (App Router) + TypeScript | Server/client rendering, built-in API routes |
| UI | Tailwind CSS + shadcn/ui | Fast development, consistent design |
| Database | Supabase (PostgreSQL) | Auth + DB + Storage + Realtime in one place |
| Auth | Google OAuth + Magic Link | Passwordless, low-friction login |
| Payments | Stripe or Lemon Squeezy | Choose based on region and needs |
| Email | Resend + React Email | Modern API, type-safe templates |
| Analytics | PostHog | Product analytics, feature flags, session replay |
| Hosting | Vercel | Zero-config, automatic deploys |

Every technology can be changed based on your needs during the discovery interview.

## Tezgah vs. Alternatives

| | Tezgah | create-t3-app | Shipfast / Supastarter |
|---|--------|---------------|------------------------|
| What | Claude Code skill set (guide) | Boilerplate code generator | Ready-made SaaS template |
| How | Step-by-step build with Claude Code | Generates project scaffold | Clone ready-made code |
| Language | English (translated) | English | English |
| Price | Free (MIT) | Free | $200–400 |
| Flexibility | Every decision is discussed and changeable | Fixed tech stack | Fixed architecture |
| Scope | DB → Auth → Payments → SEO → Legal → Test → Deploy | Project scaffold only | Code + some integrations |
| Local context | GDPR/Privacy Act, Stripe vs LS comparison | None | None |

## Requirements

- [Claude Code](https://claude.ai/claude-code) installed
- Node.js 18+

## How It Works

1. Run `npx tezgah init` to copy the skill files into your project
2. Start the orchestrator in Claude Code with `/saas-launcher`
3. The orchestrator asks questions about your product (Phase 0)
4. You make tech stack decisions together (Phase 1)
5. Each layer is built step by step by the relevant specialist skill (Phases 2–11)

You can also use a single skill independently:

```
/saas-auth          # Set up auth system only
/saas-payments      # Add payment integration only
/saas-database      # Set up Supabase infrastructure only
/saas-legal         # Prepare legal pages only
```

## Contributing

Contributions welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md).

Short summary:
- Add new skills
- Improve existing skills
- File bug reports or feature requests
- Add language support beyond English

## Security

To report a security vulnerability, read [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) — Fatih Guner
