# LK Bakehouse

LK Bakehouse is a bakery storefront and operations dashboard built with React, TypeScript, and Supabase. The exported source includes a customer-facing catalog and ordering flow, plus staff tools for day-to-day bakery operations.

> **Project status:** This repository documents the source exported from Google AI Studio. Features below are present in the codebase, but have not yet been independently run or verified against a live Supabase project. Treat this as a development project until configuration, access controls, and workflows are reviewed.

## Features in the source

### Customer storefront

- Browse and search products, filter by category, and review allergen information
- View product details, promotions, and prices
- Add items to a cart and submit an order
- View order confirmation, track an order, and contact support

### Bakery operations

- Point of sale and order management
- Product and promotion management
- Inventory, recipes, production, and purchasing screens
- Expense tracking and reports
- Business settings and staff support tools
- Supabase database schema, seed data, row-level security policies, and realtime client helpers

These are source-code features, not a claim that every workflow is connected to a configured production backend. Verify each feature in a running deployment before presenting it as production-ready.

## Technology

- React 19, TypeScript, and Vite
- Express and `tsx` for the app server
- Supabase JS and PostgreSQL
- Drizzle ORM and `pg`
- Firebase dependencies are also present in the exported project

## Project structure

- `src/` — React application, UI components, database helpers, types, and utilities
- `src/components/dashboard/` — bakery operations screens
- `src/db/` — Drizzle schema, configuration, and seed helpers
- `supabase/migrations/` — database schema and row-level security migrations
- `supabase/seed.sql` — sample database seed data
- `scripts/` — project-specific system script
- `server.ts` — Express server
- `.env.example` — environment variable template with placeholders

## Run locally

### Prerequisites

- Node.js (a current LTS release is recommended)
- A Supabase project for backend-connected workflows

The export includes both `package-lock`-style project metadata and a `bun.lock`; use one package manager consistently. With npm:

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in only the values needed for your setup.
3. Start the development server with `npm run dev`.
4. Create a production build with `npm run build`.

The available scripts are `dev`, `start`, `build`, `preview`, `lint`, and `test` as listed in `package.json`.

## Supabase setup and secret handling

1. Create a Supabase project and review the SQL migrations in `supabase/migrations/` before applying them.
2. Configure the required variables from `.env.example` for your environment.
3. Keep service-role keys, database passwords, database connection strings, and Gemini keys on the server only. Never put them in a `VITE_` variable or commit them to GitHub.
4. The Supabase anon/publishable key is designed for client use only when Row Level Security is correctly configured. Review the included policies and test permissions before using real customer or business data.
5. Keep local credentials in `.env.local`. The repository ignore rules exclude `.env*` files while allowing `.env.example`.

Do not commit a real `.env` file, exported credentials, customer records, or production database dumps. If a secret was ever committed or shared, rotate it in the service that issued it.

## Verification before deployment

- Confirm the app starts and builds in your environment.
- Apply and review migrations in a non-production Supabase project first.
- Test sign-in, staff roles, row-level security, ordering, inventory updates, and realtime behavior with test data.
- Review default business settings and contact details in the source and replace sample values with approved public business information.
- Confirm external service configuration, deployment environment variables, and error handling before using real transactions.

## License

No license is included in this export. Add a license only after choosing the terms you want others to use the project under.
