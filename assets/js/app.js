import { COUNTRIES, PRODUCT_CONFIG, STORE_CONFIG, formatMoney, isFormBackendConfigured } from "./config.js";
import { createProduct, validateProduct } from "./product.js";
import { initPreview } from "./preview.js";
import { initCart, addCartItem, replaceCartItem, removeCartItem, updateCartQuantity, getCart, subscribeCart, cartTotals, clearCart } from "./cart.js";
import { generateOrderId, serializeCheckout, validateCheckout, toBackendPayload } from "./checkout.js";
import { submitOrder } from "./form-backend.js";
import { getWhatsAppUrl } from "./whatsapp-order.js";
import { initCookieConsent } from "./cookies.js";
import { initAnimations } from "./animations.js";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const text = (tag, value, className) => { const element = document.createElement(tag); element.textContent = value; if (className) element.className = className; return element; };
let selectedSize = "30x30";
let editingId = null;
let currentOrderId = generateOrderId();
let submissionInProgress = false;

function toast(message, type = "info") {
  const region = $("#toast-region");
  const node = text("div", message, `toast toast--${type}`);
  node.setAttribute("role", type === "error" ? "alert" : "status");
  region.append(node);
  setTimeout(() => node.classList.add("is-visible"), 20);
  setTimeout(() => { node.classList.remove("is-visible"); setTimeout(() => node.remove(), 250); }, 3400);
}

function populateCountries() {
  const select = $("#country");
  COUNTRIES.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.name;
    option.dataset.code = country.code;
    option.textContent = `${country.name} — ${country.code}`;
    option.selected = country.code === "ROU";
    select.append(option);
  });
}

function setSize(size) {
  selectedSize = size;
  $$(".size-option").forEach((button) => {
    const selected = button.dataset.size === size;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $("#selected-size-label").textContent = PRODUCT_CONFIG.sizes[size].label;
  $("#product-price").textContent = formatMoney(PRODUCT_CONFIG.sizes[size].price);
}

function currentProductInput() {
  const option = $("#country").selectedOptions[0];
  return {
    athleteName: $("#athlete-name").value,
    country: $("#country").value,
    countryCode: option?.dataset.code || "ROU",
    size: selectedSize,
    quantity: Number($("#quantity").value)
  };
}

function addOrUpdateProduct() {
  const input = currentProductInput();
  const validation = validateProduct(input);
  if (!validation.valid) { toast(validation.errors[0], "error"); return; }
  const product = createProduct(input);
  if (editingId) {
    replaceCartItem(editingId, product);
    editingId = null;
    $("#add-to-cart").textContent = "Adaugă în coș";
    toast("Produs actualizat.", "success");
  } else {
    addCartItem(product);
    toast($("#club-order-toggle").checked ? "Sportiv adăugat în comanda clubului." : "Produs adăugat în coș.", "success");
  }
  $("#cart-button").classList.add("bump");
  setTimeout(() => $("#cart-button").classList.remove("bump"), 450);
}

function renderCart(items) {
  const list = $("#cart-items");
  list.replaceChildren();
  $("#cart-count").textContent = items.reduce((sum, item) => sum + item.quantity, 0);
  $("#cart-empty").hidden = items.length > 0;
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "cart-item";
    const details = document.createElement("div");
    details.append(text("strong", item.athleteName), text("span", `${item.countryCode} · ${item.sizeLabel}`, "muted"), text("span", formatMoney(item.subtotal), "price-small"));
    const controls = document.createElement("div");
    controls.className = "cart-item__controls";
    const minus = text("button", "−", "icon-button");
    minus.type = "button"; minus.setAttribute("aria-label", `Scade cantitatea pentru ${item.athleteName}`);
    minus.addEventListener("click", () => updateCartQuantity(item.id, -1));
    controls.append(minus, text("span", item.quantity));
    const plus = text("button", "+", "icon-button");
    plus.type = "button"; plus.setAttribute("aria-label", `Crește cantitatea pentru ${item.athleteName}`);
    plus.addEventListener("click", () => updateCartQuantity(item.id, 1));
    const edit = text("button", "Editează", "text-button");
    edit.type = "button";
    edit.addEventListener("click", () => editProduct(item));
    const remove = text("button", "Șterge", "text-button text-button--danger");
    remove.type = "button";
    remove.addEventListener("click", () => { removeCartItem(item.id); toast("Produs eliminat."); });
    controls.append(plus, edit, remove);
    card.append(details, controls);
    list.append(card);
  });
  const totals = cartTotals();
  $("#cart-subtotal").textContent = formatMoney(totals.subtotal);
  $("#cart-total").textContent = formatMoney(totals.total);
  $("#open-checkout").disabled = !items.length;
  renderClubRoster(items);
}

