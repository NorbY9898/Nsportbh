import { normalizeAthleteName } from "./product.js";
import { updateBacknumber } from "./backnumber-renderer.js";

export function initPreview({ input, countrySelect, board }) {
  const updateName = () => {
    const normalized = normalizeAthleteName(input.value);
    if (input.value !== normalized) input.value = normalized;
    updateBacknumber(board, { athleteName: normalized, countryCode: countrySelect.selectedOptions[0]?.dataset.code });
    board.classList.remove("is-updating");
    void board.offsetWidth;
    board.classList.add("is-updating");
  };
  const updateCountry = () => {
    const option = countrySelect.selectedOptions[0];
    updateBacknumber(board, { athleteName: input.value, countryCode: option?.dataset.code || "ROU" });
  };
  input.addEventListener("input", updateName);
  countrySelect.addEventListener("change", updateCountry);
  updateName();
  updateCountry();
}
