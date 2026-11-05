/* session.js — sesi user, alamat/toko, saldo/poin, dan klaim voucher */

const getUser = () => Store.get(KEY.user, null);
const setUser = (user) => Store.set(KEY.user, user);
const logout = () => {
  Store.remove(KEY.user);
  Store.remove(KEY.orders);
  Store.remove(KEY.claimed);
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

const getClaimed = () => Store.get(KEY.claimed, []);
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
      if (Array.isArray(result.claimed)) Store.set(KEY.claimed, result.claimed);
      return true;
    } catch (error) {
      // Jangan biarkan klaim lokal menempel kalau server menolak/mati.
      Store.set(KEY.claimed, getClaimed().filter((item) => item !== code));
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
 * Simpan user dari server ke cache localStorage sekaligus saldo & poinnya.
 */
function applyUserSession(user) {
  if (!user) return;
  setUser(user);
  if (typeof user.saldo === 'number') setSaldo(user.saldo);
  if (typeof user.points === 'number') setPoints(user.points);
  updateSaldoUI();
}
