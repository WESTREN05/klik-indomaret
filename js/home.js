/* home.js — logika halaman beranda */

function renderPromos() {
  const carousel = $('#promoCarousel');
  carousel.innerHTML = BANNERS.map((banner) => {
    const claimed = isClaimed(banner.code);
    return `<article class="promo-card promo-card--${banner.tone}">
      <span class="promo-card__emoji" aria-hidden="true">${banner.emoji}</span>
      <span class="promo-card__eyebrow">Promo Spesial</span>
      <h3>${banner.title}</h3>
      <p>${banner.desc}</p>
      <span class="promo-card__code">Kode: ${banner.code}</span>
      <button class="promo-card__btn" type="button" data-claim="${banner.code}" ${claimed ? 'disabled' : ''}>${claimed ? 'Terkonfirmasi' : 'Klaim'}</button>
    </article>`;
  }).join('');
}

function renderCategories() {
  $('#catGrid').innerHTML = CATEGORIES.map(
    (cat) => `<a class="cat-item" href="kategori.html?cat=${cat.id}">
      <span class="cat-item__icon${cat.promo ? ' cat-item__icon--promo' : ''}" style="--tint:${cat.tint}">${cat.icon}</span>
      <span>${cat.name}</span>
    </a>`
  ).join('');
}

function renderFlash() {
  const flash = PRODUCTS.filter((p) => p.tags.includes('flash'));
  $('#flashList').innerHTML = flash
    .map(
      (p) => `<article class="flash-card">
        <a class="pcard__media" href="produk.html?id=${p.id}" aria-label="${escapeHtml(p.name)}">
          ${artHTML(p)}
          ${badgeHTML(p)}
        </a>
        <span class="flash-card__brand">${p.brand}</span>
        <a class="flash-card__name" href="produk.html?id=${p.id}">${p.short}</a>
        <div class="flash-card__price">${money(p.price)} <s>${money(p.original)}</s></div>
        <div class="flash-card__sold">Terjual ${p.sold}%</div>
        <div class="progress" aria-hidden="true"><span style="width:${p.sold}%"></span></div>
        <button class="btn btn--add" type="button" data-add="${p.id}">+ Beli</button>
      </article>`
    )
    .join('');
}

function renderPopular() {
  const popular = PRODUCTS.filter((p) => p.tags.includes('popular')).slice(0, 4);
  $('#popularGrid').innerHTML = popular.map((p) => productCard(p, { compact: true })).join('');
}

function startFlashTimer() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const tick = () => {
    let diff = Math.max(0, end - new Date());
    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    diff %= 3600000;
    const minutes = String(Math.floor(diff / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const clock = $('#flashClock');
    if (clock) clock.textContent = `${hours}:${minutes}:${seconds}`;
  };
  tick();
  setInterval(tick, 1000);
}

function applyMode(mode) {
  const isPickup = mode === 'pickup';
  $$('.mode-btn').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.mode === mode));
  const eta = $('.js-store-eta');
  const em = eta?.closest('em');
  if (em) {
    em.innerHTML = `· ${isPickup ? 'Siap diambil' : 'Estimasi'} <span class="js-store-eta">${isPickup ? '30Mnt' : getStoreData().eta}</span> (${isPickup ? 'Ambil di Toko' : 'Express'})`;
  }
  Store.set(KEY.delivery, mode);
}

function initHome() {
  renderPromos();
  renderCategories();
  renderFlash();
  renderPopular();
  startFlashTimer();
  applyMode(Store.get(KEY.delivery, 'express'));

  $('#homeSearch').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = $('#homeSearchInput').value.trim();
    location.href = value ? `kategori.html?q=${encodeURIComponent(value)}` : 'kategori.html';
  });

  $('.js-voice').addEventListener('click', () => {
    toast('Pencarian suara belum tersedia di demo ini. Ketik saja nama produknya ya.', 'info');
  });

  $('.js-history').addEventListener('click', () => {
    toast('Riwayat transaksi tersedia di halaman Akun.', 'info');
  });

  $('#promoCarousel').addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-claim]');
    if (!btn || btn.disabled) return;
    const ok = await claimVoucher(btn.dataset.claim);
    if (!ok) return;
    btn.disabled = true;
    btn.textContent = 'Terkonfirmasi';
    toast(`Voucher ${btn.dataset.claim} berhasil diklaim. Cek di halaman Promo.`, 'success');
  });

  $$('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyMode(btn.dataset.mode));
  });

  document.addEventListener('cart:change', renderPopular);
}

initHome();
