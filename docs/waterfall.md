# Dokumentasi Proyek — Klik Indomaret Prototype

**Mata Kuliah:** [isi mata kuliah]  
**Nama:** [isi nama mahasiswa]  
**NIM:** [isi NIM]  
**Dosen:** [isi nama dosen]  
**Metode:** Waterfall  
**Tahun:** 2026

---

## 1. Pendahuluan

### 1.1 Latar belakang

Belanja kebutuhan harian di minimarket masih sering dilakukan secara langsung. Pada jam sibuk, antrean di kasir dan keterbatasan waktu menjadi kendala, terutama bagi mahasiswa dan pekerja yang memiliki mobilitas tinggi. Aplikasi belanja seperti Klik Indomaret menawarkan solusi pesan antar dan ambil di toko, tetapi belum semua pengguna memahami alur pemesanan, pemilihan promo, dan perhitungan biaya pengiriman.

Proyek ini membuat **prototype aplikasi web Klik Indomaret** yang meniru alur belanja tersebut. Fokusnya adalah pengalaman pengguna: memilih produk, mengatur keranjang, memakai voucher, menukar poin, memilih pengiriman, dan menyelesaikan checkout. Frontend dibuat dengan HTML, CSS, dan JavaScript murni agar mudah dipahami dan dipresentasikan, sedangkan backend memakai **PHP 8** dengan penyimpanan JSON agar tidak memerlukan setup MySQL.

### 1.2 Rumusan masalah

1. Bagaimana merancang antarmuka aplikasi belanja kebutuhan harian yang mudah digunakan di perangkat mobile?
2. Bagaimana mengimplementasikan alur keranjang, voucher, poin, dan checkout pada aplikasi web?
3. Bagaimana menyimpan data pengguna, keranjang, dan pesanan agar tetap ada saat halaman dimuat ulang?
4. Bagaimana menyediakan backend PHP sederhana yang bisa dijalankan dari VS Code tanpa database server?
5. Bagaimana memastikan aplikasi berjalan sesuai kebutuhan melalui pengujian?

### 1.3 Tujuan

1. Membangun prototype Klik Indomaret dengan 7 halaman utama.
2. Mengimplementasikan alur belanja dari beranda sampai pesanan berhasil.
3. Menyediakan fitur login, daftar, lupa password, dan profil pengguna.
4. Menyediakan backend PHP + JSON untuk auth, pesanan, voucher, profil, dan top up.
5. Menjaga frontend tetap bisa berjalan statis dengan fallback `localStorage`.
6. Menguji setiap fitur utama dan mendokumentasikan hasilnya.

### 1.4 Manfaat

- **Bagi pengguna:** gambaran pengalaman belanja online yang cepat dan sederhana.
- **Bagi penulis:** latihan menerapkan metode Waterfall dari analisis sampai pengujian.
- **Bagi pembaca:** referensi prototype aplikasi belanja berbasis web tanpa framework.

### 1.5 Batasan masalah

- Aplikasi berupa **prototype**, bukan sistem produksi.
- Backend memakai PHP built-in server + file JSON, bukan database relasional.
- Tidak ada pembayaran nyata, pengiriman nyata, atau integrasi payment gateway.
- Data runtime PHP disimpan di `php/data/*.json`; keranjang dan preferensi tetap di `localStorage`.
- Produk dan harga bersifat contoh.
- Foto produk masih berupa placeholder emoji sampai aset desain dimasukkan.
- Akun demo: `081234567890` / `password123`. Register tetap bisa membuat akun baru.

---

## 2. Metode Waterfall

Metode Waterfall adalah model pengembangan perangkat lunak yang berjalan berurutan. Setiap tahap diselesaikan sebelum masuk ke tahap berikutnya.

```text
Analisis Kebutuhan
        ↓
       Desain
        ↓
    Implementasi
        ↓
     Pengujian
        ↓
   Pemeliharaan
```

### 2.1 Analisis kebutuhan

Mengidentifikasi halaman, fitur, aktor, dan kebutuhan data. Hasilnya berupa daftar kebutuhan fungsional dan non-fungsional (bagian 3).

### 2.2 Desain

Menentukan struktur halaman, navigasi, komponen UI, dan alur pengguna. Desain mengacu pada referensi Google Stitch untuk Beranda, Kategori, Detail Produk, dan Keranjang, lalu dilengkapi halaman Login, Akun, dan Promo agar alur terasa lengkap.

