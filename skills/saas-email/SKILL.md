---
name: saas-email
description: >
  Set up the email infrastructure for a SaaS application. Covers Resend and
  Mailgun integration, DNS configuration (SPF, DKIM, DMARC), and transactional
  email templates. Use this skill when the user wants to send emails, configure
  a custom domain for email, or set up email templates.
---

# SaaS Email

This skill covers transactional email infrastructure for a SaaS application.

## Provider Selection

| | Resend | Mailgun |
|---|--------|----------|
| Free tier | 3,000 emails/month | 1,000 emails/day |
| API style | Modern, simple | Mature, feature-rich |
| React Email | Native support | Template builder |
| Best for | Next.js SaaS, simple transactional | High volume, inbound email |

**Recommendation:** Resend for most Next.js projects.

## Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Add your domain in Domains → Add Domain
3. Add the DNS records provided by Resend to your domain registrar
4. Get your API key from API Keys
5. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=hello@yourdomain.com
   ```
6. Install:
   ```bash
   npm install resend @react-email/components
   ```

## DNS Configuration

Three DNS records are required for good deliverability:

**SPF** — Authorises your email provider to send on behalf of your domain:
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```
(Resend will give you the exact value)

**DKIM** — Adds a cryptographic signature to emails:
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
```

**DMARC** — Policy for handling emails that fail SPF/DKIM:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

DNS changes take 24–48 hours to propagate. Add these records on day one.

## Email Templates with React Email

```typescript
// emails/welcome.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  loginUrl: string
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Text>Hi {name},</Text>
          <Text>Welcome! Your account is ready.</Text>
          <Button href={loginUrl}>Go to Dashboard</Button>
        </Container>
      </Body>
    </Html>
  )
}
```

## Sending Emails

```typescript
// lib/email.ts
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/welcome'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: 'Welcome!',
    react: <WelcomeEmail name={name} loginUrl={`${process.env.NEXT_PUBLIC_URL}/dashboard`} />,
  })
}

export async function sendPaymentConfirmation(to: string, amount: number) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: 'Payment confirmed',
    react: <PaymentConfirmationEmail amount={amount} />,
  })
}
```

## Triggering Emails from Webhooks

Send emails from Stripe webhook events:

```typescript
// In the webhook handler
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.CheckoutSession
  if (session.customer_email) {
    await sendPaymentConfirmation(session.customer_email, session.amount_total! / 100)
  }
  break
}
```

## Common Gotchas

- DNS changes take 24–48 hours — add records on day one, don't wait
- Test emails with Resend's test mode before going live
- Always handle email sending errors gracefully — a failed email should not crash the app
- Use a dedicated sending domain (e.g. `mail.yourdomain.com`) to protect your main domain's reputation
- The `from` address must match a verified domain in Resend
- Unsubscribe links are required for marketing emails (not transactional)
