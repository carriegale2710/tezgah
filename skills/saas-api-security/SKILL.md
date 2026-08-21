---
name: saas-api-security
description: >
  Set up an API security layer for a SaaS application. Rate limiting,
  plan-based access control, input validation, error handling, CORS, and
  health checks. Use this skill when the user wants anything related to
  API security, rate limiting, authorisation, input validation, error
  handling, or API protection. Phrases like "secure the API", "add rate
  limiting", "check the plan", "input validation" trigger this skill.
---

# SaaS API Security — Security and Quality Layer

This skill hardens the API layer of a SaaS application from a security, resilience, and quality perspective. It is added as a final protection and quality layer on top of the other layers (auth, payments).

**Dependency:** This skill is Phase 7 of the **saas-launcher** orchestrator skill. It can also be used independently.

**Related skills:**
- **saas-auth** — Session data forms the foundation of API protection.
- **saas-payments** — Plan data drives access control decisions.

---

## Security Layer Architecture

An incoming API request must pass through these layers in order:

```
Request arrives
  → 1. Rate Limiting (too many requests?)
    → 2. Authentication (who is this?)
      → 3. Authorization (do they have permission? Is their plan sufficient?)
        → 4. Input Validation (is the submitted data valid?)
          → 5. Business Logic (the actual operation)
            → 6. Error Handling (if something goes wrong)
              → Return response
```

Each layer is independent and rejects the request without proceeding to the next layer on violation.

---

## 1. Rate Limiting

### Why It's Necessary

Without rate limiting:
- A user (or bot) can send thousands of requests per second and crash your server (DDoS)
- Brute force attacks can target login pages
- Someone can freely consume your resources via the API
- Your payment webhook endpoint can be spammed from outside

### Strategy

Apply rate limiting at two levels:

**Global level (IP-based):** Apply to all endpoints. A set number of requests per second or minute. Purpose: DDoS and brute force protection.

**Endpoint level (user-based):** Apply separately to sensitive endpoints — login attempts, checkout creation, email sending. Purpose: fair use of resources.

### Rate Limiting in Serverless Environments

In serverless environments (Vercel, Netlify) each request runs in a separate process. This means in-memory rate limiting (keeping a counter in memory) won't work — each process has its own memory and counters aren't shared.

Solution: Use an external data store. Upstash Redis is a managed Redis service optimised for serverless environments. It works over HTTP (no TCP connection required), keeping the counter in Redis on every request. Its free tier is sufficient for most early-stage SaaS.

For a simple project or MVP where even Upstash feels like overkill: skip rate limiting and add it when the need arises in production. But at minimum put a basic protection on your login endpoint and webhook endpoint.

### Rate Limit Response

Return HTTP 429 (Too Many Requests) when the limit is exceeded. Include the following information as headers:
- Total limit (X-RateLimit-Limit)
- Remaining allowance (X-RateLimit-Remaining)
- Reset time (X-RateLimit-Reset)

User-friendly error message: "Too many requests. Please wait a few seconds and try again."

---

## 2. Authentication Check

This layer consumes the session system built by the **saas-auth** skill.

Perform a session check on every protected API endpoint:
- No session → return 401 Unauthorized
- Invalid or expired session → return 401
- Valid session → pass user information to the next layer

General protection via middleware should already be in place (see **saas-auth**). The API route-level check is a safety net for edge cases not covered by the middleware.

---

## 3. Authorization — Plan-Based Access Control

Authentication answers "who is this?" Authorization answers "can this person perform this action?"

### Plan Hierarchy

Define plans as a hierarchy: free < starter < pro < enterprise. Each API endpoint requires a minimum plan level. Return 403 Forbidden if the user's plan is below the required level.

The 403 response should be user-friendly:
- Current plan information
- Required plan information
- Upgrade URL (link to the pricing page)

### Plan Check Points

Check plans not only in API routes but also at these points:
- **UI level:** Visually lock features requiring a higher plan (lock icon, "Requires Pro plan" label). This is UX, not security — the real check is always server-side.
- **API level:** Plan check on every protected endpoint. This is the real security layer.
- **Resource limits:** Check limits like "up to 5 projects" in resource creation endpoints.

### Usage-Based Limits

Some plans include a monthly API call or operation limit. Track these limits:
- Increment the counter on every API call
- Add a warning header as the limit approaches
- Return 429 when the limit is exceeded (different from rate limiting — this is a plan limit)
- Reset the counter at the start of each month

---

## 4. Input Validation

### Why It's Critical

Every piece of data from a user is potentially malicious. Unvalidated input can lead to:
- SQL Injection (database manipulation)
- XSS (malicious script injection)
- Type errors (crashing if an object arrives where a string was expected)
- Business logic errors (negative amounts, overly long text)

### Validation Strategy

