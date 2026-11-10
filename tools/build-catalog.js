#!/usr/bin/env node
/**
 * build-catalog.js — menulis ulang php/data/catalog.json dari sumber JS.
 *
 * Sumber kebenaran: js/data.js (kategori, toko, alamat, banner, voucher,
 * settings) + js/products.js (produk, harga, varian).
 * Jalankan setelah mengubah harga, varian, atau aturan voucher:
 *
 *   npm run build:catalog
 *
 * Keluar dengan kode 1 jika data sumber tidak lengkap, supaya catalog.json
 * tidak pernah ditulis setengah jadi.
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
  process.exit(1);
}

let data;
try {
  const source =
    fs.readFileSync(dataFile, 'utf8') +
    '\n' +
    fs.readFileSync(productsFile, 'utf8') +
    '\n;globalThis.__DATA__ = { PRODUCTS, CATEGORIES, STORES, ADDRESSES, BANNERS, VOUCHERS, STORE, SETTINGS };';

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: productsFile });
  data = sandbox.__DATA__;
} catch (error) {
  fail(`Gagal mengevaluasi js/data.js + js/products.js: ${error.message}`);
}

const lists = ['PRODUCTS', 'CATEGORIES', 'STORES', 'ADDRESSES', 'BANNERS', 'VOUCHERS'];
for (const name of lists) {
  if (!Array.isArray(data[name]) || data[name].length === 0) {
    fail(`${name} kosong atau bukan array; catalog.json tidak ditulis.`);
  }
}

if (!data.STORE || typeof data.STORE !== 'object') {
  fail('STORE tidak ditemukan; catalog.json tidak ditulis.');
}

if (!data.SETTINGS || typeof data.SETTINGS !== 'object') {
  fail('SETTINGS tidak ditemukan; catalog.json tidak ditulis.');
}

for (const product of data.PRODUCTS) {
  if (!product.id || !Number.isFinite(product.price) || !Array.isArray(product.variants)) {
    fail(`Produk tidak lengkap (butuh id, price, variants): ${JSON.stringify(product.id)}`);
  }
}

for (const voucher of data.VOUCHERS) {
  if (!voucher.code || !Number.isFinite(voucher.min) || !voucher.rules) {
    fail(`Voucher tidak lengkap (butuh code, min, rules): ${JSON.stringify(voucher.code)}`);
  }
}

const catalog = {
  products: data.PRODUCTS,
  categories: data.CATEGORIES,
  vouchers: data.VOUCHERS,
  stores: data.STORES,
  addresses: data.ADDRESSES,
  banners: data.BANNERS,
  store: data.STORE,
  settings: data.SETTINGS,
};

try {
  fs.writeFileSync(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`);
} catch (error) {
  fail(`Gagal menulis ${catalogFile}: ${error.message}`);
}

console.log('catalog.json ditulis dari js/data.js + js/products.js');
console.log(
  `INFO  ${catalog.products.length} produk, ${catalog.vouchers.length} voucher, ` +
    `${catalog.categories.length} kategori, ${catalog.stores.length} toko, ` +
    `${catalog.addresses.length} alamat, ${catalog.banners.length} banner + settings`
);
