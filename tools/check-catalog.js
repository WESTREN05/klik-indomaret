#!/usr/bin/env node
/**
 * check-catalog.js — membandingkan js/data.js + js/products.js dengan
 * php/data/catalog.json, termasuk harga, varian, dan aturan voucher.
 *
 * Jalankan dari root proyek:
 *   node tools/check-catalog.js
 *
 * Jika ada perbedaan: `npm run build:catalog` untuk membuat ulang catalog.json.
 * Keluar dengan kode 1 jika ada masalah, supaya bisa dipakai di CI/pre-commit.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'js', 'data.js');
const productsFile = path.join(root, 'js', 'products.js');
const catalogFile = path.join(root, 'php', 'data', 'catalog.json');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

if (!fs.existsSync(dataFile)) fail(`File tidak ditemukan: ${dataFile}`);
if (!fs.existsSync(productsFile)) fail(`File tidak ditemukan: ${productsFile}`);
if (!fs.existsSync(catalogFile)) fail(`File tidak ditemukan: ${catalogFile}`);

let data;
try {
  const source =
    fs.readFileSync(dataFile, 'utf8') +
    '\n' +
    fs.readFileSync(productsFile, 'utf8') +
    '\n;globalThis.__DATA__ = { PRODUCTS, CATEGORIES, STORES, ADDRESSES, VOUCHERS, BANNERS, STORE, SETTINGS };';
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: productsFile });
  data = sandbox.__DATA__;
} catch (error) {
  fail(`Gagal mengevaluasi js/data.js + js/products.js: ${error.message}`);
}

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
} catch (error) {
  fail(`Gagal membaca catalog.json: ${error.message}`);
}

const groups = [
  { name: 'products', key: 'id', left: data.PRODUCTS, right: catalog.products },
  { name: 'categories', key: 'id', left: data.CATEGORIES, right: catalog.categories },
  { name: 'stores', key: 'id', left: data.STORES, right: catalog.stores },
  { name: 'addresses', key: 'id', left: data.ADDRESSES, right: catalog.addresses },
  { name: 'vouchers', key: 'code', left: data.VOUCHERS, right: catalog.vouchers },
  { name: 'banners', key: 'code', left: data.BANNERS, right: catalog.banners },
];

const problems = [];
const notes = [];

function collect(list, key, sourceName) {
  if (!Array.isArray(list)) {
    problems.push(`${sourceName}: daftar tidak ditemukan atau bukan array.`);
    return [];
  }

  const values = [];
  const seen = new Map();

  list.forEach((item, index) => {
    const raw = item && item[key];
    const label = `${sourceName}[${index}]`;

    if (typeof raw !== 'string' || raw.trim() === '') {
      problems.push(`${label}.${key} kosong atau bukan string.`);
      return;
    }

    if (raw !== raw.trim()) {
      problems.push(`${label}.${key} punya spasi di awal/akhir: ${JSON.stringify(raw)}`);
    }

    if (/\s/.test(raw.trim())) {
      problems.push(`${label}.${key} mengandung spasi di tengah: ${JSON.stringify(raw)}`);
    }

    if (seen.has(raw)) {
      problems.push(`${sourceName}: ${key} duplikat ${JSON.stringify(raw)} (indeks ${seen.get(raw)} dan ${index}).`);
    } else {
      seen.set(raw, index);
    }

    values.push({ raw, value: raw.trim(), index });
  });

  return values;
}

const show = (value) => (value === undefined ? '(tidak ada)' : JSON.stringify(value));

/** Bandingkan nilai JS dengan isi catalog.json dan laporkan jalur yang beda. */
function compareValues(label, expected, actual) {
  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      problems.push(`${label}: tipe beda -> js ${show(expected)} vs catalog ${show(actual)}`);
      return;
    }
    if (expected.length !== actual.length) {
      problems.push(`${label}: jumlah beda -> js ${expected.length} vs catalog ${actual.length}`);
    }
    const length = Math.min(expected.length, actual.length);
    for (let index = 0; index < length; index += 1) {
      compareValues(`${label}[${index}]`, expected[index], actual[index]);
    }
    return;
  }

  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object') {
      problems.push(`${label}: tipe beda -> js ${show(expected)} vs catalog ${show(actual)}`);
      return;
    }
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    keys.forEach((key) => compareValues(`${label}.${key}`, expected[key], actual[key]));
    return;
  }

  if (expected !== actual) {
    problems.push(`${label}: js ${show(expected)} vs catalog ${show(actual)}`);
  }
}

for (const group of groups) {
  const left = collect(group.left, group.key, `data.js ${group.name}`);
  const right = collect(group.right, group.key, `catalog.json ${group.name}`);

  const leftMap = new Map(left.map((item) => [item.raw, item]));
  const rightMap = new Map(right.map((item) => [item.raw, item]));

  for (const item of left) {
    if (!rightMap.has(item.raw)) {
      const lower = item.raw.trim().toLowerCase();
      const caseMatch = right.find((entry) => entry.raw.trim().toLowerCase() === lower);
      if (caseMatch) {
        problems.push(
          `${group.name}: beda huruf besar/kecil -> data.js ${JSON.stringify(item.raw)} vs catalog.json ${JSON.stringify(caseMatch.raw)}`
        );
      } else {
        problems.push(
          `${group.name}: hanya ada di data.js -> ${JSON.stringify(item.raw)} (${group.key})`
        );
      }
      continue;
    }

    const counterpart = rightMap.get(item.raw);
    compareValues(
      `${group.name}[${item.value}]`,
      group.left[item.index],
      group.right[counterpart.index]
    );
  }

  for (const item of right) {
    if (!leftMap.has(item.raw)) {
      const lower = item.raw.trim().toLowerCase();
      const caseMatch = left.find((entry) => entry.raw.trim().toLowerCase() === lower);
      if (!caseMatch) {
        problems.push(
          `${group.name}: hanya ada di catalog.json -> ${JSON.stringify(item.raw)} (${group.key})`
        );
      }
    }
  }

  notes.push(`${group.name}: data.js ${left.length} vs catalog.json ${right.length}`);
}

if (!catalog.settings) {
  problems.push('settings: catalog.json belum punya settings (ongkir/poin/maxQty).');
} else {
  compareValues('settings', data.SETTINGS, catalog.settings);
}

console.log('Pemeriksaan data.js + products.js vs catalog.json');
console.log('='.repeat(56));
notes.forEach((note) => console.log(`INFO  ${note}`));
console.log('INFO  harga, varian, aturan voucher, dan settings ikut dibandingkan');

const productIds = new Set((data.PRODUCTS || []).map((product) => product.id));
(data.PRODUCTS || []).forEach((product, index) => {
  if (product && product.image) {
    const imagePath = path.join(root, product.image.replace(/^\/+/, ''));
    if (!fs.existsSync(imagePath)) {
      // Bukan error fatal: aplikasi memakai assets/products/<id>.jpg.
      notes.push(`products[${index}].image menunjuk file yang tidak ada: ${product.image}`);
    }
  }
  if (product && product.id && !productIds.has(product.id.trim())) {
    notes.push(`products[${index}].id tidak konsisten setelah trim.`);
  }
});

if (problems.length === 0) {
  console.log('OK    Semua ID, harga, varian, dan aturan voucher cocok.');
  process.exit(0);
}

console.log('');
problems.forEach((problem) => console.log(`GAGAL ${problem}`));
console.log('');
console.log(`Total masalah: ${problems.length}`);
console.log('Jalankan `npm run build:catalog` untuk menyinkronkan catalog.json.');
process.exit(1);
