# VYNQORA CRM

**VYNQORA CRM** is a centralized Customer Management System designed to give businesses a single source of truth for everything they know about their customers—who they are, how teams interact with them, where deals stand, and what needs attention next.

### Why It Exists
Growing teams often struggle with customer data scattered across spreadsheets, personal inboxes, and disconnected tools—leading to missed follow-ups, slow responses, and decisions made on guesswork instead of real visibility. VYNQORA CRM brings contacts, accounts, leads, sales pipelines, tasks, and team activity into one calm, minimalist workspace, with a long-term path toward intelligent automation and AI-assisted insights.

---

## Current Status

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1: Foundation (Core CMS)** | Auth, RBAC, Contacts, Companies, Leads, Deals Pipeline, Activities, Tasks, Notifications, Audit Logs, Dashboard (Backend + Frontend) | **Completed** |
| **Phase 2: Support & Communication** *(MVP Gate)* | Helpdesk Ticketing, SLA Tracking, Email Integration, Live Chat, Knowledge Base, Rule-Based Segmentation & Campaigns | **Up Next** |
| **Phase 3: AI Layer I** | Sentiment Analysis, AI Smart Replies, RAG Chatbot, Auto Data Entry & Enrichment | Planned |
| **Phase 4: AI Layer II** | Predictive Lead Scoring, Churn Prediction, Sales Forecasting, Smart Segmentation | Planned |
| **Phase 5: Advanced AI & Automation** | Next-Best-Action, Conversation Intelligence, Natural Language Querying, Visual Workflow Builder | Planned |
| **Phase 6: Scale, Polish & Expand** | Docker & Cloud Deployment, Mobile App, Customer Portal, Load Testing, Security & GDPR Hardening | Planned |

---

## Tech Stack

### Backend (`backend/`)
- **Framework:** NestJS 11 (TypeScript, strict mode)
- **Database & ORM:** PostgreSQL + Prisma 6
- **Auth & Security:** JWT Access + Rotating Refresh Tokens (`@nestjs/jwt`, `passport-jwt`), `bcrypt`, RBAC Guards, `helmet`, `cookie-parser`, Global Audit Interceptor
- **Validation & Docs:** `class-validator`, `class-transformer`, OpenAPI / Swagger (`/api/docs`)

### Frontend (`frontend/`)
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling & UI:** Tailwind CSS v4 + `shadcn/ui` (Base UI primitives) — minimalist warm light palette
- **Data Fetching & State:** TanStack Query (caching, `keepPreviousData`, optimistic updates with rollback), Axios (queued `401` token refresh interceptor), Zustand (persisted auth store)
- **Forms & Visualization:** React Hook Form + Zod, Recharts, `@dnd-kit` (Kanban drag-and-drop), `sonner` toasts, `lucide-react` icons

### Workspace
- **Monorepo:** `pnpm` workspace (`pnpm-workspace.yaml` managing `backend/` and `frontend/`)

---

## Project Structure

```text
CRM/
├── backend/                          # NestJS REST API
│   ├── prisma/
│   │   ├── schema.prisma             # 10 Prisma models & 5 enums
│   │   └── migrations/               # Database migrations
│   ├── src/
│   │   ├── auth/                     # Register, Login, Refresh, Logout, Me, JWT Strategy
│   │   ├── users/                    # Staff management & RBAC + /users/options
│   │   ├── contacts/                 # CRUD, search/filter, CSV import & export
│   │   ├── companies/                # CRUD + linked contacts & deals
│   │   ├── leads/                    # CRUD, status tracking, Convert-to-Deal
│   │   ├── deals/                    # CRUD + Kanban pipeline endpoint
│   │   ├── activities/               # Contact & deal interaction timeline
│   │   ├── tasks/                    # CRUD + automatic assignee notifications
│   │   ├── notifications/            # In-app notifications & unread counts
│   │   ├── audit/                    # Global write-action audit trail
│   │   ├── dashboard/                # KPIs, pipeline summary, recent activity, upcoming tasks
│   │   ├── prisma/                   # Global PrismaModule & PrismaService
│   │   └── common/                   # Guards, decorators, pagination DTO, AuditInterceptor
│   └── .env.example
├── frontend/                         # Next.js Web App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/               # /login (with Demo Admin Login), /register
│   │   │   └── (dashboard)/          # /, /contacts, /companies, /leads, /deals, /tasks, /users, /audit
│   │   ├── components/               # shadcn/ui primitives, AppShell, Kanban, module dialogs
│   │   ├── hooks/                    # TanStack Query hooks per backend module
│   │   ├── lib/                      # Axios refresh client, query keys, CSV parser, formatters
│   │   ├── stores/                   # Zustand auth store
│   │   └── types/                    # Shared TypeScript interfaces matching Prisma schema
│   └── .env.example
├── demo.json                         # Schema-aligned sample dataset (10 users, 50 entries/section)
├── AI_Customer_Management_System_Overview.md
├── Frontend_Implementation_Plan.md
├── pnpm-workspace.yaml
└── README.md
```

