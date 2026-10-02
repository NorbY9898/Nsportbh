import test from "node:test";
import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
};

const cart = await import("../assets/js/cart.js");

const item = (id, name = "POPESCU", size = "30x30") => ({ id, athleteName: name, country: "România", countryCode: "ROU", size, sizeLabel: "30 × 30 cm", quantity: 1, unitPrice: null, subtotal: null });

test("coșul persistă produse, actualizează cantități și șterge", () => {
  cart.clearCart();
  cart.addCartItem(item("a"));
  cart.updateCartQuantity("a", 1);
  assert.equal(cart.getCart()[0].quantity, 2);
  assert.match(memory.get("nsport-judo-cart-v1"), /POPESCU/);
  cart.removeCartItem("a");
  assert.equal(cart.getCart().length, 0);
});

test("acceptă o comandă de club cu peste zece sportivi", () => {
  cart.clearCart();
  for (let index = 1; index <= 12; index += 1) cart.addCartItem(item(String(index), `SPORTIV ${index}`));
  assert.equal(cart.getCart().length, 12);
  assert.equal(cart.getCart().reduce((sum, product) => sum + product.quantity, 0), 12);
  assert.equal(cart.cartTotals().total, null);
  cart.clearCart();
});

test("migrează localStorage și elimină dimensiunile vechi fără eroare", () => {
  memory.set("nsport-judo-cart-v1", JSON.stringify([
    item("valid", "POPESCU", "40x40"),
    item("legacy-15", "IONESCU", "15x15"),
    item("legacy-25", "MARIN", "25x25")
  ]));
  cart.initCart();
  assert.deepEqual(cart.getCart().map((product) => product.size), ["40x40"]);
  assert.equal(cart.getCart()[0].sizeLabel, "40 × 40 cm");
  assert.doesNotMatch(memory.get("nsport-judo-cart-v1"), /15x15|25x25/);
  assert.equal(cart.addCartItem(item("invalid", "TEST", "25x25")), false);
  cart.clearCart();
});
