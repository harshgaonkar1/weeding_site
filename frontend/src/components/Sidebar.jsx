import React, { useState } from "react";
import {
  LayoutTemplate,
  Target,
  Users,
  Home,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  ChevronDown,
  ChevronsUpDown,
  PlusCircle,
  Headphones,
  X,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  totalCount = 2,
  totalWeddingsCount = 3,
  activeTab = "weddings",
  setActiveTab,
  onOpenAddModal,
  onOpenAddWeddingModal,
  selectedWedding = null,
  weddings = [],
  onSelectWedding,
  isMobileNavOpen = false,
  setIsMobileNavOpen,
  onOpenChat,
  onOpenCallCenterModal,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const {
    user,
    isAdmin,
    isCallCenter,
    isMarriageClient,
    isViewOnly,
    canEditGuests,
    setIsLoginModalOpen,
  } = useAuth();
  const isScopedCaller = isCallCenter && user?.wedding_id && user.wedding_id !== "all";
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [selectMarriageModalTab, setSelectMarriageModalTab] = useState(null);

  const closeMobile = () => {
    if (setIsMobileNavOpen) setIsMobileNavOpen(false);
  };

  const handleCommunicationClick = (tabKey) => {
    if (selectedWedding && selectedWedding.id && selectedWedding.id !== "all") {
      // Already in a particular marriage -> display that marriage data directly
      setActiveTab(tabKey);
      closeMobile();
    } else {
      // In overview section of admin panel -> must select the marriage first!
      setSelectMarriageModalTab(tabKey);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-fadeIn"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar: Clean White with Exact Structure & Icons from Reference Image */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white flex flex-col justify-between border-r border-slate-100 shrink-0 transition-all duration-300 ease-in-out md:static md:translate-x-0 md:z-auto md:h-full md:min-h-0 overflow-y-auto no-scrollbar ${
          isCollapsed ? "p-3 md:w-20" : "p-4 sm:p-5 md:w-60 lg:w-64"
        } ${
          isMobileNavOpen
            ? "w-72 max-w-[85vw] translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0 shadow-none"
        }`}
      >
        <div className="space-y-4 sm:space-y-5">
          {/* Mobile Drawer Header with Branding & Close Button */}
          {isMobileNavOpen && (
            <div className="md:hidden flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="text-base font-black tracking-wider text-[#e11d48] font-sans">
                RSVP.CO
              </span>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close navigation menu"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Current Workspace Dropdown Pill */}
          <div className="relative">
            {isCollapsed ? (
              <div
                onClick={() => {
                  if (!isMarriageClient && !isScopedCaller) {
                    setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen);
                  }
                }}
                title={
                  selectedWedding
                    ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name} (${totalCount} guests)`
                    : `All Weddings (${totalWeddingsCount} active)`
                }
                className="w-10 h-10 mx-auto rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <Home className="w-4 h-4 text-[#e11d48]" />
              </div>
            ) : (
              <div
                onClick={() => {
                  if (!isMarriageClient && !isScopedCaller) {
                    setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen);
                  }
                }}
                className={`bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between transition-all select-none ${
                  isMarriageClient || isScopedCaller
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-2 h-2 rounded-full bg-[#e11d48] shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {selectedWedding
                      ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name}`
                      : "All Weddings Hub"}
                  </span>
                </div>
                {!isMarriageClient && !isScopedCaller && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                      isWorkspaceDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
            )}

            {/* Workspace Dropdown Menu */}
            {!isMarriageClient && !isScopedCaller && isWorkspaceDropdownOpen && (
              <div
                className={`absolute ${
                  isCollapsed ? "left-full ml-3 top-0 w-64" : "top-full left-0 right-0 mt-2"
                } bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 space-y-1 animate-fadeIn`}
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                  Select Wedding Workspace
                </p>

                <button
                  type="button"
                  onClick={() => {
                    onSelectWedding(null);
                    setActiveTab("weddings");
                    setIsWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    !selectedWedding
                      ? "bg-[#e11d48] text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>All Marriage Cards</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/20">
                    {weddings.length}
                  </span>
                </button>

                {weddings.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      onSelectWedding(w);
                      setActiveTab("directory");
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      selectedWedding?.id === w.id
                        ? "bg-[#e11d48] text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">
                      {w.groom_name} & {w.bride_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      {w.total_guests || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= EXACT CATEGORIES & ICONS FROM IMAGE ================= */}
          <nav className="space-y-4 pt-1">
            {/* 1. SETUP */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-1">
                  Setup
                </p>
              )}

              {/* Overview (Active item with pink tint as in screenshot) */}
              <button
                type="button"
                onClick={() => {
                  if (selectedWedding) {
                    setActiveTab("directory");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    setActiveTab("weddings");
                  }
                  closeMobile();
                }}
                title={isCollapsed ? "Overview" : undefined}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto rounded-xl justify-center ${
                        activeTab === "weddings" || selectedWedding
                          ? "bg-[#fdf2f4] text-[#e11d48]"
                          : "text-slate-500 hover:bg-slate-50"
                      }`
                    : `w-full gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                        activeTab === "weddings" || (activeTab === "directory" && selectedWedding)
                          ? "bg-[#fdf2f4] text-[#e11d48]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                }`}
              >
                <LayoutTemplate className="w-4 h-4 shrink-0 stroke-[2.2]" />
                {!isCollapsed && <span>Overview</span>}
              </button>

              {/* Venues */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("directory");
                  closeMobile();
                }}
                title={isCollapsed ? "Venues" : undefined}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? "w-10 h-10 mx-auto rounded-xl justify-center text-slate-500 hover:bg-slate-50"
                    : "w-full gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Target className="w-4 h-4 shrink-0 text-slate-400" />
                {!isCollapsed && <span>Venues</span>}
              </button>
            </div>

            {/* 2. PEOPLE */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-1">
                  People
                </p>
              )}

              {/* Guests */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedWedding && weddings.length > 0) {
                    onSelectWedding(weddings[0]);
                  }
                  setActiveTab("directory");
                  const el = document.getElementById("guest-directory-table");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  closeMobile();
                }}
                title={isCollapsed ? `Guests (${totalCount})` : undefined}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? "w-10 h-10 mx-auto rounded-xl justify-center text-slate-500 hover:bg-slate-50"
                    : "w-full justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0 text-slate-400" />
                  {!isCollapsed && <span>Guests</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {totalCount}
                  </span>
                )}
              </button>
            </div>

            {/* 3. COMMUNICATION */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-1">
                  Communication
                </p>
              )}

              {/* RSVP */}
              <button
                type="button"
                onClick={() => handleCommunicationClick("rsvp")}
                title={isCollapsed ? "RSVP Analytics" : undefined}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto rounded-xl justify-center ${
                        activeTab === "rsvp"
                          ? "bg-[#fdf2f4] text-[#e11d48]"
                          : "text-slate-500 hover:bg-slate-50"
                      }`
                    : `w-full gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        activeTab === "rsvp"
                          ? "bg-[#fdf2f4] text-[#e11d48] font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === "rsvp" ? "text-[#e11d48]" : "text-slate-400"
                  }`}
                />
                {!isCollapsed && <span>RSVP</span>}
              </button>

              {/* Call Log */}
              <button
                type="button"
                onClick={() => handleCommunicationClick("call_logs")}
                title={isCollapsed ? "Call Log Records" : undefined}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto rounded-xl justify-center ${
                        activeTab === "call_logs"
                          ? "bg-[#fdf2f4] text-[#e11d48]"
                          : "text-slate-500 hover:bg-slate-50"
                      }`
                    : `w-full gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        activeTab === "call_logs"
                          ? "bg-[#fdf2f4] text-[#e11d48] font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                }`}
              >
                <PhoneCall
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === "call_logs" ? "text-[#e11d48]" : "text-slate-400"
                  }`}
                />
                {!isCollapsed && <span>Call Log</span>}
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => handleCommunicationClick("whatsapp")}
                title={isCollapsed ? "WhatsApp Outreach" : undefined}
                className={`flex items-center transition-all cursor-pointer ${
                  isCollapsed
                    ? `w-10 h-10 mx-auto rounded-xl justify-center ${
                        activeTab === "whatsapp"
                          ? "bg-[#fdf2f4] text-[#e11d48]"
                          : "text-slate-500 hover:bg-slate-50"
                      }`
                    : `w-full gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        activeTab === "whatsapp"
                          ? "bg-[#fdf2f4] text-[#e11d48] font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                }`}
              >
                <MessageCircle
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === "whatsapp" ? "text-[#e11d48]" : "text-slate-400"
                  }`}
                />
                {!isCollapsed && <span>WhatsApp</span>}
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className="pt-3 border-t border-slate-100 mt-4">
          <div
            onClick={() => setIsLoginModalOpen(true)}
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between p-1.5"
            } rounded-xl hover:bg-slate-50 transition-colors cursor-pointer`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              {!isCollapsed && (
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {user?.name || "Account"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isAdmin ? "Super Admin" : isCallCenter ? "Caller" : "Client"}
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </div>
        </div>
      </aside>

      {/* ================= MODAL: SELECT MARRIAGE FIRST ================= */}
      {selectMarriageModalTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Select Marriage First
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose a marriage to open its{" "}
                  <span className="font-bold text-[#e11d48]">
                    {selectMarriageModalTab === "rsvp"
                      ? "RSVP Analytics"
                      : selectMarriageModalTab === "call_logs"
                      ? "Call Desk Logs"
                      : "WhatsApp Messages"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectMarriageModalTab(null)}
                aria-label="Close marriage selection"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Marriages */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar py-1">
              {weddings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No marriages found.</p>
              ) : (
                weddings.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      onSelectWedding(w, selectMarriageModalTab);
                      setSelectMarriageModalTab(null);
                      closeMobile();
                    }}
                    className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 hover:border-[#e11d48]/40 hover:bg-[#fdf2f4]/40 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#e11d48] truncate transition-colors">
                        {w.groom_name} & {w.bride_name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {w.wedding_date || "Upcoming"} {w.city ? `• ${w.city}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        {w.total_guests || 0} Guests
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#e11d48] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