---

## Work Completed (Phase 1)

### Backend Highlights
- **Database Schema ([schema.prisma](backend/prisma/schema.prisma)):** `User`, `RefreshToken`, `Company`, `Contact`, `Lead`, `Deal`, `Activity`, `Task`, `Notification`, `AuditLog` with role/status/stage/activity enums and relational integrity.
- **Authentication & RBAC:** First registered user automatically becomes `ADMIN`; rotating single-use refresh tokens; role guards (`ADMIN`, `MANAGER`, `SALES_REP`, `SUPPORT_AGENT`, `MARKETING`); self-deactivation/demotion protection.
- **Global Audit Logging:** Automatically captures authenticated `POST`, `PUT`, `PATCH`, `DELETE` mutations with actor, entity, IP, and scrubbed payloads (secrets stripped).
- **Business Workflows:** Lead-to-Deal conversion (`POST /leads/:id/convert`), Kanban pipeline grouping (`GET /deals/pipeline`), bulk CSV contact import/export, safe cascade/detach deletes, and automatic notifications when tasks are assigned.

### Frontend Highlights
- **Minimalist Warm Light UI:** Clean `shadcn/ui` workspace with matched skeleton loaders, debounced search (`300ms`), empty states, and subtle background-fetch progress indicator.
- **Resilient Auth & API Layer:** Axios interceptor queues concurrent `401` requests behind a single `/auth/refresh` call; `<AuthGuard>` enforces authentication and role-restricted pages (`/users`, `/audit`).
- **Optimistic Interactions:** Drag-and-drop Deals Kanban board (`@dnd-kit`) with Board/Table toggle and slide-over Deal Detail sheet, quick-complete task checkboxes, and live notification bell popover — all with automatic rollback on API error.
- **Demo Support:** One-click **Demo Admin Login** (`admin@email.com` / `admin123`) on `/login` and a complete schema-aligned [demo.json](demo.json) dataset (10 staff accounts, 50 companies, 50 contacts, 50 leads, 50 deals, 50 activities, 50 tasks, 20 notifications).

---

## API Endpoints Reference (Phase 1)

All endpoints are prefixed with `/api/v1` and documented interactively at `/api/docs`.

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| **Users & RBAC** | `POST /users`, `GET /users`, `GET /users/options`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` |
| **Contacts** | `POST /contacts`, `POST /contacts/import`, `GET /contacts`, `GET /contacts/export`, `GET /contacts/:id`, `PATCH /contacts/:id`, `DELETE /contacts/:id` |
| **Companies** | `POST /companies`, `GET /companies`, `GET /companies/:id`, `PATCH /companies/:id`, `DELETE /companies/:id` |
| **Leads** | `POST /leads`, `GET /leads`, `GET /leads/:id`, `PATCH /leads/:id`, `POST /leads/:id/convert`, `DELETE /leads/:id` |
| **Deals** | `POST /deals`, `GET /deals`, `GET /deals/pipeline`, `GET /deals/:id`, `PATCH /deals/:id`, `DELETE /deals/:id` |
| **Activities** | `POST /activities`, `GET /activities`, `DELETE /activities/:id` |
| **Tasks** | `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id` |
| **Notifications** | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/mark-all-read`, `PATCH /notifications/:id/read` |
| **Audit Logs** | `GET /audit` *(Admin / Manager)* |
| **Dashboard** | `GET /dashboard/kpis`, `GET /dashboard/pipeline`, `GET /dashboard/recent-activity`, `GET /dashboard/upcoming-tasks` |

