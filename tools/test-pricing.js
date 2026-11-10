#!/usr/bin/env node
/**
 * test-pricing.js — kasus uji untuk js/pricing.js.
 *
 * Jalankan dari root proyek:
 *   node tools/test-pricing.js
 *
 * Angka yang dipakai sama dengan data demo di docs/waterfall.md.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`GAGAL: ${message}`);
  process.exit(1);
}

let pricing;
try {
  const source =
    fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'products.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'pricing.js'), 'utf8') +
    '\n;globalThis.__PRICING__ = KlikPricing;';

  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'js/pricing.js' });
  pricing = sandbox.__PRICING__;
} catch (error) {
  fail(`Gagal memuat js/pricing.js: ${error.message}`);
}

const DEMO_CART = [
  { id: 'sania-2l', qty: 1, variant: 'Pouch 2L' },
  { id: 'ultra-1l', qty: 2, variant: '1000ml' },
  { id: 'indomie-ayam-5', qty: 5, variant: '5 pcs' },
];
const ALL_VOUCHERS = ['GRATISONGKIR', 'GAJIANHEMAT', 'NEWMEMBER', 'SABTUMERIAH'];

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

function hitung(overrides = {}) {
  return pricing.computeTotals({
    items: DEMO_CART,
    delivery: 'express',
    claimed: ALL_VOUCHERS,
    ...overrides,
  });
}

/* ---- Subtotal & diskon produk ---- */

test('subtotal demo Rp 149.500 dan harga asli Rp 161.400', () => {
  const t = hitung();
  assert.strictEqual(t.subtotal, 149500);
  assert.strictEqual(t.originalTotal, 161400);
  assert.strictEqual(t.promoDiscount, 11900);
  assert.strictEqual(t.count, 8);
  assert.strictEqual(t.jenis, 3);
});

test('ongkir express Rp 10.000, ambil di toko Rp 0', () => {
  assert.strictEqual(hitung().shippingFee, 10000);
  assert.strictEqual(hitung({ delivery: 'pickup' }).shippingFee, 0);
});

test('keranjang kosong tidak dikenai ongkir', () => {
  const t = hitung({ items: [] });
  assert.strictEqual(t.total, 0);
  assert.strictEqual(t.shippingFee, 0);
});

/* ---- Voucher ---- */

test('GRATISONGKIR memotong ongkir, total Rp 149.500', () => {
  const t = hitung({ voucher: 'GRATISONGKIR' });
  assert.strictEqual(t.voucherDiscount, 10000);
  assert.strictEqual(t.total, 149500);
  assert.strictEqual(t.saving, 21900);
  assert.strictEqual(t.voucherActive, true);
});

test('GAJIANHEMAT 40% dibatasi Rp 40.000, total Rp 119.500', () => {
  const t = hitung({ voucher: 'GAJIANHEMAT' });
  assert.strictEqual(t.voucherDiscount, 40000);
  assert.strictEqual(t.total, 119500);
  assert.strictEqual(t.saving, 51900);
});

test('NEWMEMBER memotong Rp 15.000', () => {
  const t = hitung({ voucher: 'NEWMEMBER' });
  assert.strictEqual(t.voucherDiscount, 15000);
  assert.strictEqual(t.total, 144500);
});

test('SABTUMERIAH 30% + gratis ongkir, total Rp 119.500', () => {
  const t = hitung({ voucher: 'SABTUMERIAH' });
  assert.strictEqual(t.voucherDiscount, 40000);
  assert.strictEqual(t.total, 119500);
});

test('voucher ongkir tidak berlaku saat ambil di toko', () => {
  const t = hitung({ voucher: 'GRATISONGKIR', delivery: 'pickup' });
  assert.strictEqual(t.voucherDiscount, 0);
  assert.strictEqual(t.total, 149500);
});

test('voucher yang belum diklaim tidak dipakai', () => {
  const t = hitung({ voucher: 'GAJIANHEMAT', claimed: [] });
  assert.strictEqual(t.voucherDiscount, 0);
  assert.strictEqual(t.total, 159500);
});

test('minimum belanja voucher dihormati', () => {
  const t = hitung({
    items: [{ id: 'chitato-68', qty: 1 }],
    voucher: 'GAJIANHEMAT',
  });
  assert.strictEqual(t.subtotal, 10900);
  assert.strictEqual(t.voucherDiscount, 0);
  assert.strictEqual(t.total, 20900);
});

test('kode voucher tidak dikenal diabaikan', () => {
  const t = hitung({ voucher: 'TIDAKADA' });
  assert.strictEqual(t.voucherDiscount, 0);
  assert.strictEqual(t.voucherActive, false);
});

test('voucher yang sudah dipakai tidak dihitung lagi', () => {
  const t = hitung({ voucher: 'GAJIANHEMAT', used: ['GAJIANHEMAT'] });
  assert.strictEqual(t.voucherDiscount, 0);
  assert.strictEqual(t.voucherActive, false);
  assert.strictEqual(t.total, 159500);
});

test('voucher lain tetap bisa walau ada voucher terpakai', () => {
  const t = hitung({ voucher: 'NEWMEMBER', used: ['GAJIANHEMAT'] });
  assert.strictEqual(t.voucherDiscount, 15000);
  assert.strictEqual(t.voucherActive, true);
});

/* ---- Poin ---- */

test('tukar 2.000 poin memotong Rp 2.000', () => {
  const t = hitung({ usePoints: true, pointsBalance: 4850 });
  assert.strictEqual(t.pointsDiscount, 2000);
  assert.strictEqual(t.total, 157500);
});

test('poin kurang dari 2.000 tidak bisa ditukar', () => {
  const t = hitung({ usePoints: true, pointsBalance: 1999 });
  assert.strictEqual(t.pointsDiscount, 0);
  assert.strictEqual(t.total, 159500);
});

/* ---- Helper ---- */

test('requiresExpress hanya untuk voucher ongkir', () => {
  assert.strictEqual(pricing.requiresExpress('GRATISONGKIR'), true);
  assert.strictEqual(pricing.requiresExpress('SABTUMERIAH'), true);
  assert.strictEqual(pricing.requiresExpress('GAJIANHEMAT'), false);
  assert.strictEqual(pricing.requiresExpress(null), false);
});

test('voucherUsable menolak voucher di bawah minimum', () => {
  assert.strictEqual(
    pricing.voucherUsable('NEWMEMBER', { subtotal: 74999, delivery: 'express', claimed: ALL_VOUCHERS }),
    false
  );
  assert.strictEqual(
    pricing.voucherUsable('NEWMEMBER', { subtotal: 75000, delivery: 'express', claimed: ALL_VOUCHERS }),
    true
  );
});

test('voucherUsable menolak voucher yang sudah dipakai', () => {
  const args = { subtotal: 149500, delivery: 'express', claimed: ALL_VOUCHERS };
  assert.strictEqual(pricing.voucherUsable('GAJIANHEMAT', { ...args, used: ['GAJIANHEMAT'] }), false);
  assert.strictEqual(pricing.voucherUsable('GAJIANHEMAT', { ...args, used: ['NEWMEMBER'] }), true);
});

test('itemsSummary menghitung keranjang penuh', () => {
  const summary = pricing.itemsSummary(DEMO_CART);
  assert.strictEqual(summary.subtotal, 149500);
  assert.strictEqual(summary.originalTotal, 161400);
});

console.log('');
if (passed !== total) {
  console.error(`${passed}/${total} kasus lulus.`);
  process.exit(1);
}

console.log(`OK ${passed}/${total} kasus lulus.`);
