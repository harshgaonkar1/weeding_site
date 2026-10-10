// WhatsApp Utilities & Anti-Ban Variation Engine

// Clean, high-compatibility UTF-8 celebration emojis for wedding messages
export const CELEBRATION_EMOJI_POOL = [
  "✨",
  "🎉",
  "🎊",
  "💖",
  "🌸",
  "🥂",
  "🥳",
  "💫",
  "💐",
  "🌟",
  "💍",
];

// Contextual emojis that must never be modified
export const PROTECTED_EMOJIS = new Set(["✈️", "🏨", "⏰", "📍", "📞", "👰", "🤵", "🚗", "🚨"]);

export const VARIATION_WORDS = [
  [1, "is REAL", "is absolutely REAL"],
  [1, "Warm regards", "Warmest regards"],
  [1, "Looking forward", "Eagerly looking forward"],
  [2, "great energy", "amazing energy"],
  [2, "Get ready", "Get excited"],
  [2, "celebrate with us", "join the celebrations"],
  [2, "wonderful wedding", "grand wedding celebration"],
  [3, "unforgettable moments", "unforgettable memories"],
  [3, "Dear ", "Hello "],
  [3, "warmest greetings", "heartfelt greetings"],
];

export const VARIATION_LEVELS = { low: 1, medium: 2, high: 3 };
export const PROB_EMOJI = { 1: 0.35, 2: 0.65, 3: 0.9 };
export const PROB_WORD = { 1: 0.4, 2: 0.65, 3: 0.8 };

export const NAME_RE = /\{\{\s*NAME\s*\}\}/gi;
export const HAS_NAME = /\{\{\s*NAME\s*\}\}/i;

/**
 * Strips any orphaned/unpaired surrogates and replacement characters (U+FFFD )
 * ensuring 100% valid UTF-8/UTF-16 text for WhatsApp.
 */
export function sanitizeUnicodeText(str) {
  if (!str) return "";
  return String(str)
    // Remove  replacement character
    .replace(/\uFFFD/g, "")
    // Remove unpaired high surrogates
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
    // Remove unpaired low surrogates
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .normalize("NFC");
}

/**
 * Splits text into unbroken grapheme clusters to prevent splitting emoji surrogate pairs.
 */
export function splitGraphemes(str) {
  if (!str) return [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(str), (s) => s.segment);
  }
  return Array.from(str);
}

/**
 * Normalizes any raw phone input to standard international format (e.g. +919876543210).
 * Handles Indian numbers, 10-digit, 11-digit leading 0, 12-digit 91 prefix, and international + numbers.
 */
export function normalizePhoneNumber(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  let plus = s.startsWith("+");
  let d = s.replace(/\D/g, "");
  if (!plus && d.startsWith("00")) {
    plus = true;
    d = d.slice(2);
  }
  if (!d) return "";
  if (!plus) {
    if (d.length === 10 && /^[6-9]/.test(d)) return "+91" + d;
    if (d.length === 11 && d[0] === "0" && /^[6-9]/.test(d[1])) return "+91" + d.slice(1);
    if (d.length === 12 && d.startsWith("91") && /^[6-9]/.test(d[2])) return "+" + d;
    return d.length >= 11 && d.length <= 15 ? "+" + d : "";
  }
  if (d.startsWith("91") && d.length !== 12) return "";
  return d.length >= 8 && d.length <= 15 ? "+" + d : "";
}

/**
 * Formats a normalized phone number for clear UI display.
 */
export function formatPhoneNumber(p) {
  if (!p) return "";
  if (p.startsWith("+91") && p.length === 13) {
    return `+91 ${p.slice(3, 8)} ${p.slice(8)}`;
  }
  return p;
}

/**
 * Deterministic Pseudo-Random Number Generator (PRNG) using 32-bit integer arithmetic.
 */
