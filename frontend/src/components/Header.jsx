import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ShieldCheck,
  PhoneCall,
  Heart,
  LogOut,
  UserCheck,
  LogIn,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header({
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  selectedWedding,
  weddings = [],
  onOpenMobileNav,
}) {
  const {
    user,
    isAdmin,
    isCallCenter,
    isMarriageClient,
    isViewOnly,
    quickLogin,
    logout,
    setIsLoginModalOpen,
    openLoginModal,
    setIsAdminPasswordModalOpen,
  } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Keyboard shortcut Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleRoleToggle = (role) => {
    if (role === "admin") {
      if (isAdmin) return;
      // Protected: requires Super Admin password
      setIsAdminPasswordModalOpen(true);
    } else if (role === "call_center") {
      if (isCallCenter) return;
      if (isAdmin) {
        // Super Admin can switch to Call Center directly
        quickLogin("call_center");
      } else {
        // Marriage Client cannot directly switch to Call Center without logging in
        openLoginModal("call_center");
      }
    } else if (role === "marriage_client") {
      if (isMarriageClient) return;
      if (isAdmin) {
        // Super Admin can preview client view directly
        const targetWed = selectedWedding || (weddings && weddings[0]);
        quickLogin("marriage_client", targetWed);
      } else {
        // Call Desk cannot directly switch to User View without logging in
        openLoginModal("marriage_client");
      }
    }
  };

  return (
    <header className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex flex-col gap-2.5 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-20 transition-all">
      {/* 1. Mobile-Only Top Navigation Bar (< md) */}
      <div className="flex md:hidden items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open Navigation Menu"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <div className="min-w-0 leading-tight">
            <h2 className="text-xs font-extrabold text-slate-900 truncate max-w-[150px]">
              {selectedWedding
                ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name}`
                : "Wedding Portal"}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {isAdmin ? "Super Admin" : isCallCenter ? "Call Desk" : "Client Portal"}
            </p>
          </div>
        </div>

        {/* Mobile Actions: Add Guest & Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isViewOnly && (
            <button
              onClick={onOpenAddModal}
              className="bg-[#0f2922] hover:bg-[#163a30] active:scale-95 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer btn-interactive"
            >
              <Plus className="w-3.5 h-3.5 text-[#84e030]" />
              <span className="text-[11px]">Guest</span>
            </button>
          )}

          {/* Profile Trigger (Mobile) */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 p-1.5 rounded-xl cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0f2922] to-emerald-700 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{(user.name || "U").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Search & Role Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-3.5 w-full">
        {/* Search Bar */}
        <div className="relative w-full md:w-80 group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-600 transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guests, phone, logistics..."
            className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-xl pl-9 pr-10 md:pr-12 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030]/60 focus:bg-white transition-all shadow-2xs group-hover:border-slate-300 font-medium"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-400 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs pointer-events-none group-focus-within:border-emerald-300 group-focus-within:text-emerald-600 transition-colors">
            ⌘K
          </kbd>
        </div>

        {/* Right Controls: Role Switcher & (Desktop) Profile */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Clean Segmented Role Switcher Toggle */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => handleRoleToggle("admin")}
              title="Super Admin Mode"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isAdmin
                  ? "bg-white text-slate-900 font-bold shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? "text-amber-600" : "text-slate-400"}`} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleToggle("call_center")}
              title="Call Desk Telecaller Mode"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isCallCenter
                  ? "bg-white text-slate-900 font-bold shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <PhoneCall className={`w-3.5 h-3.5 ${isCallCenter ? "text-emerald-600" : "text-slate-400"}`} />
              <span>Call Center</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleToggle("marriage_client")}
              title="Marriage Client User View"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isMarriageClient
                  ? "bg-white text-slate-900 font-bold shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isMarriageClient ? "text-rose-500" : "text-slate-400"}`} />
              <span>User View</span>
            </button>
          </div>

          {/* Add Guest Button (Desktop only - mobile is in top bar) */}
          {!isViewOnly && (
            <button
              onClick={onOpenAddModal}
              className="hidden md:flex bg-[#0f2922] hover:bg-[#163a30] active:scale-98 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 shadow-2xs transition-all cursor-pointer btn-interactive"
            >
              <Plus className="w-3.5 h-3.5 text-[#84e030]" />
              <span>Add Guest</span>
            </button>
          )}

          {/* User Profile Pill & Dropdown (Desktop) */}
          <div className="hidden md:block">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/90 py-1.5 pl-2 pr-2.5 rounded-xl cursor-pointer transition-all hover:shadow-xs shadow-2xs select-none"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0f2922] to-emerald-700 flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-2xs">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span>{(user.name || "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                {user.name?.split(" ")[0]}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-slate-700" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-30 space-y-1 animate-fadeInDown">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <div className="mt-1.5">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {isAdmin ? "Super Admin" : isCallCenter ? "Call Desk" : "Client View"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-[#0f2922] hover:bg-[#163a30] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-[#84e030]" />
            <span>Sign In</span>
          </button>
        )}
          </div>
        </div>
      </div>
    </header>
  );
}