function editProduct(item) {
  editingId = item.id;
  $("#athlete-name").value = item.athleteName;
  const country = $$("#country option").find((option) => option.dataset.code === item.countryCode);
  if (country) $("#country").value = country.value;
  $("#country").dispatchEvent(new Event("change"));
  $("#athlete-name").dispatchEvent(new Event("input"));
  $("#quantity").value = item.quantity;
  setSize(item.size);
  $("#add-to-cart").textContent = "Salvează modificarea";
  closeCart();
  $("#personalizeaza").scrollIntoView({ behavior: "smooth" });
  $("#athlete-name").focus({ preventScroll: true });
}

function renderClubRoster(items) {
  const list = $("#club-roster");
  list.replaceChildren();
  items.forEach((item, index) => list.append(text("li", `${index + 1}. ${item.athleteName} — ${item.countryCode} — ${item.sizeLabel} — ${item.quantity} buc.`)));
  $("#club-roster-empty").hidden = items.length > 0;
}

function openCart() { $("#cart-drawer").classList.add("is-open"); $("#cart-backdrop").hidden = false; document.body.classList.add("no-scroll"); $("#close-cart").focus(); }
function closeCart() { $("#cart-drawer").classList.remove("is-open"); $("#cart-backdrop").hidden = true; document.body.classList.remove("no-scroll"); }

function renderRecap() {
  const recap = $("#checkout-recap");
  recap.replaceChildren();
  getCart().forEach((item) => recap.append(text("li", `${item.athleteName} · ${item.countryCode} · ${item.sizeLabel} · ${item.quantity} buc.`)));
  $("#checkout-reference").textContent = currentOrderId;
  const totals = cartTotals();
  $("#checkout-subtotal").textContent = formatMoney(totals.subtotal);
  $("#checkout-total").textContent = formatMoney(totals.total);
}

function openCheckout() {
  if (!getCart().length) { toast("Coșul este gol.", "error"); return; }
  currentOrderId = generateOrderId();
  renderRecap();
  $("#checkout-club-order").checked = $("#club-order-toggle").checked;
  $("#checkout-club-name").value = $("#club-name").value;
  $("#checkout-club-contact").value = $("#club-contact").value;
  toggleClubCheckout();
  closeCart();
  $("#checkout-dialog").showModal();
}

function toggleBilling() {
  const company = $("#billing-type").value === "persoana_juridica";
  $("#company-fields").hidden = !company;
  $$("input", $("#company-fields")).forEach((input) => input.required = company);
}

function toggleBillingAddress() {
  const different = !$("#billing-same").checked;
  $("#billing-address-fields").hidden = !different;
  $$("input", $("#billing-address-fields")).forEach((input) => input.required = different);
}

function toggleClubCheckout() {
  const enabled = $("#checkout-club-order").checked;
  $("#checkout-club-fields").hidden = !enabled;
  $$("input", $("#checkout-club-fields")).forEach((input) => input.required = enabled);
}

function showOrderState(kind, order, message) {
  const panel = $("#order-state");
  panel.hidden = false;
  panel.className = `order-state order-state--${kind}`;
  panel.replaceChildren();
  panel.append(text("h3", kind === "success" ? "Comanda ta a fost trimisă!" : "Comanda nu a putut fi trimisă."));
  panel.append(text("p", message));
  if (kind === "success") {
    panel.append(text("p", `Referință comandă: ${order.orderId}`, "order-reference"), text("p", "Te vom contacta pentru confirmarea detaliilor comenzii și livrării."));
    const home = text("a", "Înapoi la pagina principală", "button button--dark"); home.href = "./";
    const whats = text("a", "Contactează-ne pe WhatsApp", "button button--outline"); whats.href = getWhatsAppUrl(order); whats.target = "_blank"; whats.rel = "noopener";
    panel.append(home, whats);
  } else {
    panel.append(text("p", "Datele produselor tale au rămas salvate. Poți încerca din nou sau poți trimite comanda prin WhatsApp."));
    const retry = text("button", "Încearcă din nou", "button button--dark"); retry.type = "button"; retry.addEventListener("click", () => { panel.hidden = true; $("#submit-order").focus(); });
    const whats = text("a", "Trimite prin WhatsApp", "button button--outline"); whats.href = getWhatsAppUrl(order); whats.target = "_blank"; whats.rel = "noopener";
    panel.append(retry, whats);
  }
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submissionInProgress) return;
  const form = event.currentTarget;
  const order = serializeCheckout(form, getCart(), cartTotals(), currentOrderId);
  const validation = validateCheckout(order);
  if (!validation.valid) { toast(validation.errors[0], "error"); const invalid = form.querySelector(":invalid"); invalid?.focus(); return; }
  if (order.honeypot) return;
  const button = $("#submit-order");
  if (button.disabled) return;
  submissionInProgress = true;
  button.disabled = true; button.classList.add("is-loading"); button.querySelector("span").textContent = "Se trimite comanda...";
  try {
    await submitOrder(toBackendPayload(order));
    showOrderState("success", order, "Mulțumim! Solicitarea ta a ajuns la NSPORT.");
    clearCart(); form.reset(); toast("Comanda a fost trimisă.", "success");
  } catch (error) {
    showOrderState("error", order, error.message || "A apărut o eroare de rețea.");
  } finally {
    submissionInProgress = false;
    button.disabled = false; button.classList.remove("is-loading"); button.querySelector("span").textContent = "Trimite comanda";
  }
}

