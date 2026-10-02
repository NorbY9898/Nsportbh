const STORAGE_KEY = "nsport-judo-cart-v1";
let items = [];
let listeners = [];

function safeLoad() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.athleteName) : [];
  } catch { return []; }
}

function commit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener(getCart()));
}

export function initCart() { items = safeLoad(); commit(); return getCart(); }
export function getCart() { return items.map((item) => ({ ...item })); }
export function subscribeCart(listener) { listeners.push(listener); listener(getCart()); return () => { listeners = listeners.filter((x) => x !== listener); }; }
export function addCartItem(item) { items.push({ ...item }); commit(); }
export function replaceCartItem(id, item) { items = items.map((current) => current.id === id ? { ...item, id } : current); commit(); }
export function removeCartItem(id) { items = items.filter((item) => item.id !== id); commit(); }
export function updateCartQuantity(id, delta) { items = items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + delta)), subtotal: Number.isFinite(item.unitPrice) ? item.unitPrice * Math.max(1, Math.min(99, item.quantity + delta)) : null } : item); commit(); }
export function clearCart() { items = []; localStorage.removeItem(STORAGE_KEY); listeners.forEach((listener) => listener([])); }
export function cartTotals() {
  if (!items.length || items.some((item) => !Number.isFinite(item.unitPrice))) return { subtotal: null, total: null };
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { subtotal, total: subtotal };
}
