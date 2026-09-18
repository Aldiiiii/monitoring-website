# Plan Kepatuhan PRD — Website Monitoring System

> Stack: NestJS + Prisma + PostgreSQL + React Vite | PRD: `PRD.md:1-425` | Audit: `prisma/schema.prisma`, `src/*`, `web/src/*`

## 0. Konteks & Tujuan

Tujuan: bawa project dari ~70% → 100% MVP (`PRD.md:405-412`) dan siap V1 (`PRD.md:421-425`) tanpa scope creep.
Prinsip PRD: `12.5 API Contract` (`/api`, `{data,meta}`, `{error}`), `12.1 Auth`, `12.2 Check Criteria`, `12.3 Notifikasi`, `12.4 Retensi`, `12.6 Observability`.

**Skor MVP sekarang: 4.5/6** — gagal di register/login loop + wrapper/health.

---

## 1. Audit Singkat (Bukti `file:line`)

| Domain PRD | Status | Bukti |
|---|---|---|
| DB `§8` | ✅ Superset | `prisma/schema.prisma:38-169` OK |
| API Contract `12.5` `/api` + wrapper | ❌ MISSING | `src/main.ts:7-21` tanpa `setGlobalPrefix`, `src/common/prisma-error.util.ts:1-16` saja |
| Health `12.6` | ❌ MISSING | `src/app.module.ts:13-27` tanpa HealthModule |
| Auth register/login/JWT/role | ✅ | `auth/service.ts:24-73`, `jwt.strategy.ts:12-34`, `guards/roles.guard.ts:6-26` |
| Auth forgot/reset/rate-limit | ❌ MISSING | grep `forgot\|throttl` 0 hit |
| Check HTTP/TCP/retry/timeout/keyword | ✅ | `checks.service.ts:188-324,326-387`, `schema.prisma:73-75` |
| Scheduler interval | ⚠️ BUG | `checks.service.ts:36` `EVERY_MINUTE` ignore `intervalSec` `create-monitor.dto.ts:57-59` `@Min(30)` |
| Notifikasi Telegram on-change | ✅ | `checks.service.ts:398-426` |
| Maintenance suppression | ❌ BUG | `checks.service.ts:70-73` `continue` skip check, harus skip notif saja `PRD.md:268` |
| Cooldown 5m / retry Telegram | ❌ MISSING | `telegram.service.ts:21-65` sekali tanpa timeout |
| Reports uptime 7/30 | ✅ | `reports.service.ts:52-84` |
| Reports downtime/latency/retensi | ❌ MISSING | tanpa pruning, tanpa `durationSec` sum |
| Frontend auth | ❌ P0 BUG | `web/src/lib/auth.ts:1` `monitoring_token` vs `LoginPage.tsx:30` `token` |
| Frontend register/forgot | ❌ MISSING | `web/src/App.tsx:1-11` tanpa `/register` |
| Infra/docs/docker | ❌ MISSING | `docs/` kosong, `.env:15` token bocor, tanpa `Dockerfile` |

---

## 2. Fase Eksekusi

### Fase 0 — Blocker MVP (P0) — 1-2 hari — *wajib sebelum demo*

**0.1 Fix Auth Token Mismatch**
- File: `web/src/pages/LoginPage.tsx:30`, `web/src/pages/AuthCallbackPage.tsx:19`, `web/src/components/RequireAuth.tsx:4-12`, `web/src/components/SidebarLayout.tsx:28-31`
- Ubah semua `localStorage.setItem('token',...)` → `setToken()` dari `web/src/lib/auth.ts:7`. `RequireAuth` tambah `fetchMe` + expiry check. `api.ts:143-149` sudah pakai `getToken()`.

**0.2 Fix Google OAuth Callback**
- File: `src/auth/auth.controller.ts:30-52`, `src/auth/google.strategy.ts:6-32`, `src/auth/auth.service.ts:75-131`
- `auth.controller.ts:51` `token=${state}` → `token=${user.accessToken}`. Hapus `passReqToCallback:true` atau fix signature `(req,accessToken,refreshToken,profile,done)`.

