/* components.js — komponen HTML: header, nav, kartu produk, toast */

function logoHTML(compact = false) {
  return `<a class="logo${compact ? ' logo--sm' : ''}" href="index.html" aria-label="Klik Indomaret, kembali ke beranda">
    <span class="logo__mark">${ICON.bag}</span>
    <span class="logo__text">Klik <span>Indomaret</span></span>
  </a>`;
}

function avatarHTML() {
  const user = getUser();
  if (!user) {
    return `<a class="avatar avatar--guest" href="login.html" aria-label="Masuk ke akun">${ICON.user}</a>`;
  }
  return `<a class="avatar" href="akun.html" aria-label="Akun ${escapeHtml(user.name)}">${escapeHtml(initials(user.name))}</a>`;
}

function topbarHTML(variant, title) {
  if (variant === 'detail') {
    return `<header class="topbar">
      <div class="topbar__inner topbar__inner--detail">
        <button class="iconbtn" data-action="back" aria-label="Kembali">${ICON.back}</button>
        ${logoHTML(true)}
        <span class="topbar__title">${escapeHtml(title || 'Detail Produk')}</span>
        <div class="topbar__actions">
          <button class="iconbtn" data-action="help" aria-label="Bantuan">${ICON.help}</button>
          ${avatarHTML()}
        </div>
      </div>
    </header>`;
  }
  const query = new URLSearchParams(location.search).get('q') || '';
  return `<header class="topbar">
    <div class="topbar__inner">
      ${logoHTML()}
      <form class="topbar__search" role="search" data-topbar-search>
        ${ICON.search}
        <input type="search" name="q" value="${escapeHtml(query)}" placeholder="Cari susu UHT, minyak goreng, cemilan..." aria-label="Cari produk" autocomplete="off">
        <button type="submit">Cari</button>
      </form>
      <div class="topbar__actions">
        <button class="iconbtn" data-action="search" aria-label="Cari produk">${ICON.search}</button>
        <button class="iconbtn" data-action="wishlist" aria-label="Wishlist">${ICON.heart}</button>
        <button class="iconbtn iconbtn--dot" data-action="notifications" aria-label="Notifikasi">${ICON.bell}</button>
        ${avatarHTML()}
      </div>
    </div>
  </header>`;
}

function navHTML(active) {
  const items = [
    { id: 'home', label: 'Beranda', icon: ICON.home, href: 'index.html' },
    { id: 'kategori', label: 'Kategori', icon: ICON.grid, href: 'kategori.html' },
    { id: 'promo', label: 'Promo', icon: ICON.tag, href: 'promo.html' },
    { id: 'cart', label: 'Keranjang', icon: ICON.cart, href: 'keranjang.html', badge: true },
    { id: 'akun', label: 'Akun', icon: ICON.user, href: 'akun.html' },
  ];
  const count = cartCount();
  return `<nav class="bottomnav" aria-label="Navigasi utama">
    ${items
      .map(
        (item) => `<a class="bottomnav__item${item.id === active ? ' is-active' : ''}" href="${item.href}" ${item.id === active ? 'aria-current="page"' : ''}>
          <span class="bottomnav__icon">${item.icon}${item.badge ? `<span class="bottomnav__badge js-cart-count"${count > 0 ? '' : ' hidden'}>${count}</span>` : ''}</span>
          <span class="bottomnav__label">${item.label}</span>
        </a>`
      )
      .join('')}
  </nav>`;
}

function artHTML(p, extraClass = '') {
  return `<div class="art ${extraClass}" style="--tint:${p.tint || '#eef2f8'}">
    <span class="art__blob"></span>
    <img class="art__img" src="assets/products/${p.id}.jpg" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.remove()">
    <span class="art__emoji" aria-hidden="true">${p.emoji || '🛒'}</span>
  </div>`;
}

function ratingHTML(p, light = false) {
  return `<span class="rating${light ? ' rating--light' : ''}">${ICON.star}<strong>${p.rating}</strong><small>(${p.reviews})</small></span>`;
}

function badgeHTML(p) {
  if (!p.badge) return '';
  return `<span class="badge badge--${p.badge.tone}">${p.badge.label}</span>`;
}

function stepperHTML(id, variant, qty, size = '') {
  return `<div class="stepper ${size}" data-stepper data-id="${id}" data-variant="${escapeHtml(variant)}">
    <button type="button" data-step="-1" aria-label="Kurangi jumlah">${ICON.minus}</button>
    <span>${qty}</span>
    <button type="button" data-step="1" aria-label="Tambah jumlah">${ICON.plus}</button>
  </div>`;
}

function productCard(p, opts = {}) {
  const variant = cartVariantFor(p.id);
  const qty = cartQty(p.id, variant);
  const { compact = false } = opts;
  return `<article class="pcard${compact ? ' pcard--compact' : ''}">
    <a class="pcard__media" href="produk.html?id=${p.id}" aria-label="${escapeHtml(p.name)}">
      ${artHTML(p)}
      ${badgeHTML(p)}
    </a>
    <div class="pcard__body">
      <span class="pcard__brand">${p.brand}</span>
      <a class="pcard__name" href="produk.html?id=${p.id}">${p.short || p.name}</a>
      ${ratingHTML(p)}
      <div class="pcard__price">
        <strong>${money(p.price)}</strong>
        ${p.original > p.price ? `<s>${money(p.original)}</s>` : ''}
      </div>
      ${
        compact
          ? `<div class="pcard__bottom">
              ${qty ? stepperHTML(p.id, variant, qty, 'stepper--sm') : `<button class="iconbtn iconbtn--add" data-add="${p.id}" aria-label="Tambah ${escapeHtml(p.short || p.name)} ke keranjang">${ICON.plus}</button>`}
            </div>`
          : qty
            ? stepperHTML(p.id, variant, qty, 'stepper--block')
            : `<button class="btn btn--add btn--block" data-add="${p.id}">${ICON.cartPlus} Keranjang</button>`
      }
    </div>
  </article>`;
}

/* ---------------------------------------------------------
   Chrome (header + bottom nav)
   --------------------------------------------------------- */
function mountChrome({ header = 'main', title = '', active = 'home', nav = true } = {}) {
  const headerEl = $('#appHeader');
  if (headerEl) {
    headerEl.innerHTML = header === 'none' ? '' : topbarHTML(header, title);
  }
  const navEl = $('#appNav');
  if (navEl) navEl.innerHTML = nav ? navHTML(active) : '';
  updateCartBadges();
}

/* ---------------------------------------------------------
   Toast
   --------------------------------------------------------- */
function toast(message, tone = 'success') {
  let wrap = $('.toasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toasts';
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.innerHTML = `<span class="toast__icon">${tone === 'error' ? ICON.info : ICON.check}</span><span>${escapeHtml(message)}</span>`;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 260);
  }, 2600);
}