### 2.3 Implementasi

Membangun antarmuka dengan HTML dan CSS, lalu menambahkan logika dengan JavaScript. Data produk dipisahkan di `js/products.js`, data statis lain di `js/data.js`, dan logika bersama dipecah menjadi `js/core.js`, `js/session.js`, `js/cart.js`, `js/components.js`, `js/sheets.js`, serta `js/app.js` untuk event global dan inisialisasi. Backend PHP ditambahkan di folder `api/` dan `php/`, dengan `js/api.js` sebagai jembatan fetch dan fallback ke `localStorage`.

### 2.4 Pengujian

Menguji setiap fitur utama secara manual dan dengan bantuan browser automation. Hasil pengujian dicatat pada bagian 6.

### 2.5 Pemeliharaan

Melakukan perbaikan bug dan penyesuaian tampilan, misalnya:
- memperbaiki posisi indikator galeri produk,
- menyinkronkan mode pengiriman beranda dengan keranjang,
- memperbarui tampilan toko setelah toko diganti,
- menambahkan padding agar konten tidak tertutup cart bar.

---

## 3. Analisis Kebutuhan

### 3.1 Aktor

| Aktor | Peran |
| --- | --- |
| Pengunjung | Melihat beranda, katalog, detail produk, promo, dan keranjang tanpa login |
| Member | Login, mengelola profil, memakai poin, checkout, dan melihat pesanan |
| Sistem | Menyimpan data ke PHP JSON / `localStorage`, menghitung total, dan menampilkan notifikasi |

### 3.2 Kebutuhan fungsional

| Kode | Kebutuhan | Halaman |
| --- | --- | --- |
| FR-01 | Menampilkan alamat, toko, pencarian, saldo, poin, dan stamp | Beranda |
| FR-02 | Menampilkan banner promo, kategori, flash sale, dan produk populer | Beranda |
| FR-03 | Mencari produk berdasarkan nama, merek, atau kategori | Beranda, Kategori |
| FR-04 | Memfilter produk berdasarkan harga, promo JSM, dan ready di toko | Kategori |
| FR-05 | Mengurutkan produk berdasarkan popularitas, harga, dan rating | Kategori |
| FR-06 | Menampilkan detail produk, varian, toko, dan metode pengiriman | Detail Produk |
| FR-07 | Menambahkan produk ke keranjang dan mengubah jumlah | Semua halaman produk |
| FR-08 | Memilih sebagian/semua produk dan menghapus produk | Keranjang |
| FR-09 | Memakai voucher dan menukar poin | Keranjang |
| FR-10 | Memilih pengiriman express atau ambil di toko | Beranda, Detail, Keranjang |
| FR-11 | Checkout dengan QRIS, transfer bank, atau COD | Keranjang |
| FR-12 | Login, daftar, lupa password, dan show/hide password | Login |
| FR-13 | Melihat dan mengedit profil, alamat, serta pengaturan | Akun |
| FR-14 | Melihat riwayat pesanan | Akun |
| FR-15 | Klaim voucher promo | Beranda, Promo |
| FR-16 | Logout tanpa menghapus keranjang | Akun |
| FR-17 | Menampilkan halaman sukses setelah checkout | Keranjang |

### 3.3 Kebutuhan non-fungsional

| Kode | Kebutuhan |
| --- | --- |
| NFR-01 | Tampilan mobile-first (maks. 480px), layout tablet ≥768px (shell 760px, grid 3 kolom), dan desktop ≥1024px (shell 1180px, navigasi atas, grid 3–4 kolom, keranjang dua kolom) |
| NFR-02 | Navigasi konsisten melalui bottom navigation |
| NFR-03 | Waktu muat cepat karena tidak memakai framework atau build step |
| NFR-04 | Data tersimpan di PHP JSON dan tetap ada setelah refresh |
| NFR-05 | Validasi input pada form login, register, dan profil |
| NFR-06 | Umpan balik berupa toast, sheet, dan status tombol |
| NFR-07 | Kode terstruktur per halaman dan mudah dipelajari |
| NFR-08 | Dapat dijalankan dengan PHP built-in server dari VS Code |
| NFR-09 | Password disimpan sebagai hash, bukan teks biasa |
| NFR-10 | Frontend tetap bisa dipakai tanpa PHP (fallback `localStorage`) |

### 3.4 Kebutuhan data

