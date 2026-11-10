/* checkout.js — sinkronisasi poin dan alur checkout sebelum pembayaran */

const KlikCheckout = (() => {
  /**
   * Samakan saldo poin dengan server sebelum total ditampilkan, supaya angka
   * di sheet pembayaran sama dengan yang nanti ditagih server. Mengembalikan
   * false kalau sesi sudah habis.
   */
  async function syncPointsBeforePay() {
    if (!window.KlikApi?.isPhp() || !getUser()) return true;

    const before = getPoints();
    let sessionOk = true;

    try {
      const result = await window.KlikApi.me();
      if (result.user) applyUserSession(result.user);
      applyVoucherState(result);
    } catch (error) {
      if (error.status === 401) {
        toast('Sesi kamu habis. Silakan masuk lagi.', 'error');
        promptLogin('keranjang.html');
        sessionOk = false;
      }
      // Server tidak tersedia: biarkan cache dipakai, server tetap menolak
      // penukaran poin yang tidak valid saat pesanan dibuat.
    }

    let changed = getPoints() !== before;
    if (KlikCart.usePoints && getPoints() < KlikPricing.POINT_COST) {
      KlikCart.setUsePoints(false);
      changed = true;
      toast('Poin kamu tidak cukup lagi, potongan poin dilepas.', 'info');
    }

    if (changed) KlikCart.render();
    return sessionOk;
  }

  let busy = false;

  async function checkout() {
    if (busy) return;
    if (!getUser()) {
      promptLogin('keranjang.html');
      return;
    }
    if (!KlikCart.getCheckedItems().length) {
      toast('Pilih minimal satu produk dulu ya.', 'error');
      return;
    }

    busy = true;
    const payBtn = $('#payBtn');
    if (payBtn) payBtn.disabled = true;

    let sessionOk = true;
    try {
      sessionOk = await syncPointsBeforePay();
    } finally {
      busy = false;
      const freshBtn = $('#payBtn');
      if (freshBtn) freshBtn.disabled = !KlikCart.getCheckedItems().length;
    }

    if (!sessionOk || !KlikCart.getCheckedItems().length) return;
    KlikPayment.open();
  }

  return { checkout, syncPointsBeforePay };
})();
