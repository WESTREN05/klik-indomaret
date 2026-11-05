/* keranjang.js — keranjang, voucher, poin, checkout */

const cartRoot = $('#cartRoot');

let delivery = Store.get(KEY.delivery, 'express');
let usePoints = false;
let activeVoucher = delivery === 'express' && isClaimed('GRATISONGKIR') ? 'GRATISONGKIR' : null;
let selected = new Set(getCart().map(cartKey));

const catName = (id) => CATEGORIES.find((cat) => cat.id === id)?.name || 'Produk';
const checkedItems = () => getCart().filter((item) => selected.has(cartKey(item)));

function syncSelection(items) {
  const keys = new Set(items.map(cartKey));
  [...selected].forEach((key) => {
    if (!keys.has(key)) selected.delete(key);
  });
}

function totals() {
  const items = checkedItems();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);
  const originalTotal = items.reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + (p.original || p.price) * item.qty;
  }, 0);
  const promoDiscount = Math.max(0, originalTotal - subtotal);
  const shippingFee = items.length && delivery === 'express' ? 10000 : 0;

  const voucher = VOUCHERS.find((v) => v.code === activeVoucher);
  let voucherDiscount = 0;
  let voucherLabel = '';
  if (voucher && isClaimed(voucher.code) && subtotal >= voucher.min) {
    if (voucher.code === 'GRATISONGKIR') {
      if (delivery === 'express') {
        voucherDiscount = Math.min(10000, shippingFee);
        voucherLabel = 'Diskon Voucher Pengiriman';
      }
    } else if (voucher.code === 'GAJIANHEMAT') {
      voucherDiscount = Math.min(40000, Math.round(subtotal * 0.4));
      voucherLabel = 'Diskon Voucher Gajian';
    } else if (voucher.code === 'NEWMEMBER') {
      voucherDiscount = 15000;
      voucherLabel = 'Diskon Voucher Member';
    } else if (voucher.code === 'SABTUMERIAH') {
      if (delivery === 'express') {
        voucherDiscount = Math.min(30000, Math.round(subtotal * 0.3)) + Math.min(10000, shippingFee);
        voucherLabel = 'Diskon Voucher Sabtu Meriah';
      }
    }
  }

  const voucherActive = voucherDiscount > 0;
  const pointsDiscount = usePoints && getPoints() >= 2000 && items.length ? 2000 : 0;
  const total = Math.max(0, subtotal + shippingFee - voucherDiscount - pointsDiscount);
  const saving = promoDiscount + voucherDiscount + pointsDiscount;
  const jenis = new Set(items.map((item) => item.id)).size;
  return { items, count, subtotal, originalTotal, promoDiscount, shippingFee, voucher, voucherActive, voucherDiscount, voucherLabel, pointsDiscount, total, saving, jenis };
}

function emptyHTML() {
  return `<div class="empty">
    <span class="empty__icon">🛒</span>
    <h2>Keranjangmu masih kosong</h2>
    <p>Yuk isi kebutuhan dapur, minuman, dan perawatan diri. Pesan antar 1 jam atau ambil di toko.</p>
    <a class="btn btn--primary" href="kategori.html">${ICON.bag} Mulai belanja</a>
  </div>`;
}

