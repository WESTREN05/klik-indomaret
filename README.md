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

1. Buka folder `C:\klik-indomaret` di VS Code.
2. Tekan `Ctrl+Shift+B`, atau buka **Terminal → Run Task → Klik Indomaret: Start PHP Server**.
3. Buka `http://127.0.0.1:8000/` di browser.
4. Cek backend di `http://127.0.0.1:8000/api/health.php`.

Task VS Code menjalankan `start-php.ps1`. Script itu mencari PHP dari `PATH`, Laragon, XAMPP, atau `C:\php`, lalu menyalakan PHP built-in server di port `8000`.

### Manual lewat terminal

```powershell
cd C:\klik-indomaret
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

## Cara menjalankan mode statis (fallback)

Kalau hanya ingin melihat tampilan tanpa PHP:

```powershell
cd C:\klik-indomaret
python -m http.server 8123 --bind 127.0.0.1
```

Buka `http://127.0.0.1:8123/index.html`.

Bisa juga memakai **VS Code Live Server** atau membuka `index.html` langsung lewat `file://`. Di mode ini auth, pesanan, voucher, dan profil otomatis memakai `localStorage` karena endpoint PHP tidak tersedia.

> Mode statis hanya untuk preview tampilan di komputer sendiri. Python/Live Server tidak mengeksekusi PHP dan tidak membaca `.htaccess`, jadi jangan memakai mode ini untuk mengakses project dari jaringan publik.

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
- **Keranjang:** pilih semua/sebagian, stepper jumlah, hapus item, ganti alamat/toko, voucher (Gratis Ongkir, Diskon Gajian 40%, Member Baru), tukar poin, ringkasan diskon, metode pembayaran QRIS/Transfer/COD, halaman sukses.
- **Auth:** login, register dengan validasi, lupa password (mock), show/hide password, session PHP, redirect ke halaman tujuan.
- **Akun:** edit profil, riwayat pesanan dari server, pengaturan, bantuan, tentang aplikasi, logout tanpa menghapus keranjang.
- **Promo:** klaim voucher, status klaim tersimpan di server (atau `localStorage` saat mode statis), grid produk promo.
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
- `php/data/catalog.json` — hasil generate dari `js/data.js` + `js/products.js` (27 produk, 4 voucher).
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
│   └── style.css
├── js/
│   ├── api.js                      # jembatan fetch ke PHP + fallback
│   ├── data.js                     # produk, kategori, toko, alamat, banner, voucher
│   ├── app.js                      # mesin bersama: cart, auth, header, nav, sheet, toast
│   ├── home.js
│   ├── kategori.js
│   ├── produk.js
│   ├── keranjang.js
│   ├── login.js
│   ├── akun.js
│   └── promo.js
├── assets/
│   └── products/                   # tempat foto produk (lihat di bawah)
├── docs/
│   └── waterfall.md                # dokumentasi tugas
└── README.md
```

---

## Data dan reset

### Reset data PHP

Hentikan server, lalu hapus file runtime:

```powershell
Remove-Item php\data\users.json, php\data\orders.json, php\data\voucher_claims.json -Force
```

Jalankan server lagi. Akun demo dan file kosong akan dibuat ulang otomatis. `php/data/catalog.json` jangan dihapus karena berisi katalog produk.

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

Saat ini produk memakai **emoji + gradient** sebagai placeholder. Kalau foto produk dari desain sudah tersedia, simpan file JPEG di:

```text
assets/products/<id-produk>.jpg
```

Contoh:

```text
assets/products/sania-2l.jpg
assets/products/indomie-goreng.jpg
assets/products/ultra-1l.jpg
```

Nama file harus sama dengan `id` produk di `js/products.js`. Setelah file dimasukkan, gambar akan otomatis menggantikan emoji tanpa mengubah kode.

Daftar id produk ada di `js/products.js` (mulai dari `sania-2l`, `indomie-goreng`, `ultra-1l`, dan seterusnya). Selama gambar belum ada, browser bisa mencatat 404 untuk `assets/products/*.jpg` di console — ini normal dan tidak memengaruhi fungsi aplikasi.

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

## Catatan pengembangan

- **Mode PHP vs statis:** halaman yang dirender lewat PHP menyuntikkan `window.KLIK_BOOTSTRAP`. Frontend memakai API hanya jika marker `php: true` ada; halaman statis langsung memakai `localStorage`.
- **Session:** cookie `klik_session`, password disimpan sebagai hash `password_hash`, bukan teks biasa.
- **Keamanan:** ini prototype untuk tugas, bukan aplikasi produksi. Data JSON diblokir dari akses langsung lewat router dan `.htaccess`. Untuk produksi tetap perlu HTTPS, CSRF token, rate limiting, dan database relasional.
- **Font:** Google Fonts (Plus Jakarta Sans). Tanpa internet, browser memakai font fallback.
- **Desain responsif:** ponsel memakai app shell maksimal 480px; tablet (≥768px) melebar ke 760px dengan grid 3 kolom; desktop (≥1024px) memakai shell 1180px, navigasi di atas, grid produk 3–4 kolom, keranjang dua kolom dengan ringkasan sticky, dan halaman login split-screen.

---

Dibuat untuk tugas kuliah. Desain referensi: Google Stitch. Prototype ini tidak berafiliasi resmi dengan PT Indomarco Prismatama.
