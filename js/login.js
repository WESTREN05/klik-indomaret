/* login.js — masuk, daftar, validasi, dan sesi */

const authParams = new URLSearchParams(location.search);
const rawNext = authParams.get('next') || 'index.html';
const nextPage = /^[a-z0-9_-]+\.(?:html|php)(\?.*)?$/i.test(rawNext) ? rawNext : 'index.html';

const loginForm = $('#loginForm');
const registerForm = $('#registerForm');

function setFieldError(fieldId, hasError, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.toggle('has-error', hasError);
  if (message) {
    const error = field.querySelector('.field__error');
    if (error) error.textContent = message;
  }
}

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

function validateLogin() {
  const contact = $('#loginContact').value.trim();
  const password = $('#loginPassword').value;
  let valid = true;

  if (!contact) {
    setFieldError('loginContactField', true, 'Nomor HP atau email wajib diisi.');
    valid = false;
  } else {
    setFieldError('loginContactField', false);
  }

  if (password.length < 6) {
    setFieldError('loginPasswordField', true, 'Password minimal 6 karakter.');
    valid = false;
  } else {
    setFieldError('loginPasswordField', false);
  }

  return valid;
}

function validateRegister() {
  const name = $('#regName').value.trim();
  const phone = $('#regPhone').value.trim();
  const email = $('#regEmail').value.trim();
  const password = $('#regPassword').value;
  const confirm = $('#regConfirm').value;
  let valid = true;

  if (name.length < 3) {
    setFieldError('regNameField', true, 'Nama minimal 3 karakter.');
    valid = false;
  } else setFieldError('regNameField', false);

  if (!/^\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
    setFieldError('regPhoneField', true, 'Nomor HP harus 10–15 digit angka.');
    valid = false;
  } else setFieldError('regPhoneField', false);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('regEmailField', true, 'Format email belum benar.');
    valid = false;
  } else setFieldError('regEmailField', false);

  if (password.length < 6) {
    setFieldError('regPasswordField', true, 'Password minimal 6 karakter.');
    valid = false;
  } else setFieldError('regPasswordField', false);

  if (confirm !== password || !confirm) {
    setFieldError('regConfirmField', true, 'Konfirmasi password belum sama.');
    valid = false;
  } else setFieldError('regConfirmField', false);

  return valid;
}

function setBusy(button, busy, label = 'Memproses...') {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || 'Masuk';
  }
}

function finishAuth(user, button) {
  applyUserSession(user);
  if (typeof user.saldo !== 'number' && user.phone === '081234567890') setSaldo(185000);
  if (typeof user.points !== 'number' && user.phone === '081234567890') setPoints(4850);
  if (button) {
    button.disabled = true;
    button.textContent = 'Memproses...';
  }
  toast(`Selamat datang, ${user.name.split(' ')[0]}!`, 'success');
  setTimeout(() => {
    location.href = nextPage;
  }, 650);
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

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateLogin()) return;

    const contact = $('#loginContact').value.trim();
    const password = $('#loginPassword').value;
    const button = $('#loginSubmit');

    if (window.KlikApi?.isPhp()) {
      setBusy(button, true);
      try {
        const result = await window.KlikApi.login(contact, password);
        if (Array.isArray(result.claimed)) Store.set(KEY.claimed, result.claimed);
        finishAuth(result.user, button);
        return;
      } catch (error) {
        setBusy(button, false);
        if (!error.offline) {
          toast(error.message || 'Nomor HP/email atau password salah.', 'error');
          return;
        }
        // Server PHP tidak tersedia: lanjut ke fallback localStorage.
      }
    }

    const isDemo = contact.replace(/\D/g, '') === '081234567890' || contact.toLowerCase() === 'demo@klikindomaret.id';
    const isEmail = contact.includes('@');
    const rawName = isDemo ? 'Bagas Pratama' : isEmail ? contact.split('@')[0] : 'Pelanggan Indomaret';
    const name = rawName
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    finishAuth(
      {
        name: isDemo ? 'Bagas Pratama' : name,
        phone: isEmail ? '' : contact,
        email: isEmail ? contact : '',
        joined: new Date().toISOString(),
      },
      button
    );
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateRegister()) return;

    const payload = {
      name: $('#regName').value.trim(),
      phone: $('#regPhone').value.trim(),
      email: $('#regEmail').value.trim(),
      password: $('#regPassword').value,
    };
    const button = $('#registerSubmit');

    if (window.KlikApi?.isPhp()) {
      setBusy(button, true);
      try {
        const result = await window.KlikApi.register(payload);
        if (Array.isArray(result.claimed)) Store.set(KEY.claimed, result.claimed);
        finishAuth(result.user, button);
        return;
      } catch (error) {
        setBusy(button, false);
        if (!error.offline) {
          toast(error.message || 'Pendaftaran gagal.', 'error');
          return;
        }
        // Server PHP tidak tersedia: lanjut ke fallback localStorage.
      }
    }

    Store.set(KEY.claimed, []);
    finishAuth(
      {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        joined: new Date().toISOString(),
      },
      button
    );
  });

  $('#fillDemo').addEventListener('click', () => {
    switchAuthTab('login');
    $('#loginContact').value = '081234567890';
    $('#loginPassword').value = 'password123';
    setFieldError('loginContactField', false);
    setFieldError('loginPasswordField', false);
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
