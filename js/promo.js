/* promo.js — daftar voucher dan produk promo */

const promoProducts = PRODUCTS.filter((p) => p.tags.includes('jsm') || p.tags.includes('flash')).slice(0, 8);

function renderVouchers() {
  $('#voucherList').innerHTML = VOUCHERS.map((voucher) => {
    const claimed = isClaimed(voucher.code);
    const used = isVoucherUsed(voucher.code);
    return `<article class="voucher-card voucher-card--${voucher.tone}">
      <div class="voucher-card__left">
        <strong>${voucher.value}</strong>
        <span>${voucher.tag}</span>
      </div>
      <div class="voucher-card__body">
        <strong>${voucher.title}</strong>
        <small>${voucher.desc}</small>
        <em>Min. belanja ${money(voucher.min)}</em>
        <details class="voucher-terms">
          <summary>S&amp;K</summary>
          <ul>${(voucher.terms || []).map((term) => `<li>${escapeHtml(term)}</li>`).join('')}</ul>
        </details>
      </div>
      <button class="btn ${claimed || used ? 'btn--ghost' : 'btn--primary'}" type="button" data-claim="${voucher.code}" ${claimed || used ? 'disabled' : ''}>
        ${used ? 'Sudah dipakai' : claimed ? 'Diklaim' : 'Klaim'}
      </button>
    </article>`;
  }).join('');
}

function renderPromoGrid() {
  $('#promoGrid').innerHTML = promoProducts.map((p) => productCard(p)).join('');
}

let voucherSyncToken = 0;

async function syncVouchers() {
  if (!window.KlikApi?.isPhp() || !getUser()) return;
  const token = ++voucherSyncToken;
  try {
    const result = await window.KlikApi.vouchers();
    // Abaikan respons lama yang selesai setelah klaim baru disimpan.
    if (token !== voucherSyncToken) return;
    applyVoucherState(result);
    renderVouchers();
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
    voucherSyncToken += 1;
    renderVouchers();
    toast(`Voucher ${btn.dataset.claim} berhasil diklaim. Pakai saat checkout ya.`, 'success');
  });

  document.addEventListener('cart:change', renderPromoGrid);
  // Login demo selesai setelah halaman dirender: segarkan status klaim/pakai.
  document.addEventListener('auth:change', () => {
    renderVouchers();
    syncVouchers();
  });
  syncVouchers();
}

initPromo();
