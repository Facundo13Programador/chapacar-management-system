// src/services/cart.service.js
const CART_KEY = 'chapacar_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, quantity = 1) {
  const cart = loadCart();

  const idx = cart.findIndex((item) => item.productId === product._id);
  if (idx >= 0) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({
      productId: product._id,
      name: product.name,
      code: product.code,
      price: product.price,
      image: product.images?.find((i) => i.isMain)?.url || product.images?.[0]?.url || '',
      quantity,
    });
  }

  saveCart(cart);
  return cart;
}

export function getCart() {
  return loadCart();
}

export function clearCart() {
  saveCart([]);
}
