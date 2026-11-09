import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Sparkles,
  PieChart as PieIcon,
  CircleDot,
  Heart,
  TrendingUp,
  Filter,
  ChevronDown,
} from "lucide-react";

/**
 * RSVP Analytics View
 * Dedicated page showcasing RSVP Confirmed, Pending, and Regrets (Declined)
 * with interactive SVG Pie / Donut Chart and SVG Bubble Chart.
 */
export default function RsvpAnalyticsView({
  guests = [],
  wedding,
  weddings = [],
  onSelectWedding,
  onBack,
  onUpdateRsvp,
}) {
  const [sideFilter, setSideFilter] = useState("all"); // 'all' | 'groom' | 'bride'
  const [activeSlice, setActiveSlice] = useState(null);
  const [activeBubble, setActiveBubble] = useState(null);

  // If no wedding selected, prompt user to select a marriage first
  if (!wedding) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto animate-fadeIn">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-black text-slate-900">Select Marriage First</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a marriage to inspect its RSVP confirmed, pending, and regrets analytics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weddings.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-200/80">
              <p className="text-sm font-semibold text-slate-500">No marriages found.</p>
            </div>
          ) : (
            weddings.map((w) => (
              <div
                key={w.id}
                onClick={() => onSelectWedding && onSelectWedding(w, "rsvp")}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-[#7c3aed]/50 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#7c3aed] transition-colors">
                    {w.groom_name} & {w.bride_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {w.wedding_date || "Upcoming"} {w.city ? `• ${w.city}` : ""}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                  {w.total_guests || 0} Guests
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Filter guests by side if selected
  const filteredGuests = useMemo(() => {
    if (sideFilter === "groom") {
      return guests.filter((g) => (g.side || "").toLowerCase().includes("groom"));
    }
    if (sideFilter === "bride") {
      return guests.filter((g) => (g.side || "").toLowerCase().includes("bride"));
    }
    return guests;
  }, [guests, sideFilter]);

  // Overall RSVP Counts
  const total = filteredGuests.length;

  const confirmedList = useMemo(
    () =>
      filteredGuests.filter((g) => {
        const s = (g.rsvp_status || "").toLowerCase().trim();
        return s === "confirmed" || s.includes("attend") || s === "yes";
      }),
    [filteredGuests]
  );

  const regretsList = useMemo(
    () =>
      filteredGuests.filter((g) => {
        const s = (g.rsvp_status || "").toLowerCase().trim();
        return (
          s === "declined" ||
          s.includes("regret") ||
          s.includes("not") ||
          s === "no" ||
          s.includes("decline")
        );
      }),
    [filteredGuests]
  );

  const pendingList = useMemo(
    () =>
      filteredGuests.filter((g) => {
        const s = (g.rsvp_status || "").toLowerCase().trim();
        const isConf = s === "confirmed" || s.includes("attend") || s === "yes";
        const isReg =
          s === "declined" ||
          s.includes("regret") ||
          s.includes("not") ||
          s === "no" ||
          s.includes("decline");
        return !isConf && !isReg;
      }),
    [filteredGuests]
  );

  const confirmedCount = confirmedList.length;
  const pendingCount = pendingList.length;
  const regretsCount = regretsList.length;

  const confirmedPct = total > 0 ? Math.round((confirmedCount / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
  const regretsPct = total > 0 ? Math.round((regretsCount / total) * 100) : 0;

  // Groom vs Bride Breakdown
  const groomConfirmed = guests.filter(
    (g) =>
      (g.side || "").toLowerCase().includes("groom") &&
      (g.rsvp_status || "").toLowerCase().includes("confirm")
  ).length;
  const groomPending = guests.filter(
    (g) =>
      (g.side || "").toLowerCase().includes("groom") &&
      !(g.rsvp_status || "").toLowerCase().includes("confirm") &&
      !(g.rsvp_status || "").toLowerCase().includes("decline") &&
      !(g.rsvp_status || "").toLowerCase().includes("regret")
  ).length;
  const groomRegrets = guests.filter(
    (g) =>
      (g.side || "").toLowerCase().includes("groom") &&
      ((g.rsvp_status || "").toLowerCase().includes("decline") ||
        (g.rsvp_status || "").toLowerCase().includes("regret"))
  ).length;

  const brideConfirmed = guests.filter(
    (g) =>
      (g.side || "").toLowerCase().includes("bride") &&
      (g.rsvp_status || "").toLowerCase().includes("confirm")
  ).length;
  const bridePending = guests.filter(
    (g) =>
      (g.side || "").toLowerCase().includes("bride") &&
      !(g.rsvp_status || "").toLowerCase().includes("confirm") &&
      !(g.rsvp_status || "").toLowerCase().includes("decline") &&
      !(g.rsvp_status || "").toLowerCase().includes("regret")
  ).length;
  const brideRegrets = guests.filter(
    (g) =>
      (g.side || "").toLowerCase().includes("bride") &&
      ((g.rsvp_status || "").toLowerCase().includes("decline") ||
        (g.rsvp_status || "").toLowerCase().includes("regret"))
  ).length;

  // ------------------- SVG PIE / DONUT CHART GENERATION -------------------
  const pieSlices = useMemo(() => {
    if (total === 0) return [];
    const radius = 80;
    const innerRadius = 48; // Donut hole
    const cx = 100;
    const cy = 100;

    const data = [
      {
        key: "confirmed",
        label: "Confirmed",
        count: confirmedCount,
        pct: confirmedPct,
        color: "#10b981",
        lightColor: "#ecfdf5",
        ringColor: "ring-emerald-500",
      },
      {
        key: "pending",
        label: "Pending",
        count: pendingCount,
        pct: pendingPct,
        color: "#f59e0b",
        lightColor: "#fffbeb",
        ringColor: "ring-amber-500",
      },
      {
        key: "regrets",
        label: "Regrets",
        count: regretsCount,
        pct: regretsPct,
        color: "#f43f5e",
        lightColor: "#fff1f2",
        ringColor: "ring-rose-500",
      },
    ].filter((d) => d.count > 0);

    let cumulativeAngle = -Math.PI / 2; // Start from top 12 o'clock

    return data.map((d) => {
      const sliceAngle = (d.count / total) * 2 * Math.PI;
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

      // Donut arc SVG path
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
  }, [total, confirmedCount, pendingCount, regretsCount, confirmedPct, pendingPct, regretsPct]);

  // ------------------- SVG BUBBLE CHART GENERATION -------------------
  // Pack bubbles representing distinct RSVP parties & subgroups
  const bubbles = useMemo(() => {
    const rawGroups = [
      {
        id: "groom-confirmed",
        label: "Groom Confirmed",
        category: "Confirmed",
        count: groomConfirmed,
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
        count: brideConfirmed,
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
        count: groomPending,
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
        count: bridePending,
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
        count: regretsCount,
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
      const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
      return {
        ...g,
        r,
        pct,
      };
    });
  }, [groomConfirmed, brideConfirmed, groomPending, bridePending, regretsCount, total]);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 animate-fadeIn min-w-0 max-w-7xl mx-auto">
      {/* 1. Header Navigation & Scoped Wedding Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#7c3aed] mb-1.5 cursor-pointer transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#7c3aed]" />
              <span>Back to Overview</span>
            </button>
          )}

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#f5f3ff] text-[#7c3aed] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#ede9fe]">
              <Sparkles className="w-3 h-3 text-[#7c3aed]" />
              <span>RSVP Intelligence</span>
            </span>
            {weddings && weddings.length > 1 && onSelectWedding ? (
              <div className="relative inline-flex items-center">
                <select
                  value={wedding?.id || ""}
                  onChange={(e) => {
                    const match = weddings.find((w) => w.id === e.target.value);
                    if (match) onSelectWedding(match, "rsvp");
                  }}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-none rounded-xl px-2.5 py-1 pr-6 cursor-pointer focus:ring-2 focus:ring-[#7c3aed]/20 focus:outline-none appearance-none"
                >
                  {weddings.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.groom_name} & {w.bride_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                {wedding ? `${wedding.groom_name} & ${wedding.bride_name}` : "Wedding Event"}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>RSVP Analytics & Breakdown</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {total} Total Guests
            </span>
          </h1>
        </div>

        {/* Side Filter Segmented Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSideFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              sideFilter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All Sides
          </button>
          <button
            type="button"
            onClick={() => setSideFilter("groom")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              sideFilter === "groom"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🤵 Groom
          </button>
          <button
            type="button"
            onClick={() => setSideFilter("bride")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              sideFilter === "bride"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            👰 Bride
          </button>
        </div>
      </div>

      {/* 2. Top Metric Summary Cards (Confirmed, Pending, Regrets) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Confirmed */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 block">Confirmed (Attending)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-600">{confirmedCount}</span>
              <span className="text-xs font-bold text-emerald-700/80">({confirmedPct}%)</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Groom: {groomConfirmed} • Bride: {brideConfirmed}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-amber-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 block">Pending (Awaiting)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-600">{pendingCount}</span>
              <span className="text-xs font-bold text-amber-700/80">({pendingPct}%)</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Groom: {groomPending} • Bride: {bridePending}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Regrets (Declined) */}
        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 block">Regrets (Declined)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-rose-600">{regretsCount}</span>
              <span className="text-xs font-bold text-rose-700/80">({regretsPct}%)</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Groom: {groomRegrets} • Bride: {brideRegrets}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. The Visual Charts Grid: Pie Chart on Left + Bubble Chart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ================= A. INTERACTIVE SVG PIE / DONUT CHART ================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PieIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  RSVP Distribution (Pie Chart)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Interactive Slices
              </span>
            </div>

            {/* SVG Pie Chart Canvas */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
              <div className="relative w-52 h-52 shrink-0">
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
                    {confirmedPct + regretsPct}%
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
                      {confirmedCount} ({confirmedPct}%)
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
                      {pendingCount} ({pendingPct}%)
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
                      {regretsCount} ({regretsPct}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Hover over slices to inspect segments</span>
            <span>Total: {total} Guests</span>
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
                <h3 className="text-base font-extrabold text-slate-900">
                  RSVP Bubble Cluster Chart
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Sized by Guest Count
              </span>
            </div>

            {/* SVG Bubble Canvas */}
            <div className="w-full h-56 sm:h-60 bg-gradient-to-b from-slate-50/70 to-slate-100/40 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 380 250" className="w-full h-full">
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
                  <filter id="bubble-glow" x="-20%" y="-20%" width="140%" height="140%">
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
                        filter="url(#bubble-glow)"
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

      {/* 4. Guest RSVP Action List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Guest RSVP Status Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredGuests.length} guests for this celebration
            </p>
          </div>

          {/* Status Counter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ {confirmedCount} Confirmed
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              ⏳ {pendingCount} Pending
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              ✕ {regretsCount} Regrets
            </span>
          </div>
        </div>

        {/* Guests Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Current RSVP</th>
                {onUpdateRsvp && <th className="py-3 px-4 text-right">Quick Update</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredGuests.slice(0, 30).map((g) => {
                const s = (g.rsvp_status || "").toLowerCase();
                const isConf = s === "confirmed" || s.includes("attend");
                const isReg = s === "declined" || s.includes("regret");
                return (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {g.guest_name}
                    </td>
                    <td className="py-3 px-4">
                      {(g.side || "").toLowerCase().includes("bride") ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                          👰 Bride
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          🤵 Groom
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {g.contact || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {isConf ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Confirmed</span>
                        </span>
                      ) : isReg ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Regrets</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    {onUpdateRsvp && (
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateRsvp(g.id, "Confirmed")}
                            title="Mark as Confirmed"
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateRsvp(g.id, "Declined")}
                            title="Mark as Regrets"
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          >
                            Regret
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

