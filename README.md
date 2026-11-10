# Klik Indomaret — Prototype Web App + PHP API

Prototype aplikasi belanja kebutuhan harian **Klik Indomaret** untuk tugas kuliah. Frontend memakai HTML, CSS, dan JavaScript murni (tanpa build tools), sedangkan backend memakai **PHP 8 + penyimpanan JSON** sehingga tidak perlu setup MySQL. Alur pengembangan mengikuti metode **Waterfall**.

Tampilan mobile-first dengan app shell selebar maksimal **480px**, terdiri dari 7 halaman:

| Halaman | File HTML | Wrapper PHP | Isi utama |
| --- | --- | --- | --- |
| Beranda | `index.html` | `index.php` | Alamat, pencarian, mode antar/ambil, saldo & poin, promo, kategori, flash sale, produk populer |
| Kategori | `kategori.html` | `kategori.php` | Katalog, pencarian, filter harga, urutan, promo JSM, ready di toko |
| Detail Produk | `produk.html` | `produk.php` | Galeri, harga, varian, info toko, pengiriman, tab deskripsi/gizi/sertifikasi, produk terkait |
| Keranjang | `keranjang.html` | `keranjang.php` | Pilih produk, atur jumlah, voucher, tukar poin, ringkasan, checkout, halaman sukses |
| Masuk / Daftar | `login.html` | `login.php` | Login, register, lupa password, show/hide password, akun demo |
| Akun | `akun.html` | `akun.php` | Profil, saldo/poin/stamp, pesanan, alamat, pengaturan, bantuan, logout |
| Promo | `promo.html` | `promo.php` | Klaim voucher, daftar produk harga spesial JSM |

> File `.html` tetap ada supaya project bisa dibuka sebagai situs statis. Saat dijalankan lewat PHP, router mengarahkan halaman `.html` ke `php/page.php` agar session login ikut terbaca.

---

## Cara menjalankan (PHP + VS Code) — disarankan

1. Buka folder `D:\klik-indomaret` di VS Code.
2. Tekan `Ctrl+Shift+B`, atau buka **Terminal → Run Task → Klik Indomaret: Start PHP Server**.
3. Buka `http://127.0.0.1:8000/` di browser.
4. Cek backend di `http://127.0.0.1:8000/api/health.php`.

Task VS Code menjalankan `start-php.ps1`. Script itu mencari PHP dari `PATH`, Laragon, XAMPP, atau `C:\php`, lalu menyalakan PHP built-in server di port `8000`.

### Manual lewat terminal

```powershell
cd D:\klik-indomaret
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-php.ps1
```

Port lain:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-php.ps1 -Port 8001
```

Kalau PHP tidak terdeteksi, edit daftar path di `start-php.ps1` atau tambahkan PHP ke `PATH`. Contoh path Laragon yang dipakai di mesin ini:

```text
C:\laragon\bin\php\php-8.2.21-nts-Win32-vs16-x64\php.exe
```

---

## Menjalankan manual lewat PHP

Selalu jalankan project lewat router PHP:

```powershell
cd D:\klik-indomaret
php -S localhost:8000 router.php
```

Buka `http://127.0.0.1:8000/`.

> **Peringatan:** jangan menjalankan project ini lewat server statis (mis. `python -m http.server`, Live Server, atau `file://`) karena data JSON akan terbuka. Server statis menyajikan seluruh isi folder apa adanya sehingga `php/data/*.json` — berisi akun, pesanan, dan klaim voucher — bisa diunduh siapa saja. Router PHP memblokir `php/`, dotfile, dan endpoint privat.

---

## Akun demo

- **Nomor HP:** `081234567890`
- **Password:** `password123`

Atau tekan tombol **Isi otomatis** di halaman login.

### Mode demo cepat

Tambahkan `?demo=1` di URL untuk mengisi keranjang dan akun demo otomatis:

```text
http://127.0.0.1:8000/?demo=1
http://127.0.0.1:8000/keranjang.html?demo=1
http://127.0.0.1:8000/akun.html?demo=1
```

Isi keranjang demo: Sania Minyak Goreng 2L ×1, Ultra Milk 1L ×2, Indomie Ayam Bawang 5 pcs ×5.

---

## Fitur yang sudah jalan