export function createPRNG(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Safely applies synonym substitutions and subtle decorative emoji variations
 * without corrupting Unicode surrogate pairs or replacing contextual travel/hotel emojis.
 */
export function varyMessage(text, level = "low", randFn = Math.random) {
  if (!text) return "";
  const numericLevel = VARIATION_LEVELS[level] || 1;
  let modified = sanitizeUnicodeText(text);

  // 1. Synonym word variation
  for (const [tier, original, substitute] of VARIATION_WORDS) {
    if (tier <= numericLevel && modified.includes(original) && randFn() < PROB_WORD[numericLevel]) {
      modified = modified.replace(original, substitute);
    }
  }

  // 2. Safe Grapheme-level celebration emoji variation
  if (randFn() < PROB_EMOJI[numericLevel]) {
    const graphemes = splitGraphemes(modified);
    const result = graphemes.map((g) => {
      // Check if this grapheme is one of our celebration emojis
      if (CELEBRATION_EMOJI_POOL.includes(g) && randFn() < 0.4) {
        const randomEmoji = CELEBRATION_EMOJI_POOL[Math.floor(randFn() * CELEBRATION_EMOJI_POOL.length)];
        return randomEmoji;
      }
      return g;
    });
    modified = result.join("");
  }

  return sanitizeUnicodeText(modified);
}

/**
 * Replaces placeholders and applies variations to build the final personalized message for a guest.
 */
export function buildGuestMessage({
  template,
  guest,
  wedding,
  varOn = false,
  level = "low",
  randFn = Math.random,
}) {
  if (!template) return "";
  let text = sanitizeUnicodeText(template);

  if (varOn) {
    text = varyMessage(text, level, randFn);
  }

  const guestName = guest?.guest_name || guest?.name || "Guest";
  const weddingTitle = wedding
    ? `${wedding.groom_name} & ${wedding.bride_name}'s Wedding`
    : "the Wedding Celebration";
  const groomName = wedding?.groom_name || "Groom";
  const brideName = wedding?.bride_name || "Bride";
  const venue = wedding?.venue || wedding?.city || "the Wedding Venue";
  const weddingDate = wedding?.wedding_date || "the upcoming dates";
  const side = guest?.side ? `${guest.side}'s Side` : "Family";
  const rsvp = guest?.rsvp_status || "Pending";

  const resolved = text
    .replace(/\{\{\s*NAME\s*\}\}/gi, guestName)
    .replace(/\{\{\s*GUEST_NAME\s*\}\}/gi, guestName)
    .replace(/\{\{\s*WEDDING\s*\}\}/gi, weddingTitle)
    .replace(/\{\{\s*GROOM\s*\}\}/gi, groomName)
    .replace(/\{\{\s*BRIDE\s*\}\}/gi, brideName)
    .replace(/\{\{\s*VENUE\s*\}\}/gi, venue)
    .replace(/\{\{\s*DATE\s*\}\}/gi, weddingDate)
    .replace(/\{\{\s*SIDE\s*\}\}/gi, side)
    .replace(/\{\{\s*RSVP\s*\}\}/gi, rsvp);

  return sanitizeUnicodeText(resolved);
}

/**
 * Generates direct wa.me link with clean UTF-8 URL encoding and opens WhatsApp.
 */
export function sendWhatsAppMessage(phone, messageText) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (!cleanPhone) return false;

  const sanitized = sanitizeUnicodeText(messageText).trim();
  const encodedText = encodeURIComponent(sanitized);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  const win = window.open(url, "_blank");
  if (!win) {
    window.location.href = url;
  }
  return true;
}

/**
 * Default preset message templates with proper, clean wedding emojis
 */
export const DEFAULT_TEMPLATES = [
  {
    id: "rsvp_reminder",
    title: "RSVP Confirmation Reminder",
    category: "RSVP",
    text: "Dear {{NAME}} ✨, we are eagerly preparing for {{WEDDING}} on {{DATE}} at {{VENUE}} 💍. Could you please confirm your attendance so we can finalize your room and hospitality arrangements? Warm regards 🎉",
  },
  {
    id: "travel_details",
    title: "Travel & Flight Details Request",
    category: "Logistics",
    text: "Hello {{NAME}} ✈️, to ensure seamless airport/station pickup and accommodation for {{WEDDING}}, kindly share your travel itinerary and arrival timings. Looking forward to welcoming you! 🎊",
  },
  {
    id: "invitation_details",
    title: "Official Wedding Invitation & Itinerary",
    category: "Invitation",
    text: "Dear {{NAME}} 🌸, you are cordially invited to celebrate the joyous union at {{WEDDING}} on {{DATE}} at {{VENUE}} ✨. Your presence will make our celebration truly special! Warmest regards 💖",
  },
  {
    id: "welcome_reminder",
    title: "Event Reminder & Warm Welcome",
    category: "Welcome",
    text: "Hello {{NAME}} 🥳! The celebration for {{WEDDING}} is just around the corner at {{VENUE}}. Get ready for unforgettable moments! See you soon 💃🕺✨",
  },
  {
    id: "hotel_checkin",
    title: "Hotel Check-in & Hospitality Info",
    category: "Hospitality",
    text: "Dear {{NAME}} 🏨, your stay has been confirmed for {{WEDDING}} at {{VENUE}}. Our hospitality desk is ready to welcome you on arrival. Looking forward to celebrating together! ✨",
  },
];
