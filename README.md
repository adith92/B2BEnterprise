# 🏫⚡ Aplikasi Pembayaran Tagihan Listrik Sekolah SMAN Kas Sekolah ⚡🏫

Selamat datang di **Aplikasi Pembayaran Tagihan Listrik Sekolah SMAN Kas Sekolah**! 🚀 Aplikasi ini adalah dashboard operasional premium yang dirancang khusus untuk mempermudah admin dan bendahara sekolah dalam memantau, mengelola, serta memproses pembayaran tagihan listrik bulanan yang terhubung langsung (live sync) dengan **Google Sheets**! 📊✨

---

## 🎨 Pratinjau Tampilan Cetak Laporan (A4 Portrait)

Aplikasi ini dilengkapi dengan fitur cetak laporan formal yang sangat rapi dan berpresisi tinggi. Berikut adalah pratinjau lembar cetak laporan yang akan dihasilkan ketika dicetak ke kertas A4 atau diekspor ke PDF:

![Pratinjau Cetak Laporan SMAN Kas Sekolah](public/print_layout_preview.png)

---

## 🚀 Fitur Unggulan & Fungsi Lengkap

Aplikasi ini dibuat dengan standar modern yang super canggih untuk memberikan pengalaman pengguna yang luar biasa! Berikut adalah daftar rincian fiturnya:

### 1. ⚡ Live Sync Google Sheets API
* **Fungsi**: Google Sheets bertindak sebagai **Source of Truth** utama. Aplikasi membaca dan menulis data secara real-time langsung dari/ke spreadsheet sekolah tanpa perantara database eksternal.
* **Keamanan**: JWT Authentication dikonfigurasi 100% secara server-side menggunakan library resmi `googleapis`. Private key dan kredensial rahasia lainnya terproteksi aman dan tidak pernah bocor ke sisi frontend.
* **Offline Mock Fallback**: Jika aplikasi dijalankan di komputer lokal dan kunci API belum dipasang, sistem akan otomatis beralih ke mode **Simulasi Stateful Lokal** menggunakan data tagihan bulan `Mei 2026` sehingga dashboard tetap aktif dan interaktif 100%!

### 2. 🔍 Pemindai Kolom Dinamis & Cerdas (Dynamic Adapter)
* **Fungsi**: Menyaring baris spreadsheet yang semi-terstruktur (seperti adanya header kosong atau baris sub-kategori).
* **Fleksibilitas**: Sistem memindai kolom menggunakan pencarian kata kunci (*keywords*) case-insensitive (contoh: `'Sudah'`, `'Status'`, `'Lunas'`, `'Tagihan'`, `'Nominal'`) sehingga layout tabel tetap terbaca dengan sempurna meskipun admin sekolah menyisipkan kolom baru.
* **Preserved rowNumber**: Mengunci nomor baris asli dari Google Sheets agar proses pembaruan status kelunasan cell-by-cell tepat sasaran dan aman dari risiko drift data.

### 3. 📊 Dashboard Ringkasan Kas yang Premium
* **Total Nilai Tagihan Card 💙**: Akumulasi total biaya tagihan listrik sekolah pada bulan berjalan.
* **Dana Sudah Terbayar Card 💚**: Total dana kas sekolah yang sudah sukses diselesaikan/dibayarkan ke PLN.
* **Tunggakan Pending Card 💛**: Jumlah tagihan yang masih menunggak dan harus segera dilunasi.
* **Persentase Kelunasan Card 💜**: Visual progress bar interaktif dengan animasi smooth dari Framer Motion yang menampilkan persentase penyelesaian kas.

### 4. 🎛️ Bar Kontrol Pintar
* **Bulan/Tab Selector Dropdown 📅**: Dropdown dinamis pemilih bulan yang otomatis terhubung untuk memuat tab sheet yang berbeda di Google Sheets.
* **Pencarian Deskripsi Real-Time 🔍**: Memfilter baris tagihan secara instan berdasarkan nama ruangan atau kategori.
* **Tab Status Filter 🏷️**: Memfilter daftar tagihan secara cepat ("Semua", "Lunas", "Pending").

### 5. 📱 Layout Ganda Sangat Responsif
* **Desktop Grid View 💻**: Tampilan tabel minimalis modern dengan hover highlight micro-animations dan penanda badge status pembayaran yang berwarna lembut.
* **Mobile Card View 📱**: Tampilan daftar kartu kompak yang super rapi khusus ketika diakses melalui handphone.

