import React from "react";
import { Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  sideFilter = "All",
  setSideFilter,
  rsvpFilter = "All",
  setRsvpFilter,
  idCardFilter = "All",
  setIdCardFilter,
  callAttemptsFilter = "All",
  setCallAttemptsFilter,
}) {
  const { isViewOnly } = useAuth();
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 py-1">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, notes..."
          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030] focus:bg-white transition-all"
        />
      </div>

      {/* Clean Filters */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Call Checkpoint Filter (Admin & Call Center only) */}
        {!isViewOnly && (
          <select
            value={callAttemptsFilter}
            onChange={(e) => setCallAttemptsFilter(e.target.value)}
            className="bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-[#84e030] cursor-pointer"
          >
            <option value="All">📞 All Call Statuses</option>
            <option value="0">⚪ 0 Calls (Not Started)</option>
            <option value="1">📞 1st Call Done</option>
            <option value="2">📞 2nd Call Done</option>
            <option value="3+">✓ 3 Calls Completed</option>
          </select>
        )}

        {/* Side Filter */}
        <select
          value={sideFilter}
          onChange={(e) => setSideFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#84e030] cursor-pointer"
        >
          <option value="All">All Sides</option>
          <option value="Groom">🤵 Groom Side</option>
          <option value="Bride">👰 Bride Side</option>
        </select>

        {/* RSVP Filter */}
        <select
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#84e030] cursor-pointer"
        >
          <option value="All">All RSVPs</option>
          <option value="Confirmed">✓ Confirmed</option>
          <option value="Pending">⏳ Pending</option>
          <option value="Declined">✕ Regrets (Not Coming)</option>
        </select>
      </div>
    </div>
  );
}