Data produk bersifat statis di `js/products.js`; kategori, toko, alamat, banner, dan voucher ada di `js/data.js`. Salinannya untuk validasi server ada di `php/data/catalog.json`. Data pengguna dan transaksi disimpan di PHP JSON saat server aktif, dengan cache di `localStorage`:

| File PHP | Isi |
| --- | --- |
| `php/data/users.json` | Akun, hash password, saldo, poin |
| `php/data/orders.json` | Pesanan beserta item, total, dan status |
| `php/data/voucher_claims.json` | Voucher yang diklaim tiap user |
| `php/data/catalog.json` | Katalog produk & voucher untuk validasi |

Key `localStorage` yang dipakai frontend:

| Key | Isi |
| --- | --- |
| `klik_cart_v1` | Daftar item keranjang |
| `klik_user_v1` | Profil pengguna yang login |
| `klik_orders_v1` | Riwayat pesanan |
| `klik_address_v1` | Alamat aktif |
| `klik_store_v1` | Toko aktif |
| `klik_saldo_v1` | Saldo pengguna |
| `klik_points_v1` | Poin pengguna |
| `klik_claimed_v1` | Voucher yang sudah diklaim |
| `klik_delivery_v1` | Metode pengiriman aktif |

---

## 4. Perancangan

### 4.1 Struktur halaman

```text
Beranda (index.html)
├── Kategori (kategori.html)
│   └── Detail Produk (produk.html)
│       └── Keranjang (keranjang.html)
├── Promo (promo.html)
├── Akun (akun.html)
│   └── Login / Daftar (login.html)
└── Keranjang (keranjang.html)
```

### 4.2 Navigasi utama

Bottom navigation memiliki lima menu: **Beranda, Kategori, Promo, Keranjang, Akun**. Halaman Detail Produk memakai header dengan tombol kembali dan tidak menampilkan bottom navigation agar fokus pada produk.

### 4.3 Alur belanja

```text
Buka beranda
  → pilih produk / cari produk
  → buka detail produk
  → pilih varian & metode pengiriman
  → tambah ke keranjang
  → buka keranjang
  → pilih produk, atur jumlah
  → pilih voucher / tukar poin
  → checkout
  → login jika belum masuk
  → pilih metode pembayaran
  → pesanan berhasil
  → lihat pesanan di halaman Akun
```

### 4.4 Rancangan antarmuka

- **App shell** selebar maksimal 480px, latar abu-abu muda, kartu putih, aksen biru Indomaret.
- **Header** berisi logo, pencarian, notifikasi, dan keranjang.
- **Bottom navigation** tetap di bawah, dengan badge jumlah keranjang.
- **Sheet** dari bawah untuk pilihan alamat, toko, voucher, pembayaran, filter, dan sort.
- **Toast** untuk umpan balik singkat.
- **Kartu produk** berisi gambar/emoji, merek, nama, harga, rating, dan tombol tambah/stepper.

### 4.5 Rancangan data keranjang

Satu item keranjang disimpan sebagai:

```json
{
  "id": "sania-2l",
  "qty": 2,
  "variant": "Pouch 2L"
}
```

Kombinasi `id` dan `variant` menjadi kunci unik agar produk dengan varian berbeda dapat berada di keranjang secara terpisah.

### 4.6 Rancangan perhitungan

```text
subtotal        = Σ (harga produk × qty)
promoDiscount   = Σ ((harga asli − harga promo) × qty)
shippingFee     = express ? Rp 10.000 : Rp 0
voucherDiscount = sesuai voucher dan minimum belanja
pointsDiscount  = 2.000 poin → Rp 2.000
total           = subtotal + shippingFee − voucherDiscount − pointsDiscount
hemat           = promoDiscount + voucherDiscount + pointsDiscount
```

Voucher yang didukung:

| Kode | Potongan | Minimum |
| --- | --- | --- |
| `GRATISONGKIR` | Rp 10.000 ongkir express | Rp 50.000 |
| `GAJIANHEMAT` | 40% dari subtotal, maks. Rp 40.000 | Rp 100.000 |
| `NEWMEMBER` | Rp 15.000 | Rp 75.000 |

Saat checkout lewat PHP, frontend hanya mengirim daftar item, voucher, metode pengiriman, dan status tukar poin. Server membaca `php/data/catalog.json`, menghitung ulang subtotal, diskon, ongkir, total, dan poin yang didapat. Dengan begitu total tidak bisa diubah seenaknya dari browser.

---

## 5. Implementasi

### 5.1 Teknologi

