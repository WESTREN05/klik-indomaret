/* akun.js — orkestrasi halaman akun, menu, dan sinkronisasi sesi */

const akunRoot = $('#akunRoot');

function renderGuest() {
  akunRoot.innerHTML = `<div class="profile-guest">
      <span class="profile-guest__icon">${ICON.user}</span>
      <h2>Masuk ke akunmu</h2>
      <p>Simpan alamat, kumpulkan poin, dan lacak pesanan dengan mudah. Daftar gratis, kok.</p>
      <a class="btn btn--primary btn--block" href="login.html?next=akun.html">${ICON.lock} Masuk / Daftar</a>
      <a class="btn btn--ghost btn--block" href="kategori.html" style="margin-top:8px">Lihat katalog dulu</a>
    </div>

    <div class="menu-list">
      <a class="menu-item" href="promo.html">
        <span class="menu-item__icon">${ICON.ticket}</span>
        <div><strong>Voucher &amp; Promo</strong><small>Klaim promo yang sedang aktif</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </a>
      <button class="menu-item js-open-address" type="button">
        <span class="menu-item__icon">${ICON.pin}</span>
        <div><strong>Alamat Pengiriman</strong><small>Atur alamat pengantaran</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
      <button class="menu-item" type="button" data-menu="help">
        <span class="menu-item__icon">${ICON.help}</span>
        <div><strong>Bantuan</strong><small>FAQ dan customer service</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
      <button class="menu-item" type="button" data-menu="about">
        <span class="menu-item__icon">${ICON.info}</span>
        <div><strong>Tentang Aplikasi</strong><small>Prototype Klik Indomaret</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
    </div>`;

  bindMenus();
}

function renderUser() {
  const user = getUser();
  if (!user) return renderGuest();
  const orders = getCachedOrders();

  akunRoot.innerHTML = `${KlikAkunProfil.cardHTML(user)}

    <div class="menu-list">
      <a class="menu-item" href="#pesanan">
        <span class="menu-item__icon">${ICON.box}</span>
        <div><strong>Pesanan Saya</strong><small>${orders.length} pesanan tercatat</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </a>
      <a class="menu-item" href="promo.html">
        <span class="menu-item__icon">${ICON.ticket}</span>
        <div><strong>Voucher &amp; Promo</strong><small>Klaim promo yang sedang aktif</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </a>
      <button class="menu-item js-open-address" type="button">
        <span class="menu-item__icon">${ICON.pin}</span>
        <div><strong>Alamat Pengiriman</strong><small>Atur alamat pengantaran</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
      <button class="menu-item" type="button" data-menu="settings">
        <span class="menu-item__icon">${ICON.settings}</span>
        <div><strong>Pengaturan</strong><small>Notifikasi dan preferensi akun</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
      <button class="menu-item" type="button" data-menu="help">
        <span class="menu-item__icon">${ICON.help}</span>
        <div><strong>Bantuan</strong><small>FAQ dan customer service</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
      <button class="menu-item" type="button" data-menu="about">
        <span class="menu-item__icon">${ICON.info}</span>
        <div><strong>Tentang Aplikasi</strong><small>Prototype Klik Indomaret</small></div>
        <span class="menu-item__chev">${ICON.chevronRight}</span>
      </button>
    </div>

    <div class="section-label" id="pesanan"><span>Pesanan Saya</span><a class="link-more" href="promo.html">Lihat Promo ${ICON.chevronRight}</a></div>

    ${KlikAkunPesanan.listHTML(orders)}

    <button class="btn btn--danger-ghost btn--block" type="button" id="logoutBtn" style="width:calc(100% - 28px);margin:14px">${ICON.logout} Keluar dari akun</button>`;

  KlikAkunProfil.bind();
  bindMenus();
}

function bindMenus() {
  $$('[data-menu]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const menu = btn.dataset.menu;
      if (menu === 'help') {
        openHelp();
        return;
      }
      if (menu === 'settings') {
        openSheet({
          title: 'Pengaturan',
          body: `<div class="option-list">
            <button class="option is-selected" type="button" data-close>${ICON.bell}<span class="option__body"><strong>Notifikasi pesanan</strong><small>Status pesanan dan promo</small></span><span class="option__check">${ICON.check}</span></button>
            <button class="option" type="button" data-close>${ICON.lock}<span class="option__body"><strong>Keamanan akun</strong><small>Ubah password dan PIN</small></span></button>
          </div>`,
        });
        return;
      }
      openSheet({
        title: 'Tentang aplikasi',
        body: `<p class="sheet__lead">Klik Indomaret adalah prototype aplikasi belanja kebutuhan harian yang dibuat untuk tugas kuliah menggunakan metode Waterfall.</p>
          <div class="option-list">
            <div class="option is-selected"><span class="option__icon">${ICON.bag}</span><span class="option__body"><strong>Klik Indomaret</strong><small>Versi 1.0.0 · HTML, CSS, JavaScript</small></span></div>
          </div>`,
      });
    });
  });
}

function renderAkun() {
  if (getUser()) renderUser();
  else renderGuest();
}

async function syncAccount() {
  if (!window.KlikApi?.isPhp() || !getUser()) return;

  try {
    const [profile, orders] = await Promise.all([
      window.KlikApi.profile(),
      window.KlikApi.orders(),
    ]);

    if (profile.user) applyUserSession(profile.user);
    if (Array.isArray(orders.orders)) setCachedOrders(orders.orders);

    renderUser();
    mountChrome({ header: 'main', active: 'akun' });
  } catch (error) {
    if (error.status === 401) {
      logout();
      renderGuest();
      mountChrome({ header: 'main', active: 'akun' });
    }
  }
}

renderAkun();
// Mode demo: session server baru dibuat setelah app.js menyelesaikan login,
// jadi sinkronisasi awal dilewati agar tidak memicu 401 dan logout.
if (window.KlikApi?.isPhp() && getUser() && !isDemoMode) syncAccount();

document.addEventListener('auth:change', () => {
  renderAkun();
  mountChrome({ header: 'main', active: 'akun' });
  if (isDemoMode && window.KlikApi?.isPhp() && getUser()) syncAccount();
});
