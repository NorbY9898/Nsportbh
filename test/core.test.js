import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAthleteName, validateProduct, createProduct } from "../public/assets/js/product.js";
import { generateOrderId, validateCheckout, toBackendPayload } from "../public/assets/js/checkout.js";
import { buildQrPayload, createQrMatrix } from "../public/assets/js/qr-code.js";

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

test("acceptă exact cele patru dimensiuni finale", () => {
  const expected = new Map([
    ["20x20", "20 × 20 cm"],
    ["30x30", "30 × 30 cm"],
    ["35x35", "35 × 35 cm"],
    ["40x40", "40 × 40 cm"]
  ]);
  expected.forEach((label, size) => {
    const product = createProduct({ athleteName: "Popescu", country: "România", countryCode: "ROU", size, quantity: 1 });
    assert.equal(product.sizeLabel, label);
  });
  assert.equal(validateProduct({ athleteName: "Popescu", size: "25x25", quantity: 1 }).valid, false);
});

test("creează produs fără preț inventat", () => {
  const product = createProduct({ athleteName: "Marin", country: "România", countryCode: "ROU", size: "35x35", quantity: 2 });
  assert.equal(product.athleteName, "MARIN");
  assert.equal(product.sizeLabel, "35 × 35 cm");
  assert.equal(product.unitPrice, null);
  assert.equal(product.subtotal, null);
  assert.equal(product.qrData, "NSPORT|FRJ|NAME=MARIN|COUNTRY=ROU|SIZE=35x35");
});

test("QR-ul este determinist și se schimbă odată cu personalizarea", () => {
  const first = buildQrPayload({ athleteName: "POPESCU", countryCode: "ROU", size: "30 × 30 cm" });
  const same = buildQrPayload({ athleteName: "POPESCU", countryCode: "ROU", size: "30x30" });
  const changed = buildQrPayload({ athleteName: "POPESCU", countryCode: "HUN", size: "30x30" });
  assert.equal(first, "NSPORT|FRJ|NAME=POPESCU|COUNTRY=ROU|SIZE=30x30");
  assert.equal(first, same);
  assert.notEqual(first, changed);
  assert.deepEqual(createQrMatrix(first), createQrMatrix(same));
  assert.notDeepEqual(createQrMatrix(first), createQrMatrix(changed));
  assert.equal(createQrMatrix(first).length, 29);
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

test("checkout-ul respinge o dimensiune localStorage veche", () => {
  const legacyOrder = { ...baseOrder, items: [{ ...baseOrder.items[0], sizeLabel: "25 × 25 cm" }] };
  const result = validateCheckout(legacyOrder);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /dimensiunea/);
});

test("payload-ul include câmpurile de comandă și nu inventează prețuri", () => {
  const payload = toBackendPayload(baseOrder);
  assert.equal(payload.order_id, baseOrder.orderId);
  assert.equal(payload.unit_price, "Preț la cerere");
  assert.equal(payload.terms_accepted, "DA");
  assert.equal(payload.qr_payload, "NSPORT|FRJ|NAME=POPESCU|COUNTRY=ROU|SIZE=30x30");
  assert.equal(payload.items[0].qr_payload, payload.qr_payload);
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
      { productName: "Backnumber Judo personalizat", athleteName: "KOVÁCS", country: "Ungaria", countryCode: "HUN", sizeLabel: "35 × 35 cm", quantity: 1, unitPrice: 45, subtotal: 45 }
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
  assert.equal(payload.athletes[1].size, "35 × 35 cm");
  assert.equal(payload.athletes[1].unit_price, 45);
  assert.match(payload.athletes[1].qr_payload, /NAME=KOVÁCS\|COUNTRY=HUN\|SIZE=35x35/);
  assert.equal(payload.notes, "Livrare după confirmare.");
  assert.match(payload.message, /POPESCU/);
  assert.match(payload.message, /KOVÁCS/);
  assert.match(payload.message, /Stradă: Republicii/);
});
