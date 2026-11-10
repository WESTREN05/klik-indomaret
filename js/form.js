/* form.js — helper pesan field, validasi kontak, dan status tombol */

const KlikForm = (() => {
  /**
   * Toggle error pada field. Menerima id container `.field` (login) atau id
   * input (form lain). Pesan hanya diubah jika teks pesan diberikan.
   */
  function setFieldError(fieldOrInputId, hasErrorOrMessage, message) {
    const element = document.getElementById(fieldOrInputId);
    if (!element) return;

    const field = element.classList.contains('field') ? element : element.closest('.field');
    if (!field) return;

    const hasError = typeof hasErrorOrMessage === 'boolean'
      ? hasErrorOrMessage
      : Boolean(hasErrorOrMessage);
    const text = typeof hasErrorOrMessage === 'string' ? hasErrorOrMessage : message;

    field.classList.toggle('has-error', hasError);
    if (text !== undefined) {
      const error = field.querySelector('.field__error');
      if (error) error.textContent = text;
    }

    const input = field.querySelector('input, select, textarea');
    if (input) input.setAttribute('aria-invalid', String(hasError));
  }

  function normalizePhone(value = '') {
    return String(value).trim().replace(/[\s-]/g, '');
  }

  function isValidPhone(value = '') {
    return /^\d{10,15}$/.test(normalizePhone(value));
  }

  function isValidEmail(value = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
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

  return { setFieldError, isValidPhone, isValidEmail, setBusy };
})();
