import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Map,
  setWorkerUrl,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  LngLatBounds,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MapPin,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Building2,
  CheckCircle2,
  Share2,
  Navigation,
} from "lucide-react";

// Configure MapLibre Web Worker for Vite
try {
  setWorkerUrl(workerUrl);
} catch (err) {
  console.warn("MapLibre worker URL setup notice:", err);
}

// Coordinate dictionary for popular wedding destinations and luxury venues
const DESTINATION_COORDINATES = {
  // Cities & Regions in India (lng, lat)
  goa: [73.8567, 15.2993],
  cancona: [74.0321, 15.0063],
  udaipur: [73.7125, 24.5854],
  jaipur: [75.7873, 26.9124],
  jodhpur: [73.0243, 26.2389],
  mumbai: [72.8777, 19.076],
  delhi: [77.209, 28.6139],
  "new delhi": [77.209, 28.6139],
  bengaluru: [77.5946, 12.9716],
  bangalore: [77.5946, 12.9716],
  hyderabad: [78.4867, 17.385],
  chennai: [80.2707, 13.0827],
  kolkata: [88.3639, 22.5726],
  pune: [73.8567, 18.5204],
  ahmedabad: [72.5714, 23.0225],
  agra: [78.0081, 27.1767],
  kerala: [76.2711, 9.9312],
  kochi: [76.2673, 9.9312],
  shimla: [77.1734, 31.1048],
  mussoorie: [78.07, 30.4598],
  chandigarh: [76.7794, 30.7333],
  amritsar: [74.8723, 31.634],
  varanasi: [82.9739, 25.3176],
  lucknow: [80.9462, 26.8467],
  surat: [72.8311, 21.1702],
  indore: [75.8577, 22.7196],
  bhopal: [77.4126, 23.2599],
  rishikesh: [78.2676, 30.0869],
  dehradun: [78.0322, 30.3165],
  jimcorbett: [79.1278, 29.53],
  corbett: [79.1278, 29.53],

  // Specific Luxury Resort Venues
  "the lalit golf & spa resort, cancona": [74.0321, 15.0063],
  "lalit, goa": [74.0321, 15.0063],
  "the lalit": [74.0321, 15.0063],
  "lalit": [74.0321, 15.0063],
  "taj exotica": [73.9315, 15.2285],
  "w goa": [73.738, 15.6025],
  "the leela goa": [73.9427, 15.1585],
  "grand hyatt goa": [73.8563, 15.4526],
  "alila diwa": [73.9161, 15.309],
  "taj lake palace": [73.68, 24.5755],
  "the oberoi udaivilas": [73.6706, 24.5775],
  "the leela palace udaipur": [73.6755, 24.5786],
  "jagmandir island palace": [73.6775, 24.5684],
  "umaid bhawan palace": [73.0489, 26.2807],
  "rambagh palace": [75.8078, 26.8967],
  "jai mahal palace": [75.7895, 26.908],
  "fairmont jaipur": [75.8943, 27.0279],
};

/**
 * Resolves a wedding's venue & city to [lng, lat] coordinates.
 * Falls back cleanly if not specified or applies a minor jitter to prevent overlaps.
 */
function resolveWeddingCoordinates(wedding, index = 0) {
  if (!wedding) return [73.8567, 15.2993]; // Default to Goa

  // Direct lat/lng if available on object
  if (
    wedding.longitude !== undefined &&
    wedding.latitude !== undefined &&
    !isNaN(Number(wedding.longitude)) &&
    !isNaN(Number(wedding.latitude))
  ) {
    return [Number(wedding.longitude), Number(wedding.latitude)];
  }
  if (
    wedding.lng !== undefined &&
    wedding.lat !== undefined &&
    !isNaN(Number(wedding.lng)) &&
    !isNaN(Number(wedding.lat))
  ) {
    return [Number(wedding.lng), Number(wedding.lat)];
  }

  const venueLower = (wedding.venue || "").toLowerCase().trim();
  const cityLower = (wedding.city || "").toLowerCase().trim();

  // 1. Direct venue match
  for (const [key, coords] of Object.entries(DESTINATION_COORDINATES)) {
    if (venueLower && venueLower.includes(key)) {
      return applyJitter(coords, index);
    }
  }

  // 2. City match
  for (const [key, coords] of Object.entries(DESTINATION_COORDINATES)) {
    if (cityLower && cityLower.includes(key)) {
      return applyJitter(coords, index);
    }
  }

  // 3. Fallback: Default popular Indian wedding destinations cycled by index
  const fallbackCities = [
    [73.8567, 15.2993], // Goa
    [73.7125, 24.5854], // Udaipur
    [75.7873, 26.9124], // Jaipur
    [72.8777, 19.076], // Mumbai
    [77.209, 28.6139], // Delhi
    [77.5946, 12.9716], // Bengaluru
  ];

  const base = fallbackCities[index % fallbackCities.length];
  return applyJitter(base, Math.floor(index / fallbackCities.length));
}

