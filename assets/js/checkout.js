import { STORE_CONFIG, formatMoney } from "./config.js";

export function generateOrderId(date = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("-", "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(4);
  globalThis.crypto?.getRandomValues?.(bytes);
  const suffix = Array.from(bytes, (byte, index) => chars[(byte || (Date.now() >> index)) % chars.length]).join("");
  return `NSJ-${day}-${suffix}`;
}

export function serializeCheckout(form, items, totals, orderId) {
  const data = Object.fromEntries(new FormData(form).entries());
  const billingSame = data.billing_same === "on";
  return {
    orderId,
    orderDate: new Date().toISOString(),
    orderSource: "nsport.ro",
    items,
    subtotal: totals.subtotal,
    shipping: STORE_CONFIG.shipping.price,
    total: totals.total,
    customerName: data.customer_name?.trim(),
    customerPhone: data.customer_phone?.trim(),
    customerEmail: data.customer_email?.trim(),
    county: data.county?.trim(),
    city: data.city?.trim(),
    street: data.street?.trim(),
    streetNumber: data.street_number?.trim(),
    building: data.building?.trim(),
    staircase: data.staircase?.trim(),
    apartment: data.apartment?.trim(),
    postalCode: data.postal_code?.trim(),
    billingType: data.billing_type || "persoana_fizica",
    billingSame,
    companyName: data.company_name?.trim(),
    companyCui: data.company_cui?.trim(),
    companyTradeRegister: data.company_trade_register?.trim(),
    billingAddress: billingSame ? [data.street, data.street_number].filter(Boolean).join(" ") : data.billing_address?.trim(),
    billingCounty: billingSame ? data.county?.trim() : data.billing_county?.trim(),
    billingCity: billingSame ? data.city?.trim() : data.billing_city?.trim(),
    clubOrder: data.club_order === "on",
    clubName: data.club_name?.trim(),
    clubContact: data.club_contact?.trim(),
    notes: data.notes?.trim(),
    termsAccepted: data.terms_accepted === "on",
    personalizationConfirmed: data.personalization_confirmed === "on",
    honeypot: data._gotcha || ""
  };
}

export function validateCheckout(order) {
  const errors = [];
  if (!order.items.length) errors.push("Coșul este gol.");
  if (!order.customerName || order.customerName.length < 3) errors.push("Completează numele și prenumele.");
  if (!/^[+\d][\d\s().-]{7,18}$/.test(order.customerPhone || "")) errors.push("Introdu un număr de telefon valid.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail || "")) errors.push("Introdu o adresă de e-mail validă.");
  if (!order.county || !order.city || !order.street || !order.streetNumber) errors.push("Completează adresa de livrare.");
  if (order.billingType === "persoana_juridica" && (!order.companyName || !order.companyCui || !order.companyTradeRegister)) errors.push("Completează datele companiei.");
  if (!order.billingSame && (!order.billingAddress || !order.billingCounty || !order.billingCity)) errors.push("Completează adresa de facturare.");
  if (order.clubOrder && (!order.clubName || !order.clubContact)) errors.push("Completează datele clubului.");
  if (!order.personalizationConfirmed) errors.push("Confirmă informațiile de personalizare.");
  if (!order.termsAccepted) errors.push("Acceptă Termenii și condițiile.");
  return { valid: errors.length === 0, errors };
}

const show = (value) => value || "—";

export function buildEmailBody(order) {
  const athletes = order.items.map((item, index) => `${index + 1}. ${item.athleteName} — ${item.countryCode} — ${item.sizeLabel} — ${item.quantity} buc.`).join("\n");
  return `================================\nNSPORT × FR JUDO\nCOMANDĂ NOUĂ\n================================\n\nReferință: ${order.orderId}\nData: ${order.orderDate}\n\nPRODUS\nBacknumber Judo personalizat\n\nSPORTIVI\n${athletes}\n\n---\nPREȚ\nSubtotal: ${formatMoney(order.subtotal)}\nTransport: ${formatMoney(order.shipping)}\nTOTAL: ${formatMoney(order.total)}\n\n---\nCLIENT\nNume: ${show(order.customerName)}\nTelefon: ${show(order.customerPhone)}\nE-mail: ${show(order.customerEmail)}\n\n---\nLIVRARE\nJudeț: ${show(order.county)}\nLocalitate: ${show(order.city)}\nStradă: ${show(order.street)}\nNumăr: ${show(order.streetNumber)}\nBloc: ${show(order.building)}\nScară: ${show(order.staircase)}\nApartament: ${show(order.apartment)}\nCod poștal: ${show(order.postalCode)}\n\n---\nFACTURARE\nTip: ${order.billingType === "persoana_juridica" ? "Persoană juridică" : "Persoană fizică"}\nAceeași adresă: ${order.billingSame ? "DA" : "NU"}\nCompanie: ${show(order.companyName)}\nCUI: ${show(order.companyCui)}\nRegistrul Comerțului: ${show(order.companyTradeRegister)}\nAdresă: ${show(order.billingAddress)}\nJudeț: ${show(order.billingCounty)}\nLocalitate: ${show(order.billingCity)}\n\n---\nCLUB\nComandă club: ${order.clubOrder ? "DA" : "NU"}\nClub: ${show(order.clubName)}\nContact club: ${show(order.clubContact)}\n\nOBSERVAȚII\n${show(order.notes)}\n\n================================\nTermeni acceptați: ${order.termsAccepted ? "DA" : "NU"}\nPersonalizare confirmată: ${order.personalizationConfirmed ? "DA" : "NU"}\n================================`;
}

export function toBackendPayload(order) {
  const first = order.items[0] || {};
  return {
    _subject: `Comandă nouă NSPORT × FR Judo — ${order.orderId}`,
    _replyto: order.customerEmail,
    _gotcha: order.honeypot,
    order_id: order.orderId,
    order_date: order.orderDate,
    order_source: order.orderSource,
    product_name: "Backnumber Judo personalizat",
    athlete_name: first.athleteName || "Comandă multiplă",
    country: first.country || "",
    country_code: first.countryCode || "",
    size: first.sizeLabel || "",
    quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    unit_price: first.unitPrice ?? "Preț la cerere",
    subtotal: order.subtotal ?? "Preț la cerere",
    shipping: order.shipping ?? "De confirmat",
    total: order.total ?? "Preț la cerere",
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    county: order.county,
    city: order.city,
    street: order.street,
    street_number: order.streetNumber,
    building: order.building,
    staircase: order.staircase,
    apartment: order.apartment,
    postal_code: order.postalCode,
    billing_type: order.billingType,
    company_name: order.companyName,
    company_cui: order.companyCui,
    company_trade_register: order.companyTradeRegister,
    billing_address: order.billingAddress,
    billing_county: order.billingCounty,
    billing_city: order.billingCity,
    club_order: order.clubOrder ? "DA" : "NU",
    club_name: order.clubName,
    athletes: order.items.map((item) => ({ name: item.athleteName, country: item.country, code: item.countryCode, size: item.sizeLabel, quantity: item.quantity })),
    notes: order.notes,
    terms_accepted: order.termsAccepted ? "DA" : "NU",
    personalization_confirmed: order.personalizationConfirmed ? "DA" : "NU",
    message: buildEmailBody(order)
  };
}
