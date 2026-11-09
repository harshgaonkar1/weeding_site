import React, { useRef, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  ArrowRight,
  Edit3,
  Trash2,
  Sparkles,
  CheckCircle2,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";
import { animateFloat } from "../utils/animations";
import { getWeddingCoverImage } from "../utils/weddingThemes";

export default function WeddingCard({
  wedding,
  onSelect,
  onEdit,
  onDelete,
  onViewCredentials,
  onOpenGoogleSheet,
}) {
  const themeStyles = {
    emerald: {
      gradient: "from-[#14213D] via-[#1c2d52] to-[#0c1527]",
      accent: "bg-[#F4EDE0] text-[#14213D]",
      border: "border-[#E5DAC8]/40",
      lightBg: "bg-[#FAF7F2]",
      glow: "rgba(255, 107, 91, 0.25)",
    },
    rose: {
      gradient: "from-[#14213D] via-[#24355a] to-[#0c1527]",
      accent: "bg-[#FF6B5B] text-white",
      border: "border-slate-200",
      lightBg: "bg-[#FAF7F2]",
      glow: "rgba(255, 107, 91, 0.25)",
    },
    purple: {
      gradient: "from-purple-900 via-indigo-950 to-slate-950",
      accent: "bg-purple-200 text-purple-950",
      border: "border-purple-100",
      lightBg: "bg-[#fbf7ff]",
      glow: "rgba(147, 51, 234, 0.2)",
    },
    amber: {
      gradient: "from-amber-700 via-orange-900 to-slate-900",
      accent: "bg-amber-200 text-amber-950",
      border: "border-amber-100",
      lightBg: "bg-[#fffbeb]",
      glow: "rgba(217, 119, 6, 0.2)",
    },
  };

  const theme = themeStyles[wedding.cover_theme] || themeStyles.emerald;
  const totalGuests = Number(wedding.total_guests) || 0;
  const confirmedGuests = Number(wedding.confirmed_guests) || 0;
  const brideGuests = Number(wedding.bride_guests) || 0;
  const groomGuests = Number(wedding.groom_guests) || 0;
  const rsvpPercentage = totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0;

  const orbRef = useRef(null);
  useEffect(() => {
    if (orbRef.current) {
      const tween = animateFloat(orbRef.current, 8, 3.5);
      return () => tween?.kill();
    }
  }, []);

  const coverImage = getWeddingCoverImage(wedding.cover_theme || wedding.cover_image);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 hover:border-[#FF6574] hover:shadow-xl card-hover-lift flex flex-col overflow-hidden group relative text-slate-800 shadow-sm transition-all">
      {/* Card Header Cover - Dark elegant box with scrim (matches reference image) */}
      <div className="p-5 sm:p-6 text-white relative overflow-hidden min-h-[160px] flex flex-col justify-between bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#172554]">
        {/* Full Image */}
        <img
          src={coverImage}
          alt={`${wedding.groom_name} & ${wedding.bride_name}`}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-60 mix-blend-overlay"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* Soft, Transparent Scrim to Keep Text Crisp */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 pointer-events-none" />

        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold border border-white/20 shadow-xs">
            <Heart className="w-3 h-3 fill-[#FF6574] text-[#FF6574] animate-pulse" />
            <span>Marriage Event</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenGoogleSheet && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGoogleSheet(wedding);
                }}
                className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Live Google Sheet Two-Way Sync"
              >
                <FileSpreadsheet className="w-3 h-3 text-[#FF6574]" />
                <span>Sheet</span>
              </button>
            )}

            {onViewCredentials && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewCredentials(wedding);
                }}
                className="px-2.5 py-0.5 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-amber-200 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title="View & Share Client Login Credentials"
              >
                <KeyRound className="w-3 h-3 text-amber-300" />
                <span>Access</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(wedding);
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Edit Wedding Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(wedding);
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Delete Wedding"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bride & Groom Names */}
        <div className="relative z-10">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap drop-shadow-xs">
            <span className="group-hover:text-blue-100 transition-colors">{wedding.groom_name}</span>
            <span className="text-[#FF6574] text-lg font-serif italic">&</span>
            <span className="group-hover:text-white transition-colors">{wedding.bride_name}</span>
          </h3>
          <p className="text-xs text-white/70 mt-1 line-clamp-1 font-normal">
            {wedding.notes || "Grand Wedding Celebrations & Travel Directory"}
          </p>
        </div>
      </div>

      {/* Card Body - Crisp White matching screenshot */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white text-slate-800">
        {/* Event Details */}
        <div className="space-y-2 text-xs">
          {/* Date */}
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-200/70">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span>{wedding.wedding_date || "Wedding Date TBD"}</span>
          </div>

          {/* Venue & City */}
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200/70">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              {wedding.venue ? `${wedding.venue}, ` : ""}
              {wedding.city || "Venue specified in directory"}
            </span>
          </div>
        </div>

        {/* Guest Distribution & Stats */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 transition-colors">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Guest Capacity</span>
            <span className="font-extrabold text-slate-800">
              {totalGuests} Registered
            </span>
          </div>

          {/* Bride vs Groom Breakdown Pill (Matches Screenshot) */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-xl text-rose-600 hover:scale-102 transition-transform">
              <span>👰 Bride:</span>
              <span className="font-extrabold">{brideGuests}</span>
            </div>
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-xl text-sky-700 hover:scale-102 transition-transform">
              <span>🤵 Groom:</span>
              <span className="font-extrabold">{groomGuests}</span>
            </div>
          </div>

          {/* RSVP Progress bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-medium">RSVP Confirmed</span>
              <span className="font-bold text-emerald-600">{rsvpPercentage}% ({confirmedGuests})</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(rsvpPercentage, 3)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action: Open Directory (Coral Pink Button matching screenshot) */}
        <button
          onClick={() => onSelect(wedding)}
          className="w-full bg-[#FF6574] hover:bg-[#e05463] active:scale-98 text-white py-2.5 sm:py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group/btn btn-interactive"
        >
          <span>Manage Guest Directory</span>
          <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
