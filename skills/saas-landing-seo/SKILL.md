---
name: saas-landing-seo
description: >
  Design a conversion-focused landing page and set up search engine
  optimisation (SEO) for a SaaS application. Components such as hero,
  pricing, FAQ, and testimonials; metadata, sitemap, robots.txt, Open
  Graph, structured data, and a blog system. Use this skill when the user
  wants a landing page, homepage, pricing page, SEO, sitemap, Open Graph,
  blog, or "attract more customers". Phrases like "build a nice homepage",
  "set up SEO", "add a pricing section", "set up a blog" trigger this skill.
---

# SaaS Landing & SEO — Conversion and Discoverability

This skill builds the storefront (landing page) and search engine discoverability (SEO) for a SaaS application. The sole purpose of a landing page is to convert visitors into paying customers. The purpose of SEO is to ensure those visitors arrive organically.

**Dependency:** This skill is Phase 6 of the **saas-launcher** orchestrator skill. It can also be used independently.

**Related skills:**
- **saas-payments** — The pricing section should draw from the same source as the plan definitions in the payments skill.
- **saas-auth** — CTA buttons redirect unauthenticated users to the auth flow.

---

## SECTION 1: LANDING PAGE

### Page Flow Architecture

The proven SaaS landing page structure follows this order from top to bottom. The position of each component on the page is not random — it serves a psychological purpose.

**1. Navbar**
Purpose: Navigation and a persistently accessible CTA.
Content: Logo (left), navigation links (centre), CTA button (right — "Try Free" or "Sign In"). Should be sticky on scroll — the CTA must be reachable wherever the user is on the page. Hamburger menu on mobile.

**2. Hero**
Purpose: Communicate what it is, who it's for, and why it matters within the first 5 seconds.
Content: Main headline (value proposition, benefit-focused — say what it delivers, not what it does), subtitle (1–2 sentences), primary CTA button, optional product screenshot or demo. Small trust indicator: "No credit card required" or "14-day free trial".

Headline formulas:
- "[Result] + [ease/speed]" — "Find your first customer in 24 hours"
- "End [Problem]" — "End email chaos"
- "[Solution] for [audience]" — "Project management for freelancers"
- "Not [old way], [new way]" — "Not spreadsheets — smart dashboards"

**3. Social Proof Banner**
Purpose: Build "others use this too" confidence.
Content: Customer count ("Used by 500+ companies"), customer logos (greyscale, same height), or numbers (active users, uptime, customer rating). If you have no customers yet: beta user count, waitlist count, or skip this section.

**4. Problem / Solution**
Purpose: Name the pain the user feels, then present the solution.
Content: The "you've experienced this, right?" feeling. Describe the difficulty of current methods, then show how your solution eliminates it. Write with empathy — the user should recognise themselves.

**5. Features**
Purpose: Concretely show what you offer.
Content: 3–6 core features, each with an icon + headline + short description. Use benefit language, not technical jargon: instead of "Our AI engine", write "Predict customer churn 3 days in advance". Optionally link to a detail page for each feature.

**6. How It Works (Optional)**
Purpose: Simplify the process for complex products.
Content: 3 steps, numbered. "1. Sign up → 2. Connect data → 3. See results". Steps must not exceed 3 — if there are more, simplify or skip this section.

**7. Pricing**
Purpose: Present pricing transparently and make the purchase decision easier.
Content: Plan cards side by side, feature comparison, monthly/annual toggle, "Most Popular" label, CTA button on each card. Pricing data should come from the same source as the plan configuration in the **saas-payments** skill.

Design rules:
- Highlight the annual plan (show the savings percentage)
- Visually emphasise the most popular plan (border, label, shadow)
- Feature list under each plan — with checkmarks
- Mention free trial or money-back guarantee if available

**8. FAQ**
Purpose: Resolve objections before purchase.
Content: 4–8 questions and answers in accordion format. Questions that must be answered:
- How does the free trial work?
- Can I cancel at any time?
- Is my data secure?
- What payment methods do you accept?

**9. Testimonials / Customer Reviews**
Purpose: Deepen social proof and build trust.
Content: 3–6 genuine customer reviews. Each one: quote, name, title/company, photo. Specific reviews are powerful: not "Great tool" but "We increased conversions 40% in the first month". If you have no customers yet: beta user feedback, or skip this section.

**10. Final CTA**
Purpose: Close the page with a strong call to action.
Content: Large headline ("Start today"), brief repeat of the value proposition, CTA button. A visitor who has read to the end of the page has high intent — don't lose them.

**11. Footer**
Content: Logo, short description, navigation links, legal links (privacy policy, terms of service), social media icons, copyright.

---

## SECTION 2: SEO

### Technical SEO Fundamentals

#### Metadata

Every page must have a unique title and description.

Title rules: Put the primary keyword first, brand name last. 50–60 characters. Format: "Page Title | Brand Name". Sub-pages should use a template.

Description rules: Explain what the page offers and why it should be clicked. 150–160 characters. Should include a CTA: "Try for free", "Get started now".

#### Sitemap

