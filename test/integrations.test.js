import test from "node:test";
import assert from "node:assert/strict";
import { submitOrder } from "../assets/js/form-backend.js";
import { buildWhatsAppMessage, getWhatsAppUrl } from "../assets/js/whatsapp-order.js";

test("backend-ul neconfigurat refuză trimiterea reală", async () => {
  await assert.rejects(() => submitOrder({}), (error) => error.code === "NOT_CONFIGURED" && /temporar indisponibilă/.test(error.message));
});

test("mesajul WhatsApp include toți sportivii și este codat corect", () => {
  const order = {
    orderId: "NSJ-20261002-A7K4",
    items: [
      { athleteName: "POPESCU", country: "România", countryCode: "ROU", sizeLabel: "30 × 30 cm", quantity: 1 },
      { athleteName: "IONESCU", country: "România", countryCode: "ROU", sizeLabel: "25 × 25 cm", quantity: 2 }
    ],
    clubOrder: true, clubName: "Club Test", customerName: "Ion Popescu", customerPhone: "0745 326 270", customerEmail: "ion@example.ro",
    county: "Bihor", city: "Oradea", street: "Republicii", streetNumber: "1", total: null
  };
  const message = buildWhatsAppMessage(order);
  assert.match(message, /POPESCU/);
  assert.match(message, /IONESCU/);
  assert.match(message, /Club Test/);
  assert.match(getWhatsAppUrl(order), /^https:\/\/wa\.me\/40745326270\?text=/);
});
