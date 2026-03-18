// src/utils/cartUtils.js
const CART_KEY = 'cartItems';

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo carrito', e);
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-changed'));
}

export function clearCart() {
  saveCart([]);
}

export function addToCart(product, qty = 1) {
  const items = getCart();

  const idx = items.findIndex((it) => it.id === product.id);
  if (idx >= 0) {
    items[idx].qty += qty;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty,
    });
  }

  saveCart(items);
}

export function updateItemQty(id, qty) {
  const items = getCart();
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return;

  if (qty <= 0) {
    items.splice(idx, 1);
  } else {
    items[idx].qty = qty;
  }

  saveCart(items);
}

export function removeFromCart(id) {
  const items = getCart().filter((it) => it.id !== id);
  saveCart(items);
}

export function onCartChange(cb) {
  const handler = () => cb(getCart());
  window.addEventListener('cart-changed', handler);
  return () => window.removeEventListener('cart-changed', handler);
}