- **Beranda:** banner promo, kategori, flash sale dengan countdown, produk populer, pencarian, top up saldo, ganti alamat/toko.
- **Katalog:** pencarian real-time, filter harga min/max, urutan (terpopuler, harga, rating), filter promo JSM & ready, cart bar.
- **Detail produk:** pilih varian, pilih express/ambil di toko, ganti toko, galeri warna, tab informasi, wishlist, share, tambah ke keranjang, beli sekarang.
- **Keranjang:** pilih semua/sebagian, stepper jumlah, hapus item, ganti alamat/toko, empat voucher (Gratis Ongkir, Diskon Gajian 40%, Member Baru, Sabtu Meriah), tukar poin, ringkasan diskon, metode pembayaran QRIS/Transfer/COD, halaman sukses.
- **Auth:** login, register dengan validasi, lupa password (mock), show/hide password, session PHP, redirect ke halaman tujuan.
- **Akun:** edit profil, riwayat pesanan dari server, pengaturan, bantuan, tentang aplikasi, logout tanpa menghapus keranjang.
- **Promo:** klaim voucher, tombol **Pakai** untuk langsung menerapkan voucher yang sudah diklaim ke keranjang, status klaim tersimpan di server (atau `localStorage` saat mode statis), grid produk promo.
- **Checkout server-side:** total pesanan, diskon voucher, ongkir, poin, dan poin yang didapat dihitung ulang oleh PHP.
- **Top up saldo:** saldo tersimpan di akun PHP saat server aktif.

---

## Arsitektur PHP

```text
Browser
  ├── HTML/CSS/JS (7 halaman)
  ├── js/api.js  ──────────────►  /api/*.php
  └── localStorage (cache + fallback)
                                      │
                                      ▼
                              php/bootstrap.php
                              php/lib/*.php
                                      │
                                      ▼
                              php/data/*.json
```

- `router.php` — front controller PHP built-in server. Mengarahkan `/api/*`, `/`, URL bersih, dan halaman `.html` ke PHP; aset statis dilayani langsung. Folder `php/data/` diblokir dari browser.
- `php/page.php` — membaca template HTML, menyuntikkan `window.KLIK_BOOTSTRAP` (user + voucher yang sudah diklaim), lalu mengirim halaman.
- `php/bootstrap.php` — session `klik_session`, helper JSON, seeding akun demo, error handling.
- `php/lib/store.php` — baca/tulis JSON dengan `flock` dan penulisan atomik.
- `php/lib/auth.php` — register, login, logout, profil, klaim voucher.
- `php/lib/catalog.php` — katalog produk & voucher untuk validasi pesanan.
- `php/lib/order.php` — bentuk order yang dikirim ke frontend.
- `php/data/catalog.json` — hasil generate dari `js/data.js` + `js/products.js` (27 produk, 4 voucher, aturan voucher, dan settings ongkir/poin). Jangan diedit manual: ubah data di JS lalu jalankan `npm run build:catalog`.
- `php/data/users.json`, `orders.json`, `voucher_claims.json` — data runtime; dibuat otomatis saat pertama dijalankan.

