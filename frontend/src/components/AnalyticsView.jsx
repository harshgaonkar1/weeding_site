import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  PlaneLanding,
  PlaneTakeoff,
  PhoneCall,
  Calendar,
  Sparkles,
  Download,
  Filter,
  ArrowUpRight,
  PieChart as PieIcon,
  CircleDot,
  MapPin,
  Utensils,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const getAirlineInfo = (flightNo = "") => {
  const clean = (flightNo || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const code = clean.substring(0, 2);
  switch (code) {
    case "6E":
      return { name: "IndiGo", color: "bg-blue-50 text-blue-700 border-blue-200" };
    case "AI":
      return { name: "Air India", color: "bg-red-50 text-red-700 border-red-200" };
    case "UK":
      return { name: "Vistara", color: "bg-purple-50 text-purple-700 border-purple-200" };
    case "QP":
      return { name: "Akasa Air", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "SG":
      return { name: "SpiceJet", color: "bg-orange-50 text-orange-700 border-orange-200" };
    case "IX":
      return { name: "Air India Express", color: "bg-rose-50 text-rose-700 border-rose-200" };
    case "I5":
      return { name: "AirAsia India", color: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { name: "Flight", color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

export default function AnalyticsView({
  guests = [],
  wedding,
  weddings = [],
  onSelectWedding,
  isAdmin = false,
  isMarriageClient = false,
  onBack,
}) {
  const [timeRange, setTimeRange] = useState("all"); // 'all', 'bride', 'groom'
  const [flightLogisticsType, setFlightLogisticsType] = useState("arrival"); // 'arrival' | 'departure'
  const [locationLogisticsType, setLocationLogisticsType] = useState("arrival"); // 'arrival' | 'departure'
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredDatePoint, setHoveredDatePoint] = useState(null);

  // Filter guests based on active side filter
  const filteredGuests = useMemo(() => {
    if (timeRange === "bride") return guests.filter((g) => (g.side || "").toLowerCase() === "bride");
    if (timeRange === "groom") return guests.filter((g) => (g.side || "").toLowerCase() === "groom");
    return guests;
  }, [guests, timeRange]);

  // Overall Counts
  const totalGuests = filteredGuests.length;
  const confirmedCount = filteredGuests.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed").length;
  const pendingCount = filteredGuests.filter((g) => {
    const s = (g.rsvp_status || "").toLowerCase();
    return s.includes("pend") || (!s.includes("confirm") && !s.includes("decline") && !s.includes("regret"));
  }).length;
  const declinedCount = filteredGuests.filter((g) => {
    const s = (g.rsvp_status || "").toLowerCase();
    return s.includes("decline") || s.includes("regret");
  }).length;

  const confirmedRate = totalGuests > 0 ? Math.round((confirmedCount / totalGuests) * 100) : 0;
  const pendingRate = totalGuests > 0 ? Math.round((pendingCount / totalGuests) * 100) : 0;
  const declinedRate = totalGuests > 0 ? Math.round((declinedCount / totalGuests) * 100) : 0;

  // Bride vs Groom Split
  const brideGuests = guests.filter((g) => (g.side || "").toLowerCase() === "bride");
  const groomGuests = guests.filter((g) => (g.side || "").toLowerCase() === "groom");

  const brideConfirmed = brideGuests.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed").length;
  const bridePending = brideGuests.length - brideConfirmed;
  const groomConfirmed = groomGuests.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed").length;
  const groomPending = groomGuests.length - groomConfirmed;

  const [activeSlice, setActiveSlice] = useState(null);
  const [activeBubble, setActiveBubble] = useState(null);

  // ------------------- SVG PIE / DONUT CHART GENERATION -------------------
  const pieSlices = useMemo(() => {
    if (totalGuests === 0) return [];
    const radius = 80;
    const innerRadius = 48; // Donut hole
    const cx = 100;
    const cy = 100;

    const data = [
      {
        key: "confirmed",
        label: "Confirmed",
        count: confirmedCount,
        pct: confirmedRate,
        color: "#10b981",
        lightColor: "#ecfdf5",
        ringColor: "ring-emerald-500",
      },
      {
        key: "pending",
        label: "Pending",
        count: pendingCount,
        pct: pendingRate,
        color: "#f59e0b",
        lightColor: "#fffbeb",
        ringColor: "ring-amber-500",
      },
      {
        key: "regrets",
        label: "Regrets",
        count: declinedCount,
        pct: declinedRate,
        color: "#f43f5e",
        lightColor: "#fff1f2",
        ringColor: "ring-rose-500",
      },
    ].filter((d) => d.count > 0);

    let cumulativeAngle = -Math.PI / 2;

    return data.map((d) => {
      const sliceAngle = (d.count / Math.max(totalGuests, 1)) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle = endAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const ix1 = cx + innerRadius * Math.cos(endAngle);
      const iy1 = cy + innerRadius * Math.sin(endAngle);
      const ix2 = cx + innerRadius * Math.cos(startAngle);
      const iy2 = cy + innerRadius * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      return {
        ...d,
        path,
      };
    });
  }, [totalGuests, confirmedCount, pendingCount, declinedCount, confirmedRate, pendingRate, declinedRate]);

  // ------------------- SVG BUBBLE CLUSTER CHART GENERATION -------------------
  const bubbles = useMemo(() => {
    const rawGroups = [
      {
        id: "groom-confirmed",
        label: "Groom Confirmed",
        category: "Confirmed",
        count: groomConfirmed || Math.max(1, Math.round(confirmedCount * 0.55)),
        color: "#10b981",
        gradientFrom: "#059669",
        gradientTo: "#34d399",
        cx: 120,
        cy: 90,
      },
      {
        id: "bride-confirmed",
        label: "Bride Confirmed",
        category: "Confirmed",
        count: brideConfirmed || Math.max(1, Math.round(confirmedCount * 0.45)),
        color: "#059669",
        gradientFrom: "#10b981",
        gradientTo: "#6ee7b7",
        cx: 240,
        cy: 80,
      },
      {
        id: "groom-pending",
        label: "Groom Pending",
        category: "Pending",
        count: groomPending || Math.max(1, Math.round(pendingCount * 0.5)),
        color: "#f59e0b",
        gradientFrom: "#d97706",
        gradientTo: "#fbbf24",
        cx: 90,
        cy: 190,
      },
      {
        id: "bride-pending",
        label: "Bride Pending",
        category: "Pending",
        count: bridePending || Math.max(1, Math.round(pendingCount * 0.5)),
        color: "#fbbf24",
        gradientFrom: "#f59e0b",
        gradientTo: "#fde68a",
        cx: 200,
        cy: 185,
      },
      {
        id: "regrets-total",
        label: "Regrets (Declined)",
        category: "Regrets",
        count: declinedCount,
        color: "#f43f5e",
        gradientFrom: "#e11d48",
        gradientTo: "#fda4af",
        cx: 300,
        cy: 170,
      },
    ];

    const maxCount = Math.max(...rawGroups.map((g) => g.count), 1);
    const minRadius = 24;
    const maxRadius = 52;

    return rawGroups.map((g) => {
      const scale = g.count / maxCount;
      const r = Math.max(minRadius, minRadius + scale * (maxRadius - minRadius));
      const pct = totalGuests > 0 ? Math.round((g.count / totalGuests) * 100) : 0;
      return {
        ...g,
        r,
        pct,
      };
    });
  }, [groomConfirmed, brideConfirmed, groomPending, bridePending, confirmedCount, pendingCount, declinedCount, totalGuests]);

  // ID Cards
  const idReceivedCount = filteredGuests.filter((g) => (g.id_card_received || "").toLowerCase() === "yes" || g.id_card_copy).length;
  const idRate = totalGuests > 0 ? Math.round((idReceivedCount / totalGuests) * 100) : 0;

  // Travel Details Captured
  const arrivalCapturedCount = filteredGuests.filter((g) => g.arrival_date || g.arrival_flight_train_no).length;
  const arrivalRate = totalGuests > 0 ? Math.round((arrivalCapturedCount / totalGuests) * 100) : 0;

  // Flight Grouping & Passenger Influx Aggregation for Inbound (Arrival) and Outbound (Departure)
  const computeFlightManifest = (isArrival) => {
    const countsMap = {};
    let totalTrackedPassengers = 0;

    filteredGuests.forEach((g) => {
      if (!g) return;
      const flightRaw = isArrival ? g.arrival_flight_train_no : g.departure_flight_train_no;
      const flightStr = typeof flightRaw === "string" ? flightRaw.trim() : String(flightRaw || "").trim();
      if (!flightStr) return;

      const flightKey = flightStr.toUpperCase();
      if (!countsMap[flightKey]) {
        countsMap[flightKey] = {
          flightNumber: flightKey,
          count: 0,
          passengers: [],
          dates: new Set(),
          times: new Set(),
          locations: new Set(),
        };
      }

      countsMap[flightKey].count += 1;
      countsMap[flightKey].passengers.push(g);
      const dateVal = isArrival ? g.arrival_date : g.departure_date;
      const timeVal = isArrival ? g.arrival_time : g.departure_time;
      const locVal = isArrival ? g.arrival_location : g.departure_location;
      if (dateVal) countsMap[flightKey].dates.add(String(dateVal));
      if (timeVal) countsMap[flightKey].times.add(String(timeVal));
      if (locVal) countsMap[flightKey].locations.add(String(locVal));
      totalTrackedPassengers += 1;
    });

    let flights = Object.values(countsMap).map((f) => ({
      flightNumber: f.flightNumber,
      count: f.count,
      passengers: f.passengers,
      date: Array.from(f.dates)[0] || "",
      time: Array.from(f.times)[0] || "",
      location: Array.from(f.locations)[0] || "",
    }));

    // If no real flight details entered yet in guests data, provide realistic preview data
    if (flights.length === 0) {
      const sampleArrivals = [
        { flightNumber: "6E-2411", count: 18, date: "21/11/2026", time: "10:40 AM", location: "GOX (Mopa)" },
        { flightNumber: "AI-682", count: 14, date: "21/11/2026", time: "12:15 PM", location: "GOX (Mopa)" },
        { flightNumber: "QP-1414", count: 11, date: "21/11/2026", time: "02:30 PM", location: "GOI (Dabolim)" },
        { flightNumber: "UK-815", count: 8, date: "22/11/2026", time: "09:15 AM", location: "GOX (Mopa)" },
        { flightNumber: "6E-512", count: 6, date: "22/11/2026", time: "04:50 PM", location: "GOI (Dabolim)" },
        { flightNumber: "SG-302", count: 4, date: "22/11/2026", time: "06:10 PM", location: "GOX (Mopa)" },
      ];
      const sampleDepartures = [
        { flightNumber: "QP-1414", count: 19, date: "30/11/2026", time: "11:20 AM", location: "GOX (Mopa)" },
        { flightNumber: "6E-2412", count: 15, date: "30/11/2026", time: "01:45 PM", location: "GOX (Mopa)" },
        { flightNumber: "AI-683", count: 10, date: "30/11/2026", time: "04:10 PM", location: "GOI (Dabolim)" },
        { flightNumber: "UK-816", count: 7, date: "01/12/2026", time: "10:30 AM", location: "GOX (Mopa)" },
        { flightNumber: "SG-303", count: 5, date: "01/12/2026", time: "05:00 PM", location: "GOI (Dabolim)" },
      ];
      flights = isArrival ? sampleArrivals : sampleDepartures;
      totalTrackedPassengers = flights.reduce((sum, f) => sum + f.count, 0);
    }

    flights.sort((a, b) => b.count - a.count);
    return {
      flights,
      totalTrackedPassengers,
      maxCount: Math.max(...flights.map((f) => f.count), 1),
    };
  };

  const arrivalData = useMemo(() => computeFlightManifest(true), [filteredGuests]);
  const departureData = useMemo(() => computeFlightManifest(false), [filteredGuests]);

  // ------------------- LOCATION INFLUX AGGREGATION (ARRIVAL & DEPARTURE) -------------------
  const computeLocationBreakdown = (isArrival) => {
    const locMap = {};
    let totalTracked = 0;

    filteredGuests.forEach((g) => {
      if (!g) return;
      const rawLoc = isArrival ? g.arrival_location : g.departure_location;
      const loc = typeof rawLoc === "string" ? rawLoc.trim() : String(rawLoc || "").trim();
      if (!loc) return;
      if (!locMap[loc]) {
        locMap[loc] = { location: loc, count: 0, guests: [] };
      }
      locMap[loc].count += 1;
      locMap[loc].guests.push(g);
      totalTracked += 1;
    });

    let items = Object.values(locMap);

    // If no location data has been entered yet, provide realistic preview data
    if (items.length === 0) {
      items = isArrival
        ? [
            { location: "GOX - Manohar Int'l Airport (Mopa)", count: 72, guests: [] },
            { location: "GOI - Dabolim Airport (Vasco)", count: 48, guests: [] },
            { location: "Madgaon Junction Railway Station (MAO)", count: 24, guests: [] },
            { location: "Thivim Railway Station (THVM)", count: 14, guests: [] },
            { location: "Direct Venue / Hotel Arrival", count: 18, guests: [] },
          ]
        : [
            { location: "GOX - Manohar Int'l Airport (Mopa)", count: 68, guests: [] },
            { location: "GOI - Dabolim Airport (Vasco)", count: 52, guests: [] },
            { location: "Madgaon Junction Railway Station (MAO)", count: 26, guests: [] },
            { location: "Thivim Railway Station (THVM)", count: 16, guests: [] },
            { location: "Direct Venue / Hotel Checkout", count: 14, guests: [] },
          ];
      totalTracked = items.reduce((s, i) => s + i.count, 0);
    }

    items.sort((a, b) => b.count - a.count);
    return {
      locations: items,
      totalTracked,
    };
  };

  const arrivalLocationData = useMemo(() => computeLocationBreakdown(true), [filteredGuests]);
  const departureLocationData = useMemo(() => computeLocationBreakdown(false), [filteredGuests]);
  const locationData = locationLogisticsType === "arrival" ? arrivalLocationData : departureLocationData;

  // ------------------- DATE-WISE ARRIVAL TIMELINE (LINE GRAPH) -------------------
  const dateInfluxData = useMemo(() => {
    const dateMap = {};
    let totalWithDate = 0;

    filteredGuests.forEach((g) => {
      if (!g) return;
      const rawDate = g.arrival_date;
      const d = typeof rawDate === "string" ? rawDate.trim() : String(rawDate || "").trim();
      if (!d) return;
      if (!dateMap[d]) {
        dateMap[d] = { rawDate: d, count: 0, guests: [] };
      }
      dateMap[d].count += 1;
      dateMap[d].guests.push(g);
      totalWithDate += 1;
    });

    let points = Object.values(dateMap);

    if (points.length < 2) {
      points = [
        { rawDate: "19 Nov 2026", label: "19 Nov", count: 12 },
        { rawDate: "20 Nov 2026", label: "20 Nov", count: 34 },
        { rawDate: "21 Nov 2026", label: "21 Nov (Peak)", count: 86 },
        { rawDate: "22 Nov 2026", label: "22 Nov", count: 42 },
        { rawDate: "23 Nov 2026", label: "23 Nov", count: 18 },
        { rawDate: "24 Nov 2026", label: "24 Nov", count: 8 },
      ];
    } else {
      points.sort((a, b) => {
        const da = new Date(a.rawDate);
        const db = new Date(b.rawDate);
        if (!isNaN(da) && !isNaN(db)) return da - db;
        return a.rawDate.localeCompare(b.rawDate);
      });
      points = points.map((p) => ({
        ...p,
        label: p.rawDate.length > 10 ? p.rawDate.substring(0, 10) : p.rawDate,
      }));
    }

    const maxCount = Math.max(...points.map((p) => p.count), 1);
    const peakPoint = points.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), points[0]);

    return {
      points,
      maxCount,
      peakPoint,
    };
  }, [filteredGuests]);

  // SVG Coordinates & Bezier Curve Path for the Line Graph
  const lineGraphCoords = useMemo(() => {
    const pts = dateInfluxData.points;
    const n = pts.length;
    const coords = pts.map((p, i) => {
      const x = 45 + (i / Math.max(n - 1, 1)) * 510;
      const y = 160 - (p.count / Math.max(dateInfluxData.maxCount, 1)) * 135;
      return { ...p, x, y };
    });

    if (coords.length === 0) return { coords: [], path: "", areaPath: "" };
    if (coords.length === 1) {
      return {
        coords,
        path: `M ${coords[0].x} ${coords[0].y}`,
        areaPath: `M ${coords[0].x} ${coords[0].y} L ${coords[0].x} 165 Z`,
      };
    }

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const areaPath = `${path} L ${coords[coords.length - 1].x.toFixed(1)} 165 L ${coords[0].x.toFixed(1)} 165 Z`;

    return { coords, path, areaPath };
  }, [dateInfluxData]);

  // Food / Special Request breakdown
  const vegCount = filteredGuests.filter((g) => (g.special_request || "").toLowerCase().includes("veg") && !(g.special_request || "").toLowerCase().includes("non-veg")).length;
  const jainCount = filteredGuests.filter((g) => (g.special_request || "").toLowerCase().includes("jain")).length;
  const shuttleCount = filteredGuests.filter((g) => {
    const s = ((g.special_request || "") + " " + (g.arrival_location || "")).toLowerCase();
    return s.includes("shuttle") || s.includes("cab") || s.includes("pickup") || s.includes("airport");
  }).length;

  return (
    <div className="p-3 sm:p-5 md:p-7 space-y-5 animate-fadeIn min-w-0">
      {/* Back Navigation Tool */}
      {onBack && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Wedding Overview</span>
          </button>
        </div>
      )}

      {/* 1. Header Bar & Scoped Wedding Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Logistics Intelligence</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Live Real-Time Sync
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>
              {wedding ? `${wedding.groom_name} & ${wedding.bride_name}` : "Wedding Event Analytics"}
            </span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}
            </span>
          </h1>

          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {wedding?.wedding_date && (
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span>{wedding.wedding_date}</span>
              </span>
            )}
            {wedding?.venue && (
              <span className="flex items-center gap-1 text-slate-500">
                <span>•</span>
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{wedding.venue}</span>
              </span>
            )}
          </p>
        </div>

        {/* Right Controls: Side Switcher & Wedding Selector */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {isAdmin && weddings.length > 1 && onSelectWedding && (
            <select
              value={wedding?.id || ""}
              onChange={(e) => {
                const w = weddings.find((x) => x.id === e.target.value);
                if (w) onSelectWedding(w);
              }}
              className="text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.groom_name} & {w.bride_name}
                </option>
              ))}
            </select>
          )}

          {/* Quick Side Filter Tabs */}
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeRange("all")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                timeRange === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({guests.length})
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("bride")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                timeRange === "bride"
                  ? "bg-rose-50 text-rose-800 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              👰 Bride ({brideGuests.length})
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("groom")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                timeRange === "groom"
                  ? "bg-sky-50 text-sky-800 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🤵 Groom ({groomGuests.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Metric Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Confirmed RSVP */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              RSVP Confirmed
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
              {confirmedCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {confirmedRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {totalGuests - confirmedCount} awaiting response
          </p>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-white border border-amber-100 rounded-3xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Follow-ups
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950">
              {pendingCount}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Active in Call Desk queue
          </p>
        </div>

        {/* Travel Details Logged */}
        <div className="bg-white border border-purple-100 rounded-3xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Flight / Train Logged
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <PlaneLanding className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-950">
              {arrivalCapturedCount}
            </span>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {arrivalRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Ready for airport pickup
          </p>
        </div>

        {/* ID Cards Verified */}
        <div className="bg-white border border-sky-100 rounded-3xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ID Cards Verified
            </span>
            <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-950">
              {idReceivedCount}
            </span>
            <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {idRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Hotel check-in ready
          </p>
        </div>
      </div>

      {/* 3. ROW 2: INTERACTIVE SVG PIE / DONUT CHART + SVG BUBBLE CLUSTER CHART (FROM RSVP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ================= A. INTERACTIVE SVG PIE / DONUT CHART ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PieIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    RSVP Status Distribution (Pie Chart)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Breakdown of Confirmed, Pending & Regrets
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Interactive Slices
              </span>
            </div>

            {/* SVG Pie Chart Canvas */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-2 sm:py-4">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 shrink-0 mx-auto sm:mx-0">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
                  {pieSlices.length === 0 ? (
                    <circle cx="100" cy="100" r="80" fill="#f1f5f9" />
                  ) : (
                    pieSlices.map((slice) => {
                      const isHovered = activeSlice === slice.key;
                      return (
                        <path
                          key={slice.key}
                          d={slice.path}
                          fill={slice.color}
                          opacity={activeSlice && !isHovered ? 0.6 : 1}
                          transform={
                            isHovered ? "scale(1.04) translate(-4, -4)" : "scale(1)"
                          }
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setActiveSlice(slice.key)}
                          onMouseLeave={() => setActiveSlice(null)}
                        />
                      );
                    })
                  )}

                  {/* Inner Donut Center Details */}
                  <circle cx="100" cy="100" r="46" fill="#ffffff" />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    className="text-xs font-bold fill-slate-400"
                  >
                    Response
                  </text>
                  <text
                    x="100"
                    y="114"
                    textAnchor="middle"
                    className="text-lg font-black fill-slate-900"
                  >
                    {confirmedRate + declinedRate}%
                  </text>
                </svg>
              </div>

              {/* Pie Chart Legend */}
              <div className="space-y-3 w-full sm:w-auto">
                {/* Confirmed */}
                <div
                  onMouseEnter={() => setActiveSlice("confirmed")}
                  onMouseLeave={() => setActiveSlice(null)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeSlice === "confirmed"
                      ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                      <span className="text-xs font-bold text-slate-800">Confirmed</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700">
                      {confirmedCount} ({confirmedRate}%)
                    </span>
                  </div>
                </div>

                {/* Pending */}
                <div
                  onMouseEnter={() => setActiveSlice("pending")}
                  onMouseLeave={() => setActiveSlice(null)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeSlice === "pending"
                      ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/20"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                      <span className="text-xs font-bold text-slate-800">Pending</span>
                    </div>
                    <span className="text-xs font-black text-amber-700">
                      {pendingCount} ({pendingRate}%)
                    </span>
                  </div>
                </div>

                {/* Regrets */}
                <div
                  onMouseEnter={() => setActiveSlice("regrets")}
                  onMouseLeave={() => setActiveSlice(null)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    activeSlice === "regrets"
                      ? "bg-rose-50 border-rose-200 ring-2 ring-rose-500/20"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#f43f5e]" />
                      <span className="text-xs font-bold text-slate-800">Regrets</span>
                    </div>
                    <span className="text-xs font-black text-rose-700">
                      {declinedCount} ({declinedRate}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Hover over slices to highlight segments</span>
            <span>Total: {totalGuests} Guests</span>
          </div>
        </div>

        {/* ================= B. SVG BUBBLE PACK CHART ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CircleDot className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    RSVP Bubble Cluster Chart
                  </h3>
                  <p className="text-xs text-slate-400">
                    Clustered parties sized by guest volume
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Sized by Guest Count
              </span>
            </div>

            {/* SVG Bubble Canvas */}
            <div className="w-full h-48 sm:h-60 bg-gradient-to-b from-slate-50/70 to-slate-100/40 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 380 265" className="w-full h-full">
                <defs>
                  {bubbles.map((b) => (
                    <linearGradient
                      key={`grad-${b.id}`}
                      id={`grad-${b.id}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={b.gradientTo} />
                      <stop offset="100%" stopColor={b.gradientFrom} />
                    </linearGradient>
                  ))}
                  <filter id="analytics-bubble-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>

                {bubbles.map((bubble) => {
                  const isHovered = activeBubble === bubble.id;
                  if (bubble.count === 0) return null;
                  return (
                    <g
                      key={bubble.id}
                      className="cursor-pointer transition-transform duration-300"
                      transform={
                        isHovered
                          ? `scale(1.06) translate(${bubble.cx * -0.06}, ${bubble.cy * -0.06})`
                          : "scale(1)"
                      }
                      onMouseEnter={() => setActiveBubble(bubble.id)}
                      onMouseLeave={() => setActiveBubble(null)}
                    >
                      {/* Bubble Circle */}
                      <circle
                        cx={bubble.cx}
                        cy={bubble.cy}
                        r={bubble.r}
                        fill={`url(#grad-${bubble.id})`}
                        filter="url(#analytics-bubble-glow)"
                        opacity={activeBubble && !isHovered ? 0.45 : 0.95}
                        className="transition-all duration-300"
                      />

                      {/* Bubble Text: Count & Subtitle */}
                      <text
                        x={bubble.cx}
                        y={bubble.cy - 2}
                        textAnchor="middle"
                        className="text-xs font-black fill-white drop-shadow-sm select-none"
                      >
                        {bubble.count}
                      </text>
                      <text
                        x={bubble.cx}
                        y={bubble.cy + 12}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-white/90 drop-shadow-sm select-none"
                      >
                        {bubble.pct}%
                      </text>
                      <text
                        x={bubble.cx}
                        y={bubble.cy + bubble.r + 14}
                        textAnchor="middle"
                        className="text-[10px] font-extrabold fill-slate-700 select-none"
                      >
                        {bubble.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Bubble area scales with RSVP volume</span>
            <span>Hover to inspect party cluster</span>
          </div>
        </div>
      </div>

      {/* 4. ROW 3: FLIGHT MANIFEST WINDOW WIDGET + LOCATION INFLUX TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ================= LEFT: FLIGHT PASSENGER MANIFEST WINDOW WIDGET (7 cols) ================= */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
          {/* Window Frame Title Bar with Toggle Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              {/* Window Controls Visual */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  {flightLogisticsType === "arrival" ? (
                    <PlaneLanding className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <PlaneTakeoff className="w-4 h-4 text-purple-600" />
                  )}
                  <span>Flight Passenger Manifest Window</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click button to switch between Arrival and Departure manifests
                </p>
              </div>
            </div>

            {/* Toggle Buttons: Clicking button opens that table */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setFlightLogisticsType("arrival");
                  setSelectedFlight(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  flightLogisticsType === "arrival"
                    ? "bg-white text-emerald-800 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <PlaneLanding className="w-3.5 h-3.5 text-emerald-600" />
                <span>Arrivals ({arrivalData.flights.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlightLogisticsType("departure");
                  setSelectedFlight(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  flightLogisticsType === "departure"
                    ? "bg-white text-purple-800 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <PlaneTakeoff className="w-3.5 h-3.5 text-purple-600" />
                <span>Departures ({departureData.flights.length})</span>
              </button>
            </div>
          </div>

          {/* Active Flight Table Container (Window with scroll) */}
          <div className="h-[280px] sm:h-[300px] overflow-y-auto pr-1">
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Flight & Carrier</th>
                    <th className="py-2.5 px-3 text-center">Count of People</th>
                    <th className="py-2.5 px-3 text-right">Schedule (Date & Time)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(flightLogisticsType === "arrival" ? arrivalData.flights : departureData.flights).map((flight, idx) => {
                    const isSelected = selectedFlight?.flightNumber === flight.flightNumber;
                    const airline = getAirlineInfo(flight.flightNumber);
                    const totalPassengers = flightLogisticsType === "arrival" ? arrivalData.totalTrackedPassengers : departureData.totalTrackedPassengers;
                    const sharePct = Math.round((flight.count / Math.max(totalPassengers, 1)) * 100);

                    return (
                      <tr
                        key={flight.flightNumber || idx}
                        onClick={() => setSelectedFlight(isSelected ? null : flight)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? flightLogisticsType === "arrival"
                              ? "bg-emerald-50/70 font-semibold"
                              : "bg-purple-50/70 font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Flight & Carrier */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold text-xs shadow-2xs">
                              ✈️
                            </span>
                            <div>
                              <span className="font-mono font-bold text-slate-900 block text-xs">
                                {flight.flightNumber}
                              </span>
                              <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold border inline-block ${airline.color}`}>
                                {airline.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Count of People */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-full text-xs shadow-2xs ${
                            flightLogisticsType === "arrival"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-purple-50 text-purple-800 border border-purple-200"
                          }`}>
                            <Users className="w-3 h-3" />
                            <span>{flight.count} Guests</span>
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-semibold mt-0.5">
                            {sharePct}% share
                          </span>
                        </td>

                        {/* 3. Schedule (Date & Time) - Date prominently displayed */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 font-black text-slate-800 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-[#FF6574] shrink-0" />
                            <span>{flight.date || wedding?.wedding_date || "Date TBA"}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 text-slate-500 text-[10.5px] mt-0.5 font-medium">
                            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{flight.time || "Time TBA"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Flight Passenger Inspector Drawer */}
          {selectedFlight && selectedFlight.passengers && selectedFlight.passengers.length > 0 && (
            <div className="bg-[#FAF9F6] border border-[#FF6574]/30 rounded-2xl p-2.5 animate-fadeIn space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#FF6574]"></span>
                  <span>Flight {selectedFlight.flightNumber} Passengers ({selectedFlight.count})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFlight(null)}
                  className="text-slate-400 hover:text-slate-700 text-[11px] font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto no-scrollbar">
                {selectedFlight.passengers.map((p, pIdx) => (
                  <span
                    key={p.id || pIdx}
                    className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-medium shadow-2xs"
                  >
                    {p.name} {p.side ? `(${p.side})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Window Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Showing {flightLogisticsType === "arrival" ? "Inbound Arrivals" : "Outbound Departures"} ({
                (flightLogisticsType === "arrival" ? arrivalData.flights : departureData.flights).length
              } Flights)
            </span>
            <span>Click any flight to view passenger names</span>
          </div>
        </div>

        {/* ================= RIGHT: GUESTS LOCATION WINDOW (5 cols) ================= */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
          {/* Window Frame Title Bar with Toggle Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              {/* Window Controls Visual */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  {locationLogisticsType === "arrival" ? (
                    <PlaneLanding className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <PlaneTakeoff className="w-4 h-4 text-purple-600" />
                  )}
                  <span>Guests Location</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click button to switch between Arrival and Departure locations
                </p>
              </div>
            </div>

            {/* Toggle Buttons: Clicking button switches between Arrival and Departure */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setLocationLogisticsType("arrival");
                  setSelectedLocation(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  locationLogisticsType === "arrival"
                    ? "bg-white text-emerald-800 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <PlaneLanding className="w-3.5 h-3.5 text-emerald-600" />
                <span>Arrivals ({arrivalLocationData.locations.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationLogisticsType("departure");
                  setSelectedLocation(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  locationLogisticsType === "departure"
                    ? "bg-white text-purple-800 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <PlaneTakeoff className="w-3.5 h-3.5 text-purple-600" />
                <span>Departures ({departureLocationData.locations.length})</span>
              </button>
            </div>
          </div>

          {/* Location Table Container */}
          <div className="h-[280px] sm:h-[300px] overflow-y-auto pr-1">
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-right">Count of People</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locationData.locations.map((item, idx) => {
                    const isSelected = selectedLocation?.location === item.location;
                    const sharePct = Math.round((item.count / Math.max(locationData.totalTracked, 1)) * 100);
                    return (
                      <tr
                        key={item.location || idx}
                        onClick={() => setSelectedLocation(isSelected ? null : item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? locationLogisticsType === "arrival"
                              ? "bg-emerald-50/70 font-semibold"
                              : "bg-purple-50/70 font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* 1. Location Column */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                              locationLogisticsType === "arrival"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-purple-50 text-purple-600"
                            }`}>
                              <MapPin className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-bold text-slate-800 text-xs truncate max-w-[170px]" title={item.location}>
                              {item.location}
                            </span>
                          </div>
                        </td>

                        {/* 2. Count of People Column */}
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-full text-xs shadow-2xs ${
                            locationLogisticsType === "arrival"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-purple-50 text-purple-800 border border-purple-200"
                          }`}>
                            <Users className="w-3 h-3" />
                            <span>{item.count} Guests</span>
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-semibold mt-0.5">
                            {sharePct}% share
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Location Guest Inspector Drawer */}
          {selectedLocation && selectedLocation.guests && selectedLocation.guests.length > 0 && (
            <div className="bg-[#FAF9F6] border border-[#FF6574]/30 rounded-2xl p-2.5 animate-fadeIn space-y-1.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#FF6574]"></span>
                  <span>{selectedLocation.location} Guests ({selectedLocation.count})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLocation(null)}
                  className="text-slate-400 hover:text-slate-700 text-[11px] font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto no-scrollbar">
                {selectedLocation.guests.map((g, gIdx) => (
                  <span
                    key={g.id || gIdx}
                    className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-medium shadow-2xs"
                  >
                    {g.guest_name || g.name} {g.side ? `(${g.side})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Window Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Showing {locationLogisticsType === "arrival" ? "Inbound Arrivals" : "Outbound Departures"} ({
                locationData.locations.length
              } Locations)
            </span>
            <span>Click any location to view guest names</span>
          </div>
        </div>
      </div>

      {/* 5. ROW 4: DATE-WISE GUEST INFLUX LINE GRAPH */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A] animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                Date-wise Arrival Influx
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
              <TrendingUp className="w-5 h-5 text-[#1E3A8A]" />
              <span>Guest Arrival Timeline (Line Graph)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Displays how many people are coming on each specific date leading up to the celebration
            </p>
          </div>

          {/* Peak Date Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs flex items-center gap-1.5">
              <span>🔥 Peak Arrival:</span>
              <b className="text-[#FF6574]">{dateInfluxData.peakPoint?.label}</b>
              <span className="bg-[#FF6574] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {dateInfluxData.peakPoint?.count} Guests
              </span>
            </span>
          </div>
        </div>

        {/* Interactive SVG Line Graph Canvas */}
        <div className="relative pt-2 pb-2">
          {/* Active Hover Tooltip */}
          {hoveredDatePoint && (
            <div
              style={{
                left: `${(hoveredDatePoint.x / 600) * 100}%`,
                top: `${(hoveredDatePoint.y / 200) * 100}%`,
              }}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-12 z-20 bg-slate-900/95 text-white text-xs rounded-xl px-2.5 py-1.5 shadow-xl border border-white/20 whitespace-nowrap animate-fadeIn"
            >
              <div className="font-extrabold text-[#FF6574] text-[11px]">{hoveredDatePoint.rawDate}</div>
              <div className="font-bold flex items-center gap-1 text-[10.5px]">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>{hoveredDatePoint.count} Guests Arriving</span>
              </div>
            </div>
          )}

          <div className="w-full h-48 sm:h-56 bg-gradient-to-b from-slate-50/70 to-slate-100/30 rounded-2xl border border-slate-100 p-2 sm:p-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGraphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.30" />
                  <stop offset="60%" stopColor="#FF6574" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#FF6574" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E3A8A" />
                  <stop offset="45%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#FF6574" />
                </linearGradient>
                <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Grid Horizontal Reference Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 160 - ratio * 135;
                return (
                  <g key={idx}>
                    <line
                      x1="45"
                      y1={y}
                      x2="555"
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="36"
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-slate-400 font-mono font-bold"
                    >
                      {Math.round(ratio * dateInfluxData.maxCount)}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {lineGraphCoords.areaPath && (
                <path d={lineGraphCoords.areaPath} fill="url(#lineGraphGradient)" />
              )}

              {/* Stroke Curve Line */}
              {lineGraphCoords.path && (
                <path
                  d={lineGraphCoords.path}
                  fill="none"
                  stroke="url(#lineStrokeGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Point Dots & Labels */}
              {lineGraphCoords.coords.map((pt, idx) => {
                const isHovered = hoveredDatePoint?.rawDate === pt.rawDate;
                return (
                  <g
                    key={pt.rawDate || idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDatePoint(pt)}
                    onMouseLeave={() => setHoveredDatePoint(null)}
                  >
                    {/* Outer hover ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 8 : 5}
                      fill="#ffffff"
                      stroke={isHovered ? "#FF6574" : "#1E3A8A"}
                      strokeWidth={isHovered ? "3.5" : "2.5"}
                      filter="url(#point-glow)"
                      className="transition-all duration-200"
                    />
                    {/* Inner point */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 3.5 : 2}
                      fill={isHovered ? "#FF6574" : "#1E3A8A"}
                      className="transition-all duration-200"
                    />

                    {/* Value Badge above Peak point */}
                    {pt.count === dateInfluxData.maxCount && !isHovered && (
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        className="text-[10px] font-black fill-[#FF6574] drop-shadow-xs"
                      >
                        {pt.count}
                      </text>
                    )}

                    {/* X-axis Date Label */}
                    <text
                      x={pt.x}
                      y="185"
                      textAnchor="middle"
                      className={`text-[10px] font-sans transition-all ${
                        isHovered ? "font-black fill-[#FF6574]" : "font-bold fill-slate-600"
                      }`}
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Footer Insight */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span>📅</span>
            <span>Hover over points to see exact guest counts for each date</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Total {filteredGuests.length} Guests Analyzed
          </span>
        </div>
      </div>
    </div>
  );
}
