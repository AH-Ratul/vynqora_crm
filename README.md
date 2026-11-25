# VYNQORA CRM

## Project Structure
- `backend/` — NestJS REST API (TypeScript + Prisma + PostgreSQL)
- `frontend/` — Next.js frontend (TypeScript + Tailwind CSS)

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL running locally
- Redis running locally

### Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and configure your `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.*
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run Prisma database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start development server:
   ```bash
   pnpm start:dev
   ```
6. Endpoints:
   - **REST API:** `http://localhost:3000/api/v1`
   - **Interactive Swagger Docs:** `http://localhost:3000/api/docs`

### Frontend Setup
1. Open terminal in `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start development server:
   ```bash
   pnpm dev
   ```
4. Access App: `http://localhost:3001`

---

## Phase 1 Modules & Endpoints Overview

| Module | Features & Endpoints |
|---|---|
| **Auth** | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` |
| **Users & RBAC** | `GET /api/v1/users`, `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id` |
| **Contacts** | `GET/POST /api/v1/contacts`, `GET/PATCH/DELETE /api/v1/contacts/:id`, `GET /api/v1/contacts/export` (CSV) |
| **Companies** | `GET/POST /api/v1/companies`, `GET/PATCH/DELETE /api/v1/companies/:id` |
| **Leads** | `GET/POST /api/v1/leads`, `GET/PATCH/DELETE /api/v1/leads/:id` |
| **Deals & Pipeline** | `GET/POST /api/v1/deals`, `GET/PATCH/DELETE /api/v1/deals/:id`, `GET /api/v1/deals/pipeline` (Kanban data) |
| **Activities** | `POST /api/v1/activities`, `GET /api/v1/activities` (timeline per contact/deal) |
| **Tasks** | `GET/POST /api/v1/tasks`, `GET/PATCH/DELETE /api/v1/tasks/:id` |
| **Notifications**| `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/mark-all-read` |
| **Audit Logs** | `GET /api/v1/audit` (tracks state mutations with user, IP, and timestamp) |
| **Dashboard** | `GET /api/v1/dashboard/kpis`, `GET /api/v1/dashboard/pipeline`, `GET /api/v1/dashboard/recent-activity`, `GET /api/v1/dashboard/upcoming-tasks` |
