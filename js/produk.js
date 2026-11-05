/* produk.js — halaman detail produk */

const pdpParams = new URLSearchParams(location.search);
const product = findProduct(pdpParams.get('id')) || PRODUCTS[0];
const store = getStoreData();

let pdpQty = 1;
let selectedVariant = product.unit;
let selectedDelivery = Store.get(KEY.delivery, 'express');
let activeTab = 'desc';

const related = PRODUCTS.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 6);
const saveAmount = Math.max(0, (product.original || product.price) - product.price);
const pct = discountPct(product);

function badgesHTML() {
  if (product.tags.includes('jsm')) {
    return `<span class="badge badge--discount">JSM DISKON ${pct || 10}%</span>
      ${product.original > product.price ? '<span class="badge badge--super">SUPER HEMAT</span>' : ''}`;
  }
  if (product.badge) return badgeHTML(product);
  if (pct) return `<span class="badge badge--discount">DISKON ${pct}%</span>`;
  return '';
}

function panelHTML(tab) {
  if (tab === 'comp') {
    return `<p>${product.comp}</p>`;
  }
  if (tab === 'cert') {
    return `<p>${product.cert}</p>
      <ul>
        <li>${ICON.shield}<span>Produk asli dan bersertifikat resmi.</span></li>
        <li>${ICON.check}<span>Disimpan sesuai standar suhu toko.</span></li>
      </ul>`;
  }
  return `<p>${product.desc}</p>
    <ul>
      <li>${ICON.check}<span>Diperkaya vitamin &amp; mineral esensial.</span></li>
      <li>${ICON.check}<span>Kemasan higienis dan mudah disimpan.</span></li>
      <li>${ICON.check}<span>Dijamin asli &amp; segar dari toko terdekat.</span></li>
    </ul>`;
}

function renderPDP() {
  document.title = `${product.short} — Klik Indomaret`;

  $('#pdpRoot').innerHTML = `
    <section class="pdp-media" aria-label="Foto produk">
      <div class="pdp-badges">${badgesHTML()}</div>
      <div class="pdp-float">
        <button type="button" id="likeBtn" aria-label="Simpan ke wishlist" aria-pressed="false">${ICON.heart}</button>
        <button type="button" id="shareBtn" aria-label="Bagikan produk">${ICON.share}</button>
      </div>
      ${artHTML(product)}
      <div class="dots" role="group" aria-label="Galeri produk">
        <button class="is-active" type="button" data-dot="0" aria-label="Foto 1"></button>
        <button type="button" data-dot="1" aria-label="Foto 2"></button>
        <button type="button" data-dot="2" aria-label="Foto 3"></button>
      </div>
    </section>

    <section class="pdp-sheet">
      <div class="price-row">
        <span class="price-now">${money(product.price)}</span>
        ${product.original > product.price ? `<s class="price-old">${money(product.original)}</s>` : ''}
        ${saveAmount ? `<span class="price-save">Hemat ${money(saveAmount)}</span>` : ''}
        ${ratingHTML(product)}
      </div>

      <span class="pdp-brand">${product.brand} OFFICIAL</span>
      <h1 class="pdp-name">${product.name}</h1>

      <div class="pdp-chips">
        <span class="pdp-chip">${ICON.sparkle} +${product.points} Poinku Points</span>
        <span class="pdp-chip pdp-chip--red">${ICON.ticket} Voucher Diskon Gajian Aktif</span>
      </div>

      <div class="store-box">
        <span class="store-box__icon">${ICON.store}</span>
        <div class="store-box__body">
          <strong><span class="js-store-name">${store.name}</span> <span class="js-store-distance" style="font-weight:500;color:#5a6b85">${store.distance}</span></strong>
          <small>Stok tersedia (&gt;20 ${product.unit.toLowerCase()})</small>
        </div>
        <button class="store-box__change js-open-store" type="button">Ganti Toko</button>
      </div>

      <div class="delivery-grid" role="group" aria-label="Metode pengiriman">
        <button class="delivery${selectedDelivery === 'express' ? ' is-selected' : ''}" type="button" data-delivery="express">
          <span class="delivery__icon">${ICON.bolt}</span>
          <span><strong>Express 1 Jam</strong><small>Tiba s/d 15.30 WIB</small><b>Rp 10.000</b></span>
        </button>
        <button class="delivery${selectedDelivery === 'pickup' ? ' is-selected' : ''}" type="button" data-delivery="pickup">
          <span class="delivery__icon">${ICON.store}</span>
          <span><strong>Ambil di Toko</strong><small>Siap dalam 30 menit</small><b>GRATIS BIAYA</b></span>
        </button>
      </div>

      <div class="variant-block">
        <div class="variant-block__head">
          <strong>Pilihan Kemasan &amp; Ukuran</strong>
          <span id="variantLabel">${selectedVariant} (Terpilih)</span>
        </div>
        <div class="variant-row" id="variantRow">
          ${(product.variants || [product.unit])
            .map(
              (v) => `<button class="variant${v === selectedVariant ? ' is-active' : ''}" type="button" data-variant="${v}">${v}</button>`
            )
            .join('')}
        </div>
      </div>

      <div class="tabs" role="tablist" aria-label="Informasi produk">
        <button class="tab is-active" type="button" role="tab" data-tab="desc" aria-selected="true">Deskripsi</button>
        <button class="tab" type="button" role="tab" data-tab="comp" aria-selected="false">Komposisi &amp; Gizi</button>
        <button class="tab" type="button" role="tab" data-tab="cert" aria-selected="false">Sertifikasi</button>
      </div>
      <div class="tab-panel" id="tabPanel">${panelHTML(activeTab)}</div>

      <section class="related" aria-labelledby="relatedTitle">
        <div class="section-head">
          <div>
            <h2 class="section-title" id="relatedTitle">Sering Dibeli Bersama</h2>
            <p class="section-sub">Lengkapi kebutuhan dapurmu</p>
          </div>
        </div>
        <div class="related-scroll">
          ${related
            .map(
              (p) => `<article class="related-card">
                <a href="produk.html?id=${p.id}" aria-label="${escapeHtml(p.name)}">${artHTML(p)}</a>
                <a class="related-card__name" href="produk.html?id=${p.id}">${p.short}</a>
                <div class="related-card__price">${money(p.price)}</div>
                <button class="btn btn--add btn--block" type="button" data-add="${p.id}">+ Tambah</button>
              </article>`
            )
            .join('')}
        </div>
      </section>
    </section>

    <div class="pdp-bar">
      <button class="pdp-bar__store" type="button" id="storeChat">${ICON.chat}<span>Toko</span></button>
      <div class="stepper" id="pdpStepper">
        <button type="button" data-pdp-step="-1" aria-label="Kurangi jumlah">${ICON.minus}</button>
        <span id="pdpQty">1</span>
        <button type="button" data-pdp-step="1" aria-label="Tambah jumlah">${ICON.plus}</button>
      </div>
      <button class="btn btn--primary" type="button" id="buyNow">
        <small>Beli Sekarang</small>
        <strong id="pdpTotal">${money(product.price)}</strong>
      </button>
    </div>`;

  bindPDP();
}

