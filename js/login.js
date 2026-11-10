/* login.js — orkestrasi UI masuk, daftar, dan bantuan akun */

const authParams = new URLSearchParams(location.search);
const rawNext = authParams.get('next') || 'index.html';
const nextPage = /^[a-z0-9_-]+\.(?:html|php)(\?.*)?$/i.test(rawNext) ? rawNext : 'index.html';

const loginForm = $('#loginForm');
const registerForm = $('#registerForm');

function switchAuthTab(tab) {
  $$('[data-auth-tab]').forEach((btn) => {
    const active = btn.dataset.authTab === tab;
    btn.classList.toggle('is-active', active);
    if (btn.getAttribute('role') === 'tab') btn.setAttribute('aria-selected', String(active));
  });
  loginForm.hidden = tab !== 'login';
  registerForm.hidden = tab !== 'register';
  $('#authHeadline').innerHTML = tab === 'login' ? 'Belanja kebutuhan,<br>tanpa antre.' : 'Gabung member,<br>hemat tiap hari.';
  $('#authLead').textContent =
    tab === 'login'
      ? 'Masuk untuk memesan lebih cepat, menyimpan alamat, dan mengumpulkan poin setiap belanja.'
      : 'Daftar gratis dan dapatkan voucher member baru, poin belanja, serta promo khusus setiap minggu.';

  const switchText = $('#authSwitchText');
  const switchBtn = $('#authSwitchBtn');
  if (switchText) switchText.textContent = tab === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?';
  if (switchBtn) {
    switchBtn.textContent = tab === 'login' ? 'Daftar gratis' : 'Masuk di sini';
    switchBtn.dataset.authTab = tab === 'login' ? 'register' : 'login';
  }
}

function initLogin() {
  $$('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab));
  });

  $$('[data-toggle-pass]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePass);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? ICON.eyeOff : ICON.eye;
      btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    });
  });

  ['loginContact', 'loginPassword'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      const field = document.getElementById(id).closest('.field');
      if (field) field.classList.remove('has-error');
    });
  });

  ['regName', 'regPhone', 'regEmail', 'regPassword', 'regConfirm'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      const field = document.getElementById(id).closest('.field');
      if (field) field.classList.remove('has-error');
    });
  });

  KlikLoginAuth.bind(nextPage);

  $('#fillDemo').addEventListener('click', () => {
    switchAuthTab('login');
    $('#loginContact').value = '081234567890';
    $('#loginPassword').value = 'password123';
    KlikForm.setFieldError('loginContactField', false);
    KlikForm.setFieldError('loginPasswordField', false);
    toast('Akun demo siap. Tekan Masuk.', 'info');
  });

  $('#forgotLink').addEventListener('click', (event) => {
    event.preventDefault();
    const wrap = openSheet({
      title: 'Lupa password',
      body: `<p class="sheet__lead">Masukkan nomor HP atau email akunmu. Tautan reset akan dikirim (demo).</p>
        <form id="forgotForm">
          <div class="field">
            <label for="forgotContact">Nomor HP / Email</label>
            <div class="field__box">${ICON.mail}<input id="forgotContact" type="text" placeholder="0812 3456 7890 atau email"></div>
          </div>
          <button class="btn btn--primary btn--block" type="submit">Kirim tautan reset</button>
        </form>`,
    });
    wrap.querySelector('#forgotForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const value = wrap.querySelector('#forgotContact').value.trim();
      if (!value) {
        toast('Isi nomor HP atau email dulu.', 'error');
        return;
      }

      if (window.KlikApi?.isPhp()) {
        try {
          await window.KlikApi.forgot(value);
        } catch (error) {
          if (!error.offline) {
            toast(error.message || 'Tautan reset gagal dikirim.', 'error');
            return;
          }
        }
      }

      closeSheet();
      toast('Tautan reset password sudah dikirim (demo).', 'success');
    });
  });

  $$('[data-social]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toast(`Masuk dengan ${btn.dataset.social} belum tersedia di demo. Gunakan akun demo ya.`, 'info');
    });
  });

  const current = getUser();
  if (current) {
    const box = document.createElement('div');
    box.className = 'demo-box';
    box.innerHTML = `Kamu sudah masuk sebagai <strong>${escapeHtml(current.name)}</strong>.
      <button type="button" id="switchAccount">Keluar &amp; ganti akun</button>`;
    const card = $('.auth-card');
    card.insertBefore(box, card.querySelector('.auth-tabs').nextSibling);
    box.querySelector('#switchAccount').addEventListener('click', () => {
      logout();
      box.remove();
      toast('Kamu sudah keluar. Silakan masuk dengan akun lain.', 'info');
    });
  }
}

initLogin();
