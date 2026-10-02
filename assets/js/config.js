export const PRODUCT_CONFIG = Object.freeze({
  name: "Backnumber Judo personalizat",
  sizes: Object.freeze({
    "15x15": { label: "15 × 15 cm", price: null, note: "Format compact" },
    "25x25": { label: "25 × 25 cm", price: null, note: "Format mediu" },
    "30x30": { label: "30 × 30 cm", price: null, note: "Format mare" }
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
    endpoint: ""
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
  /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(STORE_CONFIG.formBackend.endpoint);

export const formatMoney = (value) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(value)
    : "Preț la cerere";
