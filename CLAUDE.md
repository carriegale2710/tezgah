# Tezgah

Tezgah is a SaaS launch skill kit written for Claude Code. It helps solopreneurs build production-ready SaaS applications.

## Project Structure

- `skills/` — Claude Code skill files (SKILL.md format)
- `bin/` — CLI tool entry point
- `lib/` — CLI source code
- `test/` — CLI tests
- `.github/` — GitHub templates, CI/CD and release workflow

## Skills

Orchestrator: `saas-launcher` — Manages the entire process, runs a discovery interview with the user, and calls other skills in sequence.

Specialist skills (each can also be used independently):
- `saas-database` — Supabase database (schema, RLS, migration, pooling)
- `saas-auth` — Authentication (OAuth, Magic Link, JWT)
- `saas-payments` — Payment system (Stripe, Lemon Squeezy)
- `saas-email` — Email infrastructure (Resend, DNS)
- `saas-storage` — File storage (Supabase Storage)
- `saas-landing-seo` — Landing page and SEO
- `saas-legal` — Legal compliance (GDPR, Privacy Act)
- `saas-api-security` — API security and rate limiting
- `saas-testing` — Testing strategy (Vitest, Playwright)
- `saas-analytics` — Product analytics (PostHog)
- `saas-deployment` — Production deployment and monitoring

## Rules

- All skill content and CLI output is in English.
- The CLI runs with zero runtime dependencies (Node.js built-ins only).
- Skill files are structured in SKILL.md format with YAML frontmatter.
- Each skill has `name` and `description` frontmatter fields.
- ESLint is used for code quality.
- Tests are in `test/cli.test.js`, written in plain Node.js (no test framework).

## Default Tech Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase + Stripe + Resend + PostHog + Vercel
