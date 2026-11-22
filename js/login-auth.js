/* login-auth.js — alur submit masuk, daftar, dan penyelesaian sesi */

const KlikLoginAuth = (() => {
  let redirectPage = 'index.html';

  function finishAuth(user, button) {
    // Akun yang berbeda harus mulai dari cache bersih (saldo/poin/voucher
    // akun sebelumnya tidak boleh ikut terbawa, terutama di mode statis).
    resetAccountCacheFor(user);
    applyUserSession(user);
    // Data server (kalau dikirim) sudah menimpa cache lewat applyUserSession.
    // Default demo hanya mengisi cache yang masih kosong, supaya saldo/poin
    // dari server tidak tertimpa angka demo saat localStorage sudah terisi.
    if (typeof user.saldo !== 'number' && user.phone === '081234567890' && Store.get(KEY.saldo, null) === null) {
      setSaldo(185000);
    }
    if (typeof user.points !== 'number' && user.phone === '081234567890' && Store.get(KEY.points, null) === null) {
      setPoints(4850);
    }
    if (button) {
      button.disabled = true;
      button.textContent = 'Memproses...';
    }
    toast(`Selamat datang, ${user.name.split(' ')[0]}!`, 'success');
    setTimeout(() => {
      location.href = redirectPage;
    }, 650);
  }

  async function submitLogin(event) {
    event.preventDefault();
    if (!KlikLoginValidasi.validateLogin()) return;

    const contact = $('#loginContact').value.trim();
    const password = $('#loginPassword').value;
    const button = $('#loginSubmit');

    if (window.KlikApi?.isPhp()) {
      KlikForm.setBusy(button, true);
      try {
        const result = await window.KlikApi.login(contact, password);
        finishAuth(result.user, button);
        applyVoucherState(result);
        return;
      } catch (error) {
        KlikForm.setBusy(button, false);
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
  }

  async function submitRegister(event) {
    event.preventDefault();
    if (!KlikLoginValidasi.validateRegister()) return;

    const payload = {
      name: $('#regName').value.trim(),
      phone: $('#regPhone').value.trim(),
      email: $('#regEmail').value.trim(),
      password: $('#regPassword').value,
    };
    const button = $('#registerSubmit');

    if (window.KlikApi?.isPhp()) {
      KlikForm.setBusy(button, true);
      try {
        const result = await window.KlikApi.register(payload);
        finishAuth(result.user, button);
        applyVoucherState(result);
        return;
      } catch (error) {
        KlikForm.setBusy(button, false);
        if (!error.offline) {
          toast(error.message || 'Pendaftaran gagal.', 'error');
          return;
        }
        // Server PHP tidak tersedia: lanjut ke fallback localStorage.
      }
    }

    Store.set(KEY.claimed, []);
    Store.set(KEY.used, []);
    finishAuth(
      {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        joined: new Date().toISOString(),
      },
      button
    );
  }

  function bind(nextPage = 'index.html') {
    redirectPage = nextPage;
    const loginForm = $('#loginForm');
    const registerForm = $('#registerForm');
    if (loginForm) loginForm.addEventListener('submit', submitLogin);
    if (registerForm) registerForm.addEventListener('submit', submitRegister);
  }

  return { bind, finishAuth };
})();
