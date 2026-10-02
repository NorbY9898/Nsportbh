import { PRODUCT_CONFIG } from "./config.js";

const STORAGE_KEY = "nsport-judo-cart-v1";
let items = [];
let listeners = [];

function normalizeCartItem(item) {
  const sizeConfig = PRODUCT_CONFIG.sizes[item?.size];
  if (!item?.id || !item?.athleteName || !sizeConfig) return null;
  const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
  return {
    ...item,
    sizeLabel: sizeConfig.label,
    quantity,
    unitPrice: sizeConfig.price,
    subtotal: Number.isFinite(sizeConfig.price) ? sizeConfig.price * quantity : null
  };
}

function safeLoad() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean);
  } catch { return []; }
}

function commit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener(getCart()));
}

export function initCart() { items = safeLoad(); commit(); return getCart(); }
export function getCart() { return items.map((item) => ({ ...item })); }
export function subscribeCart(listener) { listeners.push(listener); listener(getCart()); return () => { listeners = listeners.filter((x) => x !== listener); }; }
export function addCartItem(item) { const normalized = normalizeCartItem(item); if (!normalized) return false; items.push(normalized); commit(); return true; }
export function replaceCartItem(id, item) { const normalized = normalizeCartItem({ ...item, id }); if (!normalized) return false; items = items.map((current) => current.id === id ? normalized : current); commit(); return true; }
export function removeCartItem(id) { items = items.filter((item) => item.id !== id); commit(); }
export function updateCartQuantity(id, delta) { items = items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + delta)), subtotal: Number.isFinite(item.unitPrice) ? item.unitPrice * Math.max(1, Math.min(99, item.quantity + delta)) : null } : item); commit(); }
export function clearCart() { items = []; localStorage.removeItem(STORAGE_KEY); listeners.forEach((listener) => listener([])); }
export function cartTotals() {
  if (!items.length || items.some((item) => !Number.isFinite(item.unitPrice))) return { subtotal: null, total: null };
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { subtotal, total: subtotal };
}