function renderCart() {
  const items = getCart();
  syncSelection(items);
  if (!items.length) {
    cartRoot.innerHTML = emptyHTML();
    return;
  }

  const t = totals();
  const address = getAddress();
  const store = getStoreData();
  const user = getUser();
  const allChecked = items.length > 0 && items.every((item) => selected.has(cartKey(item)));
  const someChecked = items.some((item) => selected.has(cartKey(item)));
  const pointsBalance = getPoints();

  cartRoot.innerHTML = `
    <div class="cart-layout">
    <div class="cart-main">
    <div class="cart-head">
      <button class="address-card js-open-address" type="button">
        <span class="address-card__pin">${ICON.pin}</span>
        <span class="address-card__body">
          <small>Dikirim ke:</small>
          <strong class="js-address-text">${address.detail}</strong>
        </span>
        <span class="address-card__change">Ubah ${ICON.chevronDown}</span>
      </button>
    </div>

    <div class="select-all">
      <input class="checkbox" type="checkbox" id="selectAll" ${allChecked ? 'checked' : ''}>
      <label for="selectAll">Pilih Semua (${t.items.length} Item)</label>
      <button class="link-danger" type="button" id="removeSelected">${ICON.trash} Hapus</button>
    </div>

    <div class="segmented" role="group" aria-label="Metode pengambilan">
      <button type="button" data-delivery="express" class="${delivery === 'express' ? 'is-active' : ''}">${ICON.bolt} Pesan Antar</button>
      <button type="button" data-delivery="pickup" class="${delivery === 'pickup' ? 'is-active' : ''}">${ICON.store} Klik &amp; Ambil</button>
    </div>

    <div class="express-card">
      <span class="express-card__icon">${delivery === 'express' ? ICON.bolt : ICON.store}</span>
      <div class="express-card__body">
        ${
          delivery === 'express'
            ? `<span class="express-badge">EXPRESS 1 JAM SAMPAI</span>
               <strong>${address.detail}</strong>
               <small>Toko pemenuhan: ${store.name} · ${store.distance}</small>`
            : `<span class="express-badge" style="background:var(--blue)">SIAP DIAMBIL 30 MENIT</span>
               <strong>${store.name}</strong>
               <small>${store.address} · Gratis biaya ambil</small>`
        }
      </div>
      <button class="express-card__change ${delivery === 'express' ? 'js-open-address' : 'js-open-store'}" type="button">
        ${delivery === 'express' ? 'Ganti Alamat' : 'Ganti Toko'}
      </button>
    </div>

    <div class="section-label">
      <span>Daftar Produk Pesanan</span>
      <span>Stok Toko Dijamin</span>
    </div>

    ${items
      .map((item) => {
        const p = findProduct(item.id);
        const checked = selected.has(cartKey(item));
        return `<article class="cart-item">
          <input class="checkbox" type="checkbox" data-check="${escapeHtml(cartKey(item))}" ${checked ? 'checked' : ''} aria-label="Pilih ${escapeHtml(p.short)}">
          <a href="produk.html?id=${p.id}" aria-label="${escapeHtml(p.name)}">${artHTML(p)}</a>
          <div class="cart-item__body">
            <span class="cart-item__cat">${catName(p.cat)}</span>
            <a class="cart-item__name" href="produk.html?id=${p.id}">${p.name}</a>
            <span class="cart-item__variant">${item.variant || p.unit}</span>
            <div class="cart-item__price">${money(p.price * item.qty)}${p.original > p.price ? `<s>${money(p.original * item.qty)}</s>` : ''}</div>
            <div class="cart-item__foot">
              <span class="stock">Stok Tersedia</span>
              ${stepperHTML(item.id, item.variant, item.qty)}
            </div>
          </div>
          <button class="cart-item__remove" type="button" data-remove="${item.id}" data-variant="${escapeHtml(item.variant)}" aria-label="Hapus ${escapeHtml(p.short)}">${ICON.x}</button>
        </article>`;
      })
      .join('')}

    <div class="info-card">
      <span class="info-card__icon">${ICON.ticket}</span>
      <div class="info-card__body">
        <strong>${t.voucher ? t.voucher.title : 'Voucher belanja'}</strong>
        <small>${
          t.voucherActive
            ? `Hemat ${money(t.voucherDiscount)}${t.voucher.code === 'GRATISONGKIR' ? ' Ongkos Kirim' : ''}`
            : t.voucher
              ? `Min. belanja ${money(t.voucher.min)}`
              : 'Pilih voucher untuk hemat ekstra'
        }</small>
      </div>
      <button class="info-card__link" type="button" id="voucherBtn">${activeVoucher ? 'Ubah' : 'Pakai'}</button>
    </div>

    ${
      user
        ? `<div class="info-card">
            <span class="info-card__icon">${ICON.sparkle}</span>
            <div class="info-card__body">
              <strong>Poinku Indomaret <b>Saldo: ${pointsBalance.toLocaleString('id-ID')}</b></strong>
              <small>Tukarkan 2.000 Poin (-Rp 2.000)</small>
            </div>
            <button class="switch${usePoints ? ' is-on' : ''}" type="button" id="pointsToggle" role="switch" aria-checked="${usePoints}" aria-label="Tukarkan poin"></button>
          </div>`
        : ''
    }

    ${
      t.voucherActive
        ? `<div class="coupon">
            <strong>${ICON.ticket} ${t.voucher.code === 'GRATISONGKIR' ? 'Kupon Gratis Ongkir Aktif!' : `${t.voucher.title} Aktif!`}</strong>
            <p>${
              t.voucher.code === 'GRATISONGKIR'
                ? 'Mantap! Kamu menghemat biaya pengiriman penuh untuk pesanan ke alamat ini.'
                : `Kamu menghemat ${money(t.voucherDiscount)} dari voucher ${t.voucher.code}.`
            }</p>
          </div>`
        : ''
    }
    </div>

    <aside class="cart-side">
    <div class="summary">
      <h3>Rincian Pembayaran</h3>
      <div class="summary__row"><span>Total Harga (${t.jenis} Jenis, ${t.count} Barang)</span><span>${money(t.originalTotal)}</span></div>
      ${t.promoDiscount ? `<div class="summary__row summary__row--discount"><span>Diskon Produk Promo</span><span>-${money(t.promoDiscount)}</span></div>` : ''}
      <div class="summary__row"><span>Biaya Pengiriman (${delivery === 'express' ? 'Express 1 Jam' : 'Ambil di Toko'})</span><span>${t.shippingFee ? money(t.shippingFee) : 'GRATIS'}</span></div>
      ${t.voucherDiscount ? `<div class="summary__row summary__row--discount"><span>${t.voucherLabel}</span><span>-${money(t.voucherDiscount)}</span></div>` : ''}
      ${t.pointsDiscount ? `<div class="summary__row summary__row--point"><span>Potongan Poin Indomaret</span><span>-${money(t.pointsDiscount)}</span></div>` : ''}
      <div class="summary__total">
        <div><small>Subtotal Belanja</small><strong>${money(t.total)}</strong></div>
        <div class="summary__save">Hemat ${money(t.saving)}</div>
      </div>
    </div>

    <div class="feature-chips">
      <div class="feature-chip"><span>🛡️</span>100% Produk Asli</div>
      <div class="feature-chip"><span>⏱️</span>1 Jam Terkirim</div>
      <div class="feature-chip"><span>😊</span>Garansi Segar</div>
    </div>

    <div class="paybar">
      <div class="paybar__total">
        <small>Total Tagihan</small>
        <strong>${money(t.total)}</strong>
        <span class="save">Hemat ${money(t.saving)}</span>
      </div>
      <button class="btn btn--primary" type="button" id="payBtn" ${someChecked ? '' : 'disabled'}>Bayar Sekarang ${ICON.arrowRight}</button>
    </div>
    </aside>
    </div>`;

  bindCart();
}

