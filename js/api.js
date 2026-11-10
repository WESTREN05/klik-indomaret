/* =========================================================
   api.js — jembatan frontend ke backend PHP
   Kalau server PHP tidak tersedia, halaman tetap jalan
   memakai localStorage (mode static).
   ========================================================= */

const KlikApi = (() => {
  const base = (window.KLIK_API_BASE || 'api').replace(/\/+$/, '');
  const isHttp = location.protocol === 'http:' || location.protocol === 'https:';

  class ApiError extends Error {
    constructor(message, status = 0, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
      this.offline = status === 0;
      this.timeout = false;
    }
  }

  async function request(path, options = {}) {
    if (!isHttp) {
      throw new ApiError('API PHP hanya tersedia lewat local server.', 0, null);
    }

    const method = options.method || 'GET';
    const body = options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body;
    const headers = {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const configuredTimeout = Number(window.KLIK_API_TIMEOUT_MS);
    const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 10000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    let text;
    try {
      response = await fetch(`${base}/${path}`, {
        method,
        headers,
        body,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      });
      text = await response.text();
    } catch (error) {
      if (controller.signal.aborted) {
        const apiError = new ApiError('Server tidak merespons. Periksa koneksi lalu coba lagi.', 0, null);
        apiError.offline = false;
        apiError.timeout = true;
        throw apiError;
      }
      throw new ApiError('Tidak bisa terhubung ke server PHP.', 0, null);
    } finally {
      clearTimeout(timer);
    }
    let data = null;
    let isJson = true;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      isJson = false;
      data = { ok: false, error: text || 'Respons server tidak valid.' };
    }

    if (!response.ok || (data && data.ok === false)) {
      const apiError = new ApiError(
        (data && data.error) || `Permintaan gagal (${response.status}).`,
        response.status,
        data
      );
      // Server statis (Python/Live Server) membalas HTML 404/405/501 karena
      // endpoint PHP tidak ada. Hanya status itu yang dianggap API tidak
      // tersedia; HTML 500 dari PHP adalah error server sungguhan.
      const staticServerMiss = !isJson && [404, 405, 501].includes(response.status);
      if (staticServerMiss) apiError.offline = true;
      throw apiError;
    }

    return data || { ok: true };
  }

  return {
    isHttp: () => isHttp,
    // Marker ini hanya disuntikkan oleh php/page.php. Halaman statis tidak punya marker.
    isPhp: () => window.KLIK_BOOTSTRAP?.php === true,
    base,
    request,
    health: () => request('health.php'),
    me: () => request('auth.php?action=me'),
    login: (contact, password) =>
      request('auth.php?action=login', { method: 'POST', body: { contact, password } }),
    register: (data) => request('auth.php?action=register', { method: 'POST', body: data }),
    logout: () => request('auth.php?action=logout', { method: 'POST' }),
    forgot: (contact) => request('auth.php?action=forgot', { method: 'POST', body: { contact } }),
    orders: () => request('orders.php'),
    createOrder: (order) => request('orders.php', { method: 'POST', body: order }),
    vouchers: () => request('vouchers.php'),
    claimVoucher: (code) => request('vouchers.php', { method: 'POST', body: { code } }),
    profile: () => request('profile.php'),
    updateProfile: (data) => request('profile.php', { method: 'POST', body: data }),
    topup: (amount) => request('profile.php?action=topup', { method: 'POST', body: { amount } }),
  };
})();

window.KlikApi = KlikApi;
