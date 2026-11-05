/* promo.js — daftar voucher dan produk promo */

const promoProducts = PRODUCTS.filter((p) => p.tags.includes('jsm') || p.tags.includes('flash')).slice(0, 8);

function renderVouchers() {
  $('#voucherList').innerHTML = VOUCHERS.map((voucher) => {
    const claimed = isClaimed(voucher.code);
    const value = voucher.code === 'GAJIANHEMAT' ? '40%' : voucher.code === 'GRATISONGKIR' ? '10rb' : '15rb';
    const label = voucher.code === 'GAJIANHEMAT' ? 'DISKON' : voucher.code === 'GRATISONGKIR' ? 'ONGKIR' : 'MEMBER';
    return `<article class="voucher-card voucher-card--${voucher.tone}">
      <div class="voucher-card__left">
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
      <div class="voucher-card__body">
        <strong>${voucher.title}</strong>
        <small>${voucher.desc}</small>
        <em>Min. belanja ${money(voucher.min)}</em>
      </div>
      <button class="btn ${claimed ? 'btn--ghost' : 'btn--primary'}" type="button" data-claim="${voucher.code}" ${claimed ? 'disabled' : ''}>
        ${claimed ? 'Diklaim' : 'Klaim'}
      </button>
    </article>`;
  }).join('');
}

function renderPromoGrid() {
  $('#promoGrid').innerHTML = promoProducts.map((p) => productCard(p)).join('');
}

async function syncVouchers() {
  if (!window.KlikApi?.isPhp() || !getUser()) return;
  try {
    const result = await window.KlikApi.vouchers();
    if (Array.isArray(result.claimed)) {
      Store.set(KEY.claimed, result.claimed);
      renderVouchers();
    }
  } catch (error) {
    /* mode static / offline tetap memakai klaim localStorage */
  }
}

function initPromo() {
  renderVouchers();
  renderPromoGrid();

  $('#voucherList').addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-claim]');
    if (!btn || btn.disabled) return;
    const ok = await claimVoucher(btn.dataset.claim);
    if (!ok) return;
    renderVouchers();
    toast(`Voucher ${btn.dataset.claim} berhasil diklaim. Pakai saat checkout ya.`, 'success');
  });

  document.addEventListener('cart:change', renderPromoGrid);
  syncVouchers();
}

initPromo();
