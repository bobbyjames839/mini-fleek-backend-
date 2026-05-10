# Your Role

You are the **backend agent** for this project. Your scope is the Node.js API and database only.

## What you own
- The Node.js codebase (framework choice, routing, middleware, error handling)
- Database choice, schema, migrations, and seed data (20–30 products, 4–5 categories, 4–5 vendors)
- All entities: Vendor, Product, Cart, Order, User
- Auth implementation: sign-up, log-in, session/token management, password hashing, scoping cart and orders to the authenticated user
- API endpoints for the funnel: auth, products (list/detail), categories, vendors, cart (get/add/update/remove), checkout (place order), orders (list/get by id)
- Deployment of the backend (Render, Railway, Fly, etc.) and the hosted database

## What you do NOT own
- The React frontend, any UI code, design tokens, or styling
- Anything inside the `/frontend` (or equivalent) directory

## How to work with the frontend
- The frontend is being built in parallel by another agent. Treat it as an external client.
- Maintain a `backend/API_CONTRACT.md` file that documents every endpoint: method, path, auth requirements, request shape, response shape, error shapes. Keep it up to date — the frontend reads this as the source of truth.
- Configure CORS to allow the frontend origin (local dev + deployed URL).
- Read `frontend/API_CONTRACT.md` (if it exists) for endpoints the frontend needs but you haven't built yet — implement against that contract.

## Read this next
The full task brief follows below. Read it carefully — your work must satisfy the backend requirements in Part 3 and contribute to the end-to-end funnel in Part 4.

---


# Full Stack AI Builder | Home Task — Mini Fleek

## Context

Fleek is the world's largest B2B marketplace for secondhand fashion. Vintage stores, online resellers, and retail buyers source graded vintage and secondhand inventory in bulk from verified wholesalers across the UK, Europe, US, India, and Pakistan. The product the world sees lives at joinfleek.com and in our mobile apps. Behind it is a wholesale marketplace: bundles of clothing (10–500 pieces) sold per-bundle with per-piece pricing, transparent grading, buyer protection, and end-to-end shipping.

Imagine you've just joined Fleek. We want to see how you'd build a small but complete v0 of the buyer-facing marketplace from scratch — with a real design system, a working frontend, a real backend, and an end-to-end e-commerce funnel a person can actually click through.

## What we want from you

**A mini Fleek.** Small, complete, opinionated, and runnable. We should be able to land on a homepage, sign in, browse products, add one to a cart, check out, and see an order confirmation. The screens should look like they belong to the same product. The backend should be real (not mocked).

**Tech stack.** React on the frontend, Node.js on the backend. Everything else — framework, ORM, database, auth library, deployment target — is your call. AI tools are encouraged; we use Claude Code heavily and will provide you with an account.

**Deliverables (this is what you submit).**

- **Frontend codebase** — React, in a public/shared GitHub repo
- **Backend codebase** — Node.js, in a public/shared GitHub repo (or a monorepo with the frontend)
- **Hosted demo** — a live URL we can play with end-to-end
- **Loom (~10 min)** — see Part 5
- *(Optional)* a short design note — Figma, a markdown file, annotated screenshots, sketches, whatever helped you think before coding

## Part 1 — Design thinking

Spend a bit of time thinking about design before you write a line of code. The tool doesn't matter — what matters is that you've reasoned about your colour palette, type scale, components, and screen layouts before you let the AI run.

**1a. Study Fleek as your reference.** Spend real time on joinfleek.com. Understand the funnel — how the homepage is laid out, how categories and vendors are surfaced, how a bundle product page is structured, what's on the cart and the checkout. We're not looking for a clone; we're looking for evidence that you can study a system and decompose it before you rebuild it from scratch.

**1b. Decide on a small design system.** A colour palette with semantic tokens (primary, surface, text, success, warning, error), 2–3 type scales, spacing and radius scales, and the core components you'll actually use — button, input, card, badge (for discount %), nav, product tile, price block. Capture this however you like — a Figma file, a design notes markdown, well-named CSS variables. We just want to see that you thought about it.

**1c. Sketch the four key screens.** Home, category/listing, product detail, cart. Figma frames are fine; wireframes, annotated screenshots of references, even rough sketches are fine. The point is to plan before you code, not to produce a polished design artifact.

For reference on how serious design systems are organised — Shopify Polaris, Atlassian Design System, Material 3, IBM Carbon, or Untitled UI. You don't need to match that bar; we just want to see you understand the discipline.

## Part 2 — Frontend (React)

