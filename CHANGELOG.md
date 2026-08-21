# Changelog

This file follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-03-22

### Added

**Skills (12 total):**
- **saas-launcher** — Orchestrator skill: discovery interview, tech stack decisions, phase management
- **saas-database** — Supabase database: project setup, schema design, RLS, migration, connection pooling
- **saas-auth** — Authentication: Google OAuth, Magic Link, JWT, protected routes
- **saas-payments** — Payment system: Stripe/Lemon Squeezy, checkout, webhook, subscription management
- **saas-email** — Email infrastructure: Resend/Mailgun, DNS (SPF/DKIM/DMARC), templates
- **saas-storage** — File storage: Supabase Storage, upload, RLS security, image optimisation
- **saas-landing-seo** — Landing page and SEO: components, metadata, sitemap, Open Graph, blog
- **saas-legal** — Legal compliance: GDPR/Privacy Act, privacy policy, cookie consent
- **saas-api-security** — API security: rate limiting, plan-based access, input validation
- **saas-testing** — Testing strategy: Vitest, Playwright E2E, webhook testing, CI integration
- **saas-analytics** — Product analytics: PostHog, event tracking, feature flags, session replay
- **saas-deployment** — Deployment: Vercel/Railway/Fly.io, domain, SSL, CI/CD, monitoring

**CLI tool:**
- `tezgah init` — install all skills
- `tezgah add <skill>` — add a single skill
- `tezgah remove <skill>` — remove a skill
- `tezgah update` — update installed skills
- `tezgah doctor` — check installation
- `tezgah list` — list skills
- Typo suggestions via fuzzy matching
- Terminal colour support detection (NO_COLOR compliant)

**Infrastructure:**
- GitHub Actions CI (Node 18/20/22)
- Automatic npm release workflow (tag-based)
- ESLint code quality
- Automated CLI tests
- Issue and PR templates
- Security policy (SECURITY.md)

[1.0.0]: https://github.com/komunite/tezgah/releases/tag/v1.0.0