**0.3 Register UI**
- File baru: `web/src/pages/RegisterPage.tsx` (copy `LoginPage.tsx:159-238`), `web/src/App.tsx:1-11` tambah `Route /register`, link `LoginPage.tsx:266`.
- Backend sudah ada `POST /auth/register` `auth.controller.ts:13-16`.

**0.4 Maintenance Bug**
- File: `src/checks/checks.service.ts:56-73,393-440`
- Hapus `continue`; tetap `await runCheckForMonitor(monitor)` lalu di `notifyTelegram` cek `if(maintenanceIds.has(monitor.id)) return;` atau skip call.

**0.5 Health + Global Prefix**
- File: `src/main.ts:7-21`, `src/app.module.ts:13-27`, `web/src/lib/api.ts:143`
- Tambah `app.setGlobalPrefix('api')`, modul `src/health/health.controller.ts` `GET /health → {status:'ok', timestamp: ISO8601}`. Update `VITE_API_URL` dan `README.md:52`.

### Fase 1 — Kepatuhan MVP Wajib (P1) — 3-4 hari

**1.1 Rate Limit + Security**
- File: `src/main.ts:10`, `src/auth/auth.module.ts:10-15`, `src/app.module.ts`
- `npm i @nestjs/throttler helmet`, `ThrottlerModule.forRoot({ttl:60000, limit:5})` untuk `auth/login,register`, `app.use(helmet())`, restrict CORS `origin: process.env.FRONTEND_URL`.

**1.2 Scheduler Respect `intervalSec`**
- File: `src/checks/checks.service.ts:36-73`, `src/monitors/dto/create-monitor.dto.ts:57-65`
- Ubah `@Cron(EVERY_MINUTE)` loop: `if(monitor.lastCheckedAt && Date.now()-monitor.lastCheckedAt.getTime() < monitor.intervalSec*1000) continue;`. DTO `@Min(30)` → `@Min(60) @Max(300)`.

**1.3 Telegram Dedup + Retry**
- File: `src/notifications/telegram.service.ts:21-65`, `src/checks/checks.service.ts:393-440`
- Map `lastNotifiedAt: Map<string, number>` key `monitorId+status`, cooldown 5 menit `PRD.md:258`. `telegram.service` retry 3x `for attempt 0..2` + `setTimeout 8000ms`.

**1.4 API Wrapper & Error Format `PRD.md:312-339`**
- File baru: `src/common/interceptors/transform.interceptor.ts` → `{data, meta:{requestId: uuid, timestamp}}`, `src/common/filters/http-exception.filter.ts` → `{error:{code,message,details}}`
- Daftar global di `main.ts:12-17` bersama `ValidationPipe`.

**1.5 Forgot/Reset Password `PRD.md:204-206`**
- File: `prisma/schema.prisma` tambah `model PasswordResetToken {id, userId, token @unique, expiresAt, usedAt}`, `src/auth/dto/forgot-password.dto.ts`, `reset-password.dto.ts`, `src/auth/auth.service.ts`, `auth.controller.ts`
- `POST /auth/forgot-password {email}` → generate token 15-30 menit, kirim email (nodemailer). `POST /auth/reset-password {token, newPassword}` → `bcrypt.hash 10`.

**1.6 Secrets & Env**
- File: `.env:15-16`, `src/auth/jwt.strategy.ts:18`, `src/auth/auth.module.ts:13`
- Hapus fallback `dev-secret` → throw jika `!JWT_SECRET` di prod, buat `.env.example`, revoke `TELEGRAM_BOT_TOKEN` bocor.

### Fase 2 — V1 (`PRD.md:421-425`) — 3 hari