function bindCart() {
  const items = getCart();
  const selectAll = $('#selectAll');
  if (selectAll) {
    selectAll.indeterminate = selected.size > 0 && selected.size < items.length;
    selectAll.addEventListener('change', () => {
      if (selectAll.checked) items.forEach((item) => selected.add(cartKey(item)));
      else selected.clear();
      renderCart();
    });
  }

  $$('[data-check]', cartRoot).forEach((box) => {
    box.addEventListener('change', () => {
      const key = box.dataset.check;
      if (box.checked) selected.add(key);
      else selected.delete(key);
      renderCart();
    });
  });

  $('#removeSelected')?.addEventListener('click', () => {
    if (!selected.size) {
      toast('Belum ada produk yang dipilih.', 'info');
      return;
    }
    const remainingItems = getCart().filter((item) => !selected.has(cartKey(item)));
    selected.clear();
    saveCart(remainingItems);
    toast('Produk terpilih dihapus dari keranjang.', 'success');
  });

  $$('[data-remove]', cartRoot).forEach((btn) => {
    btn.addEventListener('click', () => {
      removeItem(btn.dataset.remove, btn.dataset.variant);
      toast('Produk dihapus dari keranjang.', 'info');
    });
  });

  $$('.segmented [data-delivery]', cartRoot).forEach((btn) => {
    btn.addEventListener('click', () => {
      delivery = btn.dataset.delivery;
      Store.set(KEY.delivery, delivery);
      if (delivery === 'pickup' && (activeVoucher === 'GRATISONGKIR' || activeVoucher === 'SABTUMERIAH')) activeVoucher = null;
      else if (delivery === 'express' && !activeVoucher && isClaimed('GRATISONGKIR') && totals().subtotal >= 50000) activeVoucher = 'GRATISONGKIR';
      renderCart();
    });
  });

  $('#voucherBtn')?.addEventListener('click', () => openVoucherSheet(totals().subtotal));

  $('#pointsToggle')?.addEventListener('click', () => {
    if (getPoints() < 2000) {
      toast('Poin kamu belum cukup untuk penukaran.', 'error');
      return;
    }
    usePoints = !usePoints;
    renderCart();
  });

  $('#payBtn')?.addEventListener('click', checkout);
}

