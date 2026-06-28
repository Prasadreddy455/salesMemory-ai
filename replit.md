# SalesMemory AI

An AI-powered B2B sales CRM that remembers everything, drafts follow-up emails, handles objections, and tracks AI costs — all in one dark, focused command center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sales-memory run dev` — run the frontend (port 21922)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `ANTHROPIC_API_KEY` — Anthropic API key for Claude

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, Recharts, shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Anthropic Claude (claude-haiku-4-5 for simple tasks, claude-sonnet-4-6 for complex)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — DB schema (clients.ts, interactions.ts, api-usage.ts)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/claude.ts` — Anthropic AI integration with model routing
- `artifacts/sales-memory/src/` — React frontend

## Architecture decisions

- Model routing: Haiku for simple tasks (email drafts, summaries, follow-ups); Sonnet for complex tasks (objection handling, strategic advice)
- Client memory stored as JSON string in `memory` column — parsed on read, serialized on write
- API usage logged to `api_usage` table on every AI call for cost analytics
- All AI interactions logged as `interactions` for the client timeline

## Product

- Pipeline dashboard: Kanban board with deals organized by stage (Discovery → Proposal → Negotiation → Won/Lost)
- Client profiles: Memory panel (decision makers, objections, notes), interaction history, AI quick actions
- AI assistant: Generate follow-up emails, draft objection responses, suggest next steps, summarize interactions
- Cost analytics: Monthly spend, daily cost chart, breakdown by model and task type
- Budget tracking: Configurable monthly budget with overage warnings

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `pnpm run typecheck:libs` must be run after changing any `lib/*` schema to rebuild declarations before typechecking artifacts
- Model names must match the Anthropic AI integration's supported models list exactly
- The `memory` field in the DB is a JSON string; always JSON.stringify before writing, parse on read
- DB column `deal_stage` maps to camelCase `dealStage` in Drizzle; routes must map these back to snake_case for the API

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
