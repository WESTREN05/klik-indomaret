/* akun.js — profil, riwayat pesanan, dan pengaturan akun */

const akunRoot = $('#akunRoot');

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch (err) {
    return 'Baru saja';
  }
}

function orderCardHTML(order) {
  const first = order.items[0] || { name: 'Pesanan', qty: 1, emoji: '🛒', tint: '#eef2f8', id: '' };
  const more = order.items.length > 1 ? `+${order.items.length - 1} produk lain` : `${first.qty}x`;
  return `<article class="order-card">
    <div class="order-card__head">
      <span>${formatDate(order.date)}</span>
      <span class="order-card__status">${order.status || 'Diproses'}</span>
    </div>
    <div class="order-card__body">
      ${artHTML({ id: first.id, name: first.name, emoji: first.emoji, tint: first.tint })}
      <div>
        <strong>${first.name}</strong>
        <small>${more}</small>
        <small>${order.method} · Estimasi ${order.eta}</small>
      </div>
      <span class="order-card__total">${money(order.total)}</span>
    </div>
  </article>`;
}

function openEditProfile() {
  const user = getUser();
  if (!user) return;
  const wrap = openSheet({
    title: 'Edit profil',
    body: `<form id="editProfileForm">
      <div class="field">
        <label for="editName">Nama lengkap</label>
        <div class="field__box">${ICON.user}<input id="editName" name="name" type="text" value="${escapeHtml(user.name)}" required></div>
      </div>
      <div class="field">
        <label for="editPhone">Nomor HP</label>
        <div class="field__box">${ICON.phone}<input id="editPhone" name="phone" type="tel" value="${escapeHtml(user.phone || '')}" placeholder="08xxxxxxxxxx"></div>
      </div>
      <div class="field">
        <label for="editEmail">Email</label>
        <div class="field__box">${ICON.mail}<input id="editEmail" name="email" type="email" value="${escapeHtml(user.email || '')}" placeholder="nama@email.com"></div>
      </div>
      <button class="btn btn--primary btn--block" type="submit">Simpan perubahan</button>
    </form>`,
  });
  wrap.querySelector('#editProfileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const payload = {
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim(),
    };

    if (payload.name.length < 3) {
      toast('Nama minimal 3 karakter.', 'error');
      return;
    }

    const button = event.target.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Menyimpan...';
    }

    try {
      if (window.KlikApi?.isPhp() && getUser()) {
        try {
          const result = await window.KlikApi.updateProfile(payload);
          if (result.user) applyUserSession(result.user);
          else setUser({ ...user, ...payload });
        } catch (error) {
          if (error.status === 401) {
            logout();
            closeSheet();
            renderAkun();
            mountChrome({ header: 'main', active: 'akun' });
            toast('Sesi kamu habis. Silakan masuk lagi.', 'error');
            return;
          }
          if (!error.offline) {
            toast(error.message || 'Profil gagal disimpan.', 'error');
            return;
          }
          setUser({ ...user, ...payload });
        }
      } else {
        setUser({ ...user, ...payload });
      }

      closeSheet();
      toast('Profil berhasil diperbarui.', 'success');
      renderAkun();
      mountChrome({ header: 'main', active: 'akun' });
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Simpan perubahan';
      }
    }
  });
}

function confirmLogout() {
  const wrap = openSheet({
    title: 'Keluar dari akun?',
    body: `<p class="sheet__lead">Keranjangmu tetap tersimpan di perangkat ini, jadi bisa dilanjutkan kapan saja.</p>
      <div class="option-list">
        <button class="btn btn--primary btn--block" type="button" id="confirmLogout">${ICON.logout} Ya, keluar</button>
        <button class="btn btn--ghost btn--block" type="button" data-close>Batal</button>
      </div>`,
  });
  wrap.querySelector('#confirmLogout').addEventListener('click', () => {
    logout();
    closeSheet();
    toast('Kamu sudah keluar dari akun.', 'info');
    renderAkun();
    mountChrome({ header: 'main', active: 'akun' });
  });
}

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
  const orders = Store.get(KEY.orders, []);
  const joined = user.joined
    ? new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(user.joined))
    : 'Oktober 2026';

  akunRoot.innerHTML = `<section class="profile-card">
      <div class="profile-card__head">
        <div class="profile-card__avatar">${escapeHtml(initials(user.name))}</div>
        <div>
          <h2>${escapeHtml(user.name)}</h2>
          <p>${escapeHtml(user.phone || user.email || 'Member Klik Indomaret')}</p>
          <p>Member sejak ${joined}</p>
        </div>
        <button class="profile-card__edit" type="button" id="editProfileBtn" aria-label="Edit profil">${ICON.edit}</button>
      </div>
      <div class="profile-stats">
        <div class="profile-stat"><small>Saldo</small><strong>${money(getSaldo())}</strong></div>
        <div class="profile-stat"><small>Poinku</small><strong>${getPoints().toLocaleString('id-ID')}</strong></div>
        <div class="profile-stat"><small>Stamp</small><strong>12</strong></div>
      </div>
    </section>

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

    ${
      orders.length
        ? orders.slice(0, 4).map(orderCardHTML).join('')
        : `<div class="empty" style="padding:28px 20px">
            <span class="empty__icon">📦</span>
            <h2>Belum ada pesanan</h2>
            <p>Yuk mulai belanja, pesananmu akan muncul di sini.</p>
            <a class="btn btn--primary btn--sm" href="kategori.html">Mulai belanja</a>
          </div>`
    }

    <button class="btn btn--danger-ghost btn--block" type="button" id="logoutBtn" style="width:calc(100% - 28px);margin:14px">${ICON.logout} Keluar dari akun</button>`;

  $('#editProfileBtn').addEventListener('click', openEditProfile);
  $('#logoutBtn').addEventListener('click', confirmLogout);
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
    if (Array.isArray(orders.orders)) Store.set(KEY.orders, orders.orders);

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
if (window.KlikApi?.isPhp() && getUser()) syncAccount();

document.addEventListener('auth:change', () => {
  renderAkun();
  mountChrome({ header: 'main', active: 'akun' });
});
