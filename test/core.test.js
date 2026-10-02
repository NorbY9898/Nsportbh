import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAthleteName, validateProduct, createProduct } from "../assets/js/product.js";
import { generateOrderId, validateCheckout, toBackendPayload } from "../assets/js/checkout.js";

test("normalizează nume românești și internaționale", () => {
  assert.equal(normalizeAthleteName("  Șerban-Ionuț  "), "ȘERBAN-IONUȚ ");
  assert.equal(normalizeAthleteName("O'Connor"), "O'CONNOR");
  assert.equal(normalizeAthleteName("Popescu123!"), "POPESCU");
});

test("respinge numele gol, dimensiunea lipsă și cantitatea invalidă", () => {
  const result = validateProduct({ athleteName: "", size: "", quantity: 0 });
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);
});

test("creează produs fără preț inventat", () => {
  const product = createProduct({ athleteName: "Marin", country: "România", countryCode: "ROU", size: "25x25", quantity: 2 });
  assert.equal(product.athleteName, "MARIN");
  assert.equal(product.sizeLabel, "25 × 25 cm");
  assert.equal(product.unitPrice, null);
  assert.equal(product.subtotal, null);
});

test("generează referință în formatul cerut", () => {
  assert.match(generateOrderId(new Date("2026-10-02T12:00:00Z")), /^NSJ-20261002-[A-HJ-NP-Z2-9]{4}$/);
});

const baseOrder = {
  orderId: "NSJ-20261002-A7K4", orderDate: "2026-10-02T10:00:00.000Z", orderSource: "nsport.ro",
  items: [{ athleteName: "POPESCU", country: "România", countryCode: "ROU", sizeLabel: "30 × 30 cm", quantity: 1, unitPrice: null }],
  subtotal: null, shipping: null, total: null, customerName: "Ion Popescu", customerPhone: "0745 326 270", customerEmail: "ion@example.ro",
  county: "Bihor", city: "Oradea", street: "Republicii", streetNumber: "1", building: "", staircase: "", apartment: "", postalCode: "",
  billingType: "persoana_fizica", billingSame: true, billingAddress: "Republicii 1", billingCounty: "Bihor", billingCity: "Oradea", companyName: "", companyCui: "", companyTradeRegister: "", clubOrder: false, clubName: "", clubContact: "",
  notes: "", termsAccepted: true, personalizationConfirmed: true, honeypot: ""
};

test("validează checkout complet și blochează acordurile nebifate", () => {
  assert.equal(validateCheckout(baseOrder).valid, true);
  const invalid = validateCheckout({ ...baseOrder, termsAccepted: false, personalizationConfirmed: false });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 2);
});

test("payload-ul include câmpurile de comandă și nu inventează prețuri", () => {
  const payload = toBackendPayload(baseOrder);
  assert.equal(payload.order_id, baseOrder.orderId);
  assert.equal(payload.unit_price, "Preț la cerere");
  assert.equal(payload.terms_accepted, "DA");
  assert.match(payload._subject, /NSJ-20261002-A7K4/);
});

test("payload-ul de club include toate datele tuturor sportivilor", () => {
  const clubOrder = {
    ...baseOrder,
    clubOrder: true,
    clubName: "CSM Oradea",
    clubContact: "Antrenor Test",
    notes: "Livrare după confirmare.",
    items: [
      { productName: "Backnumber Judo personalizat", athleteName: "POPESCU", country: "România", countryCode: "ROU", sizeLabel: "30 × 30 cm", quantity: 2, unitPrice: 50, subtotal: 100 },
      { productName: "Backnumber Judo personalizat", athleteName: "KOVÁCS", country: "Ungaria", countryCode: "HUN", sizeLabel: "25 × 25 cm", quantity: 1, unitPrice: 45, subtotal: 45 }
    ],
    subtotal: 145,
    total: 145
  };
  const payload = toBackendPayload(clubOrder);

  assert.equal(payload.club_order, "DA");
  assert.equal(payload.club_name, "CSM Oradea");
  assert.equal(payload.club_contact, "Antrenor Test");
  assert.equal(payload.quantity, 3);
  assert.equal(payload.items.length, 2);
  assert.equal(payload.athletes.length, 2);
  assert.deepEqual(payload.athletes.map((athlete) => athlete.name), ["POPESCU", "KOVÁCS"]);
  assert.equal(payload.athletes[1].size, "25 × 25 cm");
  assert.equal(payload.athletes[1].unit_price, 45);
  assert.equal(payload.notes, "Livrare după confirmare.");
  assert.match(payload.message, /POPESCU/);
  assert.match(payload.message, /KOVÁCS/);
  assert.match(payload.message, /Stradă: Republicii/);
});
