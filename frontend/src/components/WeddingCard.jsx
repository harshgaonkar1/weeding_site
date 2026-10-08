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
      gradient: "from-emerald-800 via-teal-900 to-slate-900",
      accent: "bg-[#d4f952] text-[#123118]",
      border: "border-emerald-100",
      lightBg: "bg-[#f2faf4]",
      glow: "rgba(22, 163, 74, 0.2)",
    },
    rose: {
      gradient: "from-rose-700 via-pink-900 to-slate-900",
      accent: "bg-rose-200 text-rose-950",
      border: "border-rose-100",
      lightBg: "bg-[#fff1f2]",
      glow: "rgba(225, 29, 72, 0.2)",
    },
    purple: {
      gradient: "from-purple-800 via-indigo-900 to-slate-900",
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 card-hover-lift flex flex-col overflow-hidden group relative">
      {/* Card Header Cover */}
      <div className={`p-6 bg-gradient-to-br ${theme.gradient} text-white relative overflow-hidden`}>
        {/* Ambient floating glows */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none animate-floatSlow" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#84e030]/15 rounded-full blur-xl pointer-events-none" />
        
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 shadow-xs">
            <Heart className="w-3 h-3 fill-rose-300 text-rose-300 animate-pulse" />
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
                className="px-2.5 py-1 rounded-full bg-[#84e030]/25 hover:bg-[#84e030]/40 border border-[#84e030]/50 text-white transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Live Google Sheet Two-Way Sync"
              >
                <FileSpreadsheet className="w-3 h-3 text-[#84e030]" />
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
                className="px-2.5 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-amber-200 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
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
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
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
                className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
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
            <span className="group-hover:text-emerald-100 transition-colors">{wedding.groom_name}</span>
            <span className="text-[#84e030] text-lg font-serif italic animate-pulse">&</span>
            <span className="group-hover:text-emerald-100 transition-colors">{wedding.bride_name}</span>
          </h3>
          <p className="text-xs text-white/80 mt-1 line-clamp-1 font-normal">
            {wedding.notes || "Grand Wedding Celebrations & Travel Directory"}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5 bg-white">
        {/* Event Details */}
        <div className="space-y-2.5 text-xs text-slate-600">
          {/* Date */}
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>{wedding.wedding_date || "Wedding Date TBD"}</span>
          </div>

          {/* Venue & City */}
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              {wedding.venue ? `${wedding.venue}, ` : ""}
              {wedding.city || "Venue specified in directory"}
            </span>
          </div>
        </div>

        {/* Guest Distribution & Stats */}
        <div className="bg-[#f8fafc] group-hover:bg-[#f2faf4]/60 border border-slate-200/80 rounded-2xl p-3.5 space-y-3 transition-colors">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Guest Capacity</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 shadow-2xs">
              {totalGuests} Registered
            </span>
          </div>

          {/* Bride vs Groom Breakdown Pill */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100/80 px-2.5 py-1 rounded-xl text-rose-800 hover:scale-102 transition-transform">
              <span>👰 Bride:</span>
              <span className="font-bold">{brideGuests}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100/80 px-2.5 py-1 rounded-xl text-sky-800 hover:scale-102 transition-transform">
              <span>🤵 Groom:</span>
              <span className="font-bold">{groomGuests}</span>
            </div>
          </div>

          {/* RSVP Progress bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-medium">RSVP Confirmed</span>
              <span className="font-bold text-emerald-700">{rsvpPercentage}% ({confirmedGuests})</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-[#84e030] h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${Math.max(rsvpPercentage, 3)}%` }}
              >
                <div className="absolute inset-0 shimmer-effect" />
              </div>
            </div>
          </div>
        </div>

        {/* Action: Open Directory */}
        <button
          onClick={() => onSelect(wedding)}
          className="w-full bg-[#0f2922] hover:bg-[#163a30] text-white py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer group/btn btn-interactive"
        >
          <span>Manage Guest Directory</span>
          <ArrowRight className="w-4 h-4 text-[#84e030] group-hover/btn:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
