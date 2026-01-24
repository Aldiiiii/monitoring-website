
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
