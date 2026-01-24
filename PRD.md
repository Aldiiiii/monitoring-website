
# Product Requirements Document (PRD)
## Website Monitoring System
Tech Stack: NestJS (TypeScript) + PostgreSQL + React (Vite)

---

## 1. Latar Belakang
Banyak website dan server milik instansi/perusahaan tidak memiliki sistem pemantauan otomatis.
Akibatnya, downtime sering terlambat diketahui dan berdampak pada layanan publik.

Aplikasi ini bertujuan untuk:
- Memantau uptime website/server secara otomatis
- Memberikan notifikasi cepat saat terjadi downtime
- Menyediakan laporan uptime dan performa

---

## 2. Tujuan Produk
- Monitoring layanan 24/7
- Mengurangi downtime tidak terdeteksi
- Memberikan data uptime yang akurat
- Mudah digunakan oleh non-teknis

---

## 3. Target Pengguna
- Admin IT / Programmer
- OPD / Instansi Pemerintah
- Perusahaan kecil-menengah

---

## 4. Ruang Lingkup (Scope)

### In Scope
- Monitoring HTTP/HTTPS
- Monitoring TCP Port (SSH, MySQL, dll)
- Cron-based checking
- Notifikasi Telegram
- Dashboard web
- Laporan uptime

### Out of Scope (versi awal)
- Mobile App
- SMS Gateway
- Auto-healing / auto-reboot server

---

## 5. Fitur Utama

### 5.1 Monitoring Non-Stop 24x7
- Sistem melakukan pengecekan setiap interval (1–5 menit)
- Status: UP / DOWN
- Response time dicatat

### 5.2 Multi-Protocol Monitoring
- HTTP / HTTPS
- TCP Port (host + port)

### 5.3 Notifikasi Downtime
- Telegram Bot
- Notifikasi hanya saat status berubah
- Notifikasi recovery (UP kembali)

### 5.4 Laporan Uptime & Performa
- Persentase uptime (7 hari / 30 hari)
- Riwayat downtime
- Grafik response time

### 5.5 Maintenance Window
- Jadwal maintenance
- Tidak mengirim alert saat maintenance

### 5.6 False Alarm Reduction
- Retry check (mis. 3x)
- Timeout configurable

---

## 6. Alur Sistem (High Level)

1. User membuat monitor
2. Cron job berjalan tiap X menit
3. Sistem melakukan check
4. Hasil disimpan ke database
5. Jika status berubah → kirim notifikasi
6. Dashboard menampilkan status & laporan

---

## 7. Arsitektur Teknis

### Backend
- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL
- Cron Scheduler

### Frontend
- React + Vite + TypeScript
- REST API
- Dashboard UI

---

## 8. Struktur Database (High Level)

### users
- id
- name
- email
- password
- created_at

### monitors
- id
- name
- type (HTTP | TCP)
- host
- port (nullable)
- interval
- timeout
- is_active
- created_at

### checks
- id
- monitor_id
- status (UP/DOWN)
- response_time
- checked_at

### incidents
- id
- monitor_id
- started_at
- ended_at
- duration

### maintenance_windows
- id
- monitor_id
- start_time
- end_time

---

## 9. Non-Functional Requirements
- Reliability tinggi
- Response API < 300ms
- Aman (auth + validation)
- Mudah dikembangkan

---

## 10. Roadmap Versi

### MVP
- HTTP monitoring
- Telegram alert
- Dashboard sederhana

### V1
- TCP port check
- Maintenance window
- Grafik uptime

### V2
- Multi-location checker
- Dependency monitor
- Public status page

---

## 11. Definisi Sukses
- Sistem stabil > 99%
- Notifikasi realtime
- User dapat melihat uptime dengan jelas

---

## 12. Addendum yang Disarankan

### 12.1 Autentikasi & User Management
**Tujuan**: membatasi akses, memastikan setiap monitor punya pemilik, dan audit yang jelas.

