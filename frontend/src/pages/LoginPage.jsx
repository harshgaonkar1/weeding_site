import React, { useState } from "react";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  Phone,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ initialTab = "admin" }) {
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState(initialTab); // 'admin' | 'call_center' | 'marriage_client'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRoleChange = (role) => {
    setActiveRole(role);
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
    } catch (err) {
      setErrorMessage(
        err.message || "Invalid credentials. Please check your username and password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d211b] flex flex-col justify-center items-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#173e32] via-[#0d211b] to-[#081511] opacity-90 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Wedding Portal
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/70">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Clean Role Navigation */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`py-3 px-2 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRole === "admin"
                  ? "bg-white text-slate-900 border-b-2 border-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("call_center")}
              className={`py-3 px-2 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRole === "call_center"
                  ? "bg-white text-slate-900 border-b-2 border-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Call Center</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("marriage_client")}
              className={`py-3 px-2 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRole === "marriage_client"
                  ? "bg-white text-slate-900 border-b-2 border-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Marriage View</span>
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {activeRole === "marriage_client" ? "Marriage User ID" : "Username or Email"}
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
                      activeRole === "marriage_client"
                        ? "e.g. aaditya_ananya"
                        : "e.g. admin@weddingsite.com"
                    }
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
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
                    placeholder="Enter password"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0f2922] hover:bg-[#163a30] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>
                      {activeRole === "marriage_client"
                        ? "View Marriage Details"
                        : "Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#84e030]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-emerald-100/40">
          Wedding Logistics Management System
        </p>
      </div>
    </div>
  );
}
