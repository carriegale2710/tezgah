---
name: saas-testing
description: >
  Set up a testing strategy for a SaaS application. Unit tests with Vitest,
  E2E tests with Playwright, API route testing, webhook mocking, Stripe test
  mode, and CI integration. Use this skill when the user wants anything
  related to testing, writing tests, E2E, unit tests, Playwright, Vitest,
  coverage, or quality assurance. Phrases like "write tests", "set up
  testing", "add E2E", "run tests in CI" trigger this skill.
---

# SaaS Testing — Testing Strategy and Quality Assurance

This skill sets up the testing infrastructure for a SaaS application. Without tests, claiming "production-ready" is incomplete — you can only guarantee that the payment webhook works, the auth flow hasn't broken, and the API behaves as expected through tests.

**Dependency:** This skill is the pre-deployment quality assurance step of the **saas-launcher** orchestrator skill. It can also be used independently.

**Related skills:**
- **saas-auth** — Login/signup flows are E2E tested.
- **saas-payments** — Webhook handlers and checkout flow are tested.
- **saas-api-security** — Rate limiting and input validation tests.

---

## The Test Pyramid — For SaaS

### Which Test Type and When

**Unit Test — Vitest:**
Tests individual functions and utilities. Runs fast, no external dependencies. Uses: price calculation, plan checking, input validation, helper functions.

**Integration Test — Vitest:**
Tests API routes. Sends HTTP requests, validates responses. Uses: auth endpoints, checkout API, webhook handler.

**End-to-End Test (E2E) — Playwright:**
Tests user flows in a real browser. Slowest but most reliable. Uses: sign up → log in → purchase plan → access dashboard.

### Starting Priority

Don't try to test everything on Day 1. Priority order:

1. **Webhook handler test** — If money is taken but the plan isn't activated, that's revenue loss
2. **Auth flow E2E test** — If you can't log in, the app is unusable
3. **Critical API route tests** — Plan checking, resource creation
4. **Input validation tests** — Security layer

---

## Vitest Setup

### Why Vitest

A modern test runner, alternative to Jest. Advantages: Vite-based — very fast, native ESM support, Jest-compatible API (easy migration), built-in TypeScript support, watch mode with HMR.

### Installation

```
npm install -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts` at the project root. Use a `__tests__/` folder for test files or the `.test.ts` / `.spec.ts` extension in the filename.

Add scripts to `package.json`:
- `"test": "vitest run"` — run once
- `"test:watch": "vitest"` — watch mode
- `"test:coverage": "vitest run --coverage"` — coverage report

### API Route Testing Approach

To test Next.js API routes, directly import the route handler function and call it with a mock Request object. No need to spin up a real HTTP server.

Each test:
1. Create a mock request (method, headers, body)
2. Call the route handler
3. Validate response status and body

### Webhook Handler Testing

Webhook tests are the most critical tests. Testing strategy:

1. **Signature verification test:** Verify that a webhook with a valid signature is processed, and one with an invalid signature is rejected.
2. **Event processing test:** Verify the database change for each webhook event type. Example: `checkout.session.completed` → user plan should become "pro".
3. **Idempotency test:** Send the same event twice, verify the result doesn't change.

**Stripe test mode:** Forward webhooks to localhost with Stripe CLI:
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

### Mock Strategy

Mock external services, don't mock your own code:

- **Should be mocked:** Stripe API, Resend API, Supabase client (optional)
- **Should not be mocked:** Your own utility functions, validation schemas — run these for real

Module-level mocking with Vitest's `vi.mock()` function:
- Mock the Stripe SDK — prevent real API calls
- Mock the Resend SDK — prevent emails being sent during tests

---

## Playwright E2E Setup

### Why Playwright

A modern E2E testing tool, alternative to Cypress. Advantages: multi-browser support (Chromium, Firefox, WebKit), auto-wait, debugging with trace viewer, headless CI mode.

### Installation

```
npm install -D @playwright/test
npx playwright install
```

Create `playwright.config.ts`. Basic settings:
- `baseURL`: `http://localhost:3000`
- `webServer`: automatically start the dev server before tests
- `use.trace`: `on-first-retry` — record trace only for failing tests

### Core E2E Scenarios

**Auth flow:**
1. Go to the landing page
2. Click the "Sign In" button
3. Fill in the magic link login form with an email (or test OAuth flow)
4. Verify redirection to the dashboard
5. Verify access to a protected page

**Checkout flow:**
1. Log in
2. Go to the pricing page
3. Select a plan
4. Verify redirection to Stripe Checkout
5. (Make a payment in test mode)
6. Verify return to the success page

**Landing page:**
1. Verify the homepage loads
2. Verify all sections render
3. Verify CTA buttons work
4. Verify navigation works in mobile view

### Playwright Tips

- **Test isolation:** Each test must be independent. Don't depend on state from a previous test.
- **Use locators, not CSS selectors:** `page.getByRole()`, `page.getByText()`, `page.getByTestId()` — CSS selectors are brittle.
- **Trust auto-wait:** Don't use `waitForTimeout()` — Playwright automatically waits for elements to appear.
- **Screenshot on failure:** Automatically take a screenshot on failing tests — for debugging in CI.

---

## CI Integration

### Testing with GitHub Actions

Add test steps to the CI pipeline:

1. **Unit + integration tests:** `vitest run` — should run on every PR
2. **E2E tests:** `npx playwright test` — on every PR or only before main merge
3. **Coverage report:** Show coverage change as a PR comment

### Playwright in CI

Playwright runs in headless mode in CI. Install browser dependencies with `playwright install --with-deps` in GitHub Actions. Save failing test traces as artifacts — download and open with `npx playwright show-trace` for debugging.

---

## Test Coverage

### Targets

- **Webhook handler: 100%** — This is where the money is. Every event type, every edge case must be tested.
- **Auth middleware: 90%+** — The security layer should demand high coverage.
- **API routes: 80%+** — Core flows and error cases.
- **Utility functions: 80%+** — Business logic.
- **UI components: 50%+** — Indirectly tested via E2E tests, unit test priority is low.

**Don't aim for 100% overall coverage.** Writing meaningless tests is just as bad as not writing tests. Protect critical paths with high coverage; keep the rest pragmatic.

---

## Gotchas

- **Skipping the Stripe webhook test:** "It'll work in production" is the most dangerous assumption. Test every event type separately with Stripe CLI.
- **Flaky tests in E2E:** Timing-dependent tests fail randomly. Trust Playwright's auto-wait mechanism instead of `waitForTimeout()`.
- **Test database isolation:** Tests should not use the production or development database. Use a separate test database or apply a seed-before + clean-after strategy for each test.
- **Mocks drift from reality.** If the API of a service you've mocked changes, your tests still pass but production breaks. Regularly compare mocks against the real API.
- **Environment variables in CI.** Use a separate `.env.test` file or CI secrets for the test environment. Production keys must not be in CI.
- **E2E tests are slow.** Running the full E2E suite on every commit slows down CI. Run critical flows on every PR, the full suite before main merge.
