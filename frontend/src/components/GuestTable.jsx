import React from "react";
import {
  FileText,
  Edit3,
  Trash2,
  Eye,
  PlaneLanding,
  PlaneTakeoff,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Check,
  MapPin,
  Calendar,
  Plane,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const getAvatarTheme = (name = "") => {
  const char = (name.charAt(0) || "G").toUpperCase();
  const themes = [
    { bg: "bg-[#eaf9d9]", text: "text-[#4d7f1d]" },
    { bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
    { bg: "bg-[#e0e7ff]", text: "text-[#4338ca]" },
    { bg: "bg-[#fef3c7]", text: "text-[#b45309]" },
    { bg: "bg-[#fce7f3]", text: "text-[#be185d]" },
    { bg: "bg-[#e0f2fe]", text: "text-[#0369a1]" },
  ];
  const index = char.charCodeAt(0) % themes.length;
  return themes[index];
};

export default function GuestTable({
  guests = [],
  onEditGuest,
  onDeleteGuest,
  onViewGuest,
  onOpenCallLogs,
  onOpenQuickWhatsApp,
}) {
  const { isAdmin, isViewOnly } = useAuth();
  const showCallDesk = !isViewOnly;

  if (guests.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center my-4 shadow-2xs animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 animate-floatSlow">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">No guests found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try adjusting search filters, or click "+ Add Guest" to register new guests.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs my-3 sm:my-4 animate-fadeIn">
      {/* 1. Mobile Cards View (< md) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {guests.map((guest) => {
          const avatarTheme = getAvatarTheme(guest.guest_name);
          const rsvp = (guest.rsvp_status || "Pending").toLowerCase();
          const side = (guest.side || "Groom").toLowerCase();
          const callCount = Math.max(
            Number(guest.call_count) || 0,
            guest.last_call_summary ? 1 : 0
          );
          const hasArrival = Boolean(
            guest.arrival_date || guest.arrival_time || guest.arrival_flight_train_no || guest.arrival_location
          );
          const hasDeparture = Boolean(
            guest.departure_date || guest.departure_time || guest.departure_flight_train_no || guest.departure_location
          );

          return (
            <div key={guest.id} className="p-3.5 space-y-2.5 hover:bg-[#fcfdfc] transition-colors">
              {/* Header: Avatar, Name, Sr No, and RSVP badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl ${avatarTheme.bg} ${avatarTheme.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                  >
                    {(guest.guest_name || "G").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                        {guest.guest_name}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        #{guest.sr_no}
                      </span>
                    </div>

                    {/* Side & Phone */}
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      {side === "bride" ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                          👰 Bride
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/60">
                          🤵 Groom
                        </span>
                      )}

                      {guest.contact ? (
                        <a
                          href={`tel:${guest.contact}`}
                          className="text-[11px] text-slate-600 hover:text-emerald-700 font-mono font-medium truncate flex items-center gap-1"
                        >
                          <PhoneCall className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{guest.contact}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No phone</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RSVP Status Pill */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 shadow-2xs ${
                    rsvp === "confirmed"
                      ? "bg-[#dcfce7] text-[#166534] border border-[#86efac]"
                      : rsvp === "declined"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-[#fef9c3] text-[#854d0e] border border-[#fde047]"
                  }`}
                >
                  {rsvp === "confirmed" ? (
                    <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span className="capitalize">{guest.rsvp_status || "Pending"}</span>
                </span>
              </div>

              {/* Logistics Row (Arrival & Departure) */}
              {(hasArrival || hasDeparture) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                  {hasArrival && (
                    <div className="flex items-center gap-1.5 text-emerald-900 min-w-0">
                      <PlaneLanding className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        <strong>Arr:</strong> {guest.arrival_date || "TBD"} {guest.arrival_time ? `(${guest.arrival_time})` : ""} {guest.arrival_flight_train_no ? `• ${guest.arrival_flight_train_no}` : ""}
                      </span>
                    </div>
                  )}
                  {hasDeparture && (
                    <div className="flex items-center gap-1.5 text-purple-900 min-w-0">
                      <PlaneTakeoff className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">
                        <strong>Dep:</strong> {guest.departure_date || "TBD"} {guest.departure_time ? `(${guest.departure_time})` : ""} {guest.departure_flight_train_no ? `• ${guest.departure_flight_train_no}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Call Desk & Quick Actions Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
                {/* Left: Call Desk Checkpoints */}
                {showCallDesk ? (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => onOpenCallLogs && onOpenCallLogs(guest)}
                      title={`${callCount} calls completed`}
                    >
                      {callCount > 0 ? (
                        Array.from({ length: callCount }, (_, idx) => (
                          <div
                            key={idx}
                            className="min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[9px] font-bold bg-[#16a34a] text-white shadow-2xs gap-0.5"
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{idx + 1}</span>
                          </div>
                        ))
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-slate-200/80 text-slate-500">
                          0
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCallLogs && onOpenCallLogs(guest)}
                      className="bg-[#0f2922] hover:bg-[#163a30] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <PhoneCall className="w-2.5 h-2.5 text-[#84e030]" />
                      <span>{callCount > 0 ? "Notes" : "Log Call"}</span>
                    </button>
                  </div>
                ) : (
                  <div />
                )}

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewGuest(guest)}
                    title="View full details"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {!isViewOnly && guest.contact && (
                    <button
                      type="button"
                      onClick={() => onOpenQuickWhatsApp && onOpenQuickWhatsApp(guest)}
                      title="Send WhatsApp"
                      className="p-1.5 rounded-lg text-[#128c7e] hover:bg-[#25d366]/15 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}

                  {!isViewOnly && (
                    <button
                      type="button"
                      onClick={() => onEditGuest(guest)}
                      title="Edit guest"
                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {!isViewOnly && isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDeleteGuest(guest)}
                      title="Delete guest"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/80 bg-[#f8fafc] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-3.5 w-12 text-center">Sr #</th>
              <th className="py-3.5 px-4 min-w-[180px]">Guest & Contact</th>
              <th className="py-3.5 px-3 w-28">Side</th>
              <th className="py-3.5 px-3 w-28">RSVP</th>
              <th className="py-3.5 px-4 min-w-[210px] bg-[#f2faf4]/80 text-[#165a2b]">
                <div className="flex items-center gap-1.5">
                  <PlaneLanding className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Arrival Logistics</span>
                </div>
              </th>
              <th className="py-3.5 px-4 min-w-[210px] bg-[#faf5ff]/80 text-[#581c87]">
                <div className="flex items-center gap-1.5">
                  <PlaneTakeoff className="w-3.5 h-3.5 text-purple-600" />
                  <span>Departure Logistics</span>
                </div>
              </th>
              {showCallDesk && (
                <th className="py-3.5 px-4 bg-[#f4faf4]/80 text-[#1c4d25] min-w-[190px]">
                  <div className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-[#16a34a]" />
                    <span>Call Desk</span>
                  </div>
                </th>
              )}
              <th className="py-3.5 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {guests.map((guest) => {
              const avatarTheme = getAvatarTheme(guest.guest_name);
              const rsvp = (guest.rsvp_status || "Pending").toLowerCase();
              const side = (guest.side || "Groom").toLowerCase();
              const callCount = Math.max(
                Number(guest.call_count) || 0,
                guest.last_call_summary ? 1 : 0
              );

              const hasArrival = Boolean(
                guest.arrival_date ||
                guest.arrival_time ||
                guest.arrival_flight_train_no ||
                guest.arrival_location
              );

              const hasDeparture = Boolean(
                guest.departure_date ||
                guest.departure_time ||
                guest.departure_flight_train_no ||
                guest.departure_location
              );

              return (
                <tr
                  key={guest.id}
                  className="hover:bg-[#f6fcf8] transition-colors duration-150 group"
                >
                  {/* Sr No */}
                  <td className="py-3.5 px-3.5 text-center font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                    {guest.sr_no}
                  </td>

                  {/* Guest Name & Phone */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl ${avatarTheme.bg} ${avatarTheme.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                      >
                        {(guest.guest_name || "G").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 leading-tight group-hover:text-emerald-950 transition-colors truncate">
                          {guest.guest_name}
                        </p>
                        {guest.contact ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={`tel:${guest.contact}`}
                              className="text-[11px] text-slate-500 hover:text-emerald-700 font-mono inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{guest.contact}</span>
                            </a>
                            {!isViewOnly && (
                              <button
                                type="button"
                                onClick={() => onOpenQuickWhatsApp && onOpenQuickWhatsApp(guest)}
                                title="Send WhatsApp Message"
                                className="text-[#25d366] hover:text-[#128c7e] transition-transform hover:scale-115 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">No phone</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Side */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] shadow-2xs transition-transform group-hover:scale-102 ${
                        side === "bride"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-sky-50 text-sky-800 border border-sky-200"
                      }`}
                    >
                      {side === "bride" ? "👰 Bride" : "🤵 Groom"}
                    </span>
                  </td>

                  {/* RSVP */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] shadow-2xs ${
                        rsvp === "confirmed"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : rsvp === "declined" || rsvp.includes("regret") || rsvp.includes("not")
                          ? "bg-rose-100 text-rose-900 border border-rose-200"
                          : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}
                    >
                      {rsvp === "confirmed"
                        ? "✓ Confirmed"
                        : rsvp === "declined" || rsvp.includes("regret") || rsvp.includes("not")
                        ? "✕ Regrets"
                        : "⏳ Pending"}
                    </span>
                  </td>

                  {/* DIRECT ARRIVAL LOGISTICS */}
                  <td className="py-3 px-4 bg-[#fbfdfb] group-hover:bg-[#f2faf4]/80 transition-colors">
                    {hasArrival ? (
                      <div className="space-y-1">
                        {/* Flight / Train Number */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {guest.arrival_flight_train_no ? (
                            <span className="text-[10px] font-bold font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <span>✈</span>
                              <span>{guest.arrival_flight_train_no}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              🛬 Scheduled
                            </span>
                          )}

                          {guest.arrival_time && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              ⏰ {guest.arrival_time}
                            </span>
                          )}
                        </div>

                        {/* Date */}
                        {guest.arrival_date && (
                          <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{guest.arrival_date}</span>
                          </p>
                        )}

                        {/* Location */}
                        {guest.arrival_location && (
                          <p
                            title={guest.arrival_location}
                            className="text-[10px] text-slate-600 flex items-center gap-1 line-clamp-1"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{guest.arrival_location}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                        <span>— No arrival info</span>
                      </div>
                    )}
                  </td>

                  {/* DIRECT DEPARTURE LOGISTICS */}
                  <td className="py-3 px-4 bg-[#fdfcff] group-hover:bg-[#f6f2fc]/80 transition-colors">
                    {hasDeparture ? (
                      <div className="space-y-1">
                        {/* Flight / Train Number */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {guest.departure_flight_train_no ? (
                            <span className="text-[10px] font-bold font-mono bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                              <span>🛫</span>
                              <span>{guest.departure_flight_train_no}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              🛫 Scheduled
                            </span>
                          )}

                          {guest.departure_time && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              ⏰ {guest.departure_time}
                            </span>
                          )}
                        </div>

                        {/* Date */}
                        {guest.departure_date && (
                          <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{guest.departure_date}</span>
                          </p>
                        )}

                        {/* Location */}
                        {guest.departure_location && (
                          <p
                            title={guest.departure_location}
                            className="text-[10px] text-slate-600 flex items-center gap-1 line-clamp-1"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{guest.departure_location}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                        <span>— No departure info</span>
                      </div>
                    )}
                  </td>

                  {/* Call Center Checkpoint Column (Admin & Call Center only) */}
                  {showCallDesk && (
                    <td className="py-3.5 px-4 bg-[#fafdfa]/70 group-hover:bg-[#f2faf4] transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Visual Call Checkpoint Indicator */}
                        <div
                          className="flex items-center gap-1 flex-wrap cursor-pointer"
                          onClick={() => onOpenCallLogs && onOpenCallLogs(guest)}
                          title={`${callCount} call${callCount === 1 ? "" : "s"} logged - click to view/add`}
                        >
                          {callCount > 0 ? (
                            Array.from({ length: callCount }, (_, idx) => (
                              <div
                                key={idx}
                                title={`Call ${idx + 1} completed`}
                                className="min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[9px] font-bold bg-[#16a34a] text-white shadow-2xs scale-105 transition-all duration-300 gap-0.5"
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>{idx + 1}</span>
                              </div>
                            ))
                          ) : (
                            <div
                              title="No calls completed yet (0)"
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-slate-200/80 text-slate-500 hover:bg-slate-300 transition-colors"
                            >
                              0
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenCallLogs && onOpenCallLogs(guest)}
                          className="bg-[#0f2922] hover:bg-[#163a30] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer shadow-2xs btn-interactive"
                        >
                          <PhoneCall className="w-2.5 h-2.5 text-[#84e030]" />
                          <span>{callCount > 0 ? "Notes" : "Log Call"}</span>
                        </button>
                      </div>

                      {guest.last_call_summary && (
                        <p
                          title={guest.last_call_summary}
                          className="text-[10px] text-slate-500 line-clamp-1 italic mt-1.5 max-w-[200px]"
                        >
                          "{guest.last_call_summary}"
                        </p>
                      )}
                    </td>
                  )}

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewGuest(guest)}
                        title="View full details"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!isViewOnly && guest.contact && (
                        <button
                          type="button"
                          onClick={() => onOpenQuickWhatsApp && onOpenQuickWhatsApp(guest)}
                          title="Draft & Send WhatsApp"
                          className="p-1.5 rounded-xl text-[#128c7e] hover:text-[#0b6358] hover:bg-[#25d366]/15 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!isViewOnly && (
                        <button
                          type="button"
                          onClick={() => onEditGuest(guest)}
                          title="Edit guest & logistics"
                          className="p-1.5 rounded-xl text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!isViewOnly && isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteGuest(guest)}
                          title="Delete guest"
                          className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

