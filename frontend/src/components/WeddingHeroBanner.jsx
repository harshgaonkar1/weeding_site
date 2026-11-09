import React from "react";
import {
  MapPin,
  Calendar,
  Users,
  Send,
  MoreHorizontal,
  HelpCircle,
  UserCheck,
  CheckCircle2,
  Wallet,
  ArrowRight,
  TrendingUp,
  CreditCard,
} from "lucide-react";

/**
 * Luxury Wedding Hero Banner & Executive Summary Cards
 * Exact format, background details, styling, and icons from the reference image.
 */
export default function WeddingHeroBanner({
  wedding,
  stats = {},
  displayedGuests = [],
  onScrollToTable,
  onOpenAnalytics,
  onOpenGoogleSheet,
}) {
  if (!wedding) return null;

  const totalGuests =
    stats.totalRegistered !== undefined
      ? Number(stats.totalRegistered)
      : Number(wedding.total_guests) || displayedGuests.length || 0;

  const confirmedGuests =
    stats.confirmed !== undefined
      ? Number(stats.confirmed)
      : Number(wedding.confirmed_guests) ||
        displayedGuests.filter((g) => g.rsvp_status === "Attending" || g.rsvp_status === "Confirmed").length;

  const pendingGuests =
    stats.pending !== undefined
      ? Number(stats.pending)
      : Math.max(0, totalGuests - confirmedGuests);

  // Sides Breakdown: Groom vs Bride
  const groomCount =
    stats.groomCount !== undefined
      ? Number(stats.groomCount)
      : displayedGuests.filter((g) => (g.side || "").toLowerCase().includes("groom")).length;

  const brideCount =
    stats.brideCount !== undefined
      ? Number(stats.brideCount)
      : displayedGuests.filter((g) => (g.side || "").toLowerCase().includes("bride")).length;

  // 1. Delivered: Calls done / how many received the call (Connected / Spoke / Received)
  const deliveredCalls = displayedGuests.filter((g) => {
    const status = (g.call_status || "").toLowerCase().trim();
    const count = Number(g.call_count) || 0;
    if (
      status.includes("connected") ||
      status.includes("spoke") ||
      status.includes("rsvp confirmed") ||
      status === "completed"
    ) {
      return true;
    }
    if (
      count > 0 &&
      !status.includes("no answer") &&
      !status.includes("busy") &&
      !status.includes("missed") &&
      !status.includes("wrong") &&
      !status.includes("unreachable") &&
      !status.includes("not called")
    ) {
      return true;
    }
    return false;
  }).length;

  // 2. No Response: Whom you have called but not received the call (No Answer, Busy, Unreachable)
  const noResponseCalls = displayedGuests.filter((g) => {
    const status = (g.call_status || "").toLowerCase().trim();
    const count = Number(g.call_count) || 0;
    if (
      status.includes("no answer") ||
      status.includes("busy") ||
      status.includes("missed") ||
      status.includes("ringing") ||
      status.includes("wrong number") ||
      status.includes("unreachable") ||
      status.includes("callback")
    ) {
      return true;
    }
    if (
      count > 0 &&
      !status.includes("connected") &&
      !status.includes("confirmed") &&
      !status.includes("spoke") &&
      status !== "completed"
    ) {
      return true;
    }
    return false;
  }).length;

  // 3. In Progress: Remaining calls (not yet called / call pending to be made)
  const inProgressCalls =
    displayedGuests.length > 0
      ? displayedGuests.filter((g) => {
          const count = Number(g.call_count) || 0;
          const status = (g.call_status || "").toLowerCase().trim();
          return count === 0 || !status || status === "not called" || status.includes("pending");
        }).length
      : Math.max(0, totalGuests - deliveredCalls - noResponseCalls);

  // 4. Completed: Calls you have completed (finalized RSVP / workflow completed)
  const completedCalls = displayedGuests.filter((g) => {
    const status = (g.call_status || "").toLowerCase().trim();
    const count = Number(g.call_count) || 0;
    const rsvp = (g.rsvp_status || "").toLowerCase().trim();
    if (status.includes("completed") || status.includes("rsvp confirmed") || status.includes("declined rsvp")) {
      return true;
    }
    if (count > 0 && (rsvp === "confirmed" || rsvp === "declined")) {
      return true;
    }
    if (count >= 3) {
      return true;
    }
    return false;
  }).length;

  const totalCallsAttempted = deliveredCalls + noResponseCalls;
  const responseRate =
    totalCallsAttempted > 0
      ? Math.min(100, Math.round((deliveredCalls / totalCallsAttempted) * 100))
      : totalGuests > 0
      ? Math.min(100, Math.round((deliveredCalls / totalGuests) * 100))
      : 0;
  const roomsAssigned = Math.round(confirmedGuests * 0.81);

  return (
    <div className="space-y-3.5 sm:space-y-4 mb-5 sm:mb-6 animate-fadeIn">
      {/* ================= 1. LUXURY MIDNIGHT HERO WEDDING BANNER ================= */}
      <div className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] bg-[#0b0f19] text-white p-4 sm:p-7 md:p-9 shadow-md border border-slate-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
        {/* Left Side: Planning & Wedding Pills + Couple Title + Details */}
        <div className="space-y-3 sm:space-y-3.5 max-w-2xl z-10 w-full">
          {/* Pills: [Planning] [Wedding] */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#3b123f] text-[#f472b6] tracking-wide">
              Planning
            </span>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#1e293b] text-slate-200 tracking-wide">
              Wedding
            </span>
          </div>

          {/* Couple Name */}
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans">
              {wedding.groom_name} & {wedding.bride_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal mt-1">
              Luxury Wedding
            </p>
          </div>

          {/* Location, Date, Budget */}
          <div className="flex items-center gap-3.5 sm:gap-6 flex-wrap text-xs text-slate-300 pt-1.5 sm:pt-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e11d48] shrink-0" />
              <span className="font-medium text-slate-200">
                {wedding.city || "Jaipur, Rajasthan"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e11d48] shrink-0" />
              <span className="font-medium text-slate-200">
                {wedding.wedding_date || "2-4 Feb 2026"}
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="font-extrabold text-white text-xs">₹2.4 Cr</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 leading-tight">Total Budget</span>
            </div>
          </div>
        </div>

        {/* Right Side: Night Mandap / Palace Archway Photo */}
        <div className="relative w-full lg:w-[380px] h-36 sm:h-52 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 group">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
            alt="Royal Wedding Arch"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80";
            }}
          />
          {/* Subtle Ambient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* ================= 2. STATUS STRIP ================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:px-6 sm:py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs shadow-xs">
        {/* LIVE Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-900 text-xs block leading-tight">LIVE</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none">In progress</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-tight">Duration</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">25 days to go</span>
        </div>

        {/* Budget */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-tight">Budget</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">₹2.4 Cr / ₹1.62 Cr</span>
        </div>

        {/* Location */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-tight">Location</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">{wedding.city || "Jaipur, Rajasthan"}</span>
        </div>
      </div>

      {/* ================= 3. THE 3 SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Card 1: Guests */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            {/* Top Row: Purple Icon + Title + More options */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#f3e8ff] flex items-center justify-center text-[#9333ea]">
                  <Users className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Guests</h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Total Guests Number */}
            <div className="mb-3.5 sm:mb-4">
              <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight block leading-none">
                {totalGuests}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1 block">Total Guests</span>
            </div>

            {/* 3 Badges side by side */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {/* Confirmed */}
              <div className="bg-[#ecfdf5] border border-emerald-100/60 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 block leading-tight">
                  {confirmedGuests}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block truncate">
                  Confirmed
                </span>
              </div>

              {/* Pending */}
              <div className="bg-[#fffbeb] border border-amber-100/60 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-extrabold text-amber-600 block leading-tight">
                  {pendingGuests}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block truncate">
                  Pending
                </span>
              </div>

              {/* Rooms Assigned */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 block leading-tight">
                  {roomsAssigned}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 block truncate">
                  Rooms
                </span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <button
            type="button"
            onClick={onScrollToTable}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e11d48] hover:text-[#be123c] hover:underline mt-4 sm:mt-6 pt-3 border-t border-slate-100 cursor-pointer group transition-colors self-start"
          >
            <span>View all guests</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Card 2: Invites Overview */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            {/* Top Row: Pink Send Icon + Title + More options */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fce7f3] flex items-center justify-center text-[#db2777]">
                  <Send className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Invites Overview</h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Response Rate Metric */}
            <div className="mb-2">
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium block">Response Rate</span>
              <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight block leading-tight">
                {responseRate}%
              </span>
            </div>

            {/* Gradient Progress Bar: Dark Purple to Rose Pink */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3.5 sm:mb-4 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#4a154b] via-[#a21caf] to-[#e11d48] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, responseRate))}%` }}
              />
            </div>

            {/* 4 Mini Round Icons */}
            <div className="grid grid-cols-4 gap-1 text-center pt-1">
              {/* Delivered */}
              <div className="flex flex-col items-center" title="Calls Done / Received Call">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-none">{deliveredCalls}</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 truncate block">Delivered</span>
              </div>

              {/* No Response */}
              <div className="flex flex-col items-center" title="Called but Not Received">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                  <HelpCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-none">{noResponseCalls}</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 truncate block">No Resp</span>
              </div>

              {/* In Progress */}
              <div className="flex flex-col items-center" title="Remaining Calls to Make">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-none">{inProgressCalls}</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 truncate block">Progress</span>
              </div>

              {/* Completed */}
              <div className="flex flex-col items-center" title="Calls Completed">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-none">{completedCalls}</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 truncate block">Done</span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <button
            type="button"
            onClick={onScrollToTable}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e11d48] hover:text-[#be123c] hover:underline mt-4 sm:mt-6 pt-3 border-t border-slate-100 cursor-pointer group transition-colors self-start"
          >
            <span>View all invites</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Card 3: Sides Breakdown */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            {/* Top Row: Coral Users Icon + Title + More options */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ffe4e6] flex items-center justify-center text-[#e11d48]">
                  <Users className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Sides Breakdown</h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Total Side Guests */}
            <div className="mb-3.5 sm:mb-4">
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium block">Total Distribution</span>
              <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight block leading-tight">
                {totalGuests} <span className="text-xs sm:text-sm font-semibold text-slate-400">Guests</span>
              </span>
            </div>

            {/* Groom's Side and Bride's Side Columns */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
              <div>
                <span className="text-sm sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {groomCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 block">Groom's Side</span>
              </div>
              <div>
                <span className="text-sm sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {brideCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 block">Bride's Side</span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e11d48] hover:text-[#be123c] hover:underline mt-4 sm:mt-6 pt-3 border-t border-slate-100 cursor-pointer group transition-colors self-start"
          >
            <span>View analytics</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
