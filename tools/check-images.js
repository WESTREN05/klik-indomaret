#!/usr/bin/env node
/**
 * check-images.js — memastikan foto produk memakai nama dan format yang dimuat aplikasi.
 *
 * Aplikasi meminta: assets/products/<id>.jpg (huruf kecil, ekstensi .jpg).
 * Foto yang belum ada hanya dilaporkan sebagai INFO agar check tetap hijau
 * selama pengumpulan foto. Jalankan dengan --strict untuk menjadikannya gagal.
 *
 *   node tools/check-images.js
 *   node tools/check-images.js --strict
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const productsFile = path.join(root, 'js', 'products.js');
const assetsDir = path.join(root, 'assets', 'products');
const strict = process.argv.includes('--strict');
const IMAGE_EXT = /\.(?:jpe?g|png|webp|gif)$/i;

function fail(message) {
  console.error(`GAGAL: ${message}`);
  process.exit(2);
}

if (!fs.existsSync(productsFile)) fail(`File tidak ditemukan: ${productsFile}`);
if (!fs.existsSync(assetsDir)) fail(`Folder tidak ditemukan: ${assetsDir}`);

let products;
try {
  const source = fs.readFileSync(productsFile, 'utf8') + '\n;globalThis.__PRODUCTS__ = PRODUCTS;';
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: productsFile });
  products = sandbox.__PRODUCTS__;
} catch (error) {
  fail(`Gagal mengevaluasi js/products.js: ${error.message}`);
}

if (!Array.isArray(products) || products.length === 0) {
  fail('PRODUCTS kosong atau bukan array.');
}

const files = fs.readdirSync(assetsDir, { withFileTypes: true });
const imageFiles = files.filter((entry) => entry.isFile() && IMAGE_EXT.test(entry.name));
const exactFiles = new Set(imageFiles.map((entry) => entry.name));
const lowerFiles = new Map(imageFiles.map((entry) => [entry.name.toLowerCase(), entry.name]));

const ids = new Set();
const missing = [];
const problems = [];
let ready = 0;

for (const product of products) {
  const id = String(product?.id || '').trim();
  if (!id) {
    problems.push('Ada produk tanpa id.');
    continue;
  }
  if (ids.has(id)) {
    problems.push(`id produk duplikat: ${id}`);
    continue;
  }
  ids.add(id);

  const expected = `${id}.jpg`;
  if (exactFiles.has(expected)) {
    const size = fs.statSync(path.join(assetsDir, expected)).size;
    if (size === 0) problems.push(`${expected} kosong (0 byte).`);
    else ready += 1;
    continue;
  }

  const wrongCase = lowerFiles.get(expected.toLowerCase());
  if (wrongCase) {
    problems.push(`${wrongCase} harus diganti menjadi ${expected} (huruf kecil).`);
    continue;
  }

  const wrongFormat = imageFiles.find(
    (entry) => path.parse(entry.name).name.toLowerCase() === id.toLowerCase()
  );
  if (wrongFormat) {
    problems.push(`${wrongFormat} memakai format yang tidak dimuat; simpan ulang sebagai ${expected}.`);
    continue;
  }

  missing.push(expected);
}

const extras = imageFiles
  .map((entry) => entry.name)
  .filter((name) => !ids.has(path.parse(name).name.toLowerCase()));

console.log('Pemeriksaan foto produk');
console.log('='.repeat(56));
console.log(`INFO  siap dimuat: ${ready}/${products.length} produk`);

if (missing.length > 0) {
  console.log(`INFO  belum ada: ${missing.length} foto`);
  console.log(`      ${missing.join(', ')}`);
}

if (extras.length > 0) {
  console.log(`INFO  file gambar tidak terpakai: ${extras.join(', ')}`);
}

problems.forEach((problem) => console.log(`GAGAL ${problem}`));

if (problems.length > 0) {
  console.log('');
  console.log(`Total masalah: ${problems.length} (nama/format file harus diperbaiki).`);
  process.exit(1);
}

if (missing.length > 0 && strict) {
  console.log('');
  console.log(`Mode strict: ${missing.length} foto masih belum ada.`);
  process.exit(1);
}

if (missing.length === 0) {
  console.log('OK    Semua foto produk lengkap dan memakai nama yang benar.');
} else {
  console.log('OK    Semua file yang sudah ada memakai nama/format yang benar.');
  console.log('      Jalankan dengan --strict jika foto yang belum ada harus dianggap gagal.');
}
