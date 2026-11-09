/**
 * Wedding Cover Image Presets & Theme Helpers
 * Curated high-resolution wedding vibes for marriage cards & hero banners.
 */

export const WEDDING_COVER_PRESETS = [
  {
    id: "palace_lights",
    label: "Royal Palace Mandap",
    tag: "Heritage Luxury",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85",
    theme: "emerald",
  },
  {
    id: "royal_floral",
    label: "Grand Floral Arch",
    tag: "Traditional & Marigold",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85",
    theme: "rose",
  },
  {
    id: "luxury_pastel",
    label: "Pastel Chandelier Pavilion",
    tag: "Modern Romance",
    url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=85",
    theme: "purple",
  },
  {
    id: "beachfront_sunset",
    label: "Sunset Beach Canopy",
    tag: "Destination Wedding",
    url: "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1600&q=85",
    theme: "amber",
  },
  {
    id: "fairylit_celebration",
    label: "Fairylit Garden Courtyard",
    tag: "Warm Evening Gala",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=85",
    theme: "emerald",
  },
];

/**
 * Returns the appropriate cover image URL for a wedding.
 * Handles custom URLs, preset IDs, legacy themes (emerald, rose, purple, amber), and fallbacks.
 */
export function getWeddingCoverImage(coverThemeOrUrl) {
  if (!coverThemeOrUrl) {
    return WEDDING_COVER_PRESETS[0].url;
  }

  // If already a full URL
  if (coverThemeOrUrl.startsWith("http://") || coverThemeOrUrl.startsWith("https://")) {
    return coverThemeOrUrl;
  }

  // Check preset id match
  const matchedPreset = WEDDING_COVER_PRESETS.find((p) => p.id === coverThemeOrUrl);
  if (matchedPreset) {
    return matchedPreset.url;
  }

  // Legacy theme mapping
  if (coverThemeOrUrl === "rose") return WEDDING_COVER_PRESETS[1].url;
  if (coverThemeOrUrl === "purple") return WEDDING_COVER_PRESETS[2].url;
  if (coverThemeOrUrl === "amber") return WEDDING_COVER_PRESETS[3].url;
  if (coverThemeOrUrl === "emerald") return WEDDING_COVER_PRESETS[0].url;

  return WEDDING_COVER_PRESETS[0].url;
}

