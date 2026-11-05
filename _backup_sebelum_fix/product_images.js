/*
 * product-images.js
 * Tambahkan file ini setelah app.js dan home.js di halaman HTML.
 * Setiap produk yang memiliki properti image di data.js akan menampilkan foto.
 */
(function () {
  "use strict";

  function getProductId(element) {
    const link = element.closest('a[href*="produk.html?id="]');
    if (link) {
      try {
        return new URL(link.href, window.location.href).searchParams.get("id");
      } catch (_) {}
    }

    // Untuk halaman detail produk yang memakai parameter ?id=...
    return new URLSearchParams(window.location.search).get("id");
  }

  function addProductImage(artElement) {
    if (!artElement || artElement.dataset.imageApplied === "1") return;

    const productId = getProductId(artElement);
    if (!productId || !Array.isArray(window.PRODUCTS)) return;

    const product = window.PRODUCTS.find((item) => item.id === productId);
    if (!product || !product.image) return;

    const image = document.createElement("img");
    image.className = "art__img";
    image.src = product.image;
    image.alt = product.name || "Foto produk";
    image.loading = "lazy";
    image.onerror = function () {
      image.remove();
      artElement.dataset.imageApplied = "0";
    };

    artElement.appendChild(image);
    artElement.dataset.imageApplied = "1";
  }

  function scanProductImages(root) {
    if (!root) return;

    if (root.matches && root.matches(".art")) {
      addProductImage(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll(".art").forEach(addProductImage);
    }
  }

  function start() {
    scanProductImages(document);

    // Mengurus kartu produk yang dibuat ulang oleh JavaScript.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanProductImages(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