Use a schema validation library like Zod. Define the data each API endpoint accepts as a schema. Pass incoming data through the schema — return 400 Bad Request if invalid, proceed with type-safe data if valid.

What to define in a validation schema:
- Type of each field (string, number, boolean, enum)
- Required/optional fields
- Length/size limits (max 100 characters, max 5MB)
- Format rules (email format, URL format)
- Value ranges (min: 0, max: 100)
- Allowed values (enum: ["free", "starter", "pro"])

### Error Response Format

A validation error response should clearly indicate which field is invalid and why:

```
{
  "error": "Invalid data",
  "details": [
    { "field": "email", "message": "A valid email address is required" },
    { "field": "name", "message": "Must be at most 100 characters" }
  ]
}
```

This format is both human-readable and can be processed programmatically by the client.

---

## 5. Error Handling

### Principle: Help the User, Don't Inform the Attacker

Error messages serve two audiences:
- **Legitimate users:** They need to understand what went wrong and what to do
- **Malicious actors:** They should gain no information about the system

This balance:
- Validation errors → detailed (helpful to the user)
- Business logic errors → explanatory but without technical details
- Server errors → generic message ("Something went wrong"), details only in logs

### Error Categories and HTTP Codes

| Code | Meaning | When | Message Detail |
|------|---------|------|----------------|
| 400 | Bad Request | Input validation error | Detailed (which field, why) |
| 401 | Unauthorized | No or invalid session | "You need to log in" |
| 403 | Forbidden | Insufficient plan or no permission | Plan info + upgrade link |
| 404 | Not Found | Resource not found | "Resource not found" |
| 409 | Conflict | Conflict (duplicate) | "This resource already exists" |
| 429 | Too Many Requests | Rate limit exceeded | Wait time information |
| 500 | Internal Server Error | Unexpected error | Generic message, details in logs |

### Logging

`console.log` is not enough in production. Use a logging service (Sentry, LogSnag, Axiom, Vercel Log Drain). On every 500 error:
- Error message and stack trace
- Request URL, method, body
- User ID (if available)
- Timestamp

Sentry is especially recommended — it groups errors, shows trends, and sends alerts.

---

## 6. CORS (Cross-Origin Resource Sharing)

### When It's Needed

If your API is only used by your own frontend (Next.js full-stack) CORS configuration is not needed — requests come from the same origin.

CORS is needed when:
- You're making your API accessible from other domains (public API)
- A mobile app uses your API
- Third-party integrations send requests to your API

### CORS Configuration Principles

- Don't use a wildcard (`*`) — only list trusted origins
- Restrict allowed HTTP methods (GET, POST — don't open unnecessary PUT, DELETE)
- Correctly respond to preflight requests (OPTIONS)
- Add `Access-Control-Allow-Credentials: true` for requests requiring credentials (cookies)

---

## 7. Health Check Endpoint

Every SaaS should have a `/api/health` endpoint. This endpoint:
- Verifies the application is running
- Optionally checks the database connection
- Is called at regular intervals by uptime monitoring services (BetterStack, UptimeRobot)
- Is used for post-deployment verification in CI/CD pipelines

Response: status (ok/degraded), timestamp, uptime. Return "degraded" if there's no database connection but still return 200 (application is running, DB connection is down).

---

## Security Checklist

- Is rate limiting active on all public endpoints?
- Is there brute force protection on the login endpoint?
- Is auth checked on all private endpoints?
- Is plan checking applied for paid features?
- Is input validation present on all POST/PUT endpoints?
- Do error messages avoid leaking sensitive information? (stack traces, DB details, file paths)
- Are environment variables staying server-side without `NEXT_PUBLIC_`?
- Is signature verification in place on webhook endpoints? (see **saas-payments**)
- Is CORS only open on the necessary endpoints?
- Is error tracking (Sentry etc.) installed?

---

## Gotchas

- **Rate limiting doesn't work in-memory on serverless.** Each function invocation is a separate process. Upstash Redis or a similar external solution is required.
- **IP detection behind a proxy.** Behind Vercel or Cloudflare, the real client IP is in the `x-forwarded-for` header. Directly using `req.ip` may be unreliable.
- **Plan checks in the UI are not enough.** Client-side plan checks are for UX (lock the button, show a message). The real check must be server-side — client-side checks can easily be bypassed.
- **Validation not just in the API.** Also validate on the client side (for UX — fast feedback), but server-side validation is mandatory for security. Client-side validation can be bypassed.
- **Don't expose details on 500 errors.** Messages like "Internal server error: MongoDB connection timeout at line 42" reveal your database type and structure to an attacker. Say "Something went wrong" to the user, log the details.
- **Don't launch without error tracking.** Users don't report errors — they leave silently. Without Sentry or a similar tool, you'll never learn about errors.
- **Don't put the health check endpoint behind auth.** Monitoring services don't send auth tokens. The health check should be public and lightweight.