**2.1 Reports Lengkap `12.4`**
- File: `src/reports/reports.service.ts:24-94`, `src/reports/reports.controller.ts:12-22`
- Tambah `totalDowntimeMin = sum(incidents.durationSec)/60`, `incidentCount`, `avgLatency/p95` per day. Endpoint baru `GET /reports/latency?monitorId&days`.

**2.2 Retensi & Pruning**
- File: `src/checks/checks.service.ts` atau `src/reports/` baru `retention.service.ts`
- `@Cron(EVERY_DAY_AT_MIDNIGHT)` hapus `check where checkedAt < now-90d`, archive opsi agregat harian.

**2.3 Redirect/TLS & Validasi**
- File: `src/checks/checks.service.ts:246-324`, `src/monitors/dto/create-monitor.dto.ts:41`
- Follow `Location` max 5, `rejectUnauthorized:true` default, DTO `method @IsIn(['GET','HEAD'])`.

**2.4 Audit Log**
- File: `prisma/schema.prisma` tambah `AuditLog`, `src/monitors/monitors.service.ts:13-117` log `create/update/delete` dengan `userId`.

### Fase 3 — UX & Infra — 2 hari

**3.1 Frontend UX `12.7`**
- File: `web/package.json`, `web/vite.config.ts:1-9`, `web/src/pages/MonitorsPage.tsx:414-416`, `web/src/components/UptimeChart.tsx:7-58`
- `npm i -D tailwindcss`, `vite.config.ts` proxy `/api`, hapus `web/login.html:1-258`, tambah template monitor, empty state ilustrasi, retry button `HistoryPage.tsx:70-74`, downtime display `ReportsPage.tsx:58-68`, legend status.

**3.2 Infra**
- File: `Dockerfile`, `docker-compose.yml`, `docs/api.md`, `scripts/seed-admin.ts:6-32`
- Compose postgres+api+web, healthcheck, backup note.

---

## 3. Daftar File Berubah

- Baru: `src/health/*`, `src/common/interceptors/*`, `src/common/filters/*`, `web/src/pages/RegisterPage.tsx`, `prisma/migrations/*_password_reset`
- Edit: `src/main.ts`, `src/app.module.ts`, `src/checks/checks.service.ts`, `src/notifications/telegram.service.ts`, `src/reports/*`, `src/auth/*`, `src/monitors/dto/*`, `web/src/lib/*`, `web/src/pages/*`, `web/src/components/*`, `.env.example`

---

## 4. Risiko & Mitigasi

- **Prefix `/api` breaking change** — frontend + mobile harus update `VITE_API_URL`. Mitigasi: keep fallback redirect 301 di Nginx.
- **Scheduler per-monitor** — load naik jika banyak monitor. Mitigasi: stagger + lock `isRunning` `checks.service.ts:39-43` sudah ada.
- **Token revoke** — tanpa DB session. Mitigasi: short TTL 3600 `auth.service.ts:8` + refresh token V1.

---

## 5. Open Questions untuk Konfirmasi

1. Single-tenant per-user seperti sekarang cukup? (`PRD.md:216`)
2. Refresh token perlu di Fase 1 atau cukup access token?
3. Keyword pakai regex atau `includes`? (`PRD.md:248`)
4. Provider email untuk reset password?
5. Versioning `/api/v1` perlu? (`PRD.md:357`)

Jawab :
1. multi tenant boleh
2. Refresh token
3. regex
4. google
5. perlu
---

## 6. Verifikasi

```bash
npx prisma generate && npx prisma migrate dev
npm run build # tsc -p tsconfig.build.json
npm run start:dev # ts-node -r tsconfig-paths/register src/main.ts
curl http://localhost:3000/api/health # {status:'ok'}
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/monitors
# Browser: login → localStorage monitoring_token terisi → /monitors tidak loop
```

**Kriteria Selesai Fase 0:** 6 Acceptance `PRD.md:405-412` PASS, `GET /health` 200, `POST /auth/register` → `POST /auth/login` → `POST /api/monitors` → check tiap 60s → incident → Telegram.
