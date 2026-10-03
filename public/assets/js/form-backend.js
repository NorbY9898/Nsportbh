import { STORE_CONFIG, isFormBackendConfigured } from "./config.js";

function toFormData(payload) {
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    data.append(key, typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? ""));
  });
  return data;
}

export async function submitOrder(payload, signal) {
  if (!isFormBackendConfigured()) {
    const error = new Error("Comanda prin formular este temporar indisponibilă. Poți trimite comanda prin WhatsApp.");
    error.code = "NOT_CONFIGURED";
    throw error;
  }
  let response;
  try {
    response = await fetch(STORE_CONFIG.formBackend.endpoint.trim(), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: toFormData(payload),
      signal
    });
  } catch (cause) {
    const error = new Error("Comanda nu a putut fi trimisă. Verifică conexiunea și încearcă din nou.");
    error.code = "NETWORK_ERROR";
    error.cause = cause;
    throw error;
  }
  if (!response.ok) {
    let message = "Comanda nu a putut fi trimisă.";
    try {
      const result = await response.json();
      if (Array.isArray(result.errors)) message = result.errors.map((item) => item.message).join(" ");
    } catch { /* răspunsul poate să nu fie JSON */ }
    const error = new Error(message);
    error.code = "BACKEND_ERROR";
    throw error;
  }
  return response.json().catch(() => ({}));
}
