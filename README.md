# Project Monitoring

Backend API for a website monitoring system (NestJS + TypeScript + Prisma + PostgreSQL).

## Features
- Monitors: CRUD for HTTP/TCP monitors
- Checks: read-only history
- Incidents: read-only history

## Tech Stack
- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL

## Project Structure
- `prisma/` Prisma schema and migrations
- `src/` NestJS application
  - `monitors/` CRUD module
  - `checks/` read-only module
  - `incidents/` read-only module
  - `prisma/` Prisma service/module
  - `common/` shared utilities

## Getting Started
1) Install dependencies
```bash
npm install
```

2) Configure environment
Create `.env` with:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/monitoring?schema=public"
```

3) Generate Prisma client
```bash
npx prisma generate
```

4) Run migrations (optional)
```bash
npx prisma migrate dev
```

5) Start the app
```bash
npm run start:dev
```

## API Endpoints
Base URL: `http://localhost:3000/api`

### Monitors
- `GET /api/monitors`
- `GET /api/monitors/:id`
- `POST /api/monitors`
- `PATCH /api/monitors/:id`
- `DELETE /api/monitors/:id`

### Checks
- `GET /api/checks`
- `GET /api/checks/:id`

### Incidents
- `GET /api/incidents`
- `GET /api/incidents/:id`

### Health
- `GET /api/health` → `{ status: 'ok', timestamp: ISO8601 }`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/google` + `/api/auth/google/callback`

## Notes
- This repo currently contains backend scaffolding only.
- Add a global ValidationPipe in your NestJS bootstrap to enable DTO validation.
