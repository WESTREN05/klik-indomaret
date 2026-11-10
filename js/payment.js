/* payment.js — sheet metode pembayaran dan penyelesaian pesanan */

const KlikPayment = (() => {
  function open() {
    const t = KlikCart.getTotals();
    const methods = [
      { id: 'qris', label: 'QRIS', desc: 'Scan pakai aplikasi bank atau e-wallet', icon: ICON.qr },
      { id: 'bank', label: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI', icon: ICON.bank },
      { id: 'cod', label: 'Bayar di Tempat', desc: 'Tunai saat pesanan tiba', icon: ICON.cash },
    ];
    let method = 'qris';
    const wrap = openSheet({
      title: 'Metode pembayaran',
      body: `<p class="sheet__lead">Total tagihan <strong>${money(t.total)}</strong>. Pilih metode pembayaran yang paling nyaman.</p>
        <div class="option-list" id="payMethods">
          ${methods
            .map(
              (m) => `<button class="option${m.id === method ? ' is-selected' : ''}" type="button" data-pay="${m.id}">
                <span class="option__icon">${m.icon}</span>
                <span class="option__body"><strong>${m.label}</strong><small>${m.desc}</small></span>
                ${m.id === method ? `<span class="option__check">${ICON.check}</span>` : ''}
              </button>`
            )
            .join('')}
        </div>
        <button class="btn btn--primary btn--block" type="button" id="confirmPay" style="margin-top:12px">Bayar ${money(t.total)}</button>
        <p class="hint">${ICON.info} Ini prototype. Tidak ada transaksi uang sungguhan.</p>`,
    });

    let paying = false;
    wrap.addEventListener('click', async (event) => {
      const payBtn = event.target.closest('[data-pay]');
      if (payBtn) {
        method = payBtn.dataset.pay;
        $$('[data-pay]', wrap).forEach((btn) => btn.classList.toggle('is-selected', btn === payBtn));
        $$('[data-pay] .option__check', wrap).forEach((check) => check.remove());
        payBtn.insertAdjacentHTML('beforeend', `<span class="option__check">${ICON.check}</span>`);
        return;
      }
      if (!event.target.closest('#confirmPay') || paying) return;

      paying = true;
      closeSheet();
      try {
        await finishOrder(method);
      } finally {
        paying = false;
      }
    });
  }

  async function finishOrder(method) {
    const t = KlikCart.getTotals();
    const delivery = KlikCart.delivery;
    const activeVoucher = KlikCart.activeVoucher;
    const usePoints = KlikCart.usePoints;
    const methodLabel = { qris: 'QRIS', bank: 'Transfer Bank', cod: 'Bayar di Tempat' }[method] || 'QRIS';
    const localOrder = {
      id: `INV-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      items: t.items.map((item) => {
        const p = findProduct(item.id);
        return { id: item.id, name: p.short, qty: item.qty, variant: item.variant, price: p.price, emoji: p.emoji, tint: p.tint };
      }),
      total: t.total,
      saving: t.saving,
      method: methodLabel,
      delivery,
      eta: delivery === 'express' ? '45 menit' : '30 menit',
      status: 'Diproses',
    };

    let order = localOrder;
    let serverHandled = false;

    if (window.KlikApi?.isPhp() && getUser()) {
      // Mode demo: pastikan session PHP untuk akun demo sebelum checkout.
      if (isDemoMode) {
        try {
          const demo = await window.KlikApi.login('081234567890', 'password123');
          if (demo.user) applyUserSession(demo.user);
        } catch (error) {
          /* biarkan request order menangani error session */
        }
      }

      try {
        const result = await window.KlikApi.createOrder({
          items: t.items.map((item) => ({ id: item.id, qty: item.qty, variant: item.variant })),
          voucher: t.voucherActive ? activeVoucher : null,
          usePoints: usePoints && t.pointsDiscount > 0,
          method: methodLabel,
          delivery,
          address: getAddress(),
          store: getStoreData(),
        });

        if (result.order) {
          order = result.order;
          serverHandled = true;
        }
        if (result.user) applyUserSession(result.user);
        applyVoucherState(result);
      } catch (error) {
        if (error.status === 401) {
          toast('Sesi kamu habis. Silakan masuk lagi.', 'error');
          promptLogin('keranjang.html');
          return;
        }
        if (!error.offline) {
          toast(error.message || 'Pesanan gagal diproses.', 'error');
          // Poin berubah di tempat lain: segarkan saldo supaya percobaan
          // berikutnya menampilkan total yang sama dengan tagihan server.
          if (error.status === 422) await KlikCheckout.syncPointsBeforePay();
          return;
        }
        // Server PHP tidak tersedia: lanjut simpan pesanan secara lokal.
      }
    }

    const orders = getCachedOrders();
    orders.unshift(order);
    setCachedOrders(orders);

    KlikCart.clearCheckedItems();

    if (!serverHandled) {
      // Mode statis tidak punya server: catat voucher terpakai agar tidak bisa
      // dipilih lagi pada pesanan berikutnya di perangkat ini.
      if (activeVoucher && !isVoucherUsed(activeVoucher)) {
        Store.set(KEY.used, [...getUsed(), activeVoucher]);
      }
      if (usePoints) setPoints(Math.max(0, getPoints() - KlikPricing.POINT_COST));
      setPoints(getPoints() + Math.floor(order.total / 1000));
    }
    KlikCart.setUsePoints(false);
    KlikCart.setActiveVoucher(null);

    showSuccess(order);
  }

  function showSuccess(order) {
    const overlay = document.createElement('div');
    overlay.className = 'success';
    overlay.innerHTML = `<div class="success__inner">
      <div class="success__check">${ICON.check}</div>
      <h1>Pesanan diterima!</h1>
      <p>Terima kasih, pesananmu sedang disiapkan oleh ${getStoreData().name}.</p>
      <div class="success__card">
        <div class="success__row"><span>Nomor pesanan</span><strong>${order.id}</strong></div>
        <div class="success__row"><span>Estimasi tiba</span><strong>${order.eta}</strong></div>
        <div class="success__row"><span>Metode bayar</span><strong>${order.method}</strong></div>
        <div class="success__row"><span>Total dibayar</span><strong>${money(order.total)}</strong></div>
      </div>
      <a class="btn btn--primary btn--block" href="index.html">Kembali ke Beranda</a>
      <a class="btn btn--ghost btn--block" href="akun.html" style="margin-top:8px">Lihat Pesanan</a>
    </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('no-scroll');
  }

  return { open };
})();
