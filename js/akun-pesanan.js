/* akun-pesanan.js — kartu dan daftar riwayat pesanan */

const KlikAkunPesanan = (() => {
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

  function cardHTML(order) {
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

  function listHTML(orders) {
    return orders.length
      ? orders.slice(0, 4).map(cardHTML).join('')
      : `<div class="empty" style="padding:28px 20px">
          <span class="empty__icon">📦</span>
          <h2>Belum ada pesanan</h2>
          <p>Yuk mulai belanja, pesananmu akan muncul di sini.</p>
          <a class="btn btn--primary btn--sm" href="kategori.html">Mulai belanja</a>
        </div>`;
  }

  return { listHTML };
})();
