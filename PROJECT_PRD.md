# PROJECT_PRD.md

Project: Aplikasi Pembayaran Tagihan Listrik Sekolah  
Version: 1.0  
Primary User: Admin sekolah / operator pembayaran  
Primary Data Source: Google Sheets

---

## 1. Problem

Data tagihan listrik sekolah saat ini berada di Google Sheets. Admin membutuhkan aplikasi sederhana dengan tampilan lebih rapi untuk:

- Melihat daftar tagihan.
- Mengetahui status sudah/belum bayar.
- Melihat tanggal jatuh tempo jika tersedia.
- Memproses pembayaran.
- Mencetak laporan.
- Export laporan PDF.

Spreadsheet tetap dipakai sebagai sumber utama, sehingga aplikasi harus sinkron dengan Google Sheets.

---

## 2. Goal

Membuat dashboard pembayaran tagihan listrik sekolah yang:

- Mudah dipakai.
- Responsive.
- Terhubung ke Google Sheets API.
- Bisa update status bayar ke spreadsheet.
- Bisa export PDF dan print.
- Punya UI bersih dan premium.

---

## 3. Users

### Admin Sekolah
Kebutuhan:
- Cek tagihan per bulan.
- Cek status pembayaran.
- Proses pembayaran.
- Cetak bukti/laporan.

### Owner / Kepala Sekolah
Kebutuhan:
- Melihat ringkasan tagihan.
- Melihat total sudah/belum bayar.
- Export laporan.

---

## 4. Functional Requirements

### FR-001 — Sheet Tab Selector
App harus bisa mengambil daftar tab dari Google Sheets dan menampilkannya sebagai dropdown.

Acceptance:
- User bisa memilih tab bulanan.
- Default tab adalah tab terbaru jika tersedia.

### FR-002 — Read Billing Data
App harus membaca data dari sheet aktif.

Acceptance:
- Semua row data valid tampil.
- Row kosong tidak merusak tampilan.
- Row kategori/separator tidak dianggap tagihan utama kecuali perlu ditampilkan sebagai kategori.

### FR-003 — Normalize Spreadsheet Data
App harus menormalisasi data dari spreadsheet semi-terstruktur.

Acceptance:
- Bisa mendeteksi status bayar.
- Bisa mendeteksi deskripsi/nama.
- Bisa mendeteksi ID/nomor pelanggan jika tersedia.
- Bisa mendeteksi nominal tagihan.
- Bisa mendeteksi toko/metode/channel jika tersedia.
- Bisa menyimpan raw data per row.

### FR-004 — Billing Table
App harus menampilkan tabel dinamis.

Acceptance:
- Kolom mengikuti data spreadsheet.
- Ada status badge.
- Bisa search.
- Bisa filter status.
- Responsive di desktop dan mobile.

### FR-005 — Billing Detail
User dapat klik row untuk melihat detail.

Acceptance:
- Semua field raw tampil.
- Field penting tampil di bagian atas.
- Ada tombol proses pembayaran.
- Ada tombol print/export detail.

### FR-006 — Payment Processing
Admin bisa memproses pembayaran.

Acceptance:
- Form pembayaran tampil.
- Admin bisa input tanggal bayar, nominal, metode, catatan.
- Setelah submit, Google Sheets terupdate.
- Dashboard refetch otomatis.

### FR-007 — Export PDF
Admin bisa export laporan PDF.

Acceptance:
- Export berdasarkan filter aktif.
- PDF punya header, tanggal export, summary, table.
- Layout rapi.

### FR-008 — Print
Admin bisa print laporan.

Acceptance:
- Button/filter tidak ikut tercetak.
- Area laporan bersih.
- Bisa print dari browser.

---

## 5. Non-Functional Requirements

Performance:
- Dashboard harus terasa cepat.
- Loading state jelas.
- Refetch data 10–15 detik atau manual sync.

Security:
- Google credentials server-side only.
- Env secret tidak masuk client.
- Input API harus divalidasi.
- Tidak ada destructive operation.

UX:
- UI sederhana dan premium.
- Animasi halus.
- Mobile friendly.

Maintainability:
- Adapter dipisah dari UI.
- API routes dipisah.
- Types jelas.
- README lengkap.

---

## 6. MVP User Flow

```txt
Admin buka dashboard
→ pilih bulan/sheet
→ data ditarik dari Google Sheets
→ admin cari/filter tagihan
→ admin buka detail
→ admin proses pembayaran
→ status di spreadsheet berubah
→ dashboard refresh
→ admin export PDF / print
```

---

## 7. Data Requirements

Source:
```txt
Google Sheets: Tagihan Listrik Sekolahan
Spreadsheet ID: 1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE
```

Required detected fields:
- status pembayaran
- deskripsi / nama
- nomor pelanggan / ID
- nominal tagihan
- channel/toko/metode jika tersedia
- cetak/print flag jika tersedia
- tanggal jatuh tempo jika tersedia

Fallback:
- Jika field tidak terdeteksi, tampilkan raw data apa adanya.

---

## 8. Business Rules

1. Google Sheet adalah source of truth.
2. App tidak boleh menghapus row.
3. App tidak boleh membuat kolom baru otomatis.
4. App hanya boleh update row target.
5. Status TRUE dianggap sudah bayar.
6. Status FALSE dianggap belum bayar.
7. Tanggal jatuh tempo hanya dihitung jika kolom tersedia.
8. Jika data tidak lengkap, app tetap harus menampilkan raw detail.
9. Semua update harus memberi feedback sukses/gagal.
10. Setelah update, app wajib refetch data.

---

## 9. Edge Cases

- Header tidak berada di row pertama.
- Ada row kategori seperti LISTRIK/TELKOM.
- Ada row kosong.
- Ada nominal kosong.
- Ada status TRUE/FALSE.
- Ada status berupa teks.
- Ada duplicate sheet name dengan suffix.
- Ada sheet lama dan sheet baru.
- Google Sheets API rate limit.
- Service account belum punya akses.

---

## 10. Success Metrics

- Admin bisa memproses pembayaran tanpa edit manual spreadsheet.
- Laporan bisa dicetak dalam kurang dari 1 menit.
- Tidak ada salah update row.
- Data dashboard sama dengan spreadsheet.
- App dapat digunakan di laptop dan HP.
