import React from "react";
import {
  X,
  Calendar,
  MapPin,
  Plane,
  FileText,
  CheckCircle2,
  MessageSquare,
  Phone,
  User,
  PlaneLanding,
  PlaneTakeoff,
  Download,
  Heart,
  PhoneCall,
  Sparkles,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function GuestDetailsDrawer({
  guest,
  isOpen,
  onClose,
  onEdit,
  onOpenCallLogs,
  onOpenQuickWhatsApp,
}) {
  const { isViewOnly } = useAuth();
  if (!isOpen || !guest) return null;

  const isConfirmed = (guest.rsvp_status || "").toLowerCase() === "confirmed";
  const isIdReceived = (guest.id_card_received || "").toLowerCase() === "yes";
  const isImage = guest.id_card_copy && guest.id_card_copy.startsWith("data:image");
  const guestSide = (guest.side || "Groom").toLowerCase();
  const callCount = Math.max(
    Number(guest.call_count) || 0,
    guest.last_call_summary ? 1 : 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
              {(guest.guest_name || "G").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{guest.guest_name}</h3>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 shrink-0">#{guest.sr_no}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                  <a href={`tel:${guest.contact}`} className="hover:underline font-bold text-slate-700 font-mono truncate">
                    {guest.contact || "No contact"}
                  </a>
                </p>
                {!isViewOnly && guest.contact && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenQuickWhatsApp) onOpenQuickWhatsApp(guest);
                    }}
                    title="Send WhatsApp"
                    className="text-[#25d366] hover:text-[#128c7e] transition-transform hover:scale-115 cursor-pointer shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto text-xs">
          {/* Status Badges Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Side Badge */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Wedding Side
              </span>
              {guestSide === "bride" ? (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">
                  👰 Bride's Side
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold">
                  🤵 Groom's Side
                </span>
              )}
            </div>

            {/* RSVP Status */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                RSVP Status
              </span>
              {isConfirmed ? (
                <span className="inline-flex items-center gap-1 bg-[#d7f7e2] text-[#15803d] px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Confirmed
                </span>
              ) : (guest.rsvp_status || "").toLowerCase() === "declined" || (guest.rsvp_status || "").toLowerCase().includes("regret") ? (
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-200 px-3 py-1 rounded-full text-xs font-semibold">
                  ✕ Regrets (Not Coming)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-[#fef3c7] text-[#b45309] px-3 py-1 rounded-full text-xs font-semibold">
                  ⏳ {guest.rsvp_status || "Pending"}
                </span>
              )}
            </div>

            {/* ID Card Status */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                ID Card Status
              </span>
              {isIdReceived ? (
                <span className="inline-flex items-center gap-1 bg-[#eaf9bb] text-[#4d7c0f] px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Received
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                  Pending (No)
                </span>
              )}
            </div>
          </div>

          {/* Call Center Checkpoint Progress Card (Admin & Call Center only) */}
          {!isViewOnly && (
            <div className="bg-[#f4faf4] border border-[#c3eeb0] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#1c4d25] font-bold text-xs uppercase tracking-wider">
                  <PhoneCall className="w-4 h-4 text-[#16a34a]" />
                  <span>Call Center Checkpoints</span>
                </div>
                <span className="text-[10px] font-bold bg-[#0f2922] text-[#84e030] px-2.5 py-0.5 rounded-full">
                  {callCount > 0 ? `✓ ${callCount} Call${callCount === 1 ? "" : "s"} Completed` : "0 Calls Done"}
                </span>
              </div>

              {callCount > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Array.from({ length: callCount }, (_, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-xl text-xs font-bold"
                    >
                      <div className="w-4 h-4 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[9px] shadow-2xs">
                        ✓
                      </div>
                      <span>Call #{idx + 1} Done</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-400 text-xs text-center italic">
                  No calls logged yet
                </div>
              )}

              {guest.last_call_summary && (
                <div className="bg-white border border-emerald-200 p-2.5 rounded-xl text-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Latest Call Summary:
                  </span>
                  <p className="text-xs italic">"{guest.last_call_summary}"</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCallLogs) onOpenCallLogs(guest);
                }}
                className="w-full bg-[#0f2922] hover:bg-[#163a30] text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#84e030]" />
                <span>Open Call Center Log & Add Notes</span>
              </button>
            </div>
          )}

          {/* Arrival Logistics */}
          <div className="bg-[#f2fcf5] border border-emerald-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <PlaneLanding className="w-4 h-4 text-emerald-600" />
              <span>Arrival Logistics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Date & Time</span>
                <span className="font-semibold text-slate-800">
                  {guest.arrival_date || "Not set"} {guest.arrival_time && `• ${guest.arrival_time}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Flight / Train No</span>
                <span className="font-bold text-emerald-700">
                  {guest.arrival_flight_train_no || "Not set"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">Arrival Location</span>
                <span className="text-slate-600">
                  {guest.arrival_location || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Departure Logistics */}
          <div className="bg-[#f8f6ff] border border-purple-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs uppercase tracking-wider">
              <PlaneTakeoff className="w-4 h-4 text-purple-600" />
              <span>Departure Logistics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Date & Time</span>
                <span className="font-semibold text-slate-800">
                  {guest.departure_date || "Not set"} {guest.departure_time && `• ${guest.departure_time}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Flight / Train No</span>
                <span className="font-bold text-purple-700">
                  {guest.departure_flight_train_no || "Not set"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">Departure Location</span>
                <span className="text-slate-600">
                  {guest.departure_location || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: ID Card Copy */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>ID Card Copy / Document Record</span>
            </div>
            {guest.id_card_copy ? (
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {isImage
                          ? "ID_Card_Photo_Scan.png"
                          : guest.id_card_copy.startsWith("data:")
                          ? "Government_ID_Document.pdf"
                          : guest.id_card_copy}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Attached & Verified Document
                      </p>
                    </div>
                  </div>

                  {guest.id_card_copy.startsWith("data:") && (
                    <a
                      href={guest.id_card_copy}
                      download={`ID_Card_${guest.guest_name || "Guest"}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>

                {isImage && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100 flex items-center justify-center">
                    <img
                      src={guest.id_card_copy}
                      alt="ID Card Document"
                      className="w-full h-full object-contain max-h-48"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px]">
                No ID card file attached for this guest.
              </p>
            )}
          </div>

          {/* Section: Special Request */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Special Request & Dietary Notes</span>
            </div>
            {guest.special_request ? (
              <p className="text-slate-800 leading-relaxed bg-white/80 border border-amber-200/60 rounded-xl p-3">
                {guest.special_request}
              </p>
            ) : (
              <p className="text-slate-400 italic text-[11px]">
                No special requests or dietary constraints specified.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/70 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          {!isViewOnly && guest.contact && (
            <button
              onClick={() => {
                onClose();
                if (onOpenQuickWhatsApp) onOpenQuickWhatsApp(guest);
              }}
              className="bg-[#25d366] hover:bg-[#20bd5a] text-slate-950 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer btn-interactive"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Message</span>
            </button>
          )}
          {!isViewOnly && (
            <button
              onClick={() => {
                onClose();
                onEdit(guest);
              }}
              className="bg-[#0f2922] hover:bg-[#163a30] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              Edit Guest Logistics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
