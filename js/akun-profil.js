/* akun-profil.js — kartu profil, edit profil, dan logout */

const KlikAkunProfil = (() => {
  function cardHTML(user) {
    const joined = user.joined
      ? new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(user.joined))
      : 'Oktober 2026';

    return `<section class="profile-card">
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
    </section>`;
  }

  function openEditProfile() {
    const user = getUser();
    if (!user) return;
    const wrap = openSheet({
      title: 'Edit profil',
      body: `<form id="editProfileForm" novalidate>
        <div class="field">
          <label for="editName">Nama lengkap</label>
          <div class="field__box">${ICON.user}<input id="editName" name="name" type="text" value="${escapeHtml(user.name)}" required></div>
          <small class="field__error"></small>
        </div>
        <div class="field">
          <label for="editPhone">Nomor HP</label>
          <div class="field__box">${ICON.phone}<input id="editPhone" name="phone" type="tel" inputmode="tel" value="${escapeHtml(user.phone || '')}" placeholder="08xxxxxxxxxx"></div>
          <small class="field__error"></small>
        </div>
        <div class="field">
          <label for="editEmail">Email</label>
          <div class="field__box">${ICON.mail}<input id="editEmail" name="email" type="email" value="${escapeHtml(user.email || '')}" placeholder="nama@email.com"></div>
          <small class="field__error"></small>
        </div>
        <button class="btn btn--primary btn--block" type="submit">Simpan perubahan</button>
      </form>`,
    });
    ['editName', 'editPhone', 'editEmail'].forEach((id) => {
      wrap.querySelector(`#${id}`)?.addEventListener('input', () => KlikForm.setFieldError(id, ''));
    });
    wrap.querySelector('#editProfileForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const payload = {
        name: String(data.get('name') || '').trim(),
        phone: String(data.get('phone') || '').trim().replace(/[\s-]/g, ''),
        email: String(data.get('email') || '').trim().toLowerCase(),
      };

      KlikForm.setFieldError('editName', '');
      KlikForm.setFieldError('editPhone', '');
      KlikForm.setFieldError('editEmail', '');

      let valid = true;
      if (payload.name.length < 3) {
        KlikForm.setFieldError('editName', 'Nama minimal 3 karakter.');
        valid = false;
      }
      if (!payload.phone && !payload.email) {
        KlikForm.setFieldError('editPhone', 'Isi nomor HP atau email.');
        KlikForm.setFieldError('editEmail', 'Isi nomor HP atau email.');
        valid = false;
      } else {
        if (payload.phone && !KlikForm.isValidPhone(payload.phone)) {
          KlikForm.setFieldError('editPhone', 'Nomor HP harus 10–15 digit angka.');
          valid = false;
        }
        if (payload.email && !KlikForm.isValidEmail(payload.email)) {
          KlikForm.setFieldError('editEmail', 'Format email belum benar.');
          valid = false;
        }
      }
      if (!valid) return;

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

  function bind() {
    $('#editProfileBtn')?.addEventListener('click', openEditProfile);
    $('#logoutBtn')?.addEventListener('click', confirmLogout);
  }

  return { cardHTML, bind };
})();
