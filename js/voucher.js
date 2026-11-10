/* voucher.js — sheet pemilihan voucher dan promosi */

const KlikVoucher = (() => {
  function open(subtotal) {
    const activeVoucher = KlikCart.activeVoucher;
    const delivery = KlikCart.delivery;
    const wrap = openSheet({
      title: 'Voucher & promo',
      body: `<div class="option-list">
        ${VOUCHERS.map((voucher) => {
          const claimed = isClaimed(voucher.code);
          const used = isVoucherUsed(voucher.code);
          const applicable = KlikPricing.voucherUsable(voucher.code, {
            subtotal,
            delivery,
            claimed: getClaimed(),
            used: getUsed(),
          });
          const statusText = used
            ? 'Sudah dipakai di pesanan sebelumnya'
            : !claimed
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
              <small class="option__terms">S&amp;K: ${(voucher.terms || []).map((term) => escapeHtml(term)).join(' ')}</small>
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
      KlikCart.setActiveVoucher(btn.dataset.voucher || null);
      closeSheet();
      KlikCart.render();
      toast(
        KlikCart.activeVoucher ? 'Voucher berhasil dipakai.' : 'Voucher dilepas.',
        KlikCart.activeVoucher ? 'success' : 'info'
      );
    });
  }

  return { open };
})();
