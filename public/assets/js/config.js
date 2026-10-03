export const PRODUCT_CONFIG = Object.freeze({
  name: "Backnumber Judo personalizat",
  sizes: Object.freeze({
    "20x20": { label: "20 × 20 cm", width: 20, height: 20, price: null, note: "Format compact" },
    "30x30": { label: "30 × 30 cm", width: 30, height: 30, price: null, note: "Format mediu" },
    "35x35": { label: "35 × 35 cm", width: 35, height: 35, price: null, note: "Format mare" },
    "40x40": { label: "40 × 40 cm", width: 40, height: 40, price: null, note: "Format extra mare" }
  })
});

export const STORE_CONFIG = Object.freeze({
  brand: "NSPORT",
  collaboration: "NSPORT × FR Judo",
  sellerLegalName: "",
  cui: "",
  tradeRegister: "",
  legalAddress: "",
  orderEmail: "nsportoradeabh@yahoo.com",
  phoneDisplay: "0745 326 270",
  whatsappDisplay: "0745 326 270",
  whatsappInternational: "40745326270",
  domain: "https://nsport.ro",
  formBackend: Object.freeze({
    provider: "formspree",
    endpoint: "https://formspree.io/f/xyezarzg",
    configured: true
  }),
  shipping: Object.freeze({
    enabled: true,
    price: null,
    courier: "",
    estimatedDelivery: ""
  }),
  payments: Object.freeze({
    card: false,
    bankTransfer: false,
    cashOnDelivery: false
  }),
  social: Object.freeze({ facebook: "", instagram: "", tiktok: "" })
});

export const FORM_BACKEND_CONFIG = STORE_CONFIG.formBackend;

export const COUNTRIES = Object.freeze([
  { name: "România", code: "ROU" },
  { name: "Republica Moldova", code: "MDA" },
  { name: "Ungaria", code: "HUN" },
  { name: "Bulgaria", code: "BUL" },
  { name: "Ucraina", code: "UKR" },
  { name: "Serbia", code: "SRB" },
  { name: "Germania", code: "GER" },
  { name: "Franța", code: "FRA" },
  { name: "Italia", code: "ITA" },
  { name: "Spania", code: "ESP" },
  { name: "Regatul Unit", code: "GBR" },
  { name: "Statele Unite", code: "USA" }
]);

export const isFormBackendConfigured = () =>
  STORE_CONFIG.formBackend.provider === "formspree" &&
  STORE_CONFIG.formBackend.configured === true &&
  /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(STORE_CONFIG.formBackend.endpoint);

export const formatMoney = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(value)
    : "Preț la cerere";
