/* login-validasi.js — validasi form masuk dan daftar */

const KlikLoginValidasi = (() => {
  function validateLogin() {
    const contact = $('#loginContact').value.trim();
    const password = $('#loginPassword').value;
    let valid = true;

    if (!contact) {
      KlikForm.setFieldError('loginContactField', true, 'Nomor HP atau email wajib diisi.');
      valid = false;
    } else {
      KlikForm.setFieldError('loginContactField', false);
    }

    if (password.length < 6) {
      KlikForm.setFieldError('loginPasswordField', true, 'Password minimal 6 karakter.');
      valid = false;
    } else {
      KlikForm.setFieldError('loginPasswordField', false);
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
      KlikForm.setFieldError('regNameField', true, 'Nama minimal 3 karakter.');
      valid = false;
    } else KlikForm.setFieldError('regNameField', false);

    if (!KlikForm.isValidPhone(phone)) {
      KlikForm.setFieldError('regPhoneField', true, 'Nomor HP harus 10–15 digit angka.');
      valid = false;
    } else KlikForm.setFieldError('regPhoneField', false);

    if (!KlikForm.isValidEmail(email)) {
      KlikForm.setFieldError('regEmailField', true, 'Format email belum benar.');
      valid = false;
    } else KlikForm.setFieldError('regEmailField', false);

    if (password.length < 6) {
      KlikForm.setFieldError('regPasswordField', true, 'Password minimal 6 karakter.');
      valid = false;
    } else KlikForm.setFieldError('regPasswordField', false);

    if (confirm !== password || !confirm) {
      KlikForm.setFieldError('regConfirmField', true, 'Konfirmasi password belum sama.');
      valid = false;
    } else KlikForm.setFieldError('regConfirmField', false);

    return valid;
  }

  return { validateLogin, validateRegister };
})();