function updatePdpBar() {
  $('#pdpQty').textContent = pdpQty;
  $('#pdpTotal').textContent = money(product.price * pdpQty);
}

function bindPDP() {
  $('#pdpStepper').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-pdp-step]');
    if (!btn) return;
    pdpQty = Math.min(99, Math.max(1, pdpQty + Number(btn.dataset.pdpStep)));
    updatePdpBar();
  });

  $('#buyNow').addEventListener('click', () => {
    addToCart(product.id, pdpQty, selectedVariant);
    setTimeout(() => {
      location.href = 'keranjang.html';
    }, 260);
  });

  $('#variantRow').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-variant]');
    if (!btn) return;
    selectedVariant = btn.dataset.variant;
    $$('#variantRow .variant').forEach((el) => el.classList.toggle('is-active', el === btn));
    $('#variantLabel').textContent = `${selectedVariant} (Terpilih)`;
  });

  $$('.delivery').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedDelivery = btn.dataset.delivery;
      $$('.delivery').forEach((el) => el.classList.toggle('is-selected', el === btn));
      Store.set(KEY.delivery, selectedDelivery);
      toast(selectedDelivery === 'pickup' ? 'Metode: ambil di toko (gratis biaya).' : 'Metode: express 1 jam.', 'info');
    });
  });

  $$('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      $$('.tab').forEach((el) => {
        el.classList.toggle('is-active', el === btn);
        el.setAttribute('aria-selected', String(el === btn));
      });
      $('#tabPanel').innerHTML = panelHTML(activeTab);
    });
  });

  $('#likeBtn').addEventListener('click', (event) => {
    const btn = event.currentTarget;
    const liked = btn.classList.toggle('is-liked');
    btn.setAttribute('aria-pressed', String(liked));
    toast(liked ? 'Produk disimpan ke wishlist.' : 'Produk dihapus dari wishlist.', 'info');
  });

  $('#shareBtn').addEventListener('click', async () => {
    const data = { title: product.name, text: `Cek ${product.short} di Klik Indomaret`, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        toast('Link produk disalin.', 'success');
      }
    } catch (err) {
      toast('Link produk disalin.', 'success');
    }
  });

  $$('.dots button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.dots button').forEach((el) => el.classList.toggle('is-active', el === btn));
      const tints = [product.tint, '#e8f1ff', '#fff3e0'];
      $('.pdp-media .art')?.style.setProperty('--tint', tints[Number(btn.dataset.dot)] || product.tint);
    });
  });

  $('#storeChat').addEventListener('click', () => {
    openSheet({
      title: getStoreData().name,
      body: `<div class="option-list">
        <div class="option is-selected">
          <span class="option__icon">${ICON.store}</span>
          <span class="option__body"><strong>${getStoreData().name}</strong><small>${getStoreData().address}</small><small>Buka ${STORE.hours} · ${getStoreData().distance} dari lokasimu</small></span>
        </div>
      </div>
      <p class="sheet__lead" style="margin-top:10px">Butuh bantuan? Chat customer service Klik Indomaret.</p>
      <button class="btn btn--primary btn--block" type="button" data-close>${ICON.chat} Mulai chat</button>`,
    });
  });
}

renderPDP();