### Endpoint API

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/health.php` | Cek status server, PHP, dan penyimpanan |
| GET | `/api/auth.php?action=me` | Ambil user dari session |
| POST | `/api/auth.php?action=login` | Login dengan nomor HP/email + password |
| POST | `/api/auth.php?action=register` | Daftar akun baru |
| POST | `/api/auth.php?action=logout` | Hapus session |
| POST | `/api/auth.php?action=forgot` | Kirim tautan reset (mock) |
| GET | `/api/orders.php` | Daftar pesanan user |
| POST | `/api/orders.php` | Buat pesanan; total dihitung ulang di server |
| GET | `/api/vouchers.php` | Daftar voucher + voucher yang diklaim |
| POST | `/api/vouchers.php` | Klaim voucher |
| GET | `/api/profile.php` | Profil + statistik pesanan |
| POST | `/api/profile.php` | Update nama, nomor HP, email |
| POST | `/api/profile.php?action=topup` | Top up saldo |

Semua endpoint mengembalikan JSON `{ ok: true, ... }` atau `{ ok: false, error: "..." }` dengan HTTP status yang sesuai.

---

## Struktur project

```text
klik-indomaret/
├── index.html ... promo.html       # 7 halaman frontend
├── index.php ... promo.php         # wrapper PHP opsional
├── router.php                      # router PHP built-in server
├── start-php.ps1                   # start server + auto-detect PHP
├── .vscode/
│   ├── tasks.json                  # Ctrl+Shift+B = start PHP server
│   └── settings.json               # validasi PHP
├── api/
│   ├── health.php
│   ├── auth.php
│   ├── orders.php
│   ├── vouchers.php
│   └── profile.php
├── php/
│   ├── .htaccess                    # blokir akses langsung (Apache)
│   ├── bootstrap.php
│   ├── page.php
│   ├── lib/
│   │   ├── store.php
│   │   ├── page-boot.php           # skrip bootstrap localStorage
│   │   ├── auth.php
│   │   ├── catalog.php
│   │   └── order.php
│   └── data/
│       ├── catalog.json            # katalog produk & voucher
│       ├── users.json              # dibuat otomatis
│       ├── orders.json             # dibuat otomatis
│       ├── voucher_claims.json     # dibuat otomatis
│       ├── .htaccess               # blokir akses langsung (Apache)
│       └── .gitignore
├── css/
│   ├── base.css                    # token warna, reset, tipografi, utilitas
│   ├── layout.css                  # app shell, topbar, bottom nav
│   ├── components.css              # tombol, chip, badge
│   ├── home.css                    # beranda (termasuk aturan desktop)
│   ├── catalog.css                 # kategori + detail produk (termasuk desktop)
│   ├── cart.css                    # stepper + keranjang (termasuk desktop)
│   ├── account.css                 # login, akun, promo (termasuk desktop)
│   ├── overlays.css                # sheet, toast, sukses, aksesibilitas
│   └── responsive.css              # tablet + desktop untuk shell/komponen bersama
├── js/
│   ├── api.js                      # jembatan fetch ke PHP + fallback
│   ├── data.js                     # kategori, toko, alamat, banner, voucher
│   ├── products.js                 # data 27 produk
│   ├── core.js                     # utilitas, localStorage, ikon, helper data
│   ├── form.js                     # helper error field, validasi kontak, busy state
│   ├── session.js                  # user, alamat, toko, saldo, poin, klaim voucher
│   ├── cart.js                     # operasi keranjang dan badge
│   ├── pricing.js                  # satu sumber total, voucher, ongkir, poin
│   ├── components.js               # header, nav, kartu produk, toast
│   ├── sheets.js                   # bottom sheet dan dialog umum
│   ├── app.js                      # event global + inisialisasi halaman
│   ├── home.js
│   ├── kategori.js
│   ├── produk.js
│   ├── keranjang.js                # state, pemilihan item, render keranjang
│   ├── voucher.js                  # sheet voucher & promo
│   ├── checkout.js                 # sinkronisasi poin + alur checkout
│   ├── payment.js                  # metode bayar + penyelesaian pesanan
│   ├── login-validasi.js           # validasi form masuk dan daftar
│   ├── login-auth.js               # alur submit masuk/daftar + sesi
│   ├── login.js                    # orkestrasi UI halaman login
│   ├── akun-profil.js              # kartu profil, edit profil, logout
│   ├── akun-pesanan.js             # kartu dan daftar riwayat pesanan
│   ├── akun.js                     # orkestrasi halaman akun + menu
│   └── promo.js
├── tools/
│   ├── build-catalog.js            # generate catalog.json dari data.js + products.js
│   ├── check-catalog.js            # cek ID, harga, varian, voucher vs catalog.json
│   ├── check-images.js             # cek nama/format + kelengkapan foto produk
│   ├── test-pricing.js             # 19 kasus uji total, voucher, ongkir, poin
│   ├── test-session.js             # 12 kasus uji logout, voucher, saldo/poin
│   ├── test-api.js                 # 10 kasus uji klasifikasi error API
│   ├── test-page.js                # 3 kasus uji bootstrap localStorage
│   ├── test-promo.js               # 6 kasus uji tombol Pakai voucher
│   ├── test-voucher.php            # 7 kasus uji voucher sekali pakai (server)
│   ├── test-store.php              # 6 kasus uji lock + update JSON atomik
│   ├── test-order.php              # 10 kasus uji merge item & maxQty
│   └── reset-demo.php              # reset akun demo + pesanan + klaim voucher
├── assets/
│   └── products/                   # tempat foto produk (lihat di bawah)
├── docs/
│   └── waterfall.md                # dokumentasi tugas
├── package.json                    # skrip pemeriksaan (khusus dev)
├── eslint.config.js
├── stylelint.config.js
└── README.md
```

---

## Data dan reset

### Reset data PHP

Hentikan server, lalu jalankan:

```bash
npm run reset:demo
```

Perintah ini mengembalikan akun demo (`081234567890` / `password123`), saldo Rp 185.000, dan poin 4.850, serta mengosongkan pesanan dan klaim voucher. `php/data/catalog.json` tidak diubah.

Alternatif manual: hapus tiga file runtime berikut, lalu jalankan server lagi. Akun demo akan dibuat ulang otomatis.

```powershell
Remove-Item php\data\users.json, php\data\orders.json, php\data\voucher_claims.json -Force
```

### Reset data browser

Buka DevTools Console, jalankan:

```js
localStorage.clear();
```

lalu refresh. Kunci penyimpanan memakai prefix `klik_*_v1`.

### Cara kerja penyimpanan

- **Mode PHP:** user, session, pesanan, klaim voucher, saldo, dan poin disimpan di `php/data/*.json`. Frontend tetap memakai `localStorage` sebagai cache agar halaman cepat tampil.
- **Mode statis:** semua data memakai `localStorage`; tidak ada request ke PHP.
- Keranjang, alamat, toko, dan metode pengiriman selalu disimpan di `localStorage` agar tetap ada saat pindah halaman.

---

## Mengganti gambar produk

Produk otomatis memakai foto jika filenya ada; **emoji + gradient** hanya menjadi fallback ketika foto belum tersedia. Simpan file JPEG di:

```text
assets/products/<id-produk>.jpg
```

Contoh:

```text
assets/products/sania-2l.jpg
assets/products/indomie-goreng.jpg
assets/products/ultra-1l.jpg
```

Nama file harus sama dengan `id` produk di `js/products.js`, memakai **huruf kecil** dan ekstensi **`.jpg`**. Setelah file dimasukkan, gambar akan otomatis menggantikan emoji tanpa mengubah kode.

Daftar id produk ada di `js/products.js` (mulai dari `sania-2l`, `indomie-goreng`, `ultra-1l`, dan seterusnya). Saat ini 27 dari 27 foto sudah tersedia. Kalau ada produk baru, beri nama file sesuai `id` produknya; selama foto belum ada, browser bisa mencatat 404 untuk `assets/products/*.jpg` di console — ini normal dan tidak memengaruhi fungsi aplikasi.

Periksa nama, format, dan kelengkapan foto dengan:

```bash
npm run check:images
npm run check:images -- --strict
```

Mode biasa hanya gagal jika ada file yang salah nama/format; foto yang belum ada dilaporkan sebagai INFO. Mode `--strict` juga gagal selama masih ada foto yang belum lengkap. `npm run check` menjalankan mode biasa.

---

## Pemeriksaan otomatis

Dependensi di bawah hanya untuk pengembangan; aplikasi tetap berjalan tanpa build step.

```bash
npm install
npm run check
```

`npm run check` menjalankan berurutan:

- `tools/check-catalog.js` — memastikan ID/kode, harga, varian, dan aturan voucher di `js/data.js` + `js/products.js` cocok dengan `php/data/catalog.json`. Jika beda, jalankan `npm run build:catalog`.
- `tools/check-images.js` — memastikan foto yang ada memakai `<id>.jpg` huruf kecil; foto yang belum ada dilaporkan sebagai INFO.
- `tools/test-pricing.js` — 19 kasus uji total, voucher, ongkir, dan poin (angka demo di `docs/waterfall.md`).
- `tools/test-session.js` — 12 kasus uji status voucher, voucher pilihan lintas halaman, pembersihan data saat logout, keranjang yang dipertahankan, dan sinkronisasi saldo/poin dari server.
- `tools/test-api.js` — 10 kasus uji klasifikasi error API: HTML/non-JSON memakai pesan ramah, pesan JSON tetap dipakai, dan HTML 5xx bukan mode offline.
- `tools/test-voucher.php` — 7 kasus uji aturan voucher sekali pakai di server memakai fixture, tanpa menyentuh `php/data` (butuh PHP CLI).
- `tools/test-store.php` — 6 kasus uji lock reentrant, mutual exclusion antar-proses, dan update JSON atomik (butuh PHP CLI).
- `tools/test-order.php` — 10 kasus uji penggabungan item dan batas `maxQty` (butuh PHP CLI).
- `tools/test-page.js` — 3 kasus uji skrip bootstrap: cache akun dibersihkan saat session habis, sedangkan keranjang dipertahankan.
- `tools/test-promo.js` — 6 kasus uji tombol Pakai: voucher terklaim tersimpan sebagai pilihan, voucher khusus antar otomatis memilih metode express, dan tombol membuka halaman keranjang.
- ESLint untuk `js/` dan `tools/`.
- Stylelint untuk `css/`.

### Satu sumber untuk harga dan voucher

Harga produk, varian, minimal belanja voucher, dan aturan potongan hanya ditulis di `js/products.js` dan `js/data.js` (`SETTINGS` + `VOUCHERS[].rules`). Setelah mengubahnya, jalankan:

```bash
npm run build:catalog
```

Perintah itu membuat ulang `php/data/catalog.json` yang dipakai server untuk menghitung ulang total, jadi harga di browser dan tagihan server tidak bisa berbeda. `npm run check` akan gagal jika keduanya tidak sinkron.

---

## Metode Waterfall

Project ini disusun mengikuti tahapan Waterfall:

1. **Analisis kebutuhan** — menentukan 7 halaman, fitur belanja, auth, keranjang, promo, akun, dan kebutuhan backend PHP.
2. **Desain** — mengacu pada desain Google Stitch (Beranda, Kategori, Detail Produk, Keranjang) lalu menambahkan halaman Login, Akun, dan Promo.
3. **Implementasi** — HTML/CSS/JS murni, komponen bersama di `app.js`, data di `data.js`, backend PHP + JSON, dan bridge `api.js`.
4. **Pengujian** — uji alur tambah ke keranjang, pencarian/filter, login/register, voucher, poin, checkout, pesanan, logout, API, dan tampilan tiap halaman.
5. **Pemeliharaan** — perbaikan bug, penyesuaian UI, reset data, dan penyiapan dokumentasi.

Dokumentasi Waterfall yang lebih lengkap (latar belakang, kebutuhan fungsional/non-fungsional, rancangan, pengujian, kesimpulan) tersedia di [`docs/waterfall.md`](docs/waterfall.md). Isi bagian identitas (nama, NIM, mata kuliah, dosen) sebelum dikumpulkan.

---

## Keterbatasan yang diketahui

Prototype ini dibuat untuk tugas kuliah, bukan untuk produksi. Keterbatasan yang masih ada:

- **Tanpa CSRF token:** endpoint yang mengubah data mengandalkan cookie session tanpa token anti-CSRF.
- **Tanpa rate limiting:** percobaan login, klaim voucher, dan checkout belum dibatasi jumlahnya.
- **Penyimpanan JSON hanya untuk demo:** `php/data/*.json` mudah dibaca/ditulis dan tidak cocok untuk data produksi berskala besar; gunakan database relasional untuk produksi.
- **Belum ada tes end-to-end:** pengujian otomatis saat ini berupa unit test JS/PHP dan pemeriksaan data; alur browser lengkap masih diuji manual.

---

## Catatan pengembangan

- **Mode PHP vs statis:** halaman yang dirender lewat PHP menyuntikkan `window.KLIK_BOOTSTRAP`. Frontend memakai API hanya jika marker `php: true` ada; halaman statis langsung memakai `localStorage`.
- **Session:** cookie `klik_session`, password disimpan sebagai hash `password_hash`, bukan teks biasa.
- **Keamanan:** ini prototype untuk tugas, bukan aplikasi produksi. Data JSON diblokir dari akses langsung lewat router dan `.htaccess`. Untuk produksi tetap perlu HTTPS, CSRF token, rate limiting, dan database relasional.
- **Font:** Google Fonts (Plus Jakarta Sans). Tanpa internet, browser memakai font fallback.
- **Desain responsif:** ponsel memakai app shell maksimal 480px; tablet (≥768px) melebar ke 760px dengan grid 3 kolom; desktop (≥1024px) memakai shell 1180px, navigasi di atas, grid produk 3–4 kolom, keranjang dua kolom dengan ringkasan sticky, dan halaman login split-screen.

---

Dibuat untuk tugas kuliah. Desain referensi: Google Stitch. Prototype ini tidak berafiliasi resmi dengan PT Indomarco Prismatama.
