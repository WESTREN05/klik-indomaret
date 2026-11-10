/* cart.js — operasi keranjang: baca, simpan, qty, dan badge */

const cartKey = (item) => `${item.id}::${item.variant || ''}`;

function getCart() {
  // Rapikan id lama yang mungkin tersimpan dengan spasi (mis. " telur-10")
  // supaya keranjang yang sudah ada tidak hilang setelah perbaikan data.
  return Store.get(KEY.cart, [])
    .map((item) => {
      const qty = Math.floor(Number(item.qty));
      return {
        ...item,
        id: String(item.id ?? '').trim(),
        qty: Number.isFinite(qty) && qty > 0 ? Math.min(KlikPricing.MAX_QTY, qty) : 1,
      };
    })
    .filter((item) => findProduct(item.id));
}

function saveCart(cart) {
  Store.set(KEY.cart, cart);
  updateCartBadges();
  document.dispatchEvent(new CustomEvent('cart:change', { detail: cart }));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return KlikPricing.itemsSummary(getCart()).subtotal;
}

function cartOriginalTotal() {
  return KlikPricing.itemsSummary(getCart()).originalTotal;
}

function cartQty(id, variant) {
  return getCart()
    .filter((item) => item.id === id && (variant === undefined || item.variant === variant))
    .reduce((sum, item) => sum + item.qty, 0);
}

// Varian yang ditampilkan kartu produk harus sama dengan varian yang
// diubah oleh tombol plus/minus.
function cartVariantFor(id) {
  const item = getCart().find((entry) => entry.id === id);
  if (item) return item.variant;
  const product = findProduct(id);
  return product ? product.unit : '';
}

function addToCart(id, qty = 1, variant) {
  const p = findProduct(id);
  if (!p) return;
  const v = variant || p.unit;
  const amount = Math.max(1, Math.floor(Number(qty) || 1));
  const cart = getCart();
  const found = cart.find((item) => item.id === id && item.variant === v);
  const currentQty = found ? found.qty : 0;

  if (currentQty >= KlikPricing.MAX_QTY) {
    toast(`Jumlah ${p.short} sudah maksimal ${KlikPricing.MAX_QTY}.`, 'info');
    return;
  }

  const nextQty = Math.min(KlikPricing.MAX_QTY, currentQty + amount);
  if (found) found.qty = nextQty;
  else cart.push({ id, qty: nextQty, variant: v });
  saveCart(cart);

  if (nextQty < currentQty + amount) {
    toast(`Jumlah ${p.short} dibatasi maksimal ${KlikPricing.MAX_QTY}.`, 'info');
  } else {
    toast(`${p.short} ditambahkan ke keranjang`, 'success');
  }
}

function setItemQty(id, variant, qty) {
  let cart = getCart();
  const item = cart.find((i) => i.id === id && i.variant === variant);
  if (!item) return;
  const requested = Math.floor(Number(qty) || 0);
  if (requested <= 0) {
    cart = cart.filter((i) => !(i.id === id && i.variant === variant));
    saveCart(cart);
    return;
  }

  item.qty = Math.min(KlikPricing.MAX_QTY, requested);
  saveCart(cart);
  if (requested > KlikPricing.MAX_QTY) {
    toast(`Jumlah ${findProduct(id)?.short || 'produk'} dibatasi maksimal ${KlikPricing.MAX_QTY}.`, 'info');
  }
}

function changeQty(id, variant, delta) {
  const item = getCart().find((i) => i.id === id && i.variant === variant);
  if (!item) return;
  if (delta > 0 && item.qty >= KlikPricing.MAX_QTY) {
    toast(`Jumlah ${findProduct(id)?.short || 'produk'} sudah maksimal ${KlikPricing.MAX_QTY}.`, 'info');
    return;
  }
  setItemQty(id, variant, item.qty + delta);
}

function removeItem(id, variant) {
  saveCart(getCart().filter((i) => !(i.id === id && i.variant === variant)));
}

function updateCartBadges() {
  const count = cartCount();
  $$('.js-cart-count').forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
  $$('.js-cart-total').forEach((el) => {
    el.textContent = money(cartSubtotal());
  });
}
