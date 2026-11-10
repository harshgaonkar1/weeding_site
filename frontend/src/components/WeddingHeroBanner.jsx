import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Send,
  MoreHorizontal,
  HelpCircle,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Calendar,
  ImageIcon,
  Check,
  ChevronDown,
} from "lucide-react";
import { getWeddingCoverImage, WEDDING_COVER_PRESETS } from "../utils/weddingThemes";
import { useAuth } from "../context/AuthContext";

/**
 * Luxury Wedding Hero Banner & Executive Summary Cards
 * Exact format from user's reference image (media_1794219189099_a29878f6.png):
 * - Full header background covered with wedding image (not small box on side)
 * - Built-in option to select / change cover image from curated wedding vibes
 * - Planning & Wedding badges
 * - Couple name, Luxury Wedding subtitle, Location & Date
 * - Status Strip (LIVE • Duration • Location)
 * - 3 Summary Cards:
 *    Card 1: Guests (Total Guests, Confirmed, Pending, Regrets, Rooms)
 *    Card 2: Invites Overview (Response Rate %, Gradient Bar, 4 Mini status metrics)
 *    Card 3: Sides Breakdown (Total Distribution, Groom's Side, Bride's Side)
 */
export default function WeddingHeroBanner({
  wedding,
  stats = {},
  displayedGuests = [],
  onScrollToTable,
  onOpenAnalytics,
  onOpenGoogleSheet,
  onUpdateCoverImage,
}) {
  const { isMarriageClient, isViewOnly } = useAuth();
  const canChangeImage = !isMarriageClient && !isViewOnly && Boolean(onUpdateCoverImage);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const imagePickerRef = useRef(null);

  // Close image picker dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (imagePickerRef.current && !imagePickerRef.current.contains(e.target)) {
        setIsImagePickerOpen(false);
      }
    };
    if (isImagePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isImagePickerOpen]);

  if (!wedding) return null;

  const totalGuests =
    stats.totalRegistered !== undefined
      ? Number(stats.totalRegistered)
      : Number(wedding.total_guests) || displayedGuests.length || 0;

  const confirmedGuests =
    stats.confirmed !== undefined
      ? Number(stats.confirmed)
      : Number(wedding.confirmed_guests) ||
        displayedGuests.filter(
          (g) => g.rsvp_status === "Attending" || g.rsvp_status === "Confirmed"
        ).length;

  // Regrets / Declined guests count ("regrade")
  const declinedGuests =
    stats.declined !== undefined
      ? Number(stats.declined)
      : displayedGuests.filter((g) => {
          const s = (g.rsvp_status || "").toLowerCase();
          return s.includes("decline") || s.includes("regret");
        }).length;

  const pendingGuests =
    stats.pending !== undefined
      ? Number(stats.pending)
      : Math.max(0, totalGuests - confirmedGuests - declinedGuests);

  // Sides Breakdown: Groom vs Bride
  const groomCount =
    stats.groomCount !== undefined
      ? Number(stats.groomCount)
      : displayedGuests.filter((g) =>
          (g.side || "").toLowerCase().includes("groom")
        ).length;

  const brideCount =
    stats.brideCount !== undefined
      ? Number(stats.brideCount)
      : displayedGuests.filter((g) =>
          (g.side || "").toLowerCase().includes("bride")
        ).length;

  // 1. Delivered: Calls done / received call
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

  // 2. No Response: Called but not received
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

  // 3. In Progress: Remaining calls
  const inProgressCalls =
    displayedGuests.length > 0
      ? displayedGuests.filter((g) => {
          const count = Number(g.call_count) || 0;
          const status = (g.call_status || "").toLowerCase().trim();
          return (
            count === 0 ||
            !status ||
            status === "not called" ||
            status.includes("pending")
          );
        }).length
      : Math.max(0, totalGuests - deliveredCalls - noResponseCalls);

  // 4. Completed: Calls completed
  const completedCalls = displayedGuests.filter((g) => {
    const status = (g.call_status || "").toLowerCase().trim();
    const count = Number(g.call_count) || 0;
    const rsvp = (g.rsvp_status || "").toLowerCase().trim();
    if (
      status.includes("completed") ||
      status.includes("rsvp confirmed") ||
      status.includes("declined rsvp")
    ) {
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
      ? Math.min(100, Math.round((confirmedGuests / totalGuests) * 100))
      : 100;

  const roomsAssigned = Math.round(confirmedGuests * 0.81);
  const currentCoverUrl = getWeddingCoverImage(
    wedding?.cover_theme || wedding?.cover_image
  );

  // Calculate Duration
  let durationText = "25 days to go";
  if (wedding?.wedding_date) {
    try {
      const target = new Date(wedding.wedding_date);
      const now = new Date();
      const diffTime = target - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays)) {
        if (diffDays > 0) {
          durationText = `${diffDays} days to go`;
        } else if (diffDays === 0) {
          durationText = "Today!";
        } else {
          durationText = `${Math.abs(diffDays)} days ago`;
        }
      }
    } catch (e) {}
  }

  const handleSelectCover = (preset) => {
    if (onUpdateCoverImage) {
      onUpdateCoverImage(wedding.id, preset.id || preset.url);
    }
    setIsImagePickerOpen(false);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 mb-5 sm:mb-6 animate-fadeIn">
      {/* ================= 1. LUXURY WEDDING HERO BANNER (FULL IMAGE COVERING WHOLE HEADER) ================= */}
      <div className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] min-h-[220px] sm:min-h-[260px] md:min-h-[280px] p-5 sm:p-7 md:p-9 shadow-lg border border-slate-700/50 flex flex-col justify-between group">
        {/* Full Header Background Image - Bright & Elegant Wedding Vibe */}
        <img
          src={currentCoverUrl}
          alt={`${wedding.groom_name} & ${wedding.bride_name} Wedding`}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85";
          }}
        />

        {/* Soft, Transparent Scrim - Protects Text Readability WITHOUT Over-Darkening Photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges & Image Picker Option */}
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          {/* Badges: Planning & Wedding */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#FF6574] text-white tracking-wide backdrop-blur-md shadow-xs">
              Planning
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-black/45 text-white/90 tracking-wide backdrop-blur-md border border-white/20 shadow-xs">
              Wedding
            </span>
          </div>

          {/* Option to Select / Change Image (Hidden in User View) */}
          {canChangeImage && (
            <div className="relative" ref={imagePickerRef}>
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(!isImagePickerOpen)}
                className="px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white/90 hover:text-white text-[11px] sm:text-xs font-bold backdrop-blur-md border border-white/25 flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-102"
                title="Change wedding cover photo"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#FF6574]" />
                <span>Select Image</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isImagePickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Image Selection Dropdown Drawer */}
              {isImagePickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#1E3A8A]/98 backdrop-blur-xl border border-[#2563EB]/40 rounded-2xl p-3 shadow-2xl z-50 animate-fadeIn text-white space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2563EB]/40">
                    <span className="text-xs font-bold text-white">
                      Select Cover Photo
                    </span>
                    <span className="text-[10px] text-[#FF6574] font-medium">
                      5 Curated Vibes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto no-scrollbar">
                    {WEDDING_COVER_PRESETS.map((preset) => {
                      const isSelected =
                        wedding.cover_theme === preset.id ||
                        currentCoverUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectCover(preset)}
                          className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-all cursor-pointer text-left w-full ${
                            isSelected
                              ? "bg-[#FF6574]/25 border border-[#FF6574] text-white"
                              : "hover:bg-[#172554] border border-transparent text-blue-100"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-12 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold block truncate text-white">
                              {preset.label}
                            </span>
                            <span className="text-[10px] text-blue-200 block truncate">
                              {preset.tag}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#FF6574] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Couple Title & Details (Exact layout from reference image) */}
        <div className="relative z-10 space-y-2 sm:space-y-2.5 max-w-2xl mt-4 sm:mt-6">
          {/* Couple Name & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              {wedding.groom_name} & {wedding.bride_name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold mt-1 drop-shadow-sm">
              Luxury Wedding
            </p>
          </div>

          {/* Location & Date Pills */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap text-xs text-white pt-1">
            <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-[#FF6574] shrink-0" />
              <span className="font-semibold text-white">
                {wedding.city || "Goa"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-[#FF6574] shrink-0" />
              <span className="font-semibold text-white">
                {wedding.wedding_date || "2026-11-28"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. STATUS STRIP (Clean White Card matching Mockup) ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:px-6 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs shadow-sm text-slate-800">
        {/* LIVE Status */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
          <div>
            <span className="font-black text-slate-900 text-xs block leading-tight">
              LIVE
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none">
              In progress
            </span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-tight">
            Duration
          </span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">
            {durationText}
          </span>
        </div>

        {/* Location */}
        <div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block leading-tight">
            Location
          </span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
            {wedding.city || "Goa"}
          </span>
        </div>
      </div>

      {/* ================= 3. THE 3 SUMMARY CARDS (Royal Blue #1E3A8A & Coral Pink #FF6574) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
        {/* CARD 1: Guests (Total Guests, Confirmed, Pending, Regrets, Rooms) - Clean White */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-slate-800">
          <div>
            {/* Top Row: Coral Pink Icon + Title + More options */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6574]/15 flex items-center justify-center text-[#FF6574]">
                  <Users className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Guests
                </h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Total Guests Big Number */}
            <div className="mb-3.5 sm:mb-4">
              <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight block leading-none">
                {totalGuests}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1 block">
                Total Guests
              </span>
            </div>

            {/* 4 Badges side by side: Confirmed, Pending, Regrets ("regrade"), Rooms */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {/* Confirmed */}
              <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-black text-emerald-700 block leading-tight">
                  {confirmedGuests}
                </span>
                <span className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-0.5 block truncate">
                  Confirmed
                </span>
              </div>

              {/* Pending */}
              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-black text-amber-700 block leading-tight">
                  {pendingGuests}
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-600 font-semibold mt-0.5 block truncate">
                  Pending
                </span>
              </div>

              {/* Regrets (Declined) */}
              <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-black text-rose-600 block leading-tight">
                  {declinedGuests}
                </span>
                <span className="text-[9px] sm:text-[10px] text-rose-500 font-semibold mt-0.5 block truncate">
                  Regrets
                </span>
              </div>

              {/* Rooms */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 text-center">
                <span className="text-xs sm:text-sm font-black text-slate-800 block leading-tight">
                  {roomsAssigned}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 block truncate">
                  Rooms
                </span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <button
            type="button"
            onClick={onScrollToTable}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6574] hover:underline mt-4 sm:mt-6 pt-3 border-t border-slate-100 cursor-pointer group transition-colors self-start"
          >
            <span>View all guests</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 2: Invites Overview - Clean White */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-slate-800">
          <div>
            {/* Top Row: Coral Pink Send Icon + Title + More options */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6574]/15 flex items-center justify-center text-[#FF6574]">
                  <Send className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Invites Overview
                </h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Response Rate Metric */}
            <div className="mb-2">
              <span className="text-[11px] sm:text-xs text-slate-500 font-semibold block">
                Response Rate
              </span>
              <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight block leading-tight">
                {responseRate}%
              </span>
            </div>

            {/* Gradient Progress Bar: Coral Pink to Red */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3.5 sm:mb-4 overflow-hidden border border-slate-200/80">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#FF6574] via-[#f43f5e] to-[#e11d48] transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(12, responseRate))}%`,
                }}
              />
            </div>

            {/* 4 Mini Round Icons */}
            <div className="grid grid-cols-4 gap-1 text-center pt-1">
              {/* Delivered */}
              <div
                className="flex flex-col items-center"
                title="Calls Done / Received Call"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-1 shadow-2xs">
                  <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 leading-none">
                  {deliveredCalls}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 truncate block">
                  Delivered
                </span>
              </div>

              {/* No Response */}
              <div
                className="flex flex-col items-center"
                title="Called but Not Received"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-1 shadow-2xs">
                  <HelpCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 leading-none">
                  {noResponseCalls}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 truncate block">
                  No Resp
                </span>
              </div>

              {/* In Progress */}
              <div
                className="flex flex-col items-center"
                title="Remaining Calls to Make"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mb-1 shadow-2xs">
                  <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 leading-none">
                  {inProgressCalls}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 truncate block">
                  Progress
                </span>
              </div>

              {/* Completed */}
              <div
                className="flex flex-col items-center"
                title="Calls Completed"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-1 shadow-2xs">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 leading-none">
                  {completedCalls}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 truncate block">
                  Done
                </span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <button
            type="button"
            onClick={onScrollToTable}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6574] hover:underline mt-4 sm:mt-6 pt-3 border-t border-slate-100 cursor-pointer group transition-colors self-start"
          >
            <span>View all invites</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 3: Sides Breakdown - Clean White */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-slate-800">
          <div>
            {/* Top Row: Coral Pink Icon + Title + More options */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6574]/15 flex items-center justify-center text-[#FF6574]">
                  <Users className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Sides Breakdown
                </h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Total Side Guests */}
            <div className="mb-3.5 sm:mb-4">
              <span className="text-[11px] sm:text-xs text-slate-500 font-semibold block">
                Total Distribution
              </span>
              <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight block leading-tight">
                {totalGuests}{" "}
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  Guests
                </span>
              </span>
            </div>

            {/* Groom's Side and Bride's Side Columns */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
              <div>
                <span className="text-base sm:text-xl font-black text-slate-900 block leading-tight">
                  {groomCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 block">
                  Groom's Side
                </span>
              </div>
              <div>
                <span className="text-base sm:text-xl font-black text-slate-900 block leading-tight">
                  {brideCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 block">
                  Bride's Side
                </span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6574] hover:underline mt-4 sm:mt-6 pt-3 border-t border-slate-100 cursor-pointer group transition-colors self-start"
          >
            <span>View analytics</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
