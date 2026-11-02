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
      <div className="relative flex-1 w-full md:max-w-xs">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by name, phone, notes..."
          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#722233]/40 focus:border-[#722233] focus:bg-white transition-all"
        />
      </div>

      {/* Clean Filters Grid on Mobile, Flex on Desktop */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs w-full sm:w-auto">
        {/* Call Checkpoint Filter (Admin & Call Center only) */}
        {!isViewOnly && (
          <select
            value={callAttemptsFilter}
            onChange={(e) => setCallAttemptsFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#faf7f2] border border-[#e3d3be] rounded-xl px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-[#5c1322] focus:outline-none focus:ring-2 focus:ring-[#722233]/40 cursor-pointer"
          >
            <option value="All">📞 All Calls</option>
            <option value="0">⚪ 0 Calls</option>
            <option value="1">📞 1st Call</option>
            <option value="2">📞 2nd Call</option>
            <option value="3+">✓ 3+ Calls</option>
          </select>
        )}

        {/* Side Filter */}
        <select
          value={sideFilter}
          onChange={(e) => setSideFilter(e.target.value)}
          className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-2.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#722233]/40 cursor-pointer"
        >
          <option value="All">All Sides</option>
          <option value="Groom">🤵 Groom Side</option>
          <option value="Bride">👰 Bride Side</option>
        </select>

        {/* RSVP Filter */}
        <select
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className={`${!isViewOnly ? "col-span-2 sm:col-span-1" : ""} w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-2.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#722233]/40 cursor-pointer`}
        >
          <option value="All">All RSVPs</option>
          <option value="Confirmed">✓ Confirmed</option>
          <option value="Pending">⏳ Pending</option>
          <option value="Declined">✕ Regrets</option>
        </select>
      </div>
    </div>
  );
}
