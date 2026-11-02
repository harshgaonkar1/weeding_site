import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminPasswordModal({ isOpen, onClose, onSuccess }) {
  const { loginAsAdmin } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Please enter the Admin password");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await loginAsAdmin(password);
      setPassword("");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err.message || "Incorrect Admin password. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 relative animate-bounceIn my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all hover:scale-110 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-br from-[#3b0b14] via-[#5c1322] to-[#4a0e17] p-4 sm:p-6 text-white text-center relative overflow-hidden">
          {/* Ambient Gold/Green Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#eedfc8]/15 rounded-full blur-xl pointer-events-none" />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-[#eedfc8]/20 border border-[#eedfc8]/40 flex items-center justify-center text-[#eedfc8] mb-3 shadow-sm animate-pulseGlowAmber">
            <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight flex items-center justify-center gap-1.5">
            <span>Super Admin Access</span>
          </h3>
          <p className="text-xs text-[#eedfc8]/90 mt-1 font-normal max-w-xs mx-auto">
            Admin privileges are protected. Enter the Admin password to switch to Super Admin mode.
          </p>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              <span>Admin Password</span>
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="admin_unlock_token"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                }}
                placeholder="Enter admin password"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#722233]/40 focus:border-[#722233] focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Mode Grants:</span>
            </span>
            <ul className="list-disc pl-4 text-amber-800/90 space-y-0.5">
              <li>Full control to create, edit, and delete Marriage Cards & Guests</li>
              <li>Spreadsheet bulk import into any wedding directory</li>
              <li>Complete telecaller logs, audit history & analytics</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer btn-interactive text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-2/3 bg-[#5c1322] hover:bg-[#480e1b] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50 btn-interactive"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#eedfc8]" />
                  <span>Verify & Enter Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
