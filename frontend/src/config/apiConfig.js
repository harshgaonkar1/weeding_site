// Central configuration for Backend & Frontend Connection
export const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api";

export const BACKEND_SERVER_URL =
  import.meta?.env?.VITE_BACKEND_URL ||
  (typeof API_BASE_URL === "string" ? API_BASE_URL.replace(/\/api\/?$/, "") : "") ||
  "http://localhost:5000";

// Direct Supabase Connection (bypasses Render timeouts for guaranteed fast DB sync)
export const SUPABASE_URL =
  import.meta?.env?.VITE_SUPABASE_URL || "https://xzhhxgvtmevjzsowzyvg.supabase.co";

export const SUPABASE_KEY =
  import.meta?.env?.VITE_SUPABASE_KEY ||
  import.meta?.env?.VITE_SUPABASE_ANON_KEY ||
  "sb_secret_r5q8zQ_U_MZSXpNl9JSeKA_leatzfk-";

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
  SUPABASE_URL,
  SUPABASE_KEY,
  getApiUrl,
};
