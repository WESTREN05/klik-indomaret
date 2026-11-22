/* keranjang.js — state keranjang, pemilihan item, dan render halaman */

const cartRoot = $('#cartRoot');

let delivery = Store.get(KEY.delivery, 'express');
let usePoints = false;
const savedVoucher = getPreferredVoucher();
const savedVoucherUsable = Boolean(
  savedVoucher &&
    isClaimed(savedVoucher) &&
    !isVoucherUsed(savedVoucher) &&
    (!KlikPricing.requiresExpress(savedVoucher) || delivery === 'express')
);
let activeVoucher = savedVoucherUsable ? savedVoucher : null;
if (!activeVoucher) {
  setPreferredVoucher(null);
  // Otomatis pakai gratis ongkir hanya kalau benar-benar memenuhi syarat
  // (diklaim, belum dipakai, metode antar, dan minimum belanja tercapai).
  if (
    KlikPricing.voucherUsable('GRATISONGKIR', {
      subtotal: KlikPricing.itemsSummary(getCart()).subtotal,
      delivery,
      claimed: getClaimed(),
      used: getUsed(),
    })
  ) {
    activeVoucher = 'GRATISONGKIR';
  }
}
const selected = new Set(getCart().map(cartKey));

const catName = (id) => CATEGORIES.find((cat) => cat.id === id)?.name || 'Produk';
const checkedItems = () => getCart().filter((item) => selected.has(cartKey(item)));

function syncSelection(items) {
  const keys = new Set(items.map(cartKey));
  [...selected].forEach((key) => {
    if (!keys.has(key)) selected.delete(key);
  });
}

function totals() {
  return KlikPricing.computeTotals({
    items: checkedItems(),
    delivery,
    voucher: activeVoucher,
    usePoints,
    pointsBalance: getPoints(),
    claimed: getClaimed(),
    used: getUsed(),
  });
}

/* API kecil untuk voucher.js, checkout.js, dan payment.js. */
const KlikCart = {
  get delivery() {
    return delivery;
  },
  get usePoints() {
    return usePoints;
  },
  get activeVoucher() {
    return activeVoucher;
  },
  setUsePoints(value) {
    usePoints = Boolean(value);
  },
  setActiveVoucher(code) {
    activeVoucher = code || null;
    setPreferredVoucher(activeVoucher);
  },
  getTotals: () => totals(),
  getCheckedItems: () => checkedItems(),
  render: () => renderCart(),
  clearCheckedItems() {
    const remainingItems = getCart().filter((item) => !selected.has(cartKey(item)));
    selected.clear();
    saveCart(remainingItems);
  },
};

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
      <button class="info-card__link" type="button" id="voucherBtn">${t.voucherActive ? 'Ubah' : 'Pakai'}</button>
    </div>

    ${
      user
        ? `<div class="info-card">
            <span class="info-card__icon">${ICON.sparkle}</span>
            <div class="info-card__body">
              <strong>Poinku Indomaret <b>Saldo: ${pointsBalance.toLocaleString('id-ID')}</b></strong>
              <small>Tukarkan ${KlikPricing.POINT_COST.toLocaleString('id-ID')} Poin (-${money(KlikPricing.POINT_VALUE)})</small>
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
      if (delivery === 'pickup' && KlikPricing.requiresExpress(activeVoucher)) KlikCart.setActiveVoucher(null);
      else if (
        delivery === 'express' &&
        !activeVoucher &&
        KlikPricing.voucherUsable('GRATISONGKIR', {
          subtotal: totals().subtotal,
          delivery,
          claimed: getClaimed(),
          used: getUsed(),
        })
      ) {
        KlikCart.setActiveVoucher('GRATISONGKIR');
      }
      renderCart();
    });
  });

  $('#voucherBtn')?.addEventListener('click', () => KlikVoucher.open(totals().subtotal));

  $('#pointsToggle')?.addEventListener('click', () => {
    if (getPoints() < KlikPricing.POINT_COST) {
      toast('Poin kamu belum cukup untuk penukaran.', 'error');
      return;
    }
    usePoints = !usePoints;
    renderCart();
  });

  $('#payBtn')?.addEventListener('click', KlikCheckout.checkout);
}

document.addEventListener('cart:change', renderCart);
renderCart();