**Scope MVP**:
- Registrasi dan login via email + password
- Reset password via email (token sekali pakai, expire 15â€“30 menit)
- Verifikasi email opsional (bisa diaktifkan di versi berikutnya)
- Role dasar: admin, viewer (read-only)
- Kepemilikan monitor per user (userId di setiap monitor)

**Alur dasar**:
1) User register â†’ terima email (opsional) â†’ login
2) User login â†’ dapat access token (JWT) + refresh token (opsional)
3) User bisa CRUD monitor miliknya
4) Viewer hanya bisa read (monitor/checks/incidents)

**API endpoints (contoh)**:
- POST `/auth/register` { name, email, password }
- POST `/auth/login` { email, password } â†’ { accessToken, expiresIn }
- POST `/auth/forgot-password` { email }
- POST `/auth/reset-password` { token, newPassword }
- GET `/me` â†’ profil user

**Kebijakan keamanan**:
- Password hashing: bcrypt (10â€“12 rounds)
- Rate limiting untuk auth endpoints
- Minimum password length (>= 8) + basic complexity
- Email unik (unique index)

**Open questions**:
- Perlu multi-tenant (instansi) di MVP atau single-tenant dulu?
- Perlu refresh token di MVP atau access token short-lived saja?

### 12.2 Definisi Check & Kriteria "UP"
**Tujuan**: menentukan parameter check yang konsisten agar hasil uptime akurat.

**Default behavior**:
- HTTP sukses bila status code 200â€“399
- TCP sukses bila socket connect < timeout
- Latency dicatat (ms) pada setiap check sukses/failed

**Configurables per monitor**:
- `expectCode`: status code spesifik (mis. 200)
- `keyword`: teks yang harus muncul di body
- `method`: GET/HEAD (HTTP)
- `timeoutMs`: batas waktu koneksi (default 8000)
- `retries` + `retryDelayMs`: false alarm reduction

**HTTP rules**:
- Jika `expectCode` diset â†’ status harus match
- Jika `expectCode` kosong â†’ gunakan range 200â€“399
- Jika `keyword` diset â†’ body harus mengandung teks
- Batasi ukuran body untuk keyword check (mis. max 1MB)

**Redirect & TLS**:
- Redirect default: follow max 5x (opsional)
- TLS validation default: on (reject invalid/expired)

**Error classification (contoh)**:
- `timeout`, `dns`, `refused`, `status_500`, `keyword_not_found`

**Open questions**:
- Apakah perlu regex untuk keyword?
- Apakah perlu custom headers (auth token)?

### 12.3 Aturan Notifikasi
**Tujuan**: notifikasi cepat, tidak spam, dan punya kontrol saat maintenance.

**Trigger default**:
- Kirim notifikasi hanya saat status berubah (UPâ†’DOWN / DOWNâ†’UP)

**Cooldown & dedup**:
- Cooldown default: 5 menit (tidak mengirim notifikasi ulang untuk event yang sama)
- Dedup berdasarkan monitorId + status + window waktu

**Escalation policy (opsional)**:
- Jika DOWN lebih dari X menit, kirim ulang tiap Y menit
- Batas maksimal pengulangan (mis. 3x)

**Maintenance/Silence**:
- Per monitor: gunakan maintenance window
- Global silence (opsional): jam kerja / hari libur
- Saat maintenance aktif, skip notifikasi tetapi tetap simpan check

**Channels**:
- TELEGRAM (MVP)
- EMAIL/WEBHOOK (v1+)

**Konten pesan**:
- DOWN: `ð¨ DOWN {monitor.name} {target}`
- UP: `â UP AGAIN {monitor.name} {target}`

**Open questions**:
- Perlu on-call rotation?
- Perlu override channel per incident?

### 12.4 Retensi Data & Uptime
**Tujuan**: menjaga performa database dan konsistensi laporan uptime.

**Retensi data**:
- Checks: simpan 30â€“90 hari (configurable)
- Incidents: simpan minimal 12 bulan
- Maintenance windows: simpan selamanya (audit)

**Pruning & archival**:
- Job harian untuk hapus checks lama
- Opsional: ringkas checks lama jadi agregat harian

