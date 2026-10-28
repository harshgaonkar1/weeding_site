import React, { useState } from "react";
import {
  Users,
  UserPlus,
  ChevronDown,
  ChevronsUpDown,
  Briefcase,
  Heart,
  PlusCircle,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  MessageSquare,
  X,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SidebarChatWidget from "./SidebarChatWidget";

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
}) {
  const {
    user,
    isAdmin,
    isCallCenter,
    isMarriageClient,
    isViewOnly,
    canEditGuests,
    setIsLoginModalOpen,
    setIsAdminPasswordModalOpen,
  } = useAuth();
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  const closeMobile = () => {
    if (setIsMobileNavOpen) setIsMobileNavOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-fadeIn"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar (Desktop Static + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white p-5 flex flex-col justify-between border-r border-slate-100 shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 lg:w-72 md:min-h-[860px] overflow-y-auto ${
          isMobileNavOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0 shadow-none"
        }`}
      >
        <div className="space-y-5">
          {/* Brand Logo & Current Role Badge */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={closeMobile}>
              <div className="w-8 h-8 rounded-2xl bg-[#1c4d25] flex items-center justify-center p-1.5 shadow-sm ring-4 ring-[#d8f5df] transition-all group-hover:scale-105">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#84e030]"></span>
                </span>
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 font-sans block leading-none">
                  Wedding Site
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Guest & Travel Directory</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation menu"
              className="md:hidden w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        {/* Role Pill Banner */}
        <div className="px-2">
          {isAdmin ? (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900 text-xs font-bold shadow-2xs animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Super Admin</span>
              </span>
              <span className="text-[10px] bg-amber-200/70 text-amber-950 px-1.5 py-0.5 rounded-md font-semibold">
                Full Access
              </span>
            </div>
          ) : isCallCenter ? (
            <div
              onClick={() => setIsAdminPasswordModalOpen(true)}
              title="Click to Unlock Super Admin Mode with Password"
              className="flex items-center justify-between bg-[#edf9df] hover:bg-emerald-100/70 border border-[#c3eeb0] px-3 py-1.5 rounded-xl text-[#2d5c12] text-xs font-bold shadow-2xs animate-fadeIn cursor-pointer group transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                <span>Call Center Desk</span>
              </span>
              <span className="text-[10px] bg-[#d3f5b7] text-[#1c4d25] group-hover:bg-[#1c4d25] group-hover:text-white px-1.5 py-0.5 rounded-md font-semibold transition-colors">
                Switch Role
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-800 text-xs font-bold shadow-2xs animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                <span>Client Portal</span>
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-semibold">
                View Only
              </span>
            </div>
          )}
        </div>

        {/* Workspace Dropdown Card */}
        <div className="relative">
          <div
            onClick={() => {
              if (!isMarriageClient) {
                setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen);
              }
            }}
            className={`bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between transition-all group select-none ${
              isMarriageClient ? "cursor-default ring-1 ring-rose-200/50" : "hover:bg-[#f1f5f9] cursor-pointer hover:shadow-xs"
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-200/80 group-hover:bg-rose-100 flex items-center justify-center text-slate-700 group-hover:text-rose-600 transition-colors shrink-0">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {selectedWedding
                    ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name}`
                    : "All Weddings"}
                </h4>
                <p className="text-[11px] text-slate-500 font-normal">
                  {selectedWedding
                    ? `${totalCount} ${totalCount === 1 ? "Guest" : "Guests"} • ${selectedWedding.city || "Venue"}`
                    : `${totalWeddingsCount} Active Weddings`}
                </p>
              </div>
            </div>
            {!isMarriageClient && (
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isWorkspaceDropdownOpen ? "rotate-180 text-slate-700" : ""
                }`}
              />
            )}
          </div>

          {/* Workspace Switcher Menu (Only accessible for Admin and Call Center) */}
          {!isMarriageClient && isWorkspaceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 animate-fadeIn">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                Select Wedding Workspace
              </p>

              {/* All Weddings Option */}
              <button
                type="button"
                onClick={() => {
                  onSelectWedding(null);
                  setActiveTab("weddings");
                  setIsWorkspaceDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                  !selectedWedding
                    ? "bg-[#d4f952]/50 text-[#123118]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>All Marriage Cards</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full font-bold">
                  {weddings.length}
                </span>
              </button>

              {/* Individual Weddings */}
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
                      ? "bg-[#d4f952] text-[#123118]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">
                    {w.groom_name} & {w.bride_name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                      selectedWedding?.id === w.id
                        ? "bg-[#123118]/15 text-[#123118]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {w.total_guests || 0} {w.total_guests === 1 ? "guest" : "guests"}
                  </span>
                </button>
              ))}

              {isAdmin && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceDropdownOpen(false);
                      onOpenAddWeddingModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Create Marriage Card</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-1">
          {/* 1. Marriage Cards (All Weddings Hub - Admin & Call Center only) */}
          {!isMarriageClient && (
            <button
              onClick={() => {
                onSelectWedding(null);
                setActiveTab("weddings");
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "weddings"
                  ? "bg-[#d4f952] text-[#123118] shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 stroke-[2.2]" />
                <span>Marriage Cards</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  activeTab === "weddings"
                    ? "bg-[#123118]/10 text-[#123118]"
                    : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {totalWeddingsCount}
              </span>
            </button>
          )}

          {/* 2. Guest Directory (Active / Scoped) */}
          <button
            onClick={() => {
              if (!selectedWedding && weddings.length > 0) {
                onSelectWedding(weddings[0]);
              }
              setActiveTab("directory");
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "directory"
                ? "bg-[#d4f952] text-[#123118] shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 stroke-[2.2]" />
              <span>Guest Directory</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                activeTab === "directory"
                  ? "bg-[#123118]/10 text-[#123118]"
                  : "bg-slate-200/70 text-slate-600"
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* 3. Analytics & Trends (Visual Bar Graphs, Line Graphs, Insights) */}
          <button
            onClick={() => {
              if (!selectedWedding && weddings.length > 0) {
                onSelectWedding(weddings[0]);
              }
              setActiveTab("analytics");
              closeMobile();
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-[#d4f952] text-[#123118] shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 stroke-[2.2]" />
              <span>Analytics & Trends</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "analytics"
                  ? "bg-[#123118]/10 text-[#123118]"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              Graphs
            </span>
          </button>

          {/* Action: Add Marriage Card (Admin Only) */}
          {!isViewOnly && isAdmin && (
            <button
              onClick={onOpenAddWeddingModal}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-rose-500 stroke-[2]" />
              <span>+ Add Marriage Card</span>
            </button>
          )}

          {/* Action: Add Guest Entry (Admin only) */}
          {canEditGuests && (
            <button
              onClick={onOpenAddModal}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600 stroke-[2]" />
              <span>+ Add Guest Entry</span>
            </button>
          )}
        </nav>

        {/* Live Chatbot / Direct Messenger Widget on Sidebar (Only for User & Admin) */}
        <SidebarChatWidget
          onOpenChat={onOpenChat}
          selectedWedding={selectedWedding || (weddings && weddings[0])}
        />
      </div>

      {/* Bottom Profile Footer */}
      <div className="pt-6 border-t border-slate-100 mt-6">
        <div
          onClick={() => setIsLoginModalOpen(true)}
          title="Click to Switch User / Role"
          className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center text-white font-semibold text-xs shadow-xs overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <span>{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                {user?.name || "Guest User"}
              </p>
              <p className="text-[11px] text-slate-400 font-normal">
                {isAdmin
                  ? "Super Admin"
                  : isCallCenter
                  ? "Call Center Telecaller"
                  : "Marriage Client (View Only)"}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </aside>
    </>
  );
}
