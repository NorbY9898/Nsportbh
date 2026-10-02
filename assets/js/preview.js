import { normalizeAthleteName } from "./product.js";

export function initPreview({ input, countrySelect, nameOutput, codeOutput, board }) {
  const updateName = () => {
    const normalized = normalizeAthleteName(input.value);
    if (input.value !== normalized) input.value = normalized;
    nameOutput.textContent = normalized.trim() || "NUMELE TĂU";
    board.classList.remove("is-updating");
    void board.offsetWidth;
    board.classList.add("is-updating");
  };
  const updateCountry = () => {
    const option = countrySelect.selectedOptions[0];
    codeOutput.textContent = option?.dataset.code || "ROU";
  };
  input.addEventListener("input", updateName);
  countrySelect.addEventListener("change", updateCountry);
  updateName();
  updateCountry();
}
