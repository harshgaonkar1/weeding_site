const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const BACKEND_SERVER_URL = isLocalhost
  ? "http://localhost:5000"
  : import.meta?.env?.NEXT_PUBLIC_BACKEND_URL ||
    import.meta?.env?.VITE_BACKEND_URL ||
    "https://weeding-site-2v2w.onrender.com";

export const API_BASE_URL = isLocalhost
  ? "http://localhost:5000/api"
  : import.meta?.env?.NEXT_PUBLIC_API_BASE_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    `${BACKEND_SERVER_URL}/api`;

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