function checkoutWhatsApp() {
  const form = $("#checkout-form");
  const order = serializeCheckout(form, getCart(), cartTotals(), currentOrderId);
  const basic = validateCheckout(order);
  if (!basic.valid) { toast(basic.errors[0], "error"); return; }
  window.open(getWhatsAppUrl(order), "_blank", "noopener");
}

function initNavigation() {
  const button = $("#menu-toggle");
  const menu = $("#main-nav");
  button.addEventListener("click", () => { const open = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!open)); menu.classList.toggle("is-open", !open); });
  $$("a", menu).forEach((link) => link.addEventListener("click", () => { button.setAttribute("aria-expanded", "false"); menu.classList.remove("is-open"); }));
  addEventListener("scroll", () => $("#site-header").classList.toggle("is-scrolled", scrollY > 24), { passive: true });
}

function initGallery() {
  $$(".gallery-thumb").forEach((button) => button.addEventListener("click", () => {
    const image = $("img", button);
    $("#gallery-main").src = image.src; $("#gallery-main").alt = image.alt;
    $$(".gallery-thumb").forEach((node) => node.classList.toggle("is-active", node === button));
  }));
}

function initFaq() {
  $$(".faq-question").forEach((button) => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    button.nextElementSibling.hidden = open;
  }));
}

function initPayments() {
  const container = $("#payment-methods");
  const methods = [
    ["card", "Card online"],
    ["bankTransfer", "Transfer bancar"],
    ["cashOnDelivery", "Ramburs"]
  ].filter(([key]) => STORE_CONFIG.payments[key]);
  if (!methods.length) return;
  container.replaceChildren();
  methods.forEach(([value, label]) => {
    const row = document.createElement("label");
    row.className = "check-row";
    const input = document.createElement("input");
    input.type = "radio"; input.name = "payment_method"; input.value = value; input.required = true;
    row.append(input, document.createTextNode(label));
    container.append(row);
  });
}

function init() {
  populateCountries();
  initPreview({ input: $("#athlete-name"), countrySelect: $("#country"), nameOutput: $("#preview-name"), codeOutput: $("#preview-code"), board: $("#live-backnumber") });
  setSize(selectedSize);
  initCart(); subscribeCart(renderCart);
  $$(".size-option").forEach((button) => button.addEventListener("click", () => setSize(button.dataset.size)));
  $("#quantity-minus").addEventListener("click", () => $("#quantity").value = Math.max(1, Number($("#quantity").value) - 1));
  $("#quantity-plus").addEventListener("click", () => $("#quantity").value = Math.min(99, Number($("#quantity").value) + 1));
  $("#add-to-cart").addEventListener("click", addOrUpdateProduct);
  $("#club-order-toggle").addEventListener("change", (event) => { $("#club-config-fields").hidden = !event.target.checked; $("#add-to-cart").textContent = event.target.checked ? "Adaugă sportiv" : "Adaugă în coș"; });
  $("#cart-button").addEventListener("click", openCart); $("#mobile-cart").addEventListener("click", openCart); $("#close-cart").addEventListener("click", closeCart); $("#cart-backdrop").addEventListener("click", closeCart);
  $("#open-checkout").addEventListener("click", openCheckout); $("#close-checkout").addEventListener("click", () => $("#checkout-dialog").close());
  $("#billing-type").addEventListener("change", toggleBilling); $("#billing-same").addEventListener("change", toggleBillingAddress); $("#checkout-club-order").addEventListener("change", toggleClubCheckout);
  $("#checkout-form").addEventListener("submit", handleSubmit); $("#checkout-whatsapp").addEventListener("click", checkoutWhatsApp);
  $("#backend-notice").hidden = isFormBackendConfigured();
  $("#contact-email").href = `mailto:${STORE_CONFIG.orderEmail}`; $("#contact-email").textContent = STORE_CONFIG.orderEmail;
  $$("[data-phone]").forEach((node) => node.textContent = STORE_CONFIG.phoneDisplay);
  $$("[data-whatsapp]").forEach((node) => { node.href = `https://wa.me/${STORE_CONFIG.whatsappInternational}`; });
  $("#current-year").textContent = new Date().getFullYear();
  initNavigation(); initGallery(); initFaq(); initPayments(); initCookieConsent(); initAnimations(); toggleBilling(); toggleBillingAddress(); toggleClubCheckout();
}

document.addEventListener("DOMContentLoaded", init);
