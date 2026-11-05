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

const VOUCHERS = [
  { code: 'GAJIANHEMAT', title: 'Diskon Gajian 40%', desc: 'Maks. potongan Rp 40.000', min: 100000, tone: 'blue' },
  { code: 'GRATISONGKIR', title: 'Gratis Ongkir Express', desc: 'Hemat Rp 10.000 ongkos kirim', min: 50000, tone: 'green' },
  { code: 'NEWMEMBER', title: 'Diskon Member Baru', desc: 'Potongan Rp 15.000', min: 75000, tone: 'amber' },
  { code: 'SABTUMERIAH', title: 'Sabtu Meriah', desc: 'Diskon 30% maks. Rp 30.000 + gratis ongkir express', min: 100000, tone: 'red' },
];

/* Data produk ada di js/products.js (dipisah agar file ini ringkas). */
