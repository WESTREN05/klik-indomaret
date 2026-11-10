#!/usr/bin/env node
/**
 * test-api.js — kasus uji klasifikasi error di js/api.js.
 *
 * Jalankan dari root proyek:
 *   node tools/test-api.js
 *
 * Fokus: fallback offline hanya untuk endpoint yang tidak tersedia di server
 * statis, bukan untuk error HTML 5xx dari PHP.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const apiSource = fs.readFileSync(path.join(root, 'js', 'api.js'), 'utf8');

function createApi(fetchImpl) {
  const sandbox = {
    fetch: fetchImpl,
    AbortController: globalThis.AbortController,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    console,
    location: { protocol: 'http:' },
    window: {
      KLIK_API_BASE: 'api',
      KLIK_API_TIMEOUT_MS: 1000,
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(apiSource, sandbox, { filename: 'js/api.js' });
  return sandbox.window.KlikApi;
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  };
}

async function expectError(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  assert.fail('Permintaan seharusnya gagal.');
}

let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  try {
    await fn();
    passed += 1;
    console.log(`LULUS  ${name}`);
  } catch (error) {
    console.error(`GAGAL  ${name}`);
    console.error(`       ${error.message}`);
  }
}

(async () => {
  await test('HTML 500 dari PHP bukan mode offline', async () => {
    const api = createApi(async () => response(500, '<html><body>Fatal error</body></html>'));
    const error = await expectError(api.request('profile.php'));

    assert.strictEqual(error.status, 500);
    assert.strictEqual(error.offline, false);
    assert.strictEqual(error.message, 'Terjadi kesalahan pada server. Coba lagi nanti.');
  });

  await test('HTML 503 bukan mode offline', async () => {
    const api = createApi(async () => response(503, '<html><body>Service unavailable</body></html>'));
    const error = await expectError(api.request('orders.php'));

    assert.strictEqual(error.status, 503);
    assert.strictEqual(error.offline, false);
    assert.strictEqual(error.message, 'Terjadi kesalahan pada server. Coba lagi nanti.');
  });

  await test('JSON 500 memakai pesan server dan bukan mode offline', async () => {
    const api = createApi(async () => response(500, JSON.stringify({ ok: false, error: 'Gagal menyimpan.' })));
    const error = await expectError(api.request('profile.php'));

    assert.strictEqual(error.status, 500);
    assert.strictEqual(error.offline, false);
    assert.strictEqual(error.message, 'Gagal menyimpan.');
  });

  await test('JSON 422 memakai pesan server', async () => {
    const api = createApi(async () => response(422, JSON.stringify({ ok: false, error: 'Keranjang masih kosong.' })));
    const error = await expectError(api.request('orders.php'));

    assert.strictEqual(error.status, 422);
    assert.strictEqual(error.message, 'Keranjang masih kosong.');
  });

  await test('HTML 404 dari server statis tetap mode offline', async () => {
    const api = createApi(async () => response(404, '<html><body>Not found</body></html>'));
    const error = await expectError(api.request('health.php'));

    assert.strictEqual(error.status, 404);
    assert.strictEqual(error.offline, true);
    assert.strictEqual(error.message, 'Terjadi kesalahan pada server. Coba lagi nanti.');
  });

  await test('respons teks biasa tidak dipakai sebagai pesan error', async () => {
    const api = createApi(async () => response(502, 'Bad gateway'));
    const error = await expectError(api.request('health.php'));

    assert.strictEqual(error.status, 502);
    assert.strictEqual(error.message, 'Terjadi kesalahan pada server. Coba lagi nanti.');
  });

  await test('respons kosong memakai pesan status', async () => {
    const api = createApi(async () => response(500, ''));
    const error = await expectError(api.request('profile.php'));

    assert.strictEqual(error.status, 500);
    assert.strictEqual(error.message, 'Permintaan gagal (500).');
  });

  await test('HTML 405/501 dari server statis tetap mode offline', async () => {
    for (const status of [405, 501]) {
      const api = createApi(async () => response(status, '<html><body>Unsupported</body></html>'));
      const error = await expectError(api.request('auth.php?action=login'));

      assert.strictEqual(error.status, status);
      assert.strictEqual(error.offline, true, `status ${status} harus offline`);
    }
  });

  await test('HTML 401 bukan mode offline', async () => {
    const api = createApi(async () => response(401, '<html><body>Unauthorized</body></html>'));
    const error = await expectError(api.request('profile.php'));

    assert.strictEqual(error.status, 401);
    assert.strictEqual(error.offline, false);
    assert.strictEqual(error.message, 'Terjadi kesalahan pada server. Coba lagi nanti.');
  });

  await test('kegagalan jaringan tetap mode offline', async () => {
    const api = createApi(async () => {
      throw new TypeError('Failed to fetch');
    });
    const error = await expectError(api.request('health.php'));

    assert.strictEqual(error.status, 0);
    assert.strictEqual(error.offline, true);
  });

  console.log('');
  if (passed !== total) {
    console.error(`${passed}/${total} kasus lulus.`);
    process.exit(1);
  }

  console.log(`OK ${passed}/${total} kasus lulus.`);
})();
