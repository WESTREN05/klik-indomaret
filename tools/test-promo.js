#!/usr/bin/env node
/**
 * test-promo.js — kasus uji tombol voucher di halaman Promo.
 *
 * Jalankan dari root proyek:
 *   node tools/test-promo.js
 *
 * Fokus: voucher yang sudah diklaim menampilkan tombol Pakai dan tombol itu
 * menyimpan pilihan voucher lalu membuka halaman keranjang.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

function createElement() {
  return {
    innerHTML: '',
    handlers: {},
    addEventListener(type, fn) {
      this.handlers[type] = fn;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function createPromo() {
  const voucherList = createElement();
  const promoGrid = createElement();
  const documentStub = {
    handlers: {},
    querySelector(sel) {
      if (sel === '#voucherList') return voucherList;
      if (sel === '#promoGrid') return promoGrid;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener(type, fn) {
      this.handlers[type] = fn;
    },
  };

  const data = new Map([
    ['klik_claimed_v1', JSON.stringify(['SABTUMERIAH'])],
    ['klik_used_v1', JSON.stringify([])],
  ]);
  const localStorage = {
    get length() {
      return data.size;
    },
    key(i) {
      return Array.from(data.keys())[i] ?? null;
    },
    getItem(k) {
      return data.has(k) ? data.get(k) : null;
    },
    setItem(k, v) {
      data.set(String(k), String(v));
    },
    removeItem(k) {
      data.delete(k);
    },
  };

  const sandbox = {
    localStorage,
    location: { search: '', href: '' },
    document: documentStub,
    URLSearchParams,
    console,
    toast() {},
    productCard() {
      return '';
    },
    window: {},
    setTimeout() {
      return 0;
    },
    updateSaldoUI() {},
  };

  const source =
    fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'products.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'core.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'session.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'promo.js'), 'utf8');

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'js/promo.js' });

  return { voucherList, localStorage, sandbox };
}

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

test('voucher terklaim menampilkan tombol Pakai', () => {
  const { voucherList } = createPromo();
  assert.ok(voucherList.innerHTML.includes('data-use="SABTUMERIAH"'));
  assert.ok(voucherList.innerHTML.includes('>Pakai</button>'));
});

test('voucher belum diklaim menampilkan tombol Klaim', () => {
  const { voucherList } = createPromo();
  assert.ok(voucherList.innerHTML.includes('data-claim="GRATISONGKIR"'));
  assert.ok(voucherList.innerHTML.includes('>Klaim</button>'));
});

test('tombol Pakai menyimpan voucher pilihan', () => {
  const { voucherList, localStorage } = createPromo();
  voucherList.handlers.click({
    target: {
      closest(sel) {
        return sel === '[data-use]' ? { dataset: { use: 'SABTUMERIAH' } } : null;
      },
    },
  });

  assert.strictEqual(localStorage.getItem('klik_active_voucher_v1'), JSON.stringify('SABTUMERIAH'));
});

test('tombol Pakai membuka halaman keranjang', () => {
  const { voucherList, sandbox } = createPromo();
  voucherList.handlers.click({
    target: {
      closest(sel) {
        return sel === '[data-use]' ? { dataset: { use: 'SABTUMERIAH' } } : null;
      },
    },
  });

  assert.strictEqual(sandbox.location.href, 'keranjang.html');
});

console.log('');
if (passed !== total) {
  console.error(`${passed}/${total} kasus lulus.`);
  process.exit(1);
}

console.log(`OK ${passed}/${total} kasus lulus.`);