| Bagian | Teknologi |
| --- | --- |
| Struktur | HTML5 |
| Tampilan | CSS3 (custom properties, flexbox, grid) |
| Logika frontend | JavaScript ES6+ |
| Backend | PHP 8.2 (built-in server, session, JSON) |
| Penyimpanan | PHP JSON + `localStorage` (cache/fallback) |
| Font | Google Fonts — Plus Jakarta Sans |
| Pengujian | Browser manual + browser automation + uji endpoint API |

### 5.2 Struktur file

```text
klik-indomaret/
├── index.html ... promo.html       # 7 halaman frontend
├── index.php ... promo.php         # wrapper PHP
├── router.php                      # router PHP built-in server
├── start-php.ps1                   # start server + auto-detect PHP
├── .vscode/tasks.json              # Ctrl+Shift+B = start PHP
├── api/
│   ├── health.php
│   ├── auth.php
│   ├── orders.php
│   ├── vouchers.php
│   └── profile.php
├── php/
│   ├── bootstrap.php
│   ├── page.php
│   ├── lib/
│   │   ├── store.php
│   │   ├── auth.php
│   │   ├── catalog.php
│   │   └── order.php
│   └── data/
│       ├── catalog.json
│       ├── users.json
│       ├── orders.json
│       └── voucher_claims.json
├── css/style.css
├── js/
│   ├── api.js
│   ├── data.js
│   ├── app.js
│   ├── home.js
│   ├── kategori.js
│   ├── produk.js
│   ├── keranjang.js
│   ├── login.js
│   ├── akun.js
│   └── promo.js
├── assets/products/
├── docs/waterfall.md
└── README.md
```

### 5.3 Potongan implementasi

**Menyimpan keranjang:**

```js
function saveCart(items) {
  Store.set(KEY.cart, items);
  document.dispatchEvent(new CustomEvent('cart:change'));
  updateCartBadges();
}
```

**Menghitung total:**

```js
const subtotal = items.reduce(
  (sum, item) => sum + findProduct(item.id).price * item.qty,
  0
);
const shippingFee = items.length && delivery === 'express' ? 10000 : 0;
const total = Math.max(0, subtotal + shippingFee - voucherDiscount - pointsDiscount);
```

**Login lewat API PHP:**

```js
if (window.KlikApi?.isHttp()) {
  try {
    const result = await window.KlikApi.login(contact, password);
    if (Array.isArray(result.claimed)) Store.set(KEY.claimed, result.claimed);
    finishAuth(result.user, button);
    return;
  } catch (error) {
    if (!error.offline) {
      toast(error.message || 'Nomor HP/email atau password salah.', 'error');
      return;
    }
    // server mati: lanjut fallback localStorage
  }
}
```

**Endpoint login PHP (`api/auth.php`):**

```php
$user = klik_find_user_by_contact($contact);
if ($user === null || !password_verify($password, (string) ($user['password_hash'] ?? ''))) {
    klik_json_response(['ok' => false, 'error' => 'Nomor HP/email atau password salah.'], 401);
}

klik_login_user((int) $user['id']);
klik_json_response([
    'ok' => true,
    'user' => klik_public_user($user),
    'claimed' => klik_claimed_codes((int) $user['id']),
]);
```

**Membuat pesanan di server (`api/orders.php`):**

```php
$subtotal = 0;
foreach ($items as $item) {
    $product = $products[$item['id']] ?? null;
    if ($product === null || $item['qty'] < 1) {
        klik_json_response(['ok' => false, 'error' => 'Item pesanan tidak valid.'], 422);
    }
    $subtotal += (int) $product['price'] * (int) $item['qty'];
}

$total = max(0, $subtotal + $shippingFee - $voucherDiscount - $pointsDiscount);
```

**Fallback statis:**

```js
if (!window.KlikApi?.isHttp()) {
  // Mode static: auth, pesanan, dan voucher memakai localStorage.
  finishAuth({ name, phone, email, joined: new Date().toISOString() }, button);
}
```

### 5.4 Tampilan halaman

Screenshot hasil implementasi tersimpan di root project:

- `shot-home.png`
- `shot-kategori.png`
- `shot-produk.png`
- `shot-keranjang.png`
- `shot-login.png`
- `shot-akun.png`
- `shot-promo.png`

---

## 6. Pengujian

Pengujian dilakukan pada browser Edge/Chromium dengan local server. Setiap kasus uji dijalankan pada data demo.

