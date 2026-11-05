/* =========================================================
   app.js — mesin bersama: keranjang, auth, header, nav, sheet
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const KEY = {
  cart: 'klik_cart_v1',
  user: 'klik_user_v1',
  orders: 'klik_orders_v1',
  address: 'klik_address_v1',
  store: 'klik_store_v1',
  saldo: 'klik_saldo_v1',
  points: 'klik_points_v1',
  vouchers: 'klik_vouchers_v1',
  claimed: 'klik_claimed_v1',
  delivery: 'klik_delivery_v1',
};

const isDemoMode = new URLSearchParams(location.search).get('demo') === '1';

const money = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* storage penuh / private mode */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      /* ignore */
    }
  },
};

/* ---------------------------------------------------------
   Ikon (inline SVG, gaya Lucide)
   --------------------------------------------------------- */
const svg = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;

const ICON = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>'),
  bell: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  user: svg('<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>'),
  home: svg('<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>'),
  grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  tag: svg('<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>'),
  cartPlus: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/><path d="M12 8v5M9.5 10.5h5"/>'),
  chevronRight: svg('<path d="m9 18 6-6-6-6"/>'),
  chevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
  back: svg('<path d="m15 18-6-6 6-6"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  pin: svg('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: svg('<path d="m20 6-11 11-5-5"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>'),
  truck: svg('<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
  star: svg('<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/>', 'fill="currentColor" stroke="none"'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  wallet: svg('<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 13h2"/>'),
  ticket: svg('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M13 6v12" stroke-dasharray="2 3"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'),
  box: svg('<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>'),
  filter: svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  sort: svg('<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>'),
  arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: svg('<path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.2-.8"/>'),
  lock: svg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'),
  bag: svg('<path d="M6 7h12l1.5 13h-15L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
  store: svg('<path d="M3 9 5 3h14l2 6"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>'),
  sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  qr: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3"/>'),
  bank: svg('<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>'),
  cash: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10h.01M18 14h.01"/>'),
  map: svg('<path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3Z"/><path d="M9 7v13M15 4v13"/>'),
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  gift: svg('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18"/><path d="M12 8H7.5a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8ZM12 8h4.5a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8Z"/>'),
  chart: svg('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>'),
  refresh: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  chat: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  flame: svg('<path d="M12 22c4 0 7-2.8 7-6.5 0-3-1.8-5.2-3.5-7C14 6.8 12 4.5 12 2c-1 3-4.5 5.2-6 8.5C4.7 12.9 5 15.4 5 15.5 5 18.7 8 22 12 22Z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-1.3.8-2.2 1.7-3.2.8-.9 1.3-1.6 1.3-2.8 1 1 3 2.4 3 4.5 0 2.5-1.3 4.5-3 4.5Z"/>'),
};

/* ---------------------------------------------------------
   Produk & keranjang
   --------------------------------------------------------- */
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const cartKey = (item) => `${item.id}::${item.variant || ''}`;

function getCart() {
  // Rapikan id lama yang mungkin tersimpan dengan spasi (mis. " telur-10")
  // supaya keranjang yang sudah ada tidak hilang setelah perbaikan data.
  return Store.get(KEY.cart, [])
    .map((item) => ({ ...item, id: String(item.id ?? '').trim() }))
    .filter((item) => findProduct(item.id));
}

function saveCart(cart) {
  Store.set(KEY.cart, cart);
  updateCartBadges();
  document.dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function cartOriginalTotal() {
  return getCart().reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + (p ? (p.original || p.price) * item.qty : 0);
  }, 0);
}

function cartQty(id, variant) {
  return getCart()
    .filter((item) => item.id === id && (variant === undefined || item.variant === variant))
    .reduce((sum, item) => sum + item.qty, 0);
}

// Varian yang ditampilkan kartu produk harus sama dengan varian yang
// diubah oleh tombol plus/minus.
function cartVariantFor(id) {
  const item = getCart().find((entry) => entry.id === id);
  if (item) return item.variant;
  const product = findProduct(id);
  return product ? product.unit : '';
}

function addToCart(id, qty = 1, variant) {
  const p = findProduct(id);
  if (!p) return;
  const v = variant || p.unit;
  const cart = getCart();
  const found = cart.find((item) => item.id === id && item.variant === v);
  if (found) found.qty += qty;
  else cart.push({ id, qty, variant: v });
  saveCart(cart);
  toast(`${p.short} ditambahkan ke keranjang`, 'success');
}

function setItemQty(id, variant, qty) {
  let cart = getCart();
  const item = cart.find((i) => i.id === id && i.variant === variant);
  if (!item) return;
  item.qty = qty;
  if (item.qty <= 0) cart = cart.filter((i) => !(i.id === id && i.variant === variant));
  saveCart(cart);
}

function changeQty(id, variant, delta) {
  const item = getCart().find((i) => i.id === id && i.variant === variant);
  if (!item) return;
  setItemQty(id, variant, item.qty + delta);
}

function removeItem(id, variant) {
  saveCart(getCart().filter((i) => !(i.id === id && i.variant === variant)));
}

function updateCartBadges() {
  const count = cartCount();
  $$('.js-cart-count').forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
  $$('.js-cart-total').forEach((el) => {
    el.textContent = money(cartSubtotal());
  });
}

/* ---------------------------------------------------------
   Auth & profil
   --------------------------------------------------------- */
const getUser = () => Store.get(KEY.user, null);
const setUser = (user) => Store.set(KEY.user, user);
const logout = () => {
  Store.remove(KEY.user);
  Store.remove(KEY.orders);
  Store.remove(KEY.claimed);
  Store.remove(KEY.saldo);
  Store.remove(KEY.points);
  if (window.KlikApi?.isPhp()) {
    window.KlikApi.logout().catch(() => {});
  }
};

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || 'U';

const getAddress = () => Store.get(KEY.address, ADDRESSES[0]);
const setAddress = (address) => Store.set(KEY.address, address);

const getStoreData = () => Store.get(KEY.store, STORES[0]);
const setStoreData = (store) => Store.set(KEY.store, store);

const getSaldo = () => Store.get(KEY.saldo, 0);
const setSaldo = (value) => Store.set(KEY.saldo, value);

const getPoints = () => Store.get(KEY.points, 0);
const setPoints = (value) => Store.set(KEY.points, value);

const getClaimed = () => Store.get(KEY.claimed, []);
async function claimVoucher(code) {
  // Opsi A: klaim terikat ke akun. Di mode PHP, tamu harus masuk dulu.
  if (window.KlikApi?.isPhp() && !getUser()) {
    promptLogin();
    return false;
  }

  const claimed = getClaimed();
  if (!claimed.includes(code)) {
    claimed.push(code);
    Store.set(KEY.claimed, claimed);
  }

  if (window.KlikApi?.isPhp() && getUser()) {
    try {
      const result = await window.KlikApi.claimVoucher(code);
      if (Array.isArray(result.claimed)) Store.set(KEY.claimed, result.claimed);
      return true;
    } catch (error) {
      // Jangan biarkan klaim lokal menempel kalau server menolak/mati.
      Store.set(KEY.claimed, getClaimed().filter((item) => item !== code));
      if (error.offline) {
        console.warn('[Klik] Klaim voucher gagal disinkronkan: server tidak tersedia.', error);
      } else {
        toast(error.message || 'Voucher gagal diklaim.', 'error');
      }
      return false;
    }
  }

  return true;
}
const isClaimed = (code) => getClaimed().includes(code);

/**
 * Simpan user dari server ke cache localStorage sekaligus saldo & poinnya.
 */
function applyUserSession(user) {
  if (!user) return;
  setUser(user);
  if (typeof user.saldo === 'number') setSaldo(user.saldo);
  if (typeof user.points === 'number') setPoints(user.points);
  updateSaldoUI();
}



/* ---------------------------------------------------------
   Komponen HTML
   --------------------------------------------------------- */
const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const discountPct = (p) =>
  p.original && p.original > p.price ? Math.round((1 - p.price / p.original) * 100) : 0;

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
  return `<header class="topbar">
    <div class="topbar__inner">
      ${logoHTML()}
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
