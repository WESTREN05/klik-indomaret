#!/usr/bin/env node
/**
 * check-ids.js — membandingkan ID/kode di js/data.js dengan php/data/catalog.json.
 *
 * Jalankan dari root proyek:
 *   node tools/check-ids.js
 *
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
  const source = fs.readFileSync(dataFile, 'utf8')
    + '\n' + fs.readFileSync(productsFile, 'utf8')
    + '\n;globalThis.__DATA__ = { PRODUCTS, CATEGORIES, STORES, ADDRESSES, VOUCHERS, BANNERS, STORE };';
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
    }
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

  notes.push(
    `${group.name}: data.js ${left.length} vs catalog.json ${right.length}`
  );

  if (group.name === 'products') {
    const productIds = new Set(left.map((item) => item.value));
    (data.PRODUCTS || []).forEach((product, index) => {
      if (product && product.image) {
        const imagePath = path.join(root, product.image.replace(/^\/+/, ''));
        if (!fs.existsSync(imagePath)) {
          // Bukan error fatal: app.js memakai assets/products/<id>.jpg.
          notes.push(
            `products[${index}].image menunjuk file yang tidak ada: ${product.image}`
          );
        }
      }
      if (product && product.id && !productIds.has(product.id.trim())) {
        notes.push(`products[${index}].id tidak konsisten setelah trim.`);
      }
    });
  }
}

console.log('Pemeriksaan ID/kode data.js vs catalog.json');
console.log('='.repeat(56));
notes.forEach((note) => console.log(`INFO  ${note}`));

if (problems.length === 0) {
  console.log('OK    Semua ID/kode cocok, tidak ada spasi tersembunyi atau duplikat.');
  process.exit(0);
}

console.log('');
problems.forEach((problem) => console.log(`GAGAL ${problem}`));
console.log('');
console.log(`Total masalah: ${problems.length}`);
process.exit(1);
