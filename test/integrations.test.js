import test from "node:test";
import assert from "node:assert/strict";
import { submitOrder } from "../assets/js/form-backend.js";
import { STORE_CONFIG, isFormBackendConfigured } from "../assets/js/config.js";
import { buildWhatsAppMessage, getWhatsAppUrl } from "../assets/js/whatsapp-order.js";

test("Formspree este configurat cu endpoint-ul furnizat", () => {
  assert.equal(STORE_CONFIG.formBackend.provider, "formspree");
  assert.equal(STORE_CONFIG.formBackend.endpoint, "https://formspree.io/f/xyezarzg");
  assert.equal(STORE_CONFIG.formBackend.configured, true);
  assert.equal(isFormBackendConfigured(), true);
});

test("trimite POST real către endpoint și rezolvă numai la răspuns pozitiv", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ next: "/mulțumim" }) };
  };
  try {
    const result = await submitOrder({ order_id: "NSJ-20261002-A7K4", customer_email: "test@example.ro", athletes: [{ name: "POPESCU" }] });
    assert.equal(request.url, "https://formspree.io/f/xyezarzg");
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers.Accept, "application/json");
    assert.equal(request.options.body.get("order_id"), "NSJ-20261002-A7K4");
    assert.match(request.options.body.get("athletes"), /POPESCU/);
    assert.equal(result.next, "/mulțumim");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("răspunsul Formspree nereușit produce eroare", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ errors: [{ message: "Formular respins" }] }) });
  try {
    await assert.rejects(() => submitOrder({ order_id: "NSJ-TEST" }), (error) => error.code === "BACKEND_ERROR" && error.message === "Formular respins");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("eroarea de rețea este raportată în română", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
  try {
    await assert.rejects(() => submitOrder({ order_id: "NSJ-TEST" }), (error) => error.code === "NETWORK_ERROR" && /nu a putut fi trimisă/.test(error.message));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mesajul WhatsApp include toți sportivii și este codat corect", () => {
  const order = {
    orderId: "NSJ-20261002-A7K4",
    items: [
      { athleteName: "POPESCU", country: "România", countryCode: "ROU", sizeLabel: "30 × 30 cm", quantity: 1 },
      { athleteName: "IONESCU", country: "România", countryCode: "ROU", sizeLabel: "40 × 40 cm", quantity: 2 }
    ],
    clubOrder: true, clubName: "Club Test", customerName: "Ion Popescu", customerPhone: "0745 326 270", customerEmail: "ion@example.ro",
    county: "Bihor", city: "Oradea", street: "Republicii", streetNumber: "1", total: null
  };
  const message = buildWhatsAppMessage(order);
  assert.match(message, /POPESCU/);
  assert.match(message, /IONESCU/);
  assert.match(message, /QR payload: NSPORT\|FRJ\|NAME=POPESCU\|COUNTRY=ROU\|SIZE=30x30/);
  assert.match(message, /Club Test/);
  assert.match(getWhatsAppUrl(order), /^https:\/\/wa\.me\/40745326270\?text=/);
});
