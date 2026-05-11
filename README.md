# Mini Fleek

A small but complete v0 of the buyer-facing Fleek marketplace — built end to
end as the Full-Stack AI Builder home task. A reviewer can land on the
homepage, sign up, browse bundles, add one to a cart, check out, and see an
order confirmation, all driven by a real React frontend talking to a real
Node.js backend.

## What's in here

This repo is split into two independently deployable apps:

| Path                     | What it is                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| [`frontend/`](./frontend) | React 19 + Vite SPA. Buyer-facing UI, auth, cart, checkout.       |
| [`backend/`](./backend)   | Node.js API. Postgres (Supabase), products / cart / orders / auth.|

Each side has its own `README.md` with setup steps, scripts, and architecture
notes. The HTTP contract that joins them is duplicated as `API_CONTRACT.md`
inside each app — `backend/API_CONTRACT.md` is the source of truth,
`frontend/API_CONTRACT.md` captures FE-side decisions and open backend asks.

## Quick start (local)

```bash
# 1. Backend (Postgres + API on http://localhost:4000)
cd backend
npm install
cp .env.example .env          # fill in Supabase + OpenAI keys
npm run dev

# 2. Frontend (Vite dev server on http://localhost:5173)
cd ../frontend
npm install
cp .env.example .env          # VITE_API_BASE_URL defaults to localhost:4000
npm run dev
```

Open http://localhost:5173 and you should see real seeded products on the
homepage.

## Tech choices

- **Frontend:** React 19, Vite, TypeScript, React Router, Redux Toolkit,
  Tailwind v4. Single-page app, deployed on Vercel.
- **Backend:** Node.js (Express), TypeScript, Postgres via Supabase, Supabase
  auth for JWTs. Deployed as a stateless API.
- **AI:** OpenAI (`POST /products/search`) translates a natural-language
  buyer query into a structured filter, which the backend then runs as a
  parameterised SQL query.

## End-to-end funnel

The actual test for this task — a reviewer should be able to do all of this
on the live demo without help:

1. Land on the homepage, see categories + featured products
2. Sign up for a new account (or log in)
3. Click a category, see a grid of bundles with the filters working
4. Click a product, see the full detail page
5. Add it to cart, see the count update
6. Open the cart, change quantity, remove an item
7. Go to checkout, fill in an address, place the order
8. See the order confirmation page with an ID and summary
9. Visit `/orders/:id` later while logged in and see the same order

There's also a stretch feature: a floating natural-language search bar at the
bottom of every page that translates queries like *"Y2K denim under £8/piece
from European vendors, grade A"* into structured filters and returns matching
products inline.

## Deliverables

- **Hosted demo:** _link in submission_
- **Frontend repo:** [`./frontend`](./frontend)
- **Backend repo:** [`./backend`](./backend)
- **Loom walkthrough (~10 min):** _link in submission_
- **Design notes:** scattered in each app's README and `API_CONTRACT.md`
  files; the design system tokens themselves live in
  `frontend/src/index.css`.

## Repo layout

```
.
├── README.md                # ← you are here
├── frontend/                # React app (Vercel)
│   ├── README.md
│   ├── API_CONTRACT.md
│   ├── CLAUDE.md
│   └── src/
└── backend/                 # Node.js API
    ├── README.md
    ├── API_CONTRACT.md
    ├── CLAUDE.md
    └── src/
```

The `CLAUDE.md` in each side scopes that agent's responsibilities — frontend
agent owns the React app, backend agent owns the API + DB. Treating each side
as an independent service let me develop the two in parallel without merge
conflicts and forced a clean HTTP contract from day one.
