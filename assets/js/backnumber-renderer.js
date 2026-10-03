import { normalizeAthleteName } from "./product.js";
import { buildQrPayload, createQrMatrix, qrPathData } from "./qr-code.js";

const FALLBACK_NAME = "NUMELE TĂU";
const FALLBACK_CODE = "ROU";
const LOGO_PATH = "assets/images/frjudo/fr-judo-logo-transparent.png";
const SVG_NS = "http://www.w3.org/2000/svg";
const observedRoots = new WeakSet();
let resizeObserver;

export function fitAthleteName(element, container = element?.parentElement) {
  if (!element || !container || typeof getComputedStyle !== "function") return 0;
  element.style.removeProperty("font-size");
  const containerStyle = getComputedStyle(container);
  const availableWidth = container.clientWidth
    - parseFloat(containerStyle.paddingLeft || 0)
    - parseFloat(containerStyle.paddingRight || 0);
  if (availableWidth <= 0) return 0;
  const maximum = parseFloat(getComputedStyle(element).fontSize) || 64;
  element.style.fontSize = `${maximum}px`;
  if (element.scrollWidth <= availableWidth) return maximum;
  let lower = 1;
  let upper = maximum;
  for (let iteration = 0; iteration < 14; iteration += 1) {
    const candidate = (lower + upper) / 2;
    element.style.fontSize = `${candidate}px`;
    if (element.scrollWidth <= availableWidth) lower = candidate;
    else upper = candidate;
  }
  element.style.fontSize = `${Math.max(1, lower - 0.25)}px`;
  return lower;
}

function scheduleNameFit(root) {
  const run = () => fitAthleteName(
    root.querySelector(".backnumber-visual__name"),
    root.querySelector(".backnumber-visual__panel")
  );
  run();
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
}

function observeNameFit(root) {
  if (observedRoots.has(root) || typeof ResizeObserver !== "function") return;
  resizeObserver ||= new ResizeObserver((entries) => {
    entries.forEach(({ target }) => scheduleNameFit(target));
  });
  resizeObserver.observe(root);
  observedRoots.add(root);
}

function createQrSvg(payload) {
  const matrix = createQrMatrix(payload);
  const quietZone = 4;
  const size = matrix.length + quietZone * 2;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("width", String(size));
  background.setAttribute("height", String(size));
  background.setAttribute("fill", "#fff");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", qrPathData(matrix, quietZone));
  path.setAttribute("fill", "#111");
  svg.append(background, path);
  return svg;
}

function updateQr(root, payload) {
  const qr = root.querySelector(".backnumber-visual__qr");
  if (!qr || qr.dataset.payload === payload) return;
  qr.dataset.payload = payload;
  qr.replaceChildren(createQrSvg(payload));
}

export function updateBacknumber(root, { athleteName, countryCode, size, qrData } = {}) {
  if (!root) return;
  const name = normalizeAthleteName(athleteName || "").trim() || FALLBACK_NAME;
  const code = String(countryCode || FALLBACK_CODE).trim().slice(0, 3).toUpperCase();
  const currentSize = size || root.dataset.size;
  const payload = qrData || buildQrPayload({ athleteName: name, countryCode: code, size: currentSize });
  const nameNode = root.querySelector(".backnumber-visual__name");
  const codeNode = root.querySelector(".backnumber-visual__code");
  if (nameNode) nameNode.textContent = name;
  if (codeNode) codeNode.textContent = code;
  if (size) root.dataset.size = size;
  root.dataset.qrPayload = payload;
  updateQr(root, payload);
  root.setAttribute("aria-label", `Backnumber personalizat: ${name}, ${code}${currentSize ? `, ${currentSize}` : ""}, cu cod QR de personalizare și sigla Federației Române de Judo`);
  scheduleNameFit(root);
}

export function mountBacknumber(root, options = {}) {
  if (!root) return null;
  root.classList.add("backnumber-visual");
  if (!root.querySelector(".backnumber-visual__identifiers")) {
    const panel = document.createElement("div");
    panel.className = "backnumber-visual__panel";
    const name = document.createElement("span");
    name.className = "backnumber-visual__name";
    panel.append(name);
    const lower = document.createElement("div");
    lower.className = "backnumber-visual__lower";
    const code = document.createElement("span");
    code.className = "backnumber-visual__code";
    const identifiers = document.createElement("div");
    identifiers.className = "backnumber-visual__identifiers";
    const qr = document.createElement("div");
    qr.className = "backnumber-visual__qr";
    qr.setAttribute("aria-hidden", "true");
    const logo = document.createElement("img");
    logo.className = "backnumber-visual__logo";
    logo.src = LOGO_PATH;
    logo.alt = "Federația Română de Judo";
    logo.width = 590;
    logo.height = 330;
    logo.decoding = "async";
    identifiers.append(qr, logo);
    lower.append(code, identifiers);
    root.replaceChildren(panel, lower);
  }
  observeNameFit(root);
  updateBacknumber(root, options);
  return root;
}

export function createBacknumberElement(options = {}, className = "") {
  const root = document.createElement("div");
  if (className) root.className = className;
  return mountBacknumber(root, options);
}

export function hydrateBacknumbers(scope = document) {
  scope.querySelectorAll("[data-backnumber]").forEach((root) => mountBacknumber(root, {
    athleteName: root.dataset.athleteName,
    countryCode: root.dataset.countryCode,
    size: root.dataset.size,
    qrData: root.dataset.qrPayload
  }));
}
