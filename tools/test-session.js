#!/usr/bin/env node
/**
 * test-session.js — kasus uji untuk js/session.js dan js/core.js.
 *
 * Jalankan dari root proyek:
 *   node tools/test-session.js
 *
 * Fokus: data akun apa saja yang harus hilang saat logout, dan apa yang
 * sengaja dipertahankan (keranjang + pilihan pengiriman).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

function createLocalStorage() {
  const data = new Map();
  return {
    data,
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

/**
 * Muat data.js + core.js + session.js di satu konteks, dengan localStorage
 * palsu dan mode PHP yang bisa diatur per kasus uji.
 */
function createSession({ phpMode = false } = {}) {
  const calls = { logout: 0 };
  const sandbox = {
    localStorage: createLocalStorage(),
    location: { search: '', href: '' },
    document: { addEventListener() {} },
    URLSearchParams,
    console,
    toast() {},
    setTimeout() {
      return 0;
    },
    updateSaldoUI() {},
    window: {
      KlikApi: {
        isPhp: () => phpMode,
        logout: () => {
          calls.logout += 1;
          return Promise.resolve({ ok: true });
        },
      },
    },
  };

  const source =
    fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'core.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'session.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(root, 'js', 'login-auth.js'), 'utf8') +
    '\n;globalThis.__SESSION__ = { Store, KEY, logout, getAddress, getStoreData, getUsed, isVoucherUsed, applyVoucherState, applyUserSession, getSaldo, getPoints, getPreferredVoucher, setPreferredVoucher, KlikLoginAuth };';

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'js/session.js' });

  return {
    ...sandbox.__SESSION__,
    localStorage: sandbox.localStorage,
    calls,
  };
}

