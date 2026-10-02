import { normalizeAthleteName } from "./product.js";

const FALLBACK_NAME = "NUMELE TĂU";
const FALLBACK_CODE = "ROU";

function nameScale(value) {
  const length = [...value].length;
  if (length >= 24) return 0.54;
  if (length >= 20) return 0.62;
  if (length >= 16) return 0.72;
  if (length >= 12) return 0.84;
  return 1;
}

export function updateBacknumber(root, { athleteName, countryCode, size } = {}) {
  if (!root) return;
  const name = normalizeAthleteName(athleteName || "").trim() || FALLBACK_NAME;
  const code = String(countryCode || FALLBACK_CODE).trim().slice(0, 3).toUpperCase();
  const nameNode = root.querySelector(".backnumber-visual__name");
  const codeNode = root.querySelector(".backnumber-visual__code");
  if (nameNode) nameNode.textContent = name;
  if (codeNode) codeNode.textContent = code;
  root.style.setProperty("--backnumber-name-scale", nameScale(name));
  if (size) root.dataset.size = size;
  root.setAttribute("aria-label", `Backnumber personalizat: ${name}, ${code}${size ? `, ${size}` : ""}`);
}

export function mountBacknumber(root, options = {}) {
  if (!root) return null;
  root.classList.add("backnumber-visual");
  if (!root.querySelector(".backnumber-visual__name")) {
    const panel = document.createElement("div");
    panel.className = "backnumber-visual__panel";
    const name = document.createElement("span");
    name.className = "backnumber-visual__name";
    const code = document.createElement("span");
    code.className = "backnumber-visual__code";
    panel.append(name);
    root.replaceChildren(panel, code);
  }
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
    size: root.dataset.size
  }));
}
