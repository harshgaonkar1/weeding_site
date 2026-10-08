import React, { useState } from "react";
import {
  X,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Heart,
  Share2,
  Sparkles,
  LogIn,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function WeddingCredentialsModal({
  isOpen,
  wedding,
  onClose,
  isNewlyCreated = false,
}) {
  const { quickLogin } = useAuth();
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !wedding) return null;

  const username =
    wedding.client_username ||
    `${wedding.groom_name?.trim().split(" ")[0].toLowerCase()}_${wedding.bride_name?.trim().split(" ")[0].toLowerCase()}`.replace(/[^a-z0-9_]/g, "");
  const password = wedding.client_password || `${wedding.groom_name?.trim().split(" ")[0] || "Wed"}@2026`;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const sheetLink =
      wedding.google_sheet_url ||
      `https://docs.google.com/spreadsheets/d/${wedding.google_sheet_id || "wed_" + wedding.id}/edit`;
    const text = `Wedding Client Portal Access\n` +
      `Wedding: ${wedding.groom_name} & ${wedding.bride_name}\n` +
      `Date: ${wedding.wedding_date || "Upcoming"}\n` +
      `Venue: ${wedding.venue || wedding.city || "Venue"}\n\n` +
      `Login Credentials (View-Only Dashboard)\n` +
      `User ID / Username: ${username}\n` +
      `Password: ${password}\n\n` +
      `Live Google Sheet: ${sheetLink}\n\n` +
      `Use this User ID and Password to view your guest arrivals, departures, RSVP confirmations, and travel details in real-time.`;
    navigator.clipboard.writeText(text);
    setCopiedField("all");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleTestLogin = () => {
    quickLogin("marriage_client", {
      ...wedding,
      client_username: username,
      client_password: password,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleUp">
        {/* Top Banner */}
        <div className="bg-[#0f2922] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#84e030]/15 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#84e030]/20 border border-[#84e030]/40 flex items-center justify-center text-[#84e030] mb-3 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>

          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#84e030]/20 text-[#84e030] border border-[#84e030]/40 uppercase tracking-wider mb-1">
            {isNewlyCreated ? "Created Successfully" : "Portal Access"}
          </span>

          <h3 className="text-lg font-extrabold tracking-tight text-white">
            {wedding.groom_name} & {wedding.bride_name}
          </h3>
          <p className="text-xs text-emerald-100/80 mt-0.5 font-normal">
            Client View-Only Dashboard Credentials & Google Sheet
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Share these credentials with the wedding couple or family. When they sign in, they will only see their own wedding's live guest directory and logistics in <strong>view-only</strong> mode.
            </p>
          </div>

          {/* Credentials Box */}
          <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
            {/* Username / User ID */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                User ID / Username
              </span>
              <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900">
                <span className="truncate select-all">{username}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(username, "username")}
                  className="text-emerald-700 hover:text-emerald-900 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer ml-2 shrink-0"
                >
                  {copiedField === "username" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Password
              </span>
              <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900">
                <span className="truncate select-all">{password}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(password, "password")}
                  className="text-emerald-700 hover:text-emerald-900 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer ml-2 shrink-0"
                >
                  {copiedField === "password" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Google Sheet Link */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Generated Google Sheet (Two-Way Sync)
              </span>
              <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900">
                <span className="truncate select-all text-emerald-800 text-[11px]">
                  {wedding.google_sheet_url || `https://docs.google.com/spreadsheets/d/${wedding.google_sheet_id || "wed_" + wedding.id}/edit`}
                </span>
                <a
                  href={wedding.google_sheet_url || `https://docs.google.com/spreadsheets/d/${wedding.google_sheet_id || "wed_" + wedding.id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer ml-2 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open</span>
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleCopyAll}
              className="w-full bg-[#0f2922] hover:bg-[#163a30] active:scale-98 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all btn-interactive"
            >
              {copiedField === "all" ? (
                <>
                  <Check className="w-4 h-4 text-[#84e030]" />
                  <span className="text-[#84e030]">✓ Full Message Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#84e030]" />
                  <span>Copy Complete Login Message</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleTestLogin}
              className="w-full bg-[#edf9df] hover:bg-[#dff5cb] border border-[#c3eeb0] text-[#1c4d25] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs btn-interactive"
            >
              <LogIn className="w-3.5 h-3.5 text-[#16a34a]" />
              <span>Login as this Marriage (Test View)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
