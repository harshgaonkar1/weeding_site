import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck2,
  Plane,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { gsap, animateStaggerIn } from "../utils/animations";

export default function StatsCards({ stats }) {
  const gridRef = useRef(null);

  // Dropdown expansion state for each card
  const [expandedCards, setExpandedCards] = useState({
    total: false,
    rsvpConfirmed: false,
    rsvpPending: false,
    rsvpRegrets: false,
    idCard: false,
    flight: false,
  });

  // GSAP: Stagger entrance for metric cards on mount
  useEffect(() => {
    if (gridRef.current) {
      animateStaggerIn(gridRef.current.children, {
        y: 20,
        scale: 0.96,
        duration: 0.45,
        stagger: 0.05,
      });
    }
  }, []);

  const toggleCard = (key) => {
    setExpandedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isAllExpanded = Object.values(expandedCards).every(Boolean);

  const toggleAll = () => {
    const nextState = !isAllExpanded;
    setExpandedCards({
      total: nextState,
      rsvpConfirmed: nextState,
      rsvpPending: nextState,
      rsvpRegrets: nextState,
      idCard: nextState,
      flight: nextState,
    });
  };

  const totalRegistered = stats?.totalRegistered ?? 0;
  const groomTotal = stats?.groomSideCount ?? 0;
  const brideTotal = stats?.brideSideCount ?? 0;

  // RSVP Confirmed
  const rsvpConfirmed = stats?.rsvpConfirmed ?? 0;
  const groomConfirmed = stats?.groomRsvpConfirmed ?? 0;
  const brideConfirmed = stats?.brideRsvpConfirmed ?? 0;
  const rsvpRate = totalRegistered > 0 ? Math.round((rsvpConfirmed / totalRegistered) * 100) : 0;

  // RSVP Pending
  const rsvpPending = stats?.rsvpPending ?? 0;
  const groomPending = stats?.groomRsvpPending ?? 0;
  const bridePending = stats?.brideRsvpPending ?? 0;
  const rsvpPendingRate = totalRegistered > 0 ? Math.round((rsvpPending / totalRegistered) * 100) : 0;

  // RSVP Regrets (Not Coming / Declined)
  const rsvpDeclined = stats?.rsvpDeclined ?? 0;
  const groomDeclined = stats?.groomRsvpDeclined ?? 0;
  const brideDeclined = stats?.brideRsvpDeclined ?? 0;
  const rsvpDeclinedRate = totalRegistered > 0 ? Math.round((rsvpDeclined / totalRegistered) * 100) : 0;

  // ID Cards Received
  const idCardReceived = stats?.idCardReceived ?? 0;
  const groomIdReceived = stats?.groomIdCardReceived ?? 0;
  const brideIdReceived = stats?.brideIdCardReceived ?? 0;
  const idCardRate = totalRegistered > 0 ? Math.round((idCardReceived / totalRegistered) * 100) : 0;

  // Confirmed Flight / Travel Details Received
  const flightDetailsReceived = stats?.flightDetailsReceived ?? stats?.arrivalSetCount ?? 0;
  const groomFlightReceived = stats?.groomFlightDetailsReceived ?? stats?.groomArrivalSet ?? 0;
  const brideFlightReceived = stats?.brideFlightDetailsReceived ?? stats?.brideArrivalSet ?? 0;
  const flightRate = totalRegistered > 0 ? Math.round((flightDetailsReceived / totalRegistered) * 100) : 0;

  return (
    <div className="space-y-2.5">
      {/* Top Controls Bar: Quick Expand/Collapse All */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Overview Metrics
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-[#FF6574] bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs"
        >
          <ChevronsUpDown className="w-3 h-3 text-[#FF6574]" />
          <span>{isAllExpanded ? "Collapse All" : "Expand All"}</span>
        </button>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        {/* 1. Total Registered */}
        <div className="bg-white border border-slate-200/90 hover:border-[#FF6574] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs card-hover-lift animate-fadeInUp text-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#FF6574] shrink-0 shadow-2xs border border-slate-200">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Guests</p>
                <p className="text-xl font-black text-slate-900 leading-tight">
                  {totalRegistered}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
              All
            </span>
          </div>

          {/* Dropdown Toggle Trigger (Arrow Only) */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleCard("total")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer group/btn"
              title={expandedCards.total ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedCards.total ? "rotate-180 text-[#FF6574]" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Dropdown Bifurcation Content */}
            {expandedCards.total && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>🤵</span> Groom:
                  </span>
                  <span className="font-extrabold text-slate-900">{groomTotal}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>👰</span> Bride:
                  </span>
                  <span className="font-extrabold text-rose-600">{brideTotal}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. RSVP Confirmed */}
        <div className="bg-white border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs card-hover-lift animate-fadeInUp delay-75 text-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RSVP Confirmed</p>
                <p className="text-xl font-black text-emerald-600 leading-tight">
                  {rsvpConfirmed}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              {rsvpRate}%
            </span>
          </div>

          {/* Dropdown Toggle Trigger (Arrow Only) */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleCard("rsvpConfirmed")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-50 transition-colors cursor-pointer group/btn"
              title={expandedCards.rsvpConfirmed ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedCards.rsvpConfirmed ? "rotate-180 text-emerald-600" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Dropdown Bifurcation Content */}
            {expandedCards.rsvpConfirmed && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>🤵</span> Groom:
                  </span>
                  <span className="font-extrabold text-emerald-700">{groomConfirmed}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>👰</span> Bride:
                  </span>
                  <span className="font-extrabold text-emerald-700">{brideConfirmed}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. RSVP Pending */}
        <div className="bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs card-hover-lift animate-fadeInUp delay-100 text-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs border border-amber-200">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RSVP Pending</p>
                <p className="text-xl font-black text-amber-600 leading-tight">
                  {rsvpPending}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
              {rsvpPendingRate}%
            </span>
          </div>

          {/* Dropdown Toggle Trigger (Arrow Only) */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleCard("rsvpPending")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-slate-50 transition-colors cursor-pointer group/btn"
              title={expandedCards.rsvpPending ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedCards.rsvpPending ? "rotate-180 text-amber-600" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Dropdown Bifurcation Content */}
            {expandedCards.rsvpPending && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>🤵</span> Groom:
                  </span>
                  <span className="font-extrabold text-amber-700">{groomPending}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>👰</span> Bride:
                  </span>
                  <span className="font-extrabold text-amber-700">{bridePending}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. RSVP Regrets / Not Coming */}
        <div className="bg-white border border-slate-200/90 hover:border-[#FF6574] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs card-hover-lift animate-fadeInUp delay-150 text-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs border border-rose-200">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RSVP Regrets</p>
                <p className="text-xl font-black text-rose-600 leading-tight">
                  {rsvpDeclined}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
              {rsvpDeclinedRate}%
            </span>
          </div>

          {/* Dropdown Toggle Trigger (Arrow Only) */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleCard("rsvpRegrets")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer group/btn"
              title={expandedCards.rsvpRegrets ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedCards.rsvpRegrets ? "rotate-180 text-rose-600" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Dropdown Bifurcation Content */}
            {expandedCards.rsvpRegrets && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>🤵</span> Groom:
                  </span>
                  <span className="font-extrabold text-slate-900">{groomDeclined}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>👰</span> Bride:
                  </span>
                  <span className="font-extrabold text-rose-600">{brideDeclined}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. ID Cards Received */}
        <div className="bg-white border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs card-hover-lift animate-fadeInUp delay-200 text-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs border border-indigo-200">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ID Cards</p>
                <p className="text-xl font-black text-indigo-600 leading-tight">
                  {idCardReceived}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-200">
              {idCardRate}%
            </span>
          </div>

          {/* Dropdown Toggle Trigger (Arrow Only) */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleCard("idCard")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-slate-400 hover:text-indigo-700 hover:bg-slate-50 transition-colors cursor-pointer group/btn"
              title={expandedCards.idCard ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedCards.idCard ? "rotate-180 text-indigo-600" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Dropdown Bifurcation Content */}
            {expandedCards.idCard && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>🤵</span> Groom:
                  </span>
                  <span className="font-extrabold text-slate-900">{groomIdReceived}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>👰</span> Bride:
                  </span>
                  <span className="font-extrabold text-indigo-600">{brideIdReceived}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Confirmed Flight Details Received */}
        <div className="bg-white border border-slate-200/90 hover:border-sky-400 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs card-hover-lift animate-fadeInUp delay-300 relative overflow-hidden text-slate-800">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs border border-sky-200">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Flight Info</p>
                <p className="text-xl font-black text-sky-600 leading-tight">
                  {flightDetailsReceived}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-sky-200">
              <span>{flightRate}%</span>
            </div>
          </div>

          {/* Dropdown Toggle Trigger (Arrow Only) */}
          <div className="mt-2.5 pt-1.5 border-t border-slate-100 relative z-10">
            <button
              type="button"
              onClick={() => toggleCard("flight")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-slate-50 transition-colors cursor-pointer group/btn"
              title={expandedCards.flight ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  expandedCards.flight ? "rotate-180 text-sky-600" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Dropdown Bifurcation Content */}
            {expandedCards.flight && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>🤵</span> Groom:
                  </span>
                  <span className="font-extrabold text-slate-900">{groomFlightReceived}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-slate-800 text-[10px] shadow-2xs">
                  <span className="font-semibold flex items-center gap-1">
                    <span>👰</span> Bride:
                  </span>
                  <span className="font-extrabold text-rose-600">{brideFlightReceived}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
