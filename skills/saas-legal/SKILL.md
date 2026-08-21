---
name: saas-legal
description: >
  Set up a legal compliance infrastructure for a SaaS application. GDPR
  compliance, privacy policy, terms of service, cookie consent, disclosure
  text, and data processing flows. Use this skill when the user wants
  anything related to legal requirements, GDPR, privacy policy, terms of
  service, cookie consent, personal data, or compliance. Phrases like
  "write a privacy policy", "make it GDPR-compliant", "add cookie consent",
  "prepare legal pages" trigger this skill.
---

# SaaS Legal — Legal Compliance

This skill sets up the legal compliance layer for a SaaS application. Legal requirements are not things that can be deferred with "we'll sort that after launch" — you can't get Google OAuth approval without a privacy policy, you risk fines without cookie consent, and you have no legal protection without terms of service.

**Dependency:** This skill is applied after the Landing Page phase of the **saas-launcher** orchestrator skill. It can also be used independently.

**Related skills:**
- **saas-auth** — The Google OAuth consent screen requires a privacy policy URL.
- **saas-analytics** — Tracking and data collection must be disclosed in the privacy policy.
- **saas-landing-seo** — Legal pages should appear as links in the footer.

---

## Legal Framework for SaaS

### GDPR (General Data Protection Regulation)

GDPR is the EU's personal data protection regulation. It applies to any product that collects personal data from EU residents.

**Who must comply:** Every natural or legal person collecting personal data from EU-based users — including solo founders.

**What is personal data:** Any information relating to an identified or identifiable person — name, email, IP address, cookie data, payment information, usage data.

**Core obligations:**
1. **Disclosure:** Inform users before collecting data (which data, why, for how long)
2. **Explicit consent:** Obtain user consent for non-mandatory data processing
3. **Data security:** Protect collected data with technical and administrative safeguards
4. **Data deletion:** Respond to user requests within 30 days
5. **Data breach notification:** Notify authorities within 72 hours of a breach

### Other Privacy Laws

Depending on your users' location, other regulations may also apply:
- **CCPA** (California) — for California residents
- **PIPEDA** (Canada) — for Canadian users
- **Local laws** — check requirements for the countries you serve

**Practical approach:** If you build to GDPR standards, you'll satisfy most other privacy regulations as a baseline.

---

## Privacy Policy

### Why It's Required

- GDPR disclosure obligation (legal requirement)
- Google OAuth consent screen (privacy policy URL is a required field)
- App Store / Play Store requirements (if a mobile app exists)
- User trust

### What It Must Include

**1. Data controller information:**
- Company/individual name, address, contact details
- For solo founders, personal details are sufficient

**2. Data collected:**
- Identity data (name, email)
- Contact data (email address)
- Payment data (via Stripe/Lemon Squeezy — card details are not stored by you)
- Usage data (page views, clicks, session duration)
- Technical data (IP address, browser, device info)
- Cookie data

**3. Purposes for which data is processed:**
- Service delivery and account management
- Payment processing
- Communication (transactional emails)
- Product development and analytics
- Legal obligations

**4. Third parties data is shared with:**
- Supabase (database hosting)
- Stripe / Lemon Squeezy (payment processing)
- Resend (email delivery)
- PostHog (analytics)
- Vercel (hosting)
- Google (OAuth — if used)

**5. Data retention period:**
- For as long as the account is active
- After account deletion: legal retention period (10 years for invoice data)
- Anonymous analytics data: indefinitely

**6. User rights:**
- Right of access
- Right to rectification
- Right to erasure (account deletion)
- Right to object
- Right to data portability
- How to submit a request (email address)

**7. Cookie policy** (separate page or a section on the same page)

**8. Update notice:** Notification to users when the policy changes

### Implementation

Create the privacy policy page at the `/privacy` route. It must be accessible from the footer on every page. Show the last updated date.

**To start:** Generate a draft with an AI tool, edit it to match your project's actual data processing practices. Don't delay launch waiting for a lawyer — launch with the draft, then have a lawyer review it.

