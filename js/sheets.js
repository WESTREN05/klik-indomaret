/* sheets.js — bottom sheet, pencarian, alamat, toko, top up, login prompt */

/* ---------------------------------------------------------
   Bottom sheet
   --------------------------------------------------------- */
function closeSheet() {
  const sheet = $('.sheet-wrap');
  if (sheet) {
    sheet.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => sheet.remove(), 220);
  }
}

function openSheet({ title = '', body = '', className = '' } = {}) {
  closeSheet();
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop" data-close></div>
    <section class="sheet ${className}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title || 'Dialog')}">
      <div class="sheet__grab" aria-hidden="true"></div>
      <header class="sheet__head">
        <h2>${escapeHtml(title)}</h2>
        <button class="iconbtn" data-close aria-label="Tutup">${ICON.x}</button>
      </header>
      <div class="sheet__body">${body}</div>
    </section>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('is-open'));
  document.body.classList.add('no-scroll');
  wrap.addEventListener('click', (event) => {
    if (event.target.closest('[data-close]')) closeSheet();
  });
  const focusTarget = wrap.querySelector('input, button:not([data-close])');
  if (focusTarget) setTimeout(() => focusTarget.focus(), 240);
  return wrap;
}

/* ---------------------------------------------------------
   Sheet-sheet umum
   --------------------------------------------------------- */
function openNotifications() {
  openSheet({
    title: 'Notifikasi',
    body: `<div class="notif-list">
      <article class="notif"><span class="notif__icon">🎉</span><div><strong>Voucher gajian sudah masuk</strong><p>Klaim diskon s.d 40% sebelum tengah malam.</p><small>2 jam lalu</small></div></article>
      <article class="notif"><span class="notif__icon">🛵</span><div><strong>Pesananmu sedang disiapkan</strong><p>Kurir akan berangkat dalam 10 menit.</p><small>Kemarin</small></div></article>
      <article class="notif"><span class="notif__icon">⭐</span><div><strong>Poin bertambah 34</strong><p>Terima kasih sudah belanja di Indomaret Kemanggi 2.</p><small>3 hari lalu</small></div></article>
    </div>`,
  });
}

function openHelp() {
  openSheet({
    title: 'Bantuan',
    body: `<div class="help-list">
      <button class="help-item"><span>${ICON.chat}</span><div><strong>Chat dengan CS</strong><small>Senin–Minggu, 07.00–22.00</small></div>${ICON.chevronRight}</button>
      <button class="help-item"><span>${ICON.info}</span><div><strong>Pusat bantuan</strong><small>FAQ seputar pesanan & pengiriman</small></div>${ICON.chevronRight}</button>
      <button class="help-item"><span>${ICON.phone}</span><div><strong>Telepon 1500 123</strong><small>Bebas pulsa dari seluruh Indonesia</small></div>${ICON.chevronRight}</button>
    </div>`,
  });
}

function openSearch() {
  const wrap = openSheet({
    title: 'Cari produk',
    body: `<form class="search-form" data-search-form>
      <div class="searchbox">
        ${ICON.search}
        <input type="search" name="q" placeholder="Cari susu UHT, minyak goreng, cemilan..." autocomplete="off">
        <button type="submit" class="btn btn--primary btn--sm">Cari</button>
      </div>
      <p class="sheet__label">Pencarian populer</p>
      <div class="chip-row">
        ${['Minyak goreng', 'Susu UHT', 'Indomie', 'Telur', 'Kopi', 'Sabun']
          .map((q) => `<button type="button" class="chip" data-quick="${q}">${q}</button>`)
          .join('')}
      </div>
    </form>`,
  });
  wrap.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = wrap.querySelector('input[name="q"]').value.trim();
    if (!value) return;
    location.href = `kategori.html?q=${encodeURIComponent(value)}`;
  });
  wrap.addEventListener('click', (event) => {
    const quick = event.target.closest('[data-quick]');
    if (quick) location.href = `kategori.html?q=${encodeURIComponent(quick.dataset.quick)}`;
  });
  setTimeout(() => wrap.querySelector('input')?.focus(), 260);
}

