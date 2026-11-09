import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  Users,
  Phone,
  CheckCheck,
  AlertCircle,
  Plus,
  ChevronDown,
} from "lucide-react";
import { normalizePhoneNumber } from "../utils/whatsappUtils";
import { useAuth } from "../context/AuthContext";

/**
 * WhatsAppOverviewView
 * Displays how many messages so far done for the wedding,
 * outreach delivery rates, and guest messaging status logs.
 */
export default function WhatsAppOverviewView({
  guests = [],
  wedding = null,
  weddings = [],
  onSelectWedding,
  onBack,
  onOpenWhatsAppModal,
}) {
  const { canSendWhatsApp, isViewOnly, isMarriageClient } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'done' | 'opened' | 'pending'

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
              Choose a marriage to view its WhatsApp messaging outreach overview.
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
                onClick={() => onSelectWedding && onSelectWedding(w, "whatsapp")}
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

  // Load message statuses persisted in localStorage for this wedding
  const waStatuses = useMemo(() => {
    try {
      const key = `wedding_wa_status_${wedding?.id || "default"}`;
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (e) {
      return {};
    }
  }, [wedding?.id]);

  // Normalize guest list with WhatsApp readiness & status
  const processedList = useMemo(() => {
    return guests.map((g) => {
      const rawContact = g.contact || "";
      const phone = normalizePhoneNumber(rawContact);
      const hasPhone = Boolean(phone);
      const status = waStatuses[g.id] || "NOT SENT"; // "SENT" | "OPENED" | "NOT SENT"
      const isDone = status === "SENT" || status === "OPENED";

      return {
        ...g,
        phone,
        hasPhone,
        status,
        isDone,
      };
    });
  }, [guests, waStatuses]);

  // Filter by search & status
  const filteredGuests = useMemo(() => {
    return processedList.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const name = (g.guest_name || "").toLowerCase();
      const phone = (g.phone || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || phone.includes(q);
      if (!matchesSearch) return false;

      if (filterStatus === "done" && !g.isDone) return false;
      if (filterStatus === "pending" && g.isDone) return false;
      if (filterStatus === "no_phone" && g.hasPhone) return false;

      return true;
    });
  }, [processedList, searchQuery, filterStatus]);

  // ================= METRICS: HOW MANY MESSAGES SO FAR DONE =================
  const totalGuests = guests.length;
  const totalWithPhone = processedList.filter((g) => g.hasPhone).length;
  const messagesDoneCount = processedList.filter((g) => g.isDone).length;
  const messagesSentCount = processedList.filter((g) => g.status === "SENT").length;
  const messagesOpenedCount = processedList.filter((g) => g.status === "OPENED").length;
  const messagesPendingCount = totalWithPhone - messagesDoneCount;

  const donePercentage =
    totalWithPhone > 0 ? Math.round((messagesDoneCount / totalWithPhone) * 100) : 0;

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-5 animate-fadeIn min-w-0 max-w-7xl mx-auto">
      {/* 1. Header Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 mb-1.5 cursor-pointer transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-emerald-600" />
              <span>Back to Overview</span>
            </button>
          )}

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp Outreach Desk</span>
            </span>
            {weddings && weddings.length > 1 && onSelectWedding ? (
              <div className="relative inline-flex items-center">
                <select
                  value={wedding?.id || ""}
                  onChange={(e) => {
                    const match = weddings.find((w) => w.id === e.target.value);
                    if (match) onSelectWedding(match, "whatsapp");
                  }}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-none rounded-xl px-2.5 py-1 pr-6 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none appearance-none"
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
            <span>WhatsApp Messages Overview</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {messagesDoneCount} Messages Done
            </span>
          </h1>
        </div>

        {canSendWhatsApp && onOpenWhatsAppModal ? (
          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#25d366] hover:bg-[#1ebd5a] active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ Compose WhatsApp</span>
          </button>
        ) : isViewOnly ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold self-start sm:self-auto border border-slate-200 shadow-2xs">
            <span>Client View (Read Only)</span>
          </span>
        ) : null}
      </div>

      {/* 2. HERO METRIC CARD: EXACTLY HOW MANY MESSAGES DONE */}
      <div className="bg-gradient-to-br from-[#0c1e14] via-[#0f2e1d] to-[#0a1810] text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-emerald-900/60 shadow-lg relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#25d366]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Outreach Progress So Far
              </span>
              <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
                <span className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans">
                  {messagesDoneCount}
                </span>
                <span className="text-base sm:text-lg font-bold text-emerald-300">
                  Messages Done so far
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {messagesDoneCount} of {totalWithPhone} guests with phone numbers contacted. ({donePercentage}% outreach completed)
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white">{donePercentage}%</span>
                <span className="text-[10px] text-emerald-400 block font-semibold">Done Rate</span>
              </div>
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[#25d366] shrink-0">
                <CheckCheck className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2]" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 sm:h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#25d366] to-teal-300 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(donePercentage, 4))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Sub-metrics 4-Card Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Messages Done */}
        <div className="bg-white border border-emerald-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 block">Messages Done</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
            {messagesDoneCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Dispatched via WhatsApp</span>
        </div>

        {/* Opened / In Progress */}
        <div className="bg-white border border-blue-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 block">Opened / In Chat</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1 block">
            {messagesOpenedCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Conversations launched</span>
        </div>

        {/* Pending to Send */}
        <div className="bg-white border border-amber-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 block">Pending to Send</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
            {messagesPendingCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Waiting to be messaged</span>
        </div>

        {/* Total Valid Contacts */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Valid Phone Contacts</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 block">
            {totalWithPhone}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Out of {totalGuests} guests</span>
        </div>
      </div>

      {/* 4. Guest Outreach Directory: Mobile Cards + Desktop Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Guest Message Log Directory ({filteredGuests.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review guests messaged vs pending for this celebration
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest or phone..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Guests</option>
              <option value="done">✓ Messages Done ({messagesDoneCount})</option>
              <option value="pending">⏳ Pending to Send ({messagesPendingCount})</option>
            </select>
          </div>
        </div>

        {/* Mobile View: Guest Message Cards (< md) */}
        <div className="md:hidden space-y-2.5">
          {filteredGuests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No guests found matching your search.
            </div>
          ) : (
            filteredGuests.map((guest) => {
              return (
                <div
                  key={guest.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">
                          {guest.guest_name}
                        </span>
                        {(guest.side || "").toLowerCase().includes("bride") ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                            👰 Bride
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                            🤵 Groom
                          </span>
                        )}
                      </div>

                      {guest.phone ? (
                        <a
                          href={`tel:${guest.phone}`}
                          className="font-mono text-xs text-slate-600 hover:text-emerald-600 font-semibold inline-flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>+{guest.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">No valid phone</span>
                      )}
                    </div>

                    <div>
                      {guest.isDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {canSendWhatsApp && guest.hasPhone && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppModal && onOpenWhatsAppModal(guest)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{guest.isDone ? "Resend Message" : "Send WhatsApp"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Outreach Table (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">WhatsApp Contact</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">Message Status</th>
                {canSendWhatsApp && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={canSendWhatsApp ? 5 : 4} className="py-8 text-center text-slate-400">
                    No guests found matching your search.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  return (
                    <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {guest.guest_name}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        {guest.phone ? (
                          <span className="font-mono text-xs text-slate-700 font-semibold inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>+{guest.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No valid phone</span>
                        )}
                      </td>

                      {/* Side */}
                      <td className="py-3 px-4">
                        {(guest.side || "").toLowerCase().includes("bride") ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                            👰 Bride
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            🤵 Groom
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Status */}
                      <td className="py-3 px-4">
                        {guest.isDone ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Message Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Action (Only visible for Admin & Call Center) */}
                      {canSendWhatsApp && (
                        <td className="py-3 px-4 text-right">
                          {guest.hasPhone ? (
                            <button
                              type="button"
                              onClick={() => onOpenWhatsAppModal && onOpenWhatsAppModal(guest)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{guest.isDone ? "Resend" : "Send WhatsApp"}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-300 italic">Missing phone</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