---

## Terms of Service

### What It Must Include

1. **Service description:** What you offer
2. **Acceptance terms:** Using the service constitutes acceptance of the terms
3. **Account responsibilities:** User's responsibility for account security
4. **Acceptable use:** Prohibition of illegal or harmful use
5. **Payment terms:** Pricing, billing, refund policy
6. **Cancellation and termination:** How to cancel, what happens to data
7. **Intellectual property:** Your software is yours, the user's data is theirs
8. **Limitation of liability:** Liability cap for service outages, data loss
9. **Governing law:** Applicable jurisdiction and courts
10. **Change notification:** Notice to users if terms change

Create the page at the `/terms` route.

---

## Cookie Consent

### When It's Required

- **Strictly necessary cookies** (session, security): No consent needed — technically required for the service to function
- **Analytics cookies** (PostHog, GA): Consent required under GDPR
- **Marketing cookies** (advertising, retargeting): Consent is absolutely required

### Implementation Approach

**Simple banner:** A cookie notice at the bottom or top of the page. Two buttons: "Accept All" (all cookies) and "Necessary Only" (analytics off). Store the user's choice in localStorage or a cookie.

**Detailed management (optional):** Toggle individual cookie categories on/off. Not needed in the first phase.

### Integration with PostHog

If the user declines analytics cookies, don't initialise PostHog or run it in cookieless mode. Bind PostHog's `opt_out_capturing()` and `opt_in_capturing()` functions to the cookie consent decision.

---

## Account Deletion Flow (GDPR Article 17)

The user's right to delete their account and data is a legal obligation.

### Implementation

1. "Delete My Account" button on the settings page
2. Confirmation step: make clear this is irreversible and any active subscription will be cancelled
3. If there is an active subscription: cancel it first (see **saas-payments**)
4. Delete or anonymise user data
5. Anonymise (do not delete) data subject to legal retention requirements (invoices)
6. Delete the user from the auth system
7. End the session
8. Clean up data in third-party services (Stripe customer record, PostHog profile)
9. Send the user a deletion confirmation email

**Timeline:** Deletion requests must be fulfilled within 30 days. Set up an automated deletion mechanism — a manual process doesn't scale.

---

## Refund Policy

If you accept payments, you must have a refund policy:

- Refund conditions (under what circumstances refunds are given)
- Refund window (14 days, 30 days)
- Refund method (to the original payment method)
- Partial refund (cancellation mid-period)

Consumer protection law may grant a 14-day right of withdrawal for digital services — seek legal advice.

---

## Launch Checklist

- [ ] Privacy policy page (`/privacy`) is live
- [ ] Terms of service page (`/terms`) is live
- [ ] Cookie consent banner is working
- [ ] Footer has links to privacy policy and terms of service
- [ ] Privacy policy URL on the Google OAuth consent screen
- [ ] Account deletion mechanism is working
- [ ] Refund policy has been defined
- [ ] Data processing inventory has been drawn up (what data, where, why)

---

## Gotchas

- **Google OAuth won't be approved without a privacy policy.** The privacy policy URL is a required field on the OAuth Consent Screen. Prepare it before launch.
- **"Everyone does it, it'll be fine" fallacy.** GDPR fines apply to individual data controllers too. Being a solo founder is no exemption.
- **Don't start analytics without cookie consent.** Initialising PostHog or GA without user consent is a GDPR violation.
- **Keep the privacy policy up to date.** Every time you add a new third-party service (analytics, email, CDN), update the privacy policy.
- **Data location matters.** GDPR requires explicit consent or adequate safeguards for transferring data outside the EU. State the data centre locations of services like Supabase, Vercel, and Stripe in your privacy policy.
- **Invoice data cannot be deleted.** Tax law requires invoices and payment records to be retained. Even after an account is deleted, this data must be anonymised and kept.
- **Consult a lawyer, but don't wait.** Generate a draft with AI, publish it, then have a lawyer review it. Waiting for a lawyer can delay the launch by months.