## Frontend Routes (Phase 1)

| Route | Description |
|-------|-------------|
| `/login`, `/register` | Authentication screens + one-click Demo Admin Login |
| `/` | Dashboard KPIs, Pipeline by Stage chart, Recent Activity, Upcoming Tasks |
| `/contacts` & `/contacts/[id]` | Searchable/filterable contacts directory, CSV import/export, Contact 360° & Activity Timeline |
| `/companies` & `/companies/[id]` | Organization directory + Company detail with linked contacts and deals |
| `/leads` | Lead qualification table with status tabs and Convert-to-Deal workflow |
| `/deals` | Drag-and-drop Kanban Pipeline board + Table view toggle + Deal Detail sheet |
| `/tasks` | Task tracker with status/assignee filters and optimistic completion toggle |
| `/users` | Team directory, role assignment, and member management *(Admin / Manager)* |
| `/audit` | Paginated audit trail with entity filter *(Admin / Manager)* |

---

## Quick Start

### Prerequisites
- **Node.js** 20+
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL** (local or hosted, e.g. Neon)

### 1. Install Dependencies (from root)
```bash
pnpm install
```

### 2. Configure & Run Backend
1. Copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Fill in `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in `backend/.env`.
3. Run Prisma migrations and start the API:
   ```bash
   cd backend
   npx prisma migrate dev
   pnpm start:dev
   ```
4. Backend URLs:
   - **REST API:** `http://localhost:3000/api/v1`
   - **Swagger Docs:** `http://localhost:3000/api/docs`

### 3. Configure & Run Frontend
1. *(Optional)* Copy `frontend/.env.example` to `frontend/.env.local` if your backend runs on a non-default URL (defaults to `http://localhost:3000/api/v1`).
2. Start the Next.js dev server:
   ```bash
   cd frontend
   pnpm dev
   ```
3. Open **`http://localhost:3001`**.
   - First registered account on `/register` automatically becomes `ADMIN`.
   - If you load [demo.json](demo.json) into your database, you can sign in immediately with the **Demo Admin Login** button (`admin@email.com` / `admin123`).

---

## Upcoming Tasks (Roadmap)

### Phase 2 — Support & Communication *(Completes MVP)*
- **Helpdesk & Ticketing:** Ticket CRUD, status workflow (`Open → In Progress → Waiting → Resolved → Closed`), manual & round-robin assignment, SLA tracking & breach alerts, internal notes vs. customer replies, CSAT surveys.
- **Multi-Channel Inbox:** Two-way email integration (IMAP/SMTP or Gmail/Outlook API), automatic email-to-ticket creation, reusable email templates, embeddable WebSocket live chat widget.
- **Knowledge Base:** Public searchable KB portal + internal staff-only articles with versioning.
- **Marketing Foundations:** Rule-based customer segmentation, email campaign builder, open/click/bounce tracking, GDPR opt-out handling.

### Phase 3 — AI Layer I (Basic Intelligence)
- Dedicated NestJS `AiModule` with LLM provider wrapper, `pgvector` embeddings, prompt templates, and token/cost controls.
- Sentiment analysis on emails & tickets with auto-escalation rules.
- RAG-grounded AI smart reply drafts (human-in-the-loop) and customer-facing FAQ chatbot with human handoff.
- Automatic data entry (email signature parsing & fuzzy duplicate detection).

### Phase 4 — AI Layer II (Predictive Analytics)
- Predictive lead scoring, churn risk prediction & early-warning alerts, revenue/sales forecasting, and clustering-based smart segmentation.

### Phase 5 — Advanced AI & Automation
- Next-best-action recommendations, call transcription & conversation intelligence, natural language querying (*"Ask the CRM"*), product/upsell recommendations, and a visual "If → Then" automation builder.

### Phase 6 — Scale, Polish & Expand
- Docker & Docker Compose production setup, mobile app (React Native / Flutter), customer self-service portal, load testing, caching/indexing optimization, penetration testing, and GDPR compliance tooling.


