#!/usr/bin/env node
/**
 * test-page.js — kasus uji skrip bootstrap localStorage dari
 * php/lib/page-boot.php.
 *
 * Jalankan dari root proyek:
 *   node tools/test-page.js
 *
 * Fokus: saat session PHP habis, cache saldo/poin/riwayat/alamat/toko akun
 * dibersihkan, sedangkan keranjang dan pilihan pengiriman dipertahankan.
 * Preferensi alamat/toko tamu (tanpa cache user) tetap disimpan.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

function generateScript(bootstrap) {
  const encoded = Buffer.from(JSON.stringify(bootstrap), 'utf8').toString('base64');
  const code = [
    "require 'php/lib/page-boot.php';",
    `echo klik_page_bootstrap_script(json_decode(base64_decode('${encoded}'), true));`,
  ].join(' ');
  const html = execFileSync('php', ['-r', code], { cwd: root, encoding: 'utf8' });
  const match = html.match(/^<script>([\s\S]*)<\/script>$/);
  assert.ok(match, 'Skrip bootstrap tidak berbentuk <script>...</script>.');
  return match[1];
}

function createLocalStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null;
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function run(bootstrap, seed) {
  const script = generateScript(bootstrap);
  const localStorage = createLocalStorage(seed);
  const sandbox = { localStorage, window: {}, JSON };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: 'php/lib/page-boot.php' });
  return { localStorage, window: sandbox.window };
}

const BOOT_USER = {
  id: 1,
  name: 'Bagas Pratama',
  phone: '081234567890',
  email: 'bagas@email.com',
  joined: '2026-01-01T00:00:00+00:00',
  saldo: 185000,
  points: 4850,
};

let total = 0;
let passed = 0;

function test(name, fn) {
  total += 1;
  try {
    fn();
    passed += 1;
    console.log(`LULUS  ${name}`);
  } catch (error) {
    console.error(`GAGAL  ${name}`);
    console.error(`       ${error.message}`);
  }
}

test('session habis membersihkan cache akun dan riwayat per akun', () => {
  const seed = {
    klik_user_v1: JSON.stringify(BOOT_USER),
    klik_saldo_v1: '9000',
    klik_points_v1: '99',
    klik_address_v1: JSON.stringify({ id: 'kantor' }),
    klik_store_v1: JSON.stringify({ id: 'toko-2' }),
    klik_orders_v1: JSON.stringify([{ id: 'INV-lama' }]),
    'klik_orders_v1:7': JSON.stringify([{ id: 'INV-7' }]),
    'klik_orders_v1:9': JSON.stringify([{ id: 'INV-9' }]),
    klik_cart_v1: JSON.stringify([{ id: 'sania-2l', qty: 1, variant: 'Pouch 2L' }]),
    klik_delivery_v1: JSON.stringify('pickup'),
  };
  const { localStorage, window } = run({ php: true, apiBase: 'api', user: null, claimed: [], used: [] }, seed);

  for (const key of [
    'klik_user_v1',
    'klik_saldo_v1',
    'klik_points_v1',
    'klik_address_v1',
    'klik_store_v1',
    'klik_orders_v1',
    'klik_orders_v1:7',
    'klik_orders_v1:9',
  ]) {
    assert.strictEqual(localStorage.getItem(key), null, `${key} masih tersimpan`);
  }

  assert.strictEqual(localStorage.getItem('klik_cart_v1'), seed.klik_cart_v1);
  assert.strictEqual(localStorage.getItem('klik_delivery_v1'), seed.klik_delivery_v1);
  assert.strictEqual(localStorage.getItem('klik_claimed_v1'), '[]');
  assert.strictEqual(localStorage.getItem('klik_used_v1'), '[]');
  assert.strictEqual(window.KLIK_BOOTSTRAP.user, null);
});

test('tamu tetap memakai alamat dan toko pilihannya saat pindah halaman', () => {
  const seed = {
    klik_address_v1: JSON.stringify({ id: 'kantor' }),
    klik_store_v1: JSON.stringify({ id: 'toko-2' }),
    klik_cart_v1: JSON.stringify([{ id: 'sania-2l', qty: 1, variant: 'Pouch 2L' }]),
    klik_delivery_v1: JSON.stringify('express'),
  };
  const { localStorage, window } = run({ php: true, apiBase: 'api', user: null, claimed: [], used: [] }, seed);

  assert.strictEqual(localStorage.getItem('klik_address_v1'), seed.klik_address_v1);
  assert.strictEqual(localStorage.getItem('klik_store_v1'), seed.klik_store_v1);
  assert.strictEqual(localStorage.getItem('klik_cart_v1'), seed.klik_cart_v1);
  assert.strictEqual(localStorage.getItem('klik_delivery_v1'), seed.klik_delivery_v1);
  assert.strictEqual(window.KLIK_BOOTSTRAP.user, null);
});

test('session aktif menulis user, saldo, dan poin dari server', () => {
  const seed = {
    klik_user_v1: JSON.stringify({ id: 99, name: 'Lama' }),
    klik_saldo_v1: '1',
    klik_points_v1: '2',
    klik_address_v1: JSON.stringify({ id: 'kantor' }),
    klik_store_v1: JSON.stringify({ id: 'toko-2' }),
    'klik_orders_v1:99': JSON.stringify([{ id: 'INV-lama' }]),
  };
  const bootstrap = {
    php: true,
    apiBase: 'api',
    user: BOOT_USER,
    claimed: ['SABTUMERIAH'],
    used: [],
  };
  const { localStorage } = run(bootstrap, seed);

  assert.strictEqual(localStorage.getItem('klik_user_v1'), JSON.stringify(BOOT_USER));
  assert.strictEqual(localStorage.getItem('klik_saldo_v1'), '185000');
  assert.strictEqual(localStorage.getItem('klik_points_v1'), '4850');
  assert.strictEqual(localStorage.getItem('klik_address_v1'), seed.klik_address_v1);
  assert.strictEqual(localStorage.getItem('klik_store_v1'), seed.klik_store_v1);
  assert.strictEqual(localStorage.getItem('klik_orders_v1:99'), seed['klik_orders_v1:99']);
  assert.strictEqual(localStorage.getItem('klik_claimed_v1'), '["SABTUMERIAH"]');
});

test('session aktif tanpa saldo/poin tidak menghapus cache yang ada', () => {
  const { localStorage } = run(
    { php: true, apiBase: 'api', user: { id: 1, name: 'Bagas' }, claimed: [], used: [] },
    { klik_saldo_v1: '200000', klik_points_v1: '5000' }
  );

  assert.strictEqual(localStorage.getItem('klik_saldo_v1'), '200000');
  assert.strictEqual(localStorage.getItem('klik_points_v1'), '5000');
});

console.log('');
if (passed !== total) {
  console.error(`${passed}/${total} kasus lulus.`);
  process.exit(1);
}

console.log(`OK ${passed}/${total} kasus lulus.`);
