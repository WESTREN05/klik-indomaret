/* pricing.js — satu sumber perhitungan keranjang dan voucher.
   Dipakai oleh cart.js (badge/total) dan keranjang.js (ringkasan & checkout).
   Backend PHP tetap menghitung ulang total sebagai batas kepercayaan server. */

const KlikPricing = (() => {
  const {
    shippingExpress: SHIPPING_EXPRESS,
    pointCost: POINT_COST,
    pointValue: POINT_VALUE,
    maxQty: MAX_QTY,
  } = SETTINGS;

  const findProductIn = (products, id) => products.find((product) => product.id === id);
  const findVoucherIn = (vouchers, code) => vouchers.find((entry) => entry.code === code);

  /**
   * Potongan satu voucher, dihitung dari `rules` di js/data.js.
   * Rumus ini harus sama dengan klik_voucher_discount() di php/lib/pricing.php.
   */
  function discountFor(code, { subtotal = 0, shippingFee = 0, vouchers = VOUCHERS } = {}) {
    const rules = findVoucherIn(vouchers, code)?.rules || {};
    let discount = Number(rules.fixed) || 0;

    const percent = Number(rules.percent) || 0;
    if (percent > 0) {
      const amount = Math.round((subtotal * percent) / 100);
      const cap = Number(rules.cap) || 0;
      discount += cap > 0 ? Math.min(cap, amount) : amount;
    }

    const shippingCap = Number(rules.shipping) || 0;
    if (shippingCap > 0) discount += Math.min(shippingCap, shippingFee);

    return Math.max(0, discount);
  }

  /**
   * Ringkasan item tanpa ongkir/voucher/poin.
   */
  function itemsSummary(items, products = PRODUCTS) {
    let count = 0;
    let subtotal = 0;
    let originalTotal = 0;
    const ids = new Set();

    for (const item of items) {
      const product = findProductIn(products, item.id);
      if (!product) continue;
      count += item.qty;
      subtotal += product.price * item.qty;
      originalTotal += (product.original || product.price) * item.qty;
      ids.add(item.id);
    }

    return {
      count,
      subtotal,
      originalTotal,
      promoDiscount: Math.max(0, originalTotal - subtotal),
      jenis: ids.size,
    };
  }

  function requiresExpress(code, vouchers = VOUCHERS) {
    return Boolean(code && findVoucherIn(vouchers, code)?.expressOnly);
  }

  /**
   * Cek voucher: dikenal, sudah diklaim, minimum belanja terpenuhi, dan
   * metode kirim sesuai. Dipakai untuk menghitung diskon sekaligus
   * menentukan status tombol di sheet voucher.
   */
  function voucherUsable(code, { subtotal, delivery, claimed = [], used = [], vouchers = VOUCHERS }) {
    const voucher = findVoucherIn(vouchers, code);
    if (!voucher) return false;
    if (!claimed.includes(code)) return false;
    if (used.includes(code)) return false;
    if (subtotal < (voucher.min || 0)) return false;
    if (requiresExpress(code) && delivery !== 'express') return false;
    return true;
  }

  /**
   * Hitung ringkasan keranjang lengkap. Input murni; tidak membaca DOM.
   */
  function computeTotals({
    items = [],
    delivery = 'express',
    voucher = null,
    usePoints = false,
    pointsBalance = 0,
    claimed = [],
    used = [],
    products = PRODUCTS,
    vouchers = VOUCHERS,
  }) {
    const summary = itemsSummary(items, products);
    const shippingFee = items.length > 0 && delivery === 'express' ? SHIPPING_EXPRESS : 0;
    const voucherData = voucher ? findVoucherIn(vouchers, voucher) : null;

    let voucherDiscount = 0;
    let voucherLabel = '';
    const usable = Boolean(
      voucherData && voucherUsable(voucher, { subtotal: summary.subtotal, delivery, claimed, used, vouchers })
    );

    if (usable) {
      voucherDiscount = discountFor(voucher, { subtotal: summary.subtotal, shippingFee, vouchers });
      voucherLabel = voucherDiscount > 0 ? voucherData.label || voucherData.title || 'Diskon Voucher' : '';
    }

    const pointsDiscount = usePoints && pointsBalance >= POINT_COST && items.length > 0 ? POINT_VALUE : 0;
    const total = Math.max(0, summary.subtotal + shippingFee - voucherDiscount - pointsDiscount);

    return {
      ...summary,
      items,
      shippingFee,
      voucher: voucherData,
      voucherActive: voucherDiscount > 0,
      voucherDiscount,
      voucherLabel,
      pointsDiscount,
      total,
      saving: summary.promoDiscount + voucherDiscount + pointsDiscount,
    };
  }

  return {
    SHIPPING_EXPRESS,
    POINT_COST,
    POINT_VALUE,
    MAX_QTY,
    discountFor,
    requiresExpress,
    voucherUsable,
    itemsSummary,
    computeTotals,
  };
})();

window.KlikPricing = KlikPricing;
