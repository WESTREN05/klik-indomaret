/* session.js — sesi user, alamat/toko, saldo/poin, dan klaim voucher */

const getUser = () => Store.get(KEY.user, null);
const setUser = (user) => Store.set(KEY.user, user);

// Cache pesanan dipisah per akun agar riwayat akun sebelumnya tidak tampil
// saat user berganti akun di perangkat yang sama.
const ordersCacheKey = (user = getUser()) => {
  const identity = String(user?.id ?? user?.phone ?? user?.email ?? '').trim();
  return identity ? `${KEY.orders}:${identity}` : KEY.orders;
};
const getCachedOrders = (user = getUser()) => Store.get(ordersCacheKey(user), []);
const setCachedOrders = (orders, user = getUser()) => Store.set(ordersCacheKey(user), orders);

const logout = () => {
  const currentOrdersKey = ordersCacheKey();
  Store.remove(KEY.user);
  Store.remove(currentOrdersKey);
  Store.remove(KEY.orders);
  Store.remove(KEY.claimed);
  Store.remove(KEY.used);
  Store.remove(KEY.activeVoucher);
  Store.remove(KEY.address);
  Store.remove(KEY.store);
  Store.remove(KEY.saldo);
  Store.remove(KEY.points);
  if (window.KlikApi?.isPhp()) {
    window.KlikApi.logout().catch(() => {});
  }
};

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || 'U';

const getAddress = () => Store.get(KEY.address, ADDRESSES[0]);
const setAddress = (address) => Store.set(KEY.address, address);

const getStoreData = () => Store.get(KEY.store, STORES[0]);
const setStoreData = (store) => Store.set(KEY.store, store);

const getSaldo = () => Store.get(KEY.saldo, 0);
const setSaldo = (value) => Store.set(KEY.saldo, value);

const getPoints = () => Store.get(KEY.points, 0);
const setPoints = (value) => Store.set(KEY.points, value);

// Satu stamp per 400 poin. Demo 4.850 poin menghasilkan 12 stamp.
const STAMP_POINTS = 400;
const getStamp = () => Math.floor(Math.max(0, getPoints()) / STAMP_POINTS);

const getWishlist = () => {
  const list = Store.get(KEY.wishlist, []);
  return Array.isArray(list) ? list.filter((id) => typeof id === 'string' && id) : [];
};
const isWishlisted = (id) => getWishlist().includes(id);
const toggleWishlist = (id) => {
  if (!id) return false;
  const list = getWishlist();
  const liked = list.includes(id);
  Store.set(KEY.wishlist, liked ? list.filter((item) => item !== id) : [...list, id]);
  return !liked;
};

const getClaimed = () => Store.get(KEY.claimed, []);
const getUsed = () => Store.get(KEY.used, []);
const isVoucherUsed = (code) => getUsed().includes(code);

// Voucher pilihan dipakai lintas halaman (mis. tombol Pakai di halaman Promo).
const getPreferredVoucher = () => Store.get(KEY.activeVoucher, null);
const setPreferredVoucher = (code) => {
  if (code) Store.set(KEY.activeVoucher, code);
  else Store.remove(KEY.activeVoucher);
};

/** Simpan status voucher (diklaim + sudah dipakai) dari respons server. */
function applyVoucherState(result) {
  if (Array.isArray(result?.claimed)) Store.set(KEY.claimed, result.claimed);
  if (Array.isArray(result?.used)) Store.set(KEY.used, result.used);
}
async function claimVoucher(code) {
  // Opsi A: klaim terikat ke akun. Di mode PHP, tamu harus masuk dulu.
  if (window.KlikApi?.isPhp() && !getUser()) {
    promptLogin();
    return false;
  }

  const claimed = getClaimed();
  if (!claimed.includes(code)) {
    claimed.push(code);
    Store.set(KEY.claimed, claimed);
  }

  if (window.KlikApi?.isPhp() && getUser()) {
    try {
      const result = await window.KlikApi.claimVoucher(code);
      applyVoucherState(result);
      return true;
    } catch (error) {
      // Jangan biarkan klaim lokal menempel kalau server menolak/mati.
      Store.set(KEY.claimed, getClaimed().filter((item) => item !== code));
      if (error.status === 401) {
        logout();
        promptLogin();
        return false;
      }
      if (error.offline) {
        console.warn('[Klik] Klaim voucher gagal disinkronkan: server tidak tersedia.', error);
      } else {
        toast(error.message || 'Voucher gagal diklaim.', 'error');
      }
      return false;
    }
  }

  return true;
}
const isClaimed = (code) => getClaimed().includes(code);

/**
 * Bersihkan cache milik akun sebelumnya saat akun berbeda masuk tanpa logout.
 * Mode PHP akan mengisi ulang saldo/poin/voucher dari server; mode statis
 * tidak punya data server, jadi cache lama harus dibuang agar tidak bocor.
 */
function resetAccountCacheFor(nextUser) {
  const previous = getUser();
  if (!previous) return;

  const identity = (user) => String(user?.id ?? user?.phone ?? user?.email ?? '').trim();
  const before = identity(previous);
  const after = identity(nextUser);
  if (before && after && before === after) return;

  Store.remove(ordersCacheKey(previous));
  Store.remove(KEY.orders);
  Store.remove(KEY.claimed);
  Store.remove(KEY.used);
  Store.remove(KEY.activeVoucher);
  Store.remove(KEY.saldo);
  Store.remove(KEY.points);
}

/**
 * Simpan user dari server ke cache localStorage sekaligus saldo & poinnya.
 */
function applyUserSession(user) {
  if (!user) return;
  setUser(user);
  if (typeof user.saldo === 'number') setSaldo(user.saldo);
  if (typeof user.points === 'number') setPoints(user.points);
  updateSaldoUI();
}
