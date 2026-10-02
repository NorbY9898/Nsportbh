const COOKIE_KEY = "nsport-cookie-consent-v1";

export function initCookieConsent() {
  const banner = document.querySelector("#cookie-banner");
  const modal = document.querySelector("#cookie-modal");
  const save = (preferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...preferences, savedAt: new Date().toISOString() }));
    banner.hidden = true;
    modal.close();
  };
  if (!localStorage.getItem(COOKIE_KEY)) banner.hidden = false;
  document.querySelector("#cookies-all")?.addEventListener("click", () => save({ necessary: true, analytics: true, marketing: true }));
  document.querySelector("#cookies-necessary")?.addEventListener("click", () => save({ necessary: true, analytics: false, marketing: false }));
  document.querySelector("#cookies-customize")?.addEventListener("click", () => modal.showModal());
  document.querySelector("#cookie-preferences")?.addEventListener("click", () => modal.showModal());
  document.querySelector("#cookies-save")?.addEventListener("click", () => save({ necessary: true, analytics: document.querySelector("#cookie-analytics").checked, marketing: document.querySelector("#cookie-marketing").checked }));
}