function openVoucherSheet(subtotal) {
  const wrap = openSheet({
    title: 'Voucher & promo',
    body: `<div class="option-list">
      ${VOUCHERS.map((voucher) => {
        const claimed = isClaimed(voucher.code);
        const requiresExpress = voucher.code === 'GRATISONGKIR' || voucher.code === 'SABTUMERIAH';
        const applicable = claimed && subtotal >= voucher.min && (!requiresExpress || delivery === 'express');
        const statusText = !claimed
          ? 'Klaim dulu di halaman Promo'
          : subtotal < voucher.min
            ? `Min. belanja ${money(voucher.min)}`
            : applicable
              ? 'Bisa dipakai untuk pesanan ini'
              : 'Hanya untuk pesanan antar (express)';
        return `<button class="option${activeVoucher === voucher.code ? ' is-selected' : ''}" type="button" data-voucher="${voucher.code}" ${applicable ? '' : 'disabled'}>
          <span class="option__icon">${ICON.ticket}</span>
          <span class="option__body">
            <strong>${voucher.title}</strong>
            <small>${voucher.desc}</small>
            <small>${statusText}</small>
          </span>
          ${activeVoucher === voucher.code ? `<span class="option__check">${ICON.check}</span>` : ''}
        </button>`;
      }).join('')}
      <button class="option" type="button" data-voucher="">${ICON.x} Tanpa voucher</button>
    </div>`,
  });
  wrap.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-voucher]');
    if (!btn || btn.disabled) return;
    activeVoucher = btn.dataset.voucher || null;
    closeSheet();
    renderCart();
    toast(activeVoucher ? 'Voucher berhasil dipakai.' : 'Voucher dilepas.', activeVoucher ? 'success' : 'info');
  });
}

function checkout() {
  if (!getUser()) {
    promptLogin('keranjang.html');
    return;
  }
  if (!checkedItems().length) {
    toast('Pilih minimal satu produk dulu ya.', 'error');
    return;
  }
  openPaymentSheet();
}

function openPaymentSheet() {
  const t = totals();
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
  const t = totals();
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
    } catch (error) {
      if (error.status === 401) {
        toast('Sesi kamu habis. Silakan masuk lagi.', 'error');
        promptLogin('keranjang.html');
        return;
      }
      if (!error.offline) {
        toast(error.message || 'Pesanan gagal diproses.', 'error');
        return;
      }
      // Server PHP tidak tersedia: lanjut simpan pesanan secara lokal.
    }
  }

  const orders = Store.get(KEY.orders, []);
  orders.unshift(order);
  Store.set(KEY.orders, orders);

  const remainingItems = getCart().filter((item) => !selected.has(cartKey(item)));
  selected.clear();
  saveCart(remainingItems);

  if (!serverHandled) {
    if (usePoints) setPoints(Math.max(0, getPoints() - 2000));
    setPoints(getPoints() + Math.floor(order.total / 1000));
  }
  usePoints = false;

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

document.addEventListener('cart:change', renderCart);
renderCart();