**Definisi uptime**:
- Rolling 7/30 hari
- Downtime dianggap valid jika DOWN >= 1 interval check
- Jika ada retries: status final dihitung setelah semua retry

**SLA & laporan**:
- Uptime % = (total waktu - downtime) / total waktu
- Tampilkan total downtime (menit/jam) dan jumlah incident

**Open questions**:
- Butuh export CSV/PDF?
- Butuh breakdown per monitor type?

### 12.5 API Contract
**Tujuan**: API konsisten, mudah diintegrasi, dan mudah di-debug.

**Konvensi umum**:
- Base URL: `/api` (opsional)
- Semua response JSON
- Tanggal dalam ISO 8601
- Pagination: `skip` + `take`

**Format response sukses (contoh)**:
```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-01-24T00:00:00Z"
  }
}
```

**Format error standar (contoh)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "url", "issue": "must be a valid URL" }
    ]
  }
}
```

**Endpoints inti**:
- Monitors:
  - GET `/monitors` (filter: `isActive`, `type`, `skip`, `take`)
  - GET `/monitors/:id`
  - POST `/monitors`
  - PATCH `/monitors/:id`
  - DELETE `/monitors/:id`
- Checks (read-only):
  - GET `/checks` (filter: `monitorId`, `status`, `from`, `to`, `skip`, `take`)
  - GET `/checks/:id`
- Incidents (read-only):
  - GET `/incidents` (filter: `monitorId`, `from`, `to`, `skip`, `take`)
  - GET `/incidents/:id`

**Sorting (opsional)**:
- Query: `orderBy=createdAt:desc`

**Open questions**:
- Perlu versioning API (v1/v2)?
- Perlu pagination cursor?

### 12.6 Observability & Security
**Tujuan**: sistem mudah dipantau dan aman dioperasikan.

**Observability**:
- Healthcheck endpoint: `GET /health`
- Logging: request log, error log, check result summary
- Metrics (opsional): latency check, error rate, uptime per monitor

**Security**:
- Rate limiting untuk API publik
- Input validation di semua endpoint
- Env var untuk secrets (DB, Telegram token)
- Backup/restore policy untuk database

**Audit**:
- Log aktivitas penting (create/update/delete monitor)
- Simpan siapa yang melakukan perubahan

**Open questions**:
- Perlu SSO (SAML/OIDC)?
- Perlu WAF atau API gateway?

### 12.7 UX Flow (Dashboard)
**Tujuan**: pengalaman pengguna jelas dan ramah non-teknis.

**Onboarding**:
- Empty state yang menjelaskan cara membuat monitor pertama
- Template monitor (contoh: HTTP ping, TCP port)

**Status & Insight**:
- Warna status jelas (UP/DOWN/UNKNOWN)
- Ringkasan uptime 7/30 hari
- Drill-down: klik monitor â†’ detail checks & incidents

**Error state**:
- Pesan error yang jelas dan actionable
- Retry button pada list monitor/checks/incidents

**Role-based UX**:
- Admin: bisa CRUD monitor
- Viewer: read-only, tombol create/edit/delete disembunyikan

---

## 13. Acceptance Criteria (MVP)
- User bisa register/login, lalu membuat monitor HTTP.
- Sistem menjalankan check otomatis tiap 60 detik dan menyimpan hasil ke database.
- Status monitor terlihat di dashboard (UP/DOWN/UNKNOWN + lastCheckedAt + latency).
- Notifikasi Telegram terkirim hanya saat status berubah.
- Incidents dibuat saat DOWN dan ditutup saat UP kembali.
- Dashboard bisa menambah/edit/hapus monitor via UI.

## 14. Scope MVP vs V1

### MVP (harus ada)
- CRUD monitor (HTTP)
- Scheduler check 60 detik + retry
- Telegram notifications
- Dashboard list monitors

### V1 (setelah MVP)
- TCP monitoring
- Maintenance window UI
- Uptime report 7/30 hari
- Email/Webhook notifications
