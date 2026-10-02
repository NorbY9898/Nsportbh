import { PRODUCT_CONFIG } from "./config.js";

export const normalizeAthleteName = (value = "") => value
  .normalize("NFC")
  .replace(/[^\p{L}\p{M}\s.'-]/gu, "")
  .replace(/\s+/g, " ")
  .trimStart()
  .slice(0, 32)
  .toLocaleUpperCase("ro-RO");

export function validateProduct({ athleteName, size, quantity }) {
  const errors = [];
  const cleanName = normalizeAthleteName(athleteName).trim();
  if (cleanName.length < 2) errors.push("Introdu numele sportivului.");
  if (!PRODUCT_CONFIG.sizes[size]) errors.push("Selectează o dimensiune.");
  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 99) {
    errors.push("Cantitatea trebuie să fie între 1 și 99.");
  }
  return { valid: errors.length === 0, errors, cleanName };
}

export function createProduct(input) {
  const validation = validateProduct(input);
  if (!validation.valid) throw new Error(validation.errors[0]);
  const sizeConfig = PRODUCT_CONFIG.sizes[input.size];
  const quantity = Number(input.quantity);
  return {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productName: PRODUCT_CONFIG.name,
    athleteName: validation.cleanName,
    country: input.country,
    countryCode: input.countryCode,
    size: input.size,
    sizeLabel: sizeConfig.label,
    quantity,
    unitPrice: sizeConfig.price,
    subtotal: Number.isFinite(sizeConfig.price) ? sizeConfig.price * quantity : null
  };
}
