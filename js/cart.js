/* cart.js — operasi keranjang: baca, simpan, qty, dan badge */

const cartKey = (item) => `${item.id}::${item.variant || ''}`;

function getCart() {
  // Rapikan id lama yang mungkin tersimpan dengan spasi (mis. " telur-10")
  // supaya keranjang yang sudah ada tidak hilang setelah perbaikan data.
  return Store.get(KEY.cart, [])
    .map((item) => ({ ...item, id: String(item.id ?? '').trim() }))
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
  return getCart().reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function cartOriginalTotal() {
  return getCart().reduce((sum, item) => {
    const p = findProduct(item.id);
    return sum + (p ? (p.original || p.price) * item.qty : 0);
  }, 0);
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
  const cart = getCart();
  const found = cart.find((item) => item.id === id && item.variant === v);
  if (found) found.qty += qty;
  else cart.push({ id, qty, variant: v });
  saveCart(cart);
  toast(`${p.short} ditambahkan ke keranjang`, 'success');
}

function setItemQty(id, variant, qty) {
  let cart = getCart();
  const item = cart.find((i) => i.id === id && i.variant === variant);
  if (!item) return;
  item.qty = qty;
  if (item.qty <= 0) cart = cart.filter((i) => !(i.id === id && i.variant === variant));
  saveCart(cart);
}

function changeQty(id, variant, delta) {
  const item = getCart().find((i) => i.id === id && i.variant === variant);
  if (!item) return;
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
