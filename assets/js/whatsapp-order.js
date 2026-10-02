import { STORE_CONFIG, formatMoney } from "./config.js";

const line = (value) => value || "—";

export function buildWhatsAppMessage(order) {
  const athletes = order.items.map((item, index) => [
    `${index + 1}. Sportiv: ${item.athleteName}`,
    `Țara: ${item.country}`,
    `Cod: ${item.countryCode}`,
    `Dimensiune: ${item.sizeLabel}`,
    `Cantitate: ${item.quantity}`
  ].join("\n")).join("\n\n");
  return [
    "Bună ziua! Doresc să plasez următoarea comandă NSPORT × FR Judo:",
    "", "BACKNUMBER JUDO PERSONALIZAT", "",
    `Referință: ${order.orderId}`, "", athletes, "",
    order.clubOrder ? `Club: ${line(order.clubName)}` : "",
    `Client: ${line(order.customerName)}`,
    `Telefon: ${line(order.customerPhone)}`,
    `E-mail: ${line(order.customerEmail)}`, "",
    "Livrare:",
    `Județ: ${line(order.county)}`,
    `Localitate: ${line(order.city)}`,
    `Adresă: ${line([order.street, order.streetNumber].filter(Boolean).join(" "))}`,
    `Total estimativ: ${formatMoney(order.total)}`,
    "", "Confirm că datele de personalizare sunt corecte."
  ].filter((value, index, array) => value !== "" || array[index - 1] !== "").join("\n");
}

export function getWhatsAppUrl(order) {
  return `https://wa.me/${STORE_CONFIG.whatsappInternational}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}
