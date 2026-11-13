// ============================================================
// JWT Service for Secure User Sessions & API Authorization
// ------------------------------------------------------------
// Implements standard RFC 7519 JSON Web Tokens (HS256)
// with signature verification, expiration checks, and payload decoding.
// Uses native Node.js crypto (zero external dependency).
// ============================================================

import crypto from "crypto";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_SECRET_KEY ||
  "emitly_wedding_super_secret_jwt_key_2026_!@#$%^&*()";

// 24 hours token expiration by default
const DEFAULT_EXPIRATION_SECONDS = 24 * 60 * 60;

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str) {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  while (output.length % 4) {
    output += "=";
  }
  return Buffer.from(output, "base64").toString("utf8");
}

/**
 * Sign a new JWT token with user claims
 * @param {Object} payload - User claims (id, name, email, role, wedding_id, etc.)
 * @param {number} expiresInSeconds - Token expiration time in seconds (default: 24h)
 * @returns {string} - Signed JWT token (header.payload.signature)
 */
export function signJwt(payload, expiresInSeconds = DEFAULT_EXPIRATION_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - The raw or Bearer-prefixed JWT string
 * @returns {Object|null} - Decoded claims if valid, or null if invalid/expired
 */
export function verifyJwt(token) {
  if (!token || typeof token !== "string") return null;

  const rawToken = token.replace(/^Bearer\s+/i, "").trim();
  const parts = rawToken.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export default { signJwt, verifyJwt };

