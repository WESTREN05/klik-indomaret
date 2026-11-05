/* kategori.js — katalog, filter, pencarian, dan urutan */

const params = new URLSearchParams(location.search);

const state = {
  cat: params.get('cat') || 'all',
  q: params.get('q') || '',
  sort: params.get('sort') || 'popular',
  promo: params.get('promo') === '1',
  ready: params.get('ready') === '1',
  min: 0,
  max: 0,
};

const SORT_LABEL = {
  popular: 'Terpopuler',
  low: 'Harga Terendah',
  high: 'Harga Tertinggi',
  rating: 'Rating Tertinggi',
};

const CAT_TITLES = {
  all: 'Semua Produk',
  sembako: 'Kebutuhan Dapur & Sembako',
  susu: 'Susu & Olahan',
  snack: 'Snack & Biskuit',
  minuman: 'Minuman Segar',
  buah: 'Buah & Sayur',
  perawatan: 'Perawatan Diri',
  rumah: 'Kebutuhan Rumah',
  promo: 'Promo JSM',
};

function baseFiltered() {
  let list = PRODUCTS.slice();
  if (state.promo) list = list.filter((p) => p.tags.includes('jsm') || (p.badge && p.badge.tone === 'discount'));
  if (state.ready) list = list.filter((p) => p.tags.includes('ready'));
  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.short} ${p.brand} ${p.cat}`.toLowerCase().includes(q));
  }
  if (state.min > 0) list = list.filter((p) => p.price >= state.min);
  if (state.max > 0) list = list.filter((p) => p.price <= state.max);
  return list;
}

function filtered() {
  let list = baseFiltered();
  if (state.cat === 'promo') list = list.filter((p) => p.tags.includes('jsm'));
  else if (state.cat !== 'all') list = list.filter((p) => p.cat === state.cat);

  if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
  else if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
  else if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else list.sort((a, b) => b.sold - a.sold);
  return list;
}

function updateHeading(list) {
  const promoOnly = state.promo && state.cat === 'all';
  const title = state.q
    ? `Hasil untuk “${state.q}”`
    : promoOnly
      ? 'Promo Spesial'
      : CAT_TITLES[state.cat] || 'Semua Produk';
  $('#catTitle').textContent = title;
  $('#catSubtitle').textContent = `${list.length} Produk Pilihan Siap Kirim`;
  $('#crumbCurrent').textContent = state.q ? 'Pencarian' : promoOnly ? 'Promo' : CAT_TITLES[state.cat] || 'Kategori';
  document.title = `${title} — Klik Indomaret`;
}

function renderChips() {
  const allCount = baseFiltered().length;
  const chips = [{ id: 'all', name: 'Semua', count: allCount }, ...CATEGORIES];
  $('#catChips').innerHTML = chips
    .map(
      (cat) => `<button class="chip${state.cat === cat.id ? ' is-active' : ''}" type="button" data-cat="${cat.id}">
        ${cat.name}${cat.count !== undefined ? ` <span>${cat.count}</span>` : ''}
      </button>`
    )
    .join('');
}

function renderGrid(list) {
  const grid = $('#productGrid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty">
      <span class="empty__icon">🛒</span>
      <h2>Produk tidak ditemukan</h2>
      <p>Coba kata kunci lain atau hapus filter yang aktif.</p>
      <button class="btn btn--primary btn--sm" type="button" id="resetEmpty">Lihat semua produk</button>
    </div>`;
    $('#resetEmpty')?.addEventListener('click', () => {
      state.cat = 'all';
      state.q = '';
      state.promo = false;
      state.ready = false;
      state.min = 0;
      state.max = 0;
      syncURL();
      renderAll();
    });
    return;
  }
  grid.innerHTML = list.map((p) => productCard(p)).join('');
}

function updateToolbar() {
  $('#sortLabel').textContent = SORT_LABEL[state.sort] || SORT_LABEL.popular;
  $('#promoToggle').classList.toggle('is-active', state.promo);
  $('#readyToggle').classList.toggle('is-active', state.ready);
}

function updateCartBar() {
  const bar = $('#cartBar');
  const count = cartCount();
  if (bar) bar.hidden = count === 0;
  document.body.classList.toggle('has-cartbar', count > 0);
}

function syncURL() {
  const url = new URL(location.href);
  const values = {
    cat: state.cat !== 'all' ? state.cat : null,
    q: state.q || null,
    sort: state.sort !== 'popular' ? state.sort : null,
    promo: state.promo ? '1' : null,
    ready: state.ready ? '1' : null,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  history.replaceState(null, '', url);
}

function renderAll() {
  const list = filtered();
  updateHeading(list);
  renderChips();
  renderGrid(list);
  updateToolbar();
  updateCartBar();
}

function openSortSheet() {
  const wrap = openSheet({
    title: 'Urutkan produk',
    body: `<div class="option-list">
      ${Object.entries(SORT_LABEL)
        .map(
          ([key, label]) => `<button class="option${state.sort === key ? ' is-selected' : ''}" type="button" data-sort="${key}">
            <span class="option__icon">${ICON.sort}</span>
            <span class="option__body"><strong>${label}</strong></span>
            ${state.sort === key ? `<span class="option__check">${ICON.check}</span>` : ''}
          </button>`
        )
        .join('')}
    </div>`,
  });
  wrap.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-sort]');
    if (!btn) return;
    state.sort = btn.dataset.sort;
    closeSheet();
    syncURL();
    renderAll();
  });
}

function openFilterSheet() {
  const wrap = openSheet({
    title: 'Filter produk',
    body: `<form class="filter-form">
      <p class="sheet__lead">Atur rentang harga produk yang ingin ditampilkan.</p>
      <div class="field">
        <label for="minPrice">Harga minimum</label>
        <div class="field__box"><input id="minPrice" name="min" type="number" min="0" step="500" placeholder="Contoh: 5000" value="${state.min || ''}"></div>
      </div>
      <div class="field">
        <label for="maxPrice">Harga maksimum</label>
        <div class="field__box"><input id="maxPrice" name="max" type="number" min="0" step="500" placeholder="Contoh: 50000" value="${state.max || ''}"></div>
      </div>
      <button class="btn btn--primary btn--block" type="submit">Terapkan filter</button>
      <button class="btn btn--ghost btn--block" type="button" data-reset style="margin-top:8px">Reset filter</button>
    </form>`,
  });
  wrap.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.min = Math.max(0, Number(data.get('min')) || 0);
    state.max = Math.max(0, Number(data.get('max')) || 0);
    closeSheet();
    renderAll();
  });
  wrap.addEventListener('click', (event) => {
    if (!event.target.closest('[data-reset]')) return;
    state.min = 0;
    state.max = 0;
    closeSheet();
    renderAll();
  });
}

function initKategori() {
  renderAll();

  $('#catChips').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-cat]');
    if (!chip) return;
    state.cat = chip.dataset.cat;
    state.q = '';
    syncURL();
    renderAll();
  });

  $('#sortBtn').addEventListener('click', openSortSheet);
  $('#filterBtn').addEventListener('click', openFilterSheet);

  $('#promoToggle').addEventListener('click', () => {
    state.promo = !state.promo;
    syncURL();
    renderAll();
  });

  $('#readyToggle').addEventListener('click', () => {
    state.ready = !state.ready;
    syncURL();
    renderAll();
  });

  document.addEventListener('cart:change', () => {
    renderGrid(filtered());
    updateCartBar();
  });
}

initKategori();
