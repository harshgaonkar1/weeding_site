import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  PhoneCall,
  Lock,
  User,
  Eye,
  EyeOff,
  Heart,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal({ isOpen, onClose, initialTab = "admin" }) {
  const { login, user } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'admin' | 'call_center' | 'marriage_client'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "admin");
      setIdentifier("");
      setPassword("");
      setErrorMessage("");
      setShowPassword(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMessage("");
    setShowPassword(false);
    setIdentifier("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      await login(identifier, password);
      if (onClose) onClose();
    } catch (err) {
      setErrorMessage(err.message || "Invalid credentials. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-emerald-900/10 relative animate-scaleUp my-auto max-h-[92vh]">
        {/* Close Button if user is already logged in */}
        {user && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-[#0f2922] via-[#163a30] to-[#1c4d25] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#84e030]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#84e030]/20 border border-[#84e030]/40 flex items-center justify-center text-[#84e030] mb-3 shadow-sm">
            {activeTab === "admin" ? (
              <ShieldCheck className="w-6 h-6" />
            ) : activeTab === "call_center" ? (
              <PhoneCall className="w-6 h-6" />
            ) : (
              <Heart className="w-6 h-6" />
            )}
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            Wedding Management Portal
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 font-normal">
            Select your account access type
          </p>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-5 bg-black/25 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => handleTabSwitch("admin")}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-[#0f2922] shadow-sm font-bold"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("call_center")}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "call_center"
                  ? "bg-[#84e030] text-[#0f2922] shadow-sm font-bold"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              <span>Call Desk</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("marriage_client")}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "marriage_client"
                  ? "bg-emerald-300 text-[#0f2922] shadow-sm font-bold"
                  : "text-emerald-100 hover:text-white"
              }`}
            >
              <span>Marriage View</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-7 space-y-4 overflow-y-auto max-h-[60vh]">

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
            {/* Quick Demo Credentials Autofill */}
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-900">
              <span className="font-semibold text-emerald-950">
                {activeTab === "admin"
                  ? "Admin Creds: admin / manish1122"
                  : activeTab === "call_center"
                  ? "Call Desk: callcenter / call123"
                  : "Client: aaditya_ananya / Aaditya@2026"}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "admin") {
                    setIdentifier("admin@emitly.com");
                    setPassword("manish1122");
                  } else if (activeTab === "call_center") {
                    setIdentifier("callcenter@emitly.com");
                    setPassword("call123");
                  } else {
                    setIdentifier("aaditya_ananya");
                    setPassword("Aaditya@2026");
                  }
                  setErrorMessage("");
                }}
                className="text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
              >
                Auto Fill
              </button>
            </div>

            {/* Identifier Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {activeTab === "marriage_client" ? "Marriage User ID / Username" : "Username or Email Address"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="login_identifier"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    activeTab === "marriage_client"
                      ? "e.g. aaditya_ananya or rohan_priya"
                      : activeTab === "call_center"
                      ? "e.g. callcenter@emitly.com or callcenter"
                      : "e.g. admin@emitly.com or admin"
                  }
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="login_password"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    activeTab === "marriage_client"
                      ? "e.g. Aaditya@2026"
                      : activeTab === "call_center"
                      ? "e.g. call123"
                      : "e.g. manish1122"
                  }
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Role Note */}
            <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <span className="font-semibold text-slate-700 block">
                {activeTab === "admin"
                  ? "Super Admin: Full database management access across all weddings"
                  : activeTab === "call_center"
                  ? "Call Desk: Telecaller verification & 3-call checkpoint logging"
                  : "Marriage View: Private read-only dashboard for this wedding only"}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0f2922] hover:bg-[#163a30] active:scale-98 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50 btn-interactive mt-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>
                    Sign In as{" "}
                    {activeTab === "admin"
                      ? "Admin"
                      : activeTab === "call_center"
                      ? "Call Desk"
                      : "Marriage Client"}
                  </span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

