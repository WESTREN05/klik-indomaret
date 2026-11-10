/* =========================================================
   data.js — data statis toko, kategori, banner, dan voucher
   Data produk ada di js/products.js.
   ========================================================= */

const STORE = {
  name: 'Indomaret Kemanggi 2',
  address: 'Jl. Kemanggi Ilir No. 12, Palembang',
  distance: '0.4 km',
  eta: '~45Mnt',
  hours: '07.00–22.00 WIB',
};

const STORES = [
  { id: 'kemanggi-2', name: 'Indomaret Kemanggi 2', address: 'Jl. Kemanggi Ilir No. 12, Palembang', distance: '0.4 km', eta: '~45Mnt' },
  { id: 'kemanggi-1', name: 'Indomaret Kemanggi 1', address: 'Jl. Kemanggi No. 8, Palembang', distance: '0.9 km', eta: '~55Mnt' },
  { id: 'sudirman', name: 'Indomaret Sudirman', address: 'Jl. Jend. Sudirman No. 45, Palembang', distance: '1.6 km', eta: '~1 Jam' },
];

const ADDRESSES = [
  { id: 'rumah', label: 'Rumah', detail: 'Jl. Kebon Jeruk No. 12, Jakarta Barat', note: 'Patokan: seberang masjid' },
  { id: 'kantor', label: 'Kantor', detail: 'Jl. Jend. Sudirman Kav. 21, Jakarta Selatan', note: 'Lantai 4, resepsionis' },
];

const CATEGORIES = [
  { id: 'sembako', name: 'Minyak & Beras', icon: '🫗', tint: '#fff4c9', ink: '#b47a00' },
  { id: 'susu', name: 'Susu & Olahan', icon: '🥛', tint: '#ece4ff', ink: '#6c4bd1' },
  { id: 'snack', name: 'Snack & Biskuit', icon: '🍪', tint: '#ffe7d1', ink: '#c06512' },
  { id: 'minuman', name: 'Minuman Segar', icon: '🥤', tint: '#dceeff', ink: '#1f6fb2' },
  { id: 'buah', name: 'Buah & Sayur', icon: '🍎', tint: '#ffe3e3', ink: '#c03333' },
  { id: 'perawatan', name: 'Perawatan Diri', icon: '🧴', tint: '#ddf3ea', ink: '#1c7d5c' },
  { id: 'rumah', name: 'Kebutuhan Rumah', icon: '🧺', tint: '#e6ebff', ink: '#3a54b4' },
  { id: 'promo', name: 'Promo JSM', icon: '%', tint: '#ffe0e0', ink: '#d61f26', promo: true },
];

/* Angka bisnis bersama: dipakai perhitungan di browser dan, lewat
   php/data/catalog.json, juga oleh validasi pesanan di server. */
const SETTINGS = {
  shippingExpress: 10000,
  pointCost: 2000,
  pointValue: 2000,
  maxQty: 99,
};

const BANNERS = [
  {
    code: 'GAJIANHEMAT',
    title: 'Diskon Heboh Gajian',
    desc: 'Potongan s.d 40% produk dapur pilihan. Khusus hari ini!',
    tone: 'blue',
    emoji: '🧺',
  },
  {
    code: 'SABTUMERIAH',
    title: 'Sabtu Meriah',
    desc: 'Belanja s.d 30% lebih hemat + gratis ongkir express.',
    tone: 'red',
    emoji: '🛵',
  },
];

/* Voucher: `rules` adalah satu-satunya definisi potongan.
   - fixed    : potongan tetap (Rp)
   - percent  : persentase subtotal, dibatasi `cap` (Rp) bila ada
   - shipping : maksimal potongan ongkir (Rp)
   `expressOnly` menandai voucher yang tidak berlaku saat ambil di toko. */
const VOUCHERS = [
  {
    code: 'GAJIANHEMAT',
    title: 'Diskon Gajian 40%',
    desc: 'Maks. potongan Rp 40.000',
    min: 100000,
    tone: 'blue',
    value: '40%',
    tag: 'DISKON',
    label: 'Diskon Voucher Gajian',
    expressOnly: false,
    terms: [
      'Minimal belanja Rp 100.000 sebelum ongkir.',
      'Diskon 40% dengan maksimal potongan Rp 40.000.',
      'Berlaku untuk Pesan Antar dan Klik & Ambil.',
      'Tidak dapat digabung dengan voucher lain dan hanya dapat dipakai sekali per akun.',
    ],
    rules: { percent: 40, cap: 40000 },
  },
  {
    code: 'GRATISONGKIR',
    title: 'Gratis Ongkir Express',
    desc: 'Hemat Rp 10.000 ongkos kirim',
    min: 50000,
    tone: 'green',
    value: '10rb',
    tag: 'ONGKIR',
    label: 'Diskon Voucher Pengiriman',
    expressOnly: true,
    terms: [
      'Minimal belanja Rp 50.000 sebelum ongkir.',
      'Hanya berlaku untuk Pesan Antar (express), tidak berlaku untuk Klik & Ambil.',
      'Potongan ongkos kirim maksimal Rp 10.000.',
      'Tidak dapat digabung dengan voucher lain dan hanya dapat dipakai sekali per akun.',
    ],
    rules: { shipping: 10000 },
  },
  {
    code: 'NEWMEMBER',
    title: 'Diskon Member Baru',
    desc: 'Potongan Rp 15.000',
    min: 75000,
    tone: 'amber',
    value: '15rb',
    tag: 'MEMBER',
    label: 'Diskon Voucher Member',
    expressOnly: false,
    terms: [
      'Minimal belanja Rp 75.000 sebelum ongkir.',
      'Potongan tetap Rp 15.000.',
      'Berlaku untuk Pesan Antar dan Klik & Ambil.',
      'Tidak dapat digabung dengan voucher lain dan hanya dapat dipakai sekali per akun.',
    ],
    rules: { fixed: 15000 },
  },
  {
    code: 'SABTUMERIAH',
    title: 'Sabtu Meriah',
    desc: 'Diskon 30% maks. Rp 30.000 + gratis ongkir express',
    min: 100000,
    tone: 'red',
    value: '30%',
    tag: 'DISKON',
    label: 'Diskon Voucher Sabtu Meriah',
    expressOnly: true,
    terms: [
      'Minimal belanja Rp 100.000 sebelum ongkir.',
      'Diskon 30% dengan maksimal potongan Rp 30.000.',
      'Hanya berlaku untuk Pesan Antar (express) dengan tambahan potongan ongkir maksimal Rp 10.000.',
      'Tidak dapat digabung dengan voucher lain dan hanya dapat dipakai sekali per akun.',
    ],
    rules: { percent: 30, cap: 30000, shipping: 10000 },
  },
];

/* Data produk ada di js/products.js (dipisah agar file ini ringkas). */
