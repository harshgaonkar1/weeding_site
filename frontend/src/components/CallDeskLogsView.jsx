import React, { useState, useMemo } from "react";
import {
  PhoneCall,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  PhoneForwarded,
  Search,
  Filter,
  User,
  MessageSquare,
  Sparkles,
  PhoneOutgoing,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

/**
 * CallDeskLogsView
 * Strictly displays ONLY details of the call logs to the guest.
 * Excludes all non-call guest logistics (flights, trains, luggage, hampers, ID cards).
 */
export default function CallDeskLogsView({
  guests = [],
  wedding = null,
  weddings = [],
  onSelectWedding,
  onBack,
  onOpenCallLogModal,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [attemptFilter, setAttemptFilter] = useState("all");

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
              Choose a marriage to view its call desk logs and records.
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
                onClick={() => onSelectWedding && onSelectWedding(w, "call_logs")}
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

  // Filtered list strictly focused on call logs
  const filteredList = useMemo(() => {
    return guests.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const name = (g.guest_name || "").toLowerCase();
      const phone = (g.contact || "").toLowerCase();
      const notes = (g.last_call_summary || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || phone.includes(q) || notes.includes(q);
      if (!matchesSearch) return false;

      const status = (g.call_status || "Not Called").toLowerCase();
      if (outcomeFilter === "connected") {
        if (!status.includes("connected") && !status.includes("spoke") && !status.includes("confirmed")) {
          return false;
        }
      } else if (outcomeFilter === "no_answer") {
        if (!status.includes("no answer") && !status.includes("busy") && !status.includes("ringing") && !status.includes("missed")) {
          return false;
        }
      } else if (outcomeFilter === "callback") {
        if (!status.includes("callback")) return false;
      } else if (outcomeFilter === "not_called") {
        const count = Number(g.call_count) || 0;
        if (count > 0 && status !== "not called") return false;
      }

      const count = Number(g.call_count) || 0;
      if (attemptFilter === "0" && count !== 0) return false;
      if (attemptFilter === "1" && count !== 1) return false;
      if (attemptFilter === "2" && count !== 2) return false;
      if (attemptFilter === "3+" && count < 3) return false;

      return true;
    });
  }, [guests, searchQuery, outcomeFilter, attemptFilter]);

  // Overall Call Metrics
  const totalCallsAttempted = useMemo(
    () => guests.reduce((acc, g) => acc + (Number(g.call_count) || 0), 0),
    [guests]
  );

  const connectedGuests = useMemo(
    () =>
      guests.filter((g) => {
        const s = (g.call_status || "").toLowerCase();
        return s.includes("connected") || s.includes("spoke") || s.includes("confirmed");
      }).length,
    [guests]
  );

  const noAnswerGuests = useMemo(
    () =>
      guests.filter((g) => {
        const s = (g.call_status || "").toLowerCase();
        return s.includes("no answer") || s.includes("busy") || s.includes("ringing") || s.includes("missed");
      }).length,
    [guests]
  );

  const notCalledGuests = useMemo(
    () =>
      guests.filter((g) => {
        const count = Number(g.call_count) || 0;
        const s = (g.call_status || "").toLowerCase();
        return count === 0 || !s || s === "not called";
      }).length,
    [guests]
  );

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-5 animate-fadeIn min-w-0 max-w-7xl mx-auto">
      {/* 1. Header Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#FF6574] mb-1.5 cursor-pointer transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#FF6574]" />
              <span>Back to Overview</span>
            </button>
          )}

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-100">
              <PhoneCall className="w-3 h-3 text-purple-600" />
              <span>Call Log Desk</span>
            </span>
            {weddings && weddings.length > 1 && onSelectWedding ? (
              <div className="relative inline-flex items-center">
                <select
                  value={wedding?.id || ""}
                  onChange={(e) => {
                    const match = weddings.find((w) => w.id === e.target.value);
                    if (match) onSelectWedding(match, "call_logs");
                  }}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-none rounded-xl px-2.5 py-1 pr-6 cursor-pointer focus:ring-2 focus:ring-[#FF6574]/20 focus:outline-none appearance-none"
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
            <span>Guest Call Log Records</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {guests.length} Total Call Targets
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dedicated view showing call outcomes, call attempts, and conversation notes only.
          </p>
        </div>
      </div>

      {/* 2. Call Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Calls */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Calls Placed</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
            {totalCallsAttempted}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Across all guests</span>
        </div>

        {/* Connected */}
        <div className="bg-white border border-emerald-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 block">Connected / Spoke</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
            {connectedGuests}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Reached successfully</span>
        </div>

        {/* No Answer */}
        <div className="bg-white border border-amber-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 block">No Answer / Busy</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
            {noAnswerGuests}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Requires follow-up</span>
        </div>

        {/* Not Called */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Not Called Yet</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1 block">
            {notCalledGuests}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Pending call queue</span>
        </div>
      </div>

      {/* 3. Search & Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by guest name, phone, notes..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6574]/20 focus:border-[#FF6574] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6574]/20 cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            <option value="connected">✓ Connected</option>
            <option value="no_answer">✕ No Answer</option>
            <option value="callback">📞 Callback</option>
            <option value="not_called">⚪ Not Called</option>
          </select>

          <select
            value={attemptFilter}
            onChange={(e) => setAttemptFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6574]/20 cursor-pointer"
          >
            <option value="all">All Attempts</option>
            <option value="0">0 Calls</option>
            <option value="1">1 Call</option>
            <option value="2">2 Calls</option>
            <option value="3+">3+ Calls</option>
          </select>
        </div>
      </div>

      {/* 4. The Call Log Directory: Mobile Cards + Desktop Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Call Logs Directory ({filteredList.length})
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Showing only call details & conversation history
          </span>
        </div>

        {/* Mobile View: Call Log Cards (< md) */}
        <div className="md:hidden space-y-2.5">
          {filteredList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No call records found matching your filters.
            </div>
          ) : (
            filteredList.map((guest) => {
              const count = Number(guest.call_count) || 0;
              const status = guest.call_status || "Not Called";
              const s = status.toLowerCase();

              let statusBadge = (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Not Called
                </span>
              );

              if (s.includes("connected") || s.includes("spoke") || s.includes("confirmed")) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{status}</span>
                  </span>
                );
              } else if (s.includes("no answer") || s.includes("busy") || s.includes("ringing")) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{status}</span>
                  </span>
                );
              } else if (s.includes("callback")) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <PhoneForwarded className="w-3 h-3 text-blue-600" />
                    <span>Callback Req</span>
                  </span>
                );
              } else if (s.includes("decline") || s.includes("wrong")) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>{status}</span>
                  </span>
                );
              }

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
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                            Bride
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                            Groom
                          </span>
                        )}
                      </div>

                      {guest.contact ? (
                        <a
                          href={`tel:${guest.contact}`}
                          className="font-mono text-xs text-slate-600 hover:text-emerald-600 font-semibold inline-flex items-center gap-1 mt-0.5"
                        >
                          <PhoneCall className="w-3 h-3 text-slate-400" />
                          <span>{guest.contact}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">No phone</span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          count === 0
                            ? "bg-slate-100 text-slate-400"
                            : count === 1
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : count === 2
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {count} {count === 1 ? "call" : "calls"}
                      </span>
                      {statusBadge}
                    </div>
                  </div>

                  {guest.last_call_summary && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200/60 line-clamp-2">
                      "{guest.last_call_summary}"
                    </p>
                  )}

                  {onOpenCallLogModal && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenCallLogModal(guest)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6574] hover:bg-[#e05463] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <PhoneOutgoing className="w-3.5 h-3.5" />
                        <span>{count > 0 ? "Add Notes" : "Log Call"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Call Log Table (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Phone Contact</th>
                <th className="py-3 px-4 text-center">Attempts</th>
                <th className="py-3 px-4">Call Outcome</th>
                <th className="py-3 px-4">Last Call Summary / Notes</th>
                {onOpenCallLogModal && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={onOpenCallLogModal ? 6 : 5} className="py-8 text-center text-slate-400">
                    No call records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredList.map((guest) => {
                  const count = Number(guest.call_count) || 0;
                  const status = guest.call_status || "Not Called";
                  const s = status.toLowerCase();

                  let statusBadge = (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Not Called
                    </span>
                  );

                  if (s.includes("connected") || s.includes("spoke") || s.includes("confirmed")) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{status}</span>
                      </span>
                    );
                  } else if (s.includes("no answer") || s.includes("busy") || s.includes("ringing")) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{status}</span>
                      </span>
                    );
                  } else if (s.includes("callback")) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        <PhoneForwarded className="w-3 h-3 text-blue-600" />
                        <span>Callback Req</span>
                      </span>
                    );
                  } else if (s.includes("decline") || s.includes("wrong")) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>{status}</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Guest Name & Side */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{guest.guest_name}</span>
                          {(guest.side || "").toLowerCase().includes("bride") ? (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                              Bride
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              Groom
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        {guest.contact ? (
                          <a
                            href={`tel:${guest.contact}`}
                            className="font-mono text-xs text-slate-700 hover:text-emerald-600 font-semibold inline-flex items-center gap-1"
                          >
                            <PhoneCall className="w-3 h-3 text-slate-400" />
                            <span>{guest.contact}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>

                      {/* Attempts Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            count === 0
                              ? "bg-slate-100 text-slate-400"
                              : count === 1
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : count === 2
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {count} {count === 1 ? "call" : "calls"}
                        </span>
                      </td>

                      {/* Outcome */}
                      <td className="py-3 px-4">{statusBadge}</td>

                      {/* Last Call Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        {guest.last_call_summary ? (
                          <p className="text-xs text-slate-700 line-clamp-2 italic">
                            "{guest.last_call_summary}"
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">No notes recorded</span>
                        )}
                      </td>

                      {/* Action */}
                      {onOpenCallLogModal && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenCallLogModal(guest)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6574] hover:bg-[#e05463] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <PhoneOutgoing className="w-3.5 h-3.5" />
                            <span>Log Call</span>
                          </button>
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