function openAddressSheet() {
  const current = getAddress();
  const wrap = openSheet({
    title: 'Alamat pengiriman',
    body: `<div class="option-list">
      ${ADDRESSES.map(
        (a) => `<button class="option${a.id === current.id ? ' is-selected' : ''}" data-address="${a.id}">
          <span class="option__icon">${ICON.pin}</span>
          <span class="option__body"><strong>${a.label}</strong><small>${a.detail}</small><small>${a.note}</small></span>
          ${a.id === current.id ? `<span class="option__check">${ICON.check}</span>` : ''}
        </button>`
      ).join('')}
      <button class="option option--add" data-close>${ICON.plus} Tambah alamat baru</button>
    </div>`,
  });
  wrap.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-address]');
    if (!btn) return;
    const address = ADDRESSES.find((a) => a.id === btn.dataset.address);
    if (!address) return;
    setAddress(address);
    $$('.js-address-text').forEach((el) => (el.textContent = address.detail));
    closeSheet();
    toast(`Alamat diubah ke ${address.label}`, 'success');
  });
}

function openStoreSheet() {
  const current = getStoreData();
  const wrap = openSheet({
    title: 'Pilih toko Indomaret',
    body: `<div class="option-list">
      ${STORES.map(
        (s) => `<button class="option${s.id === current.id ? ' is-selected' : ''}" data-store="${s.id}">
          <span class="option__icon">${ICON.store}</span>
          <span class="option__body"><strong>${s.name}</strong><small>${s.address}</small><small>${s.distance} · Estimasi ${s.eta}</small></span>
          ${s.id === current.id ? `<span class="option__check">${ICON.check}</span>` : ''}
        </button>`
      ).join('')}
    </div>`,
  });
  wrap.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-store]');
    if (!btn) return;
    const store = STORES.find((s) => s.id === btn.dataset.store);
    if (!store) return;
    setStoreData(store);
    const mode = Store.get(KEY.delivery, 'express');
    $$('.js-store-name').forEach((el) => (el.textContent = store.name));
    $$('.js-store-eta').forEach((el) => (el.textContent = mode === 'pickup' ? '30Mnt' : store.eta));
    $$('.js-store-distance').forEach((el) => (el.textContent = store.distance));
    if (typeof renderCart === 'function') renderCart();
    closeSheet();
    toast(`Toko aktif: ${store.name}`, 'success');
  });
}

function updateSaldoUI() {
  $$('.js-saldo').forEach((el) => (el.textContent = money(getSaldo())));
  $$('.js-points').forEach((el) => (el.textContent = getPoints().toLocaleString('id-ID')));
}

function openTopUp() {
  const wrap = openSheet({
    title: 'Top Up Saldo',
    body: `<p class="sheet__lead">Pilih nominal top up saldo Indomaret. Saldo bisa dipakai untuk semua transaksi.</p>
      <div class="nominal-grid">
        ${[50000, 100000, 200000, 500000].map((n) => `<button class="nominal" data-topup="${n}">${money(n)}</button>`).join('')}
      </div>
      <p class="hint">${ICON.info} Ini demo, saldo langsung bertambah tanpa pembayaran.</p>`,
  });
  wrap.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-topup]');
    if (!btn || btn.disabled) return;
    const value = Number(btn.dataset.topup);
    btn.disabled = true;

    try {
      if (window.KlikApi?.isPhp() && getUser()) {
        try {
          const result = await window.KlikApi.topup(value);
          if (result.user) applyUserSession(result.user);
          else setSaldo(getSaldo() + value);
        } catch (error) {
          if (!error.offline) {
            toast(error.message || 'Top up gagal.', 'error');
            return;
          }
          setSaldo(getSaldo() + value);
        }
      } else {
        setSaldo(getSaldo() + value);
      }

      updateSaldoUI();
      closeSheet();
      toast(`Top up ${money(value)} berhasil`, 'success');
    } finally {
      btn.disabled = false;
    }
  });
}

function promptLogin(next) {
  const target = next || `${location.pathname.split('/').pop() || 'index.html'}${location.search}`;
  const wrap = openSheet({
    title: 'Masuk dulu yuk',
    body: `<div class="auth-prompt">
      <span class="auth-prompt__icon">${ICON.lock}</span>
      <p>Masuk ke akun Klik Indomaret untuk menyimpan alamat, mengumpulkan poin, dan melanjutkan pembayaran.</p>
      <a class="btn btn--primary btn--block" href="login.html?next=${encodeURIComponent(target)}">Masuk / Daftar</a>
      <button class="btn btn--ghost btn--block" data-close>Nanti saja</button>
    </div>`,
  });
  return wrap;
}
