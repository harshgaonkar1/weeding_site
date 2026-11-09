import React, { useRef, useEffect } from "react";
import {
  Home,
  X,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Top Chrome-Style Tab Bar
 * Exact layout, icons, and styling from the user's reference image:
 * [ 🏠 Planner ]  [ Arjun & Meera (5) ✕ ]  [+]                      [ 👤 Account ]
 */
export default function ChromeTabBar({
  tabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
  unopenedWeddings = [],
  onOpenMobileNav,
}) {
  const { user, setIsLoginModalOpen } = useAuth();
  const scrollContainerRef = useRef(null);

  // Auto-scroll the active tab into view when activeTabId changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const activeEl = scrollContainerRef.current.querySelector(
      `[data-tab-id="${activeTabId}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeTabId]);

  return (
    <header className="w-full bg-white border-b border-slate-100 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-4 select-none shrink-0 z-30 sticky top-0 shadow-2xs">
      {/* Left: Mobile Nav + Brand Logo + Chrome Tabs */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 overflow-hidden">
        {/* Mobile Hamburger Button */}
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open Navigation Menu"
            className="md:hidden w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer shrink-0 border border-slate-200/60 active:scale-95 transition-all"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Brand Logo & Name: RSVP.CO in #e11d48 */}
        <div
          onClick={() => onSelectTab("all")}
          className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0"
          title="RSVP.CO - Return to Overview"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#fdf2f4] border border-[#fce7eb] flex items-center justify-center text-[#e11d48] group-hover:scale-105 transition-transform shrink-0">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>
          <span className="text-base sm:text-lg font-black tracking-tight text-[#e11d48] font-sans hidden sm:inline-block">
            RSVP.CO
          </span>
        </div>

        {/* Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Scrollable Chrome Tab Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-0.5"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={tab.title}
                className={`group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 max-w-[130px] sm:max-w-[240px] ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/90 ring-1 ring-slate-100/60"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-transparent"
                }`}
              >
                {/* Tab Title */}
                <span className="truncate leading-tight text-slate-800 font-bold text-[11px] sm:text-xs">
                  {tab.title}
                </span>

                {/* Circular Green Badge (Matching the exact green '(5)' circle in reference image) */}
                {tab.count !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-[#16a34a] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 leading-none">
                    {tab.count > 99 ? "99+" : tab.count}
                  </span>
                )}

                {/* Close Button (✕) */}
                {!tab.isFixed && !tab.isHub && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    title={`Close ${tab.title}`}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-[#e11d48] transition-colors cursor-pointer shrink-0 ml-0.5"
                  >
                    <X className="w-2.5 h-2.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Chrome-Style "+" New Tab Button */}
          {onNewTab && (
            <button
              type="button"
              onClick={onNewTab}
              title={
                unopenedWeddings.length > 0
                  ? `New Tab (${unopenedWeddings.length} weddings available)`
                  : "All Marriages Hub"
              }
              className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#e11d48] border border-transparent hover:border-slate-200 transition-all shrink-0 cursor-pointer shadow-2xs group"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Right: User Profile ("Account" as in reference image) */}
      <div
        onClick={() => setIsLoginModalOpen(true)}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0 px-2 py-1 rounded-xl hover:bg-slate-50"
        title="Click to Switch User / Role"
      >
        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
          <User className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold text-slate-700 hidden sm:inline-block">
          {user?.name?.split(" ")[0] || "Account"}
        </span>
      </div>
    </header>
  );
}