// Tiny jitter so weddings in the exact same resort/city don't stack directly on top of each other
function applyJitter([lng, lat], offsetIndex) {
  if (offsetIndex === 0) return [lng, lat];
  const angle = (offsetIndex * 137.5 * Math.PI) / 180;
  const radius = 0.007 * Math.sqrt(offsetIndex); // ~700 meters offset
  return [lng + Math.cos(angle) * radius, lat + Math.sin(angle) * radius];
}

export default function VenuesMapView({
  weddings = [],
  selectedWedding = null,
  isAdmin = false,
  isMarriageClient = false,
  isViewOnly = false,
  onBack = null,
  onSelectWedding,
  onOpenDirectory,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [activeWeddingId, setActiveWeddingId] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Safely clear all markers from map
  const clearMarkers = () => {
    if (!markersRef.current || !Array.isArray(markersRef.current)) return;
    markersRef.current.forEach((item) => {
      try {
        if (item && item.marker && typeof item.marker.remove === "function") {
          item.marker.remove();
        } else if (item && typeof item.remove === "function") {
          item.remove();
        }
      } catch (err) {
        console.warn("Marker remove notice:", err);
      }
    });
    markersRef.current = [];
  };

  // Determine scoped weddings based on role:
  // Admin: Sees ALL marriages
  // Client / View-Only: Sees strictly their single marriage
  const displayedWeddings = useMemo(() => {
    if (isMarriageClient || isViewOnly) {
      if (selectedWedding) return [selectedWedding];
      if (weddings.length > 0) return [weddings[0]];
      return [];
    }
    // Admin / Global: Display all
    return weddings;
  }, [weddings, selectedWedding, isMarriageClient, isViewOnly]);

  // Filtered weddings for search (Admin side list)
  const filteredWeddings = useMemo(() => {
    if (!searchFilter.trim()) return displayedWeddings;
    const q = searchFilter.toLowerCase();
    return displayedWeddings.filter(
      (w) =>
        (w.groom_name && w.groom_name.toLowerCase().includes(q)) ||
        (w.bride_name && w.bride_name.toLowerCase().includes(q)) ||
        (w.venue && w.venue.toLowerCase().includes(q)) ||
        (w.city && w.city.toLowerCase().includes(q))
    );
  }, [displayedWeddings, searchFilter]);

  // Active wedding object
  const activeWedding = useMemo(() => {
    if (activeWeddingId) {
      const found = displayedWeddings.find((w) => w.id === activeWeddingId);
      if (found) return found;
    }
    return displayedWeddings[0] || null;
  }, [activeWeddingId, displayedWeddings]);

  // Initialize MapLibre GL with OpenFreeMap Liberty style
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup existing instance if any
    if (mapInstanceRef.current) {
      try {
        clearMarkers();
        mapInstanceRef.current.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    }

    // Default initial center
    const initialCoords =
      displayedWeddings.length > 0
        ? resolveWeddingCoordinates(displayedWeddings[0], 0)
        : [73.8567, 15.2993];

    const map = new Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: initialCoords,
      zoom: displayedWeddings.length === 1 ? 13 : 5.5,
      pitch: 25,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Add navigation and fullscreen controls
    map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new FullscreenControl(), "top-right");

    map.on("load", () => {
      renderMarkers(map);
    });

    const handleResize = () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.resize();
        }
      } catch (e) {}
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearMarkers();
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (e) {
        console.warn("Map remove notice:", e);
      }
    };
  }, [displayedWeddings]);

  // Render Markers on Map
  const renderMarkers = (map) => {
    if (!map) return;

    // Clear old markers safely
    clearMarkers();

    if (displayedWeddings.length === 0) return;

    const bounds = new LngLatBounds();

    displayedWeddings.forEach((w, idx) => {
      const coords = resolveWeddingCoordinates(w, idx);
      bounds.extend(coords);

      // Create Custom Marker DOM Element
      const el = document.createElement("div");
      el.className = "wedding-map-marker group cursor-pointer";
      el.style.width = "40px";
      el.style.height = "48px";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.justifyContent = "flex-start";
      el.style.transform = "translate3d(0, 0, 0)";

      const initials = `${(w.groom_name || "G")[0]}&${(w.bride_name || "B")[0]}`;

      el.innerHTML = `
        <div style="
          background: #FF6574;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(255, 101, 116, 0.45);
          border: 2.5px solid #ffffff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        " class="marker-pin hover:scale-110">
          <span style="
            transform: rotate(45deg);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: -0.5px;
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          ">${initials}</span>
        </div>
        <div style="
          width: 8px;
          height: 3px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 50%;
          margin-top: 2px;
          filter: blur(1px);
        "></div>
      `;

      // Custom Popup HTML
      const popupContent = document.createElement("div");
      popupContent.className = "p-2 min-w-[210px] text-slate-800 font-sans";
      popupContent.innerHTML = `
        <div style="font-family: inherit;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #FF6574; background: #FFF0F2; padding: 2px 7px; border-radius: 9999px;">
              ${w.city || "Wedding Venue"}
            </span>
            <span style="font-size: 11px; color: #64748B; font-weight: 600;">
              ${w.wedding_date || ""}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 4px 0 2px 0;">
            ${w.groom_name} & ${w.bride_name}
          </h4>
          <p style="font-size: 11px; color: #475569; margin: 0 0 8px 0; line-height: 1.3;">
            📍 ${w.venue || "Venue specified in directory"}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 11px;">
            <span style="color: #64748B;">Guests: <b style="color: #0F172A;">${w.total_guests || 0}</b></span>
            <span style="color: #10B981; font-weight: 700;">${w.confirmed_guests || 0} Confirmed</span>
          </div>
        </div>
      `;

      const popup = new Popup({
        offset: [0, -32],
        closeButton: true,
        closeOnClick: false,
        maxWidth: "280px",
      }).setDOMContent(popupContent);

      const marker = new Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setActiveWeddingId(w.id);
        map.flyTo({ center: coords, zoom: 13.5, speed: 1.2 });
      });

      markersRef.current.push({ marker, wedding: w, coords });
    });

    // Auto-fit view
    if (displayedWeddings.length === 1) {
      const singleCoords = resolveWeddingCoordinates(displayedWeddings[0], 0);
      map.setCenter(singleCoords);
      map.setZoom(13.5);
    } else if (displayedWeddings.length > 1) {
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 360 },
        maxZoom: 12,
      });
    }
  };

  // Focus a specific wedding from sidebar
  const handleFocusWedding = (wedding, idx) => {
    setActiveWeddingId(wedding.id);
    const coords = resolveWeddingCoordinates(wedding, idx);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: coords,
        zoom: 14,
        speed: 1.3,
        curve: 1.42,
        essential: true,
      });

      // Open popup for this marker
      const item = markersRef.current.find((m) => m.wedding.id === wedding.id);
      if (item) {
        item.marker.togglePopup();
      }
    }
  };

  // Center all venues
  const handleCenterAll = () => {
    if (!mapInstanceRef.current || displayedWeddings.length === 0) return;
    if (displayedWeddings.length === 1) {
      const coords = resolveWeddingCoordinates(displayedWeddings[0], 0);
      mapInstanceRef.current.flyTo({ center: coords, zoom: 13.5, speed: 1 });
      return;
    }
    const bounds = new LngLatBounds();
    displayedWeddings.forEach((w, idx) => {
      bounds.extend(resolveWeddingCoordinates(w, idx));
    });
    mapInstanceRef.current.fitBounds(bounds, {
      padding: { top: 70, bottom: 70, left: 70, right: 360 },
      maxZoom: 12,
    });
  };

  // Open Google Maps directions
  const handleOpenGoogleMapsDirections = (wedding) => {
    const venueName = wedding.venue || "";
    const city = wedding.city || "";
    const query = encodeURIComponent(`${venueName} ${city}`.trim() || "India");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank"
    );
  };

  // Share venue address
  const handleShareVenue = (wedding) => {
    const text = `Wedding Venue for ${wedding.groom_name} & ${wedding.bride_name}: ${wedding.venue || ""}, ${wedding.city || ""}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-4 flex-1 animate-fadeIn min-w-0">
      {/* Top Banner & Venue Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6574] animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6574]">
              {isAdmin
                ? "Admin Overview • All Venues"
                : "Assigned Wedding Destination"}
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              OpenFreeMaps Liberty
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#1E3A8A]" />
            {isAdmin ? "Wedding Venues & Locations" : "Wedding Venue Location"}
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            {isAdmin
              ? `Displaying all ${displayedWeddings.length} scheduled marriage venues on a single interactive vector map powered by OpenFreeMap.`
              : activeWedding
              ? `Destination details for ${activeWedding.groom_name} & ${activeWedding.bride_name} at ${activeWedding.venue || "the specified venue"}, ${activeWedding.city || ""}.`
              : "Locate your marriage destination on the interactive map."}
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back</span>
            </button>
          )}

          {displayedWeddings.length > 1 && (
            <button
              onClick={handleCenterAll}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Fit map view to see all marriage locations"
            >
              <Compass className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Center All ({displayedWeddings.length})</span>
            </button>
          )}

          {activeWedding && (
            <button
              onClick={() => handleOpenGoogleMapsDirections(activeWedding)}
              className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#152a65] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Open directions in Google Maps"
            >
              <Navigation className="w-3.5 h-3.5 text-white" />
              <span>Get Directions</span>
            </button>
          )}

          {activeWedding && (
            <button
              onClick={() => handleShareVenue(activeWedding)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Copy venue address"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Map Canvas + Side List Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[580px] sm:min-h-[640px]">
        {/* Map Container */}
        <div
          className={`${
            displayedWeddings.length > 1 ? "lg:col-span-8" : "lg:col-span-12"
          } bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative flex flex-col min-h-[460px] sm:min-h-[560px]`}
        >
          {/* Map Target Container with id="map" as specified in instructions */}
          <div
            id="map"
            ref={mapContainerRef}
            className="w-full h-full flex-1"
            style={{ minHeight: "460px" }}
          />

          {/* Map Overlay Badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-sm pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-bold text-slate-800">
              {isAdmin
                ? `${displayedWeddings.length} Active Venues Plotted`
                : `${activeWedding?.venue || "Wedding Location"}`}
            </span>
          </div>

          {/* Quick venue pill for mobile */}
          {activeWedding && (
            <div className="lg:hidden absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {activeWedding.groom_name} & {activeWedding.bride_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  📍 {activeWedding.venue || "Venue specified in directory"} (
                  {activeWedding.city || "India"})
                </p>
              </div>
              <button
                onClick={() => handleOpenGoogleMapsDirections(activeWedding)}
                className="shrink-0 p-2 bg-[#FF6574] text-white rounded-lg shadow-xs"
                title="Get Directions"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar / Wedding Locations List (Visible for Admin with multiple weddings, or single venue details for client) */}
        {displayedWeddings.length > 1 ? (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col space-y-3 min-h-[460px]">
            {/* Search within venues */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Venues Directory ({filteredWeddings.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Click to Focus
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search couple, city, or resort..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6574] focus:ring-1 focus:ring-[#FF6574]"
                />
              </div>
            </div>

            {/* Venues Cards Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[500px]">
              {filteredWeddings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No venues found matching "{searchFilter}"
                </div>
              ) : (
                filteredWeddings.map((w, idx) => {
                  const isSelected =
                    (activeWeddingId === w.id) ||
                    (!activeWeddingId && idx === 0);
                  return (
                    <div
                      key={w.id || idx}
                      onClick={() => handleFocusWedding(w, idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? "border-[#FF6574] bg-[#FFF8F8] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {w.groom_name} & {w.bride_name}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FF6574] shrink-0" />
                            <span>
                              {w.venue || "Venue specified in directory"}
                            </span>
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                          {w.city || "Venue"}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{w.wedding_date || "Date TBA"}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {onSelectWedding && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectWedding) onSelectWedding(w);
                                if (onOpenDirectory) onOpenDirectory();
                              }}
                              className="text-[10px] font-bold text-[#1E3A8A] hover:underline flex items-center gap-0.5"
                            >
                              <span>Directory</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeWedding ? (
          /* Client Single Venue Details Panel */
          <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6574]">
                Wedding Celebration Venue
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {activeWedding.venue || "Resort & Venue"}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF6574]" />
                <span>
                  {activeWedding.city
                    ? `${activeWedding.city}, India`
                    : "Destination Location"}
                </span>
              </p>
            </div>

            <div className="space-y-1 md:border-l md:border-slate-100 md:pl-5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Celebration Date
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{activeWedding.wedding_date || "Date scheduled"}</span>
              </p>
              <p className="text-xs text-slate-500">
                Total Guests Expected: {activeWedding.total_guests || 0}
              </p>
            </div>

            <div className="flex items-center gap-2 justify-start md:justify-end">
              <button
                onClick={() => handleOpenGoogleMapsDirections(activeWedding)}
                className="px-4 py-2.5 bg-[#FF6574] hover:bg-[#e05463] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Navigation className="w-4 h-4 text-white" />
                <span>Open Google Maps</span>
              </button>
              {onOpenDirectory && (
                <button
                  onClick={onOpenDirectory}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Guest Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

