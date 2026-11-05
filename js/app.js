/* app.js — event global dan inisialisasi halaman */

/* ---------------------------------------------------------
   Event global
   --------------------------------------------------------- */
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (action) {
    const name = action.dataset.action;
    if (name === 'search') openSearch();
    if (name === 'notifications') openNotifications();
    if (name === 'help') openHelp();
    if (name === 'back') {
      if (history.length > 1) history.back();
      else location.href = 'index.html';
    }
    if (name === 'wishlist') {
      toast('Wishlist masih kosong. Tekan ikon hati di halaman produk untuk menyimpan.', 'info');
    }
    return;
  }

  const addressBtn = event.target.closest('.js-open-address');
  if (addressBtn) {
    event.preventDefault();
    openAddressSheet();
    return;
  }

  const storeBtn = event.target.closest('.js-open-store');
  if (storeBtn) {
    event.preventDefault();
    openStoreSheet();
    return;
  }

  const topupBtn = event.target.closest('.js-open-topup');
  if (topupBtn) {
    event.preventDefault();
    openTopUp();
    return;
  }

  const addBtn = event.target.closest('[data-add]');
  if (addBtn) {
    event.preventDefault();
    addToCart(addBtn.dataset.add, 1, addBtn.dataset.variant);
    return;
  }

  const stepBtn = event.target.closest('[data-step]');
  if (stepBtn) {
    event.preventDefault();
    const box = stepBtn.closest('[data-stepper]');
    if (!box) return;
    changeQty(box.dataset.id, box.dataset.variant, Number(stepBtn.dataset.step));
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSheet();
});

/* ---------------------------------------------------------
   Auto-mount chrome berdasarkan atribut <body>
   --------------------------------------------------------- */
(function init() {
  const body = document.body;
  $$('[data-icon]').forEach((el) => {
    const icon = ICON[el.dataset.icon];
    if (icon) el.innerHTML = icon;
  });

  // Mode demo: index.html?demo=1 mengisi keranjang + akun contoh.
  if (isDemoMode) {
    if (!getCart().length) {
      saveCart([
        { id: 'sania-2l', qty: 1, variant: 'Pouch 2L' },
        { id: 'ultra-1l', qty: 2, variant: '1000ml' },
        { id: 'indomie-ayam-5', qty: 5, variant: '5 pcs' },
      ]);
    }

    if (!getUser()) {
      setUser({
        name: 'Bagas Pratama',
        phone: '081234567890',
        email: 'bagas@email.com',
        joined: new Date().toISOString(),
      });
    }

    // Saldo & poin awal untuk mode demo (kalau belum diisi server).
    if (Store.get(KEY.saldo, null) === null) setSaldo(185000);
    if (Store.get(KEY.points, null) === null) setPoints(4850);

    if (getUser()?.phone === '081234567890') {
      // Kalau dijalankan lewat PHP, buat session server untuk akun demo.
      if (window.KlikApi?.isPhp()) {
        window.KlikApi.login('081234567890', 'password123')
          .then((result) => {
            if (result.user) applyUserSession(result.user);
            if (Array.isArray(result.claimed)) Store.set(KEY.claimed, result.claimed);
            updateCartBadges();
            updateSaldoUI();
            document.dispatchEvent(new CustomEvent('auth:change', { detail: result.user || null }));
          })
          .catch(() => {
            /* server belum siap; mode demo tetap jalan dengan localStorage */
          });
      }
    }
  }

  updateCartBadges();
  updateSaldoUI();
  if (body.dataset.header === 'none') return;
  mountChrome({
    header: body.dataset.header || 'main',
    title: body.dataset.title || '',
    active: body.dataset.active || 'home',
    nav: body.dataset.nav !== 'false',
  });
})();