Create a dynamic sitemap file — use the framework's built-in sitemap generation. Must include:
- All public pages (landing, pricing, blog posts)
- Last updated date for each page
- Change frequency (monthly, weekly)
- Priority (homepage: 1.0, blog: 0.6)

Must not include: dashboard pages, API endpoints, auth pages.

#### Robots.txt

Tells search engines what to crawl and what to skip. Allow: all public pages. Block: /api/, /dashboard/, /settings/. Specify the sitemap URL.

#### Open Graph and Twitter Card

Preview cards that look great when shared on social media.

OG image: 1200×630px, brand colours, large headline, short description. A separate OG image per page is ideal but a single general image is sufficient to start. Use the framework's dynamic OG image generation — produce them automatically for each page.

Test: check your URL at https://www.opengraph.xyz.

#### Structured Data (JSON-LD)

Used to display rich snippets in search results (star rating, price info, FAQ). Most useful schema types for SaaS:
- SoftwareApplication — product page
- FAQPage — FAQ section
- Organization — company info
- Article — blog posts

### Content SEO: Blog

A blog is the most effective way to drive organic traffic. Not mandatory for an MVP, but starting from the first month makes a big long-term difference.

#### Blog Strategy

- **Keyword research:** Find the questions your target audience searches on Google. Start with low-competition, mid-volume (long-tail) keywords.
- **Content types:** "How to" guides, comparison articles ("X vs Y"), list posts ("10 best tools"), problem-solving articles.
- **Publishing frequency:** 1 post per week is a good starting cadence. Consistency matters more than frequency.
- **Internal links:** Every blog post should link to related posts and product pages (pricing, features).

#### Technical Blog Infrastructure

MDX (Markdown + JSX) is the recommended format. Advantages: fast writing in Markdown, ability to embed React components (interactive demos, code examples), metadata management via frontmatter (title, description, date, author, tags).

Blog post file structure: Frontmatter (YAML) + content (Markdown). Display in date order on the listing page, calculate reading time, add a category/tag filter.

### Performance SEO

Google Core Web Vitals is now a ranking factor. Targets:

- **LCP (Largest Contentful Paint):** Under 2.5 seconds. Optimise the hero image, prioritise font loading.
- **FID/INP (Interaction to Next Paint):** Under 200ms. Lazy-load heavy JavaScript, avoid unnecessary client-side rendering.
- **CLS (Cumulative Layout Shift):** Under 0.1. Give images width/height attributes, prevent layout shift while fonts load.

Performance tools:
- Lighthouse (built into Chrome DevTools)
- PageSpeed Insights (https://pagespeed.web.dev)
- Vercel Analytics (automatic Web Vitals measurement)

### Pre-Launch SEO Checklist

- Does every page have a unique title and description?
- Is sitemap.xml accessible?
- Is robots.txt accessible?
- Have OG images been tested?
- Has the site been added to Google Search Console?
- Has the sitemap been submitted to Google?
- Are the favicon and apple-touch-icon set?
- Is the H1 tag used exactly once per page?
- Do all images have alt attributes?
- Has the 404 page been customised?
- Are canonical URLs correct?
- Is the Lighthouse score 90+?

---

## SECTION 3: CONVERSION OPTIMISATION

### Core Principles

- **One primary CTA.** Every button on the page should point to the same action. "Try Free" or "Get Started" — be consistent.
- **Reduce friction.** Ask for the minimum information on the signup form. Email alone is enough — name, company name, phone number can wait until after launch.
- **Create urgency.** Time-pressure elements like "Limited-time offer", "Special price for first 100 users", "14-day free trial".
- **Resolve objections.** Answer price, security, cancellation, and support questions in the FAQ. Every unanswered question is a potential lost customer.
- **Trust signals.** SSL badge, payment provider logo ("Powered by Stripe"), privacy policy link, customer count.

### Privacy Policy and Terms of Service

A legal requirement. Contents:
- What data is collected
- How data is used
- Sharing with third parties
- User rights (GDPR/local privacy laws)
- Contact information

To start, generate a draft with an AI tool and have a lawyer review it. Don't delay the launch waiting for a lawyer — launch with the draft and get it approved afterwards.

---

## Gotchas

- **Don't use jargon in the hero headline.** Instead of "AI-powered omnichannel analytics platform", write "Understand your customers, grow your revenue". Visitors are looking for a solution, not a technical document.
- **Don't hide pricing.** SaaS pages without pricing information lose trust. Instead of "Request a demo", show prices transparently — at least "Starting from X".
- **Too many CTAs.** "Try free", "Watch demo", "Download whitepaper", "Contact us" — a page pulling in four directions pulls in none. Pick one primary CTA.
- **Don't forget the OG image.** If your site looks ugly or blank when shared on social media, it kills the first impression. Test before launch.
- **Missing mobile testing.** Over 60% of traffic is mobile. A page that looks great on desktop but breaks on mobile means losing most of your customers.
- **Blog content unrelated to the product.** Generic posts like "The future of AI" attract traffic but don't convert. Write posts that solve your target audience's specific problems.
- **Forgetting to update the sitemap.** The sitemap may not automatically update when new pages or blog posts are added. Set up dynamic sitemap generation.