### 6.1 Skenario pengujian

| No | Kasus uji | Langkah | Hasil yang diharapkan | Status |
| --- | --- | --- | --- | --- |
| TC-01 | Buka beranda | Buka `index.html` | Header, banner, kategori, flash sale, produk populer tampil | Lulus |
| TC-02 | Tambah produk | Klik tombol tambah pada produk | Badge keranjang bertambah, toast muncul | Lulus |
| TC-03 | Cari produk | Isi pencarian "susu" | Menampilkan 2 produk susu | Lulus |
| TC-04 | Filter harga | Filter minimum Rp 10.000 | Produk di bawah harga tersaring | Lulus |
| TC-05 | Urutkan harga | Pilih "Harga Terendah" | Harga tersusun naik | Lulus |
| TC-06 | Ubah jumlah | Klik + / − pada stepper | Jumlah dan total berubah; item terhapus saat 0 | Lulus |
| TC-07 | Login demo | Isi akun demo lalu Masuk | Redirect ke halaman tujuan, profil tampil | Lulus |
| TC-08 | Register | Isi form valid | User baru tersimpan, tombol memproses | Lulus |
| TC-09 | Validasi register | Submit form kosong | 5 pesan error tampil | Lulus |
| TC-10 | Lupa password | Buka sheet, isi kontak | Toast tautan reset muncul | Lulus |
| TC-11 | Show/hide password | Klik ikon mata | Tipe input berubah | Lulus |
| TC-12 | Guest checkout | Checkout tanpa login | Sheet "Masuk dulu yuk" muncul | Lulus |
| TC-13 | Voucher ongkir | Pilih `GRATISONGKIR` | Ongkir Rp 10.000 menjadi Rp 0 | Lulus |
| TC-14 | Voucher gajian | Pilih `GAJIANHEMAT` | Diskon Rp 40.000, total Rp 119.500 | Lulus |
| TC-15 | Tukar poin | Aktifkan toggle poin | Total berkurang Rp 2.000 | Lulus |
| TC-16 | Ambil di toko | Pilih "Klik & Ambil" | Ongkir GRATIS, total menyesuaikan | Lulus |
| TC-17 | Checkout bank | Pilih Transfer Bank lalu bayar | Overlay sukses, pesanan tersimpan | Lulus |
| TC-18 | Riwayat pesanan | Buka Akun setelah checkout | Kartu pesanan dan status tampil | Lulus |
| TC-19 | Logout | Konfirmasi keluar | Sesi hilang, keranjang tetap ada | Lulus |
| TC-20 | Edit profil | Ubah nama dan nomor HP | Profil dan avatar diperbarui | Lulus |
| TC-21 | Ganti alamat | Pilih alamat kantor | Alamat aktif berubah | Lulus |
| TC-22 | Ganti toko | Pilih toko lain | Nama toko dan jarak berubah | Lulus |
| TC-23 | Top up | Pilih nominal Rp 50.000 | Saldo bertambah menjadi Rp 235.000 | Lulus |
| TC-24 | Klaim voucher | Klik Klaim di Promo | Tombol menjadi "Diklaim" dan tersimpan | Lulus |
| TC-25 | Varian produk | Pilih "Botol 2L" | Label varian berubah | Lulus |
| TC-26 | Tab produk | Klik "Komposisi & Gizi" | Panel informasi berubah | Lulus |
| TC-27 | Console | Buka semua halaman | Tidak ada error JavaScript | Lulus* |
| TC-28 | Health API | GET `/api/health.php` | `ok: true`, versi PHP, dan status storage tampil | Lulus |
| TC-29 | Login API | POST `auth.php?action=login` dengan akun demo | User, saldo, poin, dan session cookie dikembalikan | Lulus |
| TC-30 | Register duplikat | Daftar dengan nomor HP yang sudah ada | HTTP 409 dan pesan "Nomor HP sudah terdaftar" | Lulus |
| TC-31 | Checkout server | POST `orders.php` dengan 3 item demo + `GRATISONGKIR` | Total Rp 149.500, hemat Rp 21.900, poin bertambah | Lulus |
| TC-32 | Akses tanpa login | GET `orders.php` tanpa session | HTTP 401 | Lulus |
| TC-33 | Klaim voucher API | POST `vouchers.php` kode `GAJIANHEMAT` | Voucher masuk daftar klaim user | Lulus |
| TC-34 | Top up API | POST `profile.php?action=topup` Rp 50.000 | Saldo user bertambah Rp 50.000 | Lulus |
| TC-35 | Edit profil API | POST `profile.php` dengan nama baru | Nama tersimpan dan tampil di halaman Akun | Lulus |
| TC-36 | Session di halaman PHP | Buka `akun.html` setelah login | Halaman langsung menampilkan user dari session | Lulus |
| TC-37 | Reset data PHP | Hapus `users.json`, `orders.json`, `voucher_claims.json` lalu restart | Akun demo dibuat ulang, pesanan kosong | Lulus |
| TC-38 | Mode statis | Buka lewat Python/Live Server tanpa PHP | Login dan checkout tetap jalan dengan `localStorage` | Lulus |

