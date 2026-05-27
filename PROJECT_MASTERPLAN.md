# PROJECT_MASTERPLAN.md

Project: Aplikasi Pembayaran Tagihan Listrik Sekolah  
Version: 1.0  
Source Operating Template: `UNIVERSAL_INTERACTIVE_AGENTIC_MASTERPLAN.md` v2.1  
Primary Data Source: Google Sheets — `Tagihan Listrik Sekolahan`  
Spreadsheet ID: `1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE`  
Spreadsheet URL: https://docs.google.com/spreadsheets/d/1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE/edit?usp=sharing

---

## 1. Project Summary

Aplikasi ini adalah dashboard sederhana untuk membantu admin sekolah mengelola pembayaran tagihan listrik berdasarkan data Google Sheets.

Google Sheets menjadi **source of truth** utama. Aplikasi tidak boleh menggantikan spreadsheet di fase awal. Aplikasi harus membaca, menampilkan, memfilter, memproses pembayaran, dan memperbarui status pembayaran langsung ke Google Sheets melalui Google Sheets API.

Target hasil:
- Admin dapat melihat status tagihan listrik per bulan.
- Admin dapat melihat siapa yang sudah/belum bayar.
- Admin dapat memproses pembayaran.
- Admin dapat mencetak laporan.
- Admin dapat export laporan ke PDF.
- Data tetap sinkron dengan Google Sheets.

---

## 2. Core Principle

### Recommended Data Mode: Google Sheets API Live Sync

Untuk project ini, pendekatan utama adalah:

```txt
Google Sheets API → Next.js API Route → Dashboard UI
Dashboard Payment Action → Next.js API Route → Google Sheets API
```

Jadi, aplikasi **tidak perlu import manual sebagai proses utama**.

Import CSV/Excel hanya boleh menjadi fallback/cadangan jika:
- Google Sheets API belum siap.
- Service account belum dibuat.
- Spreadsheet belum dishare ke service account.
- Admin ingin backup offline.

---

## 3. Why API Sync, Not Manual Import?

| Pilihan | Cocok Untuk | Kelemahan |
|---|---|---|
| Import manual CSV/Excel | Backup awal / testing | Tidak real-time, rawan data beda |
| Google Sheets API live sync | Dashboard operasional harian | Butuh setup service account |
| Hybrid cache | App lebih besar / multi-user berat | Kompleks, butuh database tambahan |

Keputusan project:
```txt
Gunakan Google Sheets API sebagai sumber data utama.
Tidak pakai database dulu untuk versi awal.
```

---

## 4. Spreadsheet Data Observation

Dari tab terbaru yang sudah dicek:

```txt
Sheet contoh: Mei 2026 - Tagihan
```

Struktur terlihat bukan tabel database standar 1 header row. Ada beberapa baris header/kategori, contohnya:

```txt
Row 2: Sudah | Description | Tagihan
Row 3: LISTRIK | TOKO | Cetak
Row 4+: data transaksi
```

Implikasi:
- App harus punya `Google Sheets Adapter`.
- Jangan hardcode header secara kaku.
- Harus bisa mendeteksi header multi-row.
- Harus bisa membaca kategori seperti `LISTRIK`, `TELKOM`, dan sejenisnya jika muncul.
- Harus bisa mengabaikan row kosong/separator.
- Harus bisa menormalkan data sebelum dirender ke UI.

---

## 5. Product Scope

### In Scope — MVP

1. Dashboard tagihan listrik sekolah.
2. Koneksi Google Sheets API.
3. Pilih sheet/tab bulanan.
4. Ambil data dari sheet aktif.
5. Normalisasi data dari format spreadsheet.
6. Tampilkan tabel tagihan.
7. Search data.
8. Filter status:
   - Semua
   - Sudah bayar
   - Belum bayar
   - Terlambat
9. Detail tagihan.
10. Proses pembayaran.
11. Update status bayar ke Google Sheets.
12. Export PDF.
13. Print laporan.
14. UI responsive.
15. Animasi halus dengan Framer Motion.

### Out of Scope — Untuk Nanti

1. Payment gateway otomatis.
2. Login multi-role lengkap.
3. Database PostgreSQL.
4. WhatsApp notification otomatis.
5. Audit log permanen.
6. Multi-sekolah / multi-tenant.
7. Rekonsiliasi bank otomatis.
8. Mobile app native.

---

## 6. Tech Stack

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react

Backend:
- Next.js API Routes
- Google Sheets API
- Service account authentication

PDF/Print:
- jsPDF
- html2canvas
- browser print API
- print-specific CSS

Deployment:
- Vercel recommended

Optional later:
- Supabase/PostgreSQL
- Auth.js
- Resend/WhatsApp gateway
- Audit log database

---

## 7. High-Level Architecture

```txt
Admin User
   ↓
Next.js Dashboard UI
   ↓
Next.js Server API Routes
   ↓
Google Sheets API
   ↓
Spreadsheet: Tagihan Listrik Sekolahan
```

API routes:

```txt
GET  /api/sheets/tabs
GET  /api/sheets/rows?sheet=<sheetName>
POST /api/sheets/update-payment
POST /api/reports/pdf
```

---

## 8. Data Adapter Strategy

Because spreadsheet rows may contain category headers and non-standard header rows, create:

```txt
src/lib/sheets-adapter.ts
```

Required functions:

```ts
detectHeaderRows(rawRows)
detectDataStartRow(rawRows)
normalizeBillingRows(rawRows)
detectStatusColumn(headers)
detectDescriptionColumn(headers)
detectAmountColumn(headers)
detectStoreColumn(headers)
detectPrintColumn(headers)
detectDueDateColumn(headers)
```

Minimum normalized row shape:

```ts
export type BillingRecord = {
  rowNumber: number;
  category?: string;
  isPaid?: boolean;
  description?: string;
  customerName?: string;
  customerId?: string;
  amount?: number;
  store?: string;
  printable?: boolean;
  dueDate?: string;
  raw: Record<string, string>;
};
```

Important:
- Preserve original row number from Google Sheets.
- Update must target exact row number.
- Do not reorder data before update unless row number is preserved.
- Never delete or overwrite unknown columns.

---

## 9. Payment Update Rules

When admin processes payment:

Required:
- Find target row number.
- Detect status column.
- Update status cell only if status column is found.
- If payment date column exists, update payment date.
- If payment method column exists, update method.
- If notes column exists, update notes.
- If amount paid column exists, update amount paid.

If column is missing:
- Show non-blocking warning.
- Do not create new column automatically.
- Do not modify spreadsheet structure.

Default status values:
```txt
TRUE  = sudah bayar
FALSE = belum bayar
```

But the app must also understand:
```txt
Sudah Bayar
Lunas
Paid
Belum Bayar
Unpaid
Pending
```

---

## 10. UI/UX Direction

Design goal:
```txt
Clean, premium, simple, fast, school-admin friendly.
```

Visual style:
- White / light neutral background.
- Rounded cards.
- Soft shadows.
- Clean typography.
- Status badge with clear color.
- Smooth transitions.
- Responsive table layout.
- Mobile-friendly card view.

Main components:

```txt
DashboardShell
SummaryCards
SheetSelector
SearchFilterBar
BillingTable
BillingRowCardMobile
StatusBadge
BillingDetailModal
PaymentModal
ExportPdfButton
PrintButton
LoadingSkeleton
EmptyState
ErrorState
```

---

## 11. Pages

```txt
/                  → redirect to /dashboard
/dashboard          → main dashboard
/dashboard/print    → optional print optimized view
```

---

## 12. Environment Variables

Create `.env.example`:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
NEXT_PUBLIC_APP_NAME=Tagihan Listrik Sekolah
```

Security:
- `.env.local` must not be committed.
- Private key must only be used server-side.
- Never expose service account credential to frontend.

---

## 13. Project Checkpoints

### CP0 — Project Setup & Source of Truth
- Create repository.
- Add universal masterplan.
- Add project docs.
- Setup branch workflow.
- Add env example.

### CP1 — Google Sheets Discovery
- Connect Google Sheets API.
- List available sheet tabs.
- Read raw rows.
- Confirm data structure.
- Build sheet adapter.

### CP2 — Foundation UI
- Setup Next.js + Tailwind.
- Create dashboard shell.
- Create layout and navigation.
- Add Framer Motion base transitions.

### CP3 — Billing Table
- Render normalized rows.
- Add search.
- Add status filter.
- Add sheet selector.

### CP4 — Payment Flow
- Detail modal.
- Payment modal.
- Update payment status to Google Sheets.
- Refetch after update.

### CP5 — Reporting
- Summary cards.
- Export PDF.
- Print dashboard.

### CP6 — QA & Deployment
- Test API.
- Test payment updates.
- Test Vercel deploy.
- Write README.
- Final audit.

---

## 14. Definition of Done

MVP is done when:

- `npm run dev` works.
- Dashboard loads.
- App can list sheet tabs.
- App can read selected monthly sheet.
- App can normalize raw spreadsheet data.
- App can display status bayar.
- App can process payment.
- App can update Google Sheets.
- App can export PDF.
- App can print report.
- UI is responsive.
- Framer Motion transitions are active.
- `.env.example` exists.
- README exists.
- No secrets committed.
- Checkpoint docs are updated.

---

## 15. Main Risk

Biggest technical risk:
```txt
Spreadsheet structure is semi-formatted, not clean database-style rows.
```

Mitigation:
- Build adapter first.
- Do not start UI before data normalization works.
- Test with at least latest tab: `Mei 2026 - Tagihan`.
- Keep raw data available in detail modal.

---

## 16. Recommended First Build Order

```txt
1. Setup project
2. Setup Google Sheets API
3. Read tabs
4. Read raw rows
5. Build adapter/normalizer
6. Show data table
7. Add payment update
8. Add PDF/print
9. Polish UI animation
10. Deploy
```