function seedAccount(session) {
  const { Store, KEY } = session;
  Store.set(KEY.user, { id: 7, name: 'Bagas Pratama' });
  Store.set(`${KEY.orders}:7`, [{ id: 'INV-1' }]);
  Store.set(KEY.orders, [{ id: 'INV-lama' }]);
  Store.set(KEY.address, { id: 'kantor', label: 'Kantor' });
  Store.set(KEY.store, { id: 'toko-2', name: 'Toko Lain' });
  Store.set(KEY.saldo, 185000);
  Store.set(KEY.points, 4969);
  Store.set(KEY.claimed, ['SABTUMERIAH']);
  Store.set(KEY.used, ['SABTUMERIAH']);
  Store.set(KEY.activeVoucher, 'SABTUMERIAH');
  Store.set(KEY.cart, [{ id: 'sania-2l', qty: 1, variant: 'Pouch 2L' }]);
  Store.set(KEY.delivery, 'express');
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

/* ---- Status voucher dari server ---- */

test('applyVoucherState menyimpan daftar klaim dan voucher terpakai', () => {
  const session = createSession();
  session.applyVoucherState({ claimed: ['SABTUMERIAH', 'NEWMEMBER'], used: ['SABTUMERIAH'] });

  assert.strictEqual(JSON.stringify(session.Store.get(session.KEY.claimed, [])), '["SABTUMERIAH","NEWMEMBER"]');
  assert.strictEqual(JSON.stringify(session.getUsed()), '["SABTUMERIAH"]');
  assert.strictEqual(session.isVoucherUsed('SABTUMERIAH'), true);
  assert.strictEqual(session.isVoucherUsed('NEWMEMBER'), false);
});

test('applyVoucherState tidak menghapus cache saat field tidak dikirim', () => {
  const session = createSession();
  session.Store.set(session.KEY.used, ['SABTUMERIAH']);
  session.applyVoucherState({ claimed: ['SABTUMERIAH'] });

  assert.strictEqual(JSON.stringify(session.getUsed()), '["SABTUMERIAH"]');
});

/* ---- Voucher pilihan lintas halaman ---- */

test('setPreferredVoucher menyimpan dan menghapus pilihan voucher', () => {
  const session = createSession();
  session.setPreferredVoucher('SABTUMERIAH');

  assert.strictEqual(session.getPreferredVoucher(), 'SABTUMERIAH');
  assert.strictEqual(session.localStorage.getItem(session.KEY.activeVoucher), JSON.stringify('SABTUMERIAH'));

  session.setPreferredVoucher(null);
  assert.strictEqual(session.getPreferredVoucher(), null);
  assert.strictEqual(session.localStorage.getItem(session.KEY.activeVoucher), null);
});

/* ---- Sinkronisasi saldo/poin ---- */

test('applyUserSession memakai saldo/poin server walau cache sudah terisi', () => {
  const session = createSession();
  session.Store.set(session.KEY.saldo, 1000);
  session.Store.set(session.KEY.points, 10);
  session.applyUserSession({ id: 1, name: 'Bagas Pratama', saldo: 185000, points: 4850 });

  assert.strictEqual(session.getSaldo(), 185000);
  assert.strictEqual(session.getPoints(), 4850);
});

test('finishAuth tidak menimpa saldo/poin cache yang sudah terisi', () => {
  const session = createSession();
  session.Store.set(session.KEY.saldo, 200000);
  session.Store.set(session.KEY.points, 5000);
  session.KlikLoginAuth.finishAuth({ id: 1, name: 'Bagas Pratama', phone: '081234567890' }, null);

  assert.strictEqual(session.getSaldo(), 200000);
  assert.strictEqual(session.getPoints(), 5000);
});

test('finishAuth memakai saldo/poin server walau cache terisi', () => {
  const session = createSession();
  session.Store.set(session.KEY.saldo, 1000);
  session.Store.set(session.KEY.points, 10);
  session.KlikLoginAuth.finishAuth(
    { id: 1, name: 'Bagas Pratama', phone: '081234567890', saldo: 185000, points: 4850 },
    null
  );

  assert.strictEqual(session.getSaldo(), 185000);
  assert.strictEqual(session.getPoints(), 4850);
});

test('finishAuth mengisi saldo/poin demo saat cache kosong', () => {
  const session = createSession();
  session.KlikLoginAuth.finishAuth({ id: 1, name: 'Bagas Pratama', phone: '081234567890' }, null);

  assert.strictEqual(session.getSaldo(), 185000);
  assert.strictEqual(session.getPoints(), 4850);
});

/* ---- Logout ---- */

test('logout menghapus data akun, alamat, toko, dan status voucher', () => {
  const session = createSession();
  seedAccount(session);
  session.logout();

  for (const key of [
    session.KEY.user,
    `${session.KEY.orders}:7`,
    session.KEY.orders,
    session.KEY.address,
    session.KEY.store,
    session.KEY.saldo,
    session.KEY.points,
    session.KEY.claimed,
    session.KEY.used,
    session.KEY.activeVoucher,
  ]) {
    assert.strictEqual(session.localStorage.getItem(key), null, `${key} masih tersimpan`);
  }
});

test('logout mempertahankan keranjang dan pilihan pengiriman', () => {
  const session = createSession();
  seedAccount(session);
  const cartBefore = session.localStorage.getItem(session.KEY.cart);
  session.logout();

  assert.strictEqual(session.localStorage.getItem(session.KEY.cart), cartBefore);
  assert.strictEqual(session.localStorage.getItem(session.KEY.delivery), JSON.stringify('express'));
});

test('alamat dan toko kembali ke default setelah logout', () => {
  const session = createSession();
  seedAccount(session);
  assert.strictEqual(session.getAddress().id, 'kantor');
  assert.strictEqual(session.getStoreData().id, 'toko-2');

  session.logout();
  assert.strictEqual(session.getAddress().id, 'rumah');
  assert.strictEqual(session.getStoreData().id, 'kemanggi-2');
});

test('logout mode statis tidak memanggil API', () => {
  const session = createSession({ phpMode: false });
  seedAccount(session);
  session.logout();

  assert.strictEqual(session.calls.logout, 0);
});

test('logout mode PHP memanggil API logout sekali', () => {
  const session = createSession({ phpMode: true });
  seedAccount(session);
  session.logout();

  assert.strictEqual(session.calls.logout, 1);
});

console.log('');
if (passed !== total) {
  console.error(`${passed}/${total} kasus lulus.`);
  process.exit(1);
}

console.log(`OK ${passed}/${total} kasus lulus.`);