\* Pesan 404 untuk `assets/products/*.jpg` hanya muncul jika ada elemen gambar produk yang meminta file foto. Saat ini tampilan memakai emoji/gradient, jadi tidak mengganggu fungsi aplikasi.

### 6.2 Hasil perhitungan demo

Data keranjang demo:

| Produk | Qty | Harga | Total |
| --- | --- | ---: | ---: |
| Sania Minyak Goreng 2L | 1 | Rp 34.200 | Rp 34.200 |
| Ultra Milk Cokelat 1L | 2 | Rp 18.900 | Rp 37.800 |
| Indomie Ayam Bawang 5 pcs | 5 | Rp 15.500 | Rp 77.500 |
| **Subtotal** | **8** | | **Rp 149.500** |

Dengan voucher `GRATISONGKIR` dan express:

```text
Total harga awal      Rp 161.400
Diskon produk promo  −Rp  11.900
Ongkir express       +Rp  10.000
Voucher ongkir       −Rp  10.000
--------------------------------
Total tagihan         Rp 149.500
Hemat                 Rp  21.900
```

Dengan voucher `GAJIANHEMAT`:

```text
Subtotal              Rp 149.500
Ongkir express       +Rp  10.000
Diskon gajian 40%    −Rp  40.000
--------------------------------
Total tagihan         Rp 119.500
```

---

## 7. Kesimpulan dan Saran

### 7.1 Kesimpulan

1. Prototype Klik Indomaret berhasil dibangun dengan 7 halaman dan alur belanja yang lengkap.
2. Fitur utama seperti pencarian, filter, keranjang, voucher, poin, checkout, login, dan riwayat pesanan berjalan sesuai kebutuhan.
3. Backend PHP + JSON berhasil menyimpan user, session, pesanan, klaim voucher, saldo, dan poin tanpa perlu database server.
4. Frontend tetap bisa berjalan statis dengan fallback `localStorage` saat PHP tidak aktif.
5. Metode Waterfall membantu proses pengembangan berjalan terstruktur: kebutuhan → desain → implementasi → pengujian → pemeliharaan.

### 7.2 Saran

1. Menambahkan foto produk asli dari desain ke `assets/products/`.
2. Migrasi penyimpanan JSON ke MySQL/PostgreSQL saat data mulai banyak atau dipakai multi-user secara nyata.
3. Menambahkan integrasi pembayaran, pelacakan pesanan, dan notifikasi nyata.
4. Menambahkan CSRF token, rate limiting, HTTPS, dan pengujian keamanan sebelum dipakai publik.
5. Menambahkan pengujian otomatis (unit test/E2E) untuk menjaga kualitas saat fitur bertambah.
6. Melakukan usability testing dengan pengguna lain untuk menyempurnakan alur.

---

## Lampiran

### A. Akun demo

- Nomor HP: `081234567890`
- Password: `password123`
- Mode cepat: tambahkan `?demo=1` pada URL.

### B. Cara menjalankan (PHP + VS Code)

1. Buka folder project di VS Code.
2. Tekan `Ctrl+Shift+B` atau jalankan task **Klik Indomaret: Start PHP Server**.
3. Buka `http://127.0.0.1:8000/`.
4. Cek API di `http://127.0.0.1:8000/api/health.php`.

Manual:

```powershell
cd C:\klik-indomaret
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-php.ps1
```

Mode statis (tanpa PHP):

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Buka `http://127.0.0.1:8123/index.html`.

### C. Reset data

Data PHP:

```powershell
Remove-Item php\data\users.json, php\data\orders.json, php\data\voucher_claims.json -Force
```

Jalankan server lagi; akun demo akan dibuat ulang.

Data browser:

```js
localStorage.clear();
location.reload();
```