### 6. 🛒 Alur Pembayaran & Detail Tagihan Interaktif
* **Interactive Side Drawer 📋**: Klik baris tagihan langsung menampilkan detail lengkap ruangan, tanggal jatuh tempo, nominal, dan seluruh kolom asli dari spreadsheet secara transparan.
* **Dynamic Payment Toggler 🔄**: Tombol aksi dinamis **"Tandai Sudah Lunas"** (hijau/emerald) atau **"Tandai Belum Bayar"** (kuning/amber) untuk meng-update status ke Google Sheets seketika.
* **Safety Loading Indicator ⏳**: Menampilkan animasi spinner saat API memproses pembaruan untuk mencegah klik ganda.
* **Aesthetic Toast Alerts 🔔**: Visual toast melayang super estetik di atas layar dengan pesan santai bernada positif:
  * *“Mantap bro, status pembayaran berhasil diperbarui jadi LUNAS! 🚀”*
  * *“Mantap bro, status pembayaran berhasil diubah jadi PENDING! 🕒”*

### 7. 📄 Lembar Laporan Cetak & PDF Formal
* **Print Styles `@media print` 🖨️**: Otomatis menyembunyikan semua tombol, search bar, dropdown filter, toast, dan detail drawer saat browser mencetak halaman.
* **Kop Surat Resmi Sekolah 🏫**: Memunculkan kop surat SMA Negeri Kas Sekolah resmi lengkap dengan crest sekolah, nama yayasan, detail kontak, serta nama laporan formal periode bulan tagihan yang sedang dicetak.
* **Signature Blocks ✍️**: Menyematkan area tanda tangan resmi di bagian paling bawah lembar laporan untuk **Bendahara Sekolah** dan **Kepala Sekolah** lengkap dengan NIP masing-masing.

---

## 🛠️ Panduan Instalasi Lokal

### 1. Kloning Proyek & Pasang Dependencies
Buka terminal di direktori proyek ini, lalu jalankan:
```bash
npm install
```

### 2. Duplikasi Berkas Environment
Buat berkas `.env.local` di direktori root dengan menduplikasi dari berkas `.env.example`:
```bash
cp .env.example .env.local
```

---

## 🔑 Panduan Setup Google Sheets API

Ikuti langkah mudah di bawah ini untuk menghubungkan aplikasi Anda dengan spreadsheet Google Sheets riil:

1. Buka [Google Cloud Console](https://console.cloud.google.com/) dan buat proyek baru.
2. Aktifkan **Google Sheets API** untuk proyek Anda.
3. Masuk ke **APIs & Services > Credentials**, buat **Service Account**, lalu unduh kunci rahasia dalam format **JSON Key**.
4. Buka spreadsheet Google Sheets Anda, klik **Share (Bagikan)** di kanan atas, masukkan email Service Account tadi, set akses sebagai **Editor**, lalu simpan.
5. Buka berkas `.env.local` Anda dan isi parameter kredensialnya:

```env
GOOGLE_SHEETS_SPREADSHEET_ID="[ISI_DENGAN_ID_SPREADSHEET_ANDA]"
GOOGLE_SHEETS_CLIENT_EMAIL="[ISI_DENGAN_EMAIL_SERVICE_ACCOUNT]"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[ISI_DENGAN_PRIVATE_KEY_JSON_ANDA]\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_APP_NAME="Tagihan Listrik Sekolah"
```

---

## 💻 Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)
Jalankan dev server dengan perintah:
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### Validasi Build Produksi
Untuk menguji performa dan kompilasi produksi Next.js secara optimal:
```bash
npm run build
npm run start
```

---

## ☁️ Cara Deployment ke Cloud (Vercel)

Next.js terintegrasi secara sempurna dengan platform cloud [Vercel](https://vercel.com). Ikuti langkah kilat berikut:

1. Buat akun di [Vercel](https://vercel.com) (Gratis).
2. Hubungkan repositori GitHub Anda dengan Vercel.
3. Klik **Import Project** pada repositori aplikasi ini.
4. Pada bagian **Environment Variables** di halaman setup Vercel, masukkan 4 variabel rahasia yang sama dengan isi `.env.local` Anda:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY` (Pastikan format baris baru `\n` terbawa utuh)
   - `NEXT_PUBLIC_APP_NAME`
5. Klik **Deploy**! Aplikasi Anda langsung online dan bisa diakses oleh admin sekolah kapan saja di mana saja.
