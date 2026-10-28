// Central configuration for Backend & Frontend Connection
export const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api";

export const BACKEND_SERVER_URL =
  import.meta?.env?.VITE_BACKEND_URL ||
  (typeof API_BASE_URL === "string" ? API_BASE_URL.replace(/\/api\/?$/, "") : "") ||
  "http://localhost:5000";

/**
 * Helper to construct full backend API endpoint URLs
 * @param {string} endpoint - e.g. '/guests' or 'auth/login'
 * @returns {string} full URL
 */
export const getApiUrl = (endpoint = "") => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default {
  API_BASE_URL,
  BACKEND_SERVER_URL,
  getApiUrl,
};