Implement those screens as a working web app in React. Framework is your call — Next.js, Vite + React, Remix, anything. Use AI tools heavily — that's how we work day-to-day at Fleek, and we want to see how you work with them.

The frontend must:

- Render real data from your backend (no hardcoded JSON in the UI)
- Be responsive (desktop + mobile breakpoints)
- Be visually consistent — components reused, spacing and type sensible, palette coherent
- Include working navigation, an auth flow (sign up + log in), cart state, and a checkout flow

Deploy it on Vercel, Netlify, Render — whatever's easiest. We need a live URL.

## Part 3 — Backend (Node.js)

Real backend, real database, real APIs. Your call on framework (Express, Fastify, NestJS, Next.js API routes, Hono, etc.) and database (Postgres, MySQL, SQLite, MongoDB, Supabase, etc.).

**Entities (minimum).**

- **Vendor** — name, slug, country, optional rating
- **Product** — name, vendor, photos, total price, piece count, price-per-piece, optional original price (for discount %), brand, category, status
- **Cart** — per user, with line items
- **Order** — placed cart, with line items, shipping address, total, status, created_at

**Auth.** Build a working sign-up + log-in flow. Email/password is fine; magic-link or OAuth is also fine. Cart and orders must be tied to the logged-in user.

**Endpoints.** Map endpoints to the entities — list/get/create as the funnel requires. Cart and order endpoints must be scoped to the authenticated user.

**Seed data.** 20–30 products across 4–5 categories from 4–5 vendors. Use real product photos from joinfleek.com or placeholder images — your call. You don't need real payments — a "place order" button that creates an Order record and clears the cart is enough.

## Part 4 — The end-to-end funnel (this is the actual test)

A reviewer should be able to do all of this on the live demo without your help:

1. Land on the homepage and see categories + featured products
2. Sign up for a new account (or log in to an existing one)
3. Click a category, see a grid of products with the filters working
4. Click a product, see its full detail page with photos, vendor, pricing
5. Add it to cart, see the cart count update
6. Open the cart, change quantity, remove an item
7. Go to checkout, fill in a fake address, place the order
8. See an order confirmation page with an order ID and summary
9. Visit `/orders/:id` later (while logged in) and see the same order

If any step breaks, the task is incomplete. **Small but complete > big but flaky** is the rule.

## Stretch (only if you genuinely have time)

Pick at most one. Do it well.

- Vendor profile page — list a vendor's products plus a small "about" block
- Search across products by name / brand
- An AI feature you'd want as a buyer (e.g. "describe the kind of inventory your shop sells, get 5 product recommendations") — must be a real call, not a mock

## What we're testing

- **Design taste and discipline** — do your screens look like a real product designer's work, or like AI output someone forgot to curate?
- **Full-stack range** — can you actually wire a React frontend to a Node.js backend you wrote, with working auth?
- **Engineering judgment** — schema sanity, API design, where you spent abstraction budget, how you handled state, errors, and auth
- **AI tool fluency** — how you prompt Claude Code (and friends), when you intervene, when you don't, how you make the output your own
- **Scrappy completeness** — did the funnel actually work end-to-end on the deployed URL?
- **Communication** — can you walk us through your decisions in 10 minutes?

## What we're *not* testing

- Real payment integration, real images, production-grade auth (a simple working login is enough)
- Pixel-perfect match to joinfleek.com — we're hiring a builder, not a copier
- Polished design artifacts — rough sketches and good taste beat a beautiful Figma file with messy code
- Mobile native app
- Production-grade infrastructure, CI, exhaustive tests

## Practical bits

- **Time budget:** 6–8 hours. Spread it across a couple of evenings if that helps. Be honest about hours in your Loom.
- **Tools we'll provide:** a Claude Code account (tell your recruiter the email to invite), and we'll reimburse up to £40 in AI / API costs (send a receipt).
- **Use AI tools freely.** Claude Code is encouraged for both frontend and backend; Cursor, ChatGPT, anything else is your call. Tell us how you used them.
- **Submit:**
  - Hosted demo URL (must be playable, no local-only setup)
  - GitHub repo (frontend + backend, with a clear README on how to run)
  - Loom (~10 min)
  - *(Optional)* design note — Figma, markdown, sketches, however you captured your design thinking

## Part 5 — Loom (~10 min)

Walk us through it. We're particularly interested in:

- Your design choices — tokens, components, the decisions you made and why
- A live click-through of the funnel on your hosted demo
- The backend schema and one or two API routes (auth especially)
- How you used Claude Code — show us a prompt that worked well and one that didn't
- The thing you're least confident in
- Where you'd push back on this brief if you joined Fleek and we asked you to ship the real thing