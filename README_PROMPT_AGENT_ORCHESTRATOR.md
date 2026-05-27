# README_PROMPT_AGENT_ORCHESTRATOR.md

Gunakan prompt ini untuk menjalankan project di AionUi, OpenCode, OpenDesign, OpenClaw, Goose, atau agent orchestrator lain.

---

## MASTER START PROMPT

```txt
Baca dulu file berikut secara berurutan:

1. UNIVERSAL_INTERACTIVE_AGENTIC_MASTERPLAN.md
2. PROJECT_MASTERPLAN.md
3. PROJECT_PRD.md
4. AGENTS.md
5. docs/checkpoints/CHECKPOINT_CURRENT.md

Project yang dikerjakan:
Aplikasi Pembayaran Tagihan Listrik Sekolah.

Worker sekarang:
AI-only.

Ikuti universal interactive flow. Jangan langsung coding sebelum menampilkan checkpoint review.

Setelah review, lanjutkan CP1 — Google Sheets Discovery & Adapter.

Prioritas CP1:
1. Setup Next.js + TypeScript + Tailwind.
2. Setup Google Sheets API server-side.
3. Ambil daftar sheet/tab dari spreadsheet:
   https://docs.google.com/spreadsheets/d/1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE/edit?usp=sharing
4. Baca raw rows dari sheet terbaru: Mei 2026 - Tagihan.
5. Buat adapter/normalizer untuk data semi-terstruktur.
6. Preserve rowNumber asli dari Google Sheets.
7. Tampilkan hasil normalized data di console/API response dulu.
8. Jangan buat payment update sebelum row targeting tervalidasi.
9. Update CHECKPOINT_CURRENT.md setelah selesai.
10. Buat update report di docs/updates/.

Tech stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Google Sheets API
- jsPDF/html2canvas
- lucide-react

Aturan keamanan:
- Jangan commit .env.local
- Jangan expose private key ke frontend
- Jangan hapus/edit struktur spreadsheet
- Jangan update row tanpa sheetName dan rowNumber
```

---

## Jawaban Konsep: Import atau API?

Untuk project ini, pilihan yang benar adalah:

```txt
Konek Google Sheets API untuk sedot data langsung.
```

Bukan import manual.

Alasannya:
- Spreadsheet tetap jadi source utama.
- Data bisa sinkron.
- Status bayar bisa ditulis balik.
- Admin tidak perlu upload ulang data.

Import manual hanya fallback.
