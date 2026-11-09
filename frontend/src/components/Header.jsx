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
  Headphones,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Header({
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  selectedWedding,
  weddings = [],
  onOpenMobileNav,
  onOpenCallCenterModal,
}) {
  const {
    user,
    isAdmin,
    isCallCenter,
    isMarriageClient,
    isViewOnly,
    canEditGuests,
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
    <header className="px-3 sm:px-6 py-2 sm:py-3.5 flex flex-col gap-2 sm:gap-2.5 border-b border-slate-200 bg-[#FAF9F6]/95 backdrop-blur-md sticky top-0 z-20 transition-all text-[#1E293B]">
      {/* Main Search & Role Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-2.5 md:gap-3.5 w-full">
        {/* Search Bar + Mobile Add Guest */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#1E3A8A] transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests, phone, logistics..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 md:pr-12 py-2 text-xs text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all shadow-2xs group-hover:border-slate-300 font-medium"
            />
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs pointer-events-none group-focus-within:border-[#1E3A8A] group-focus-within:text-[#1E3A8A] transition-colors">
              ⌘K
            </kbd>
          </div>
          {canEditGuests && (
            <button
              onClick={onOpenAddModal}
              className="md:hidden bg-[#FF6574] hover:bg-[#e05463] active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Guest</span>
            </button>
          )}
        </div>

        {/* Right Controls: Role Switcher & (Desktop) Profile */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Clean Segmented Role Switcher Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => handleRoleToggle("admin")}
              title="Super Admin Mode"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isAdmin
                  ? "bg-[#1E3A8A] text-white font-bold shadow-xs border border-[#1E3A8A]"
                  : "text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-200/60"
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? "text-[#FF6574]" : "text-slate-400"}`} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleToggle("call_center")}
              title="Call Desk Telecaller Mode"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isCallCenter
                  ? "bg-[#1E3A8A] text-white font-bold shadow-xs border border-[#1E3A8A]"
                  : "text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-200/60"
              }`}
            >
              <PhoneCall className={`w-3.5 h-3.5 ${isCallCenter ? "text-[#FF6574]" : "text-slate-400"}`} />
              <span>Call Center</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleToggle("marriage_client")}
              title="Marriage Client User View"
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isMarriageClient
                  ? "bg-[#1E3A8A] text-white font-bold shadow-xs border border-[#1E3A8A]"
                  : "text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-200/60"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isMarriageClient ? "text-[#FF6574]" : "text-slate-400"}`} />
              <span>User View</span>
            </button>
          </div>

          {/* Add Guest Button (Desktop only - mobile is in top bar) */}
          {canEditGuests && (
            <button
              onClick={onOpenAddModal}
              className="hidden md:flex bg-[#FF6574] hover:bg-[#e05463] active:scale-98 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 shadow-sm shadow-[#FF6574]/20 transition-all cursor-pointer btn-interactive"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
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
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 py-1.5 pl-2 pr-2.5 rounded-xl cursor-pointer transition-all shadow-2xs select-none text-[#1E293B]"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#1E3A8A] via-[#2563EB] to-[#FF6574] flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-2xs">
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
              <span className="text-xs font-bold text-[#1E293B] truncate max-w-[100px]">
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
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-30 space-y-1 animate-fadeInDown text-[#1E293B]">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="mt-1.5">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1E3A8A] text-white">
                      {isAdmin ? "Super Admin" : isCallCenter ? "Call Desk" : "Client View"}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onOpenCallCenterModal) onOpenCallCenterModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[#FF6574]" />
                    <span>Call Center Team</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Switch Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#FF6574] hover:bg-[#FF6574]/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#FF6574]" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-[#FF6574] hover:bg-[#e05463] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#FF6574]/20 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-white" />
            <span>Sign In</span>
          </button>
        )}
          </div>
        </div>
      </div>
    </header>
  );
}
