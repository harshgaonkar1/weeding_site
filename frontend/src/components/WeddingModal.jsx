import React, { useState, useEffect } from "react";
import { X, Heart, Calendar, MapPin, Sparkles, CheckCircle2, KeyRound, Eye, EyeOff, RefreshCw, Copy, ShieldCheck } from "lucide-react";
import { generateWeddingCredentials } from "../services/api";

export default function WeddingModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    groom_name: "",
    bride_name: "",
    wedding_date: "",
    venue: "",
    city: "",
    cover_theme: "emerald",
    notes: "",
    client_username: "",
    client_password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomUsername, setIsCustomUsername] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        groom_name: initialData.groom_name || "",
        bride_name: initialData.bride_name || "",
        wedding_date: initialData.wedding_date || "",
        venue: initialData.venue || "",
        city: initialData.city || "",
        cover_theme: initialData.cover_theme || "emerald",
        notes: initialData.notes || "",
        client_username: initialData.client_username || "",
        client_password: initialData.client_password || "",
      });
      setIsCustomUsername(true);
    } else {
      const defaultCreds = generateWeddingCredentials("Aaditya", "Ananya", "2026-11-28");
      setFormData({
        groom_name: "",
        bride_name: "",
        wedding_date: "2026-11-28",
        venue: "",
        city: "",
        cover_theme: "emerald",
        notes: "",
        client_username: "",
        client_password: "",
      });
      setIsCustomUsername(false);
    }
    setErrors({});
    setShowPassword(false);
    setCopiedField(null);
  }, [initialData, isOpen]);

  // Auto-generate credentials as user types names (for new weddings)
  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...formData, [name]: value };

    if (!initialData && !isCustomUsername) {
      const creds = generateWeddingCredentials(
        nextForm.groom_name,
        nextForm.bride_name,
        nextForm.wedding_date
      );
      nextForm.client_username = creds.username;
      nextForm.client_password = creds.password;
    }

    setFormData(nextForm);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleRegeneratePassword = () => {
    const groom = formData.groom_name ? formData.groom_name.trim().split(" ")[0] : "Wedding";
    const capGroom = groom.charAt(0).toUpperCase() + groom.slice(1);
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    const newPass = `${capGroom}@${randomPin}`;
    setFormData((prev) => ({ ...prev, client_password: newPass }));
  };

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "client_username") {
      setIsCustomUsername(true);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.groom_name || formData.groom_name.trim() === "") {
      newErrors.groom_name = "Groom Name is required";
    }
    if (!formData.bride_name || formData.bride_name.trim() === "") {
      newErrors.bride_name = "Bride Name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Ensure fallback username and password if left empty
    const creds = generateWeddingCredentials(
      formData.groom_name,
      formData.bride_name,
      formData.wedding_date
    );

    const submissionData = {
      ...formData,
      client_username: formData.client_username?.trim() || creds.username,
      client_password: formData.client_password?.trim() || creds.password,
    };

    onSubmit(submissionData);
  };

  const themes = [
    { id: "emerald", label: "Royal Emerald", color: "bg-emerald-600" },
    { id: "rose", label: "Rose & Gold", color: "bg-rose-500" },
    { id: "purple", label: "Regal Purple", color: "bg-purple-600" },
    { id: "amber", label: "Warm Gold", color: "bg-amber-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? "Edit Marriage Card" : "Create New Marriage Card"}
              </h3>
              <p className="text-xs text-slate-500">
                Set up wedding event & auto-generate client view credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Bride & Groom Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                🤵 Groom's Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="groom_name"
                value={formData.groom_name}
                onChange={handleNameChange}
                placeholder="e.g. Aaditya Roy"
                className={`w-full bg-[#f8fafc] border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030] ${
                  errors.groom_name ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
              {errors.groom_name && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.groom_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                👰 Bride's Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="bride_name"
                value={formData.bride_name}
                onChange={handleNameChange}
                placeholder="e.g. Ananya Sharma"
                className={`w-full bg-[#f8fafc] border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030] ${
                  errors.bride_name ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
              {errors.bride_name && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.bride_name}</p>
              )}
            </div>
          </div>

          {/* Wedding Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Wedding Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="wedding_date"
                value={formData.wedding_date}
                onChange={handleChange}
                placeholder="YYYY-MM-DD (e.g. 2026-11-28)"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030]"
              />
            </div>
          </div>

          {/* Venue & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Venue Name
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. The Oberoi Udaivilas"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Udaipur, Rajasthan"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030]"
              />
            </div>
          </div>

          {/* Cover Theme Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Card Theme Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, cover_theme: t.id }))}
                  className={`p-2 rounded-xl border text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.cover_theme === t.id
                      ? "border-slate-900 bg-slate-50 font-bold text-slate-900 shadow-2xs ring-2 ring-slate-900/10"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${t.color}`} />
                  <span className="text-[11px]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ================= AUTO-GENERATED CLIENT VIEW CREDENTIALS ================= */}
          <div className="bg-gradient-to-br from-amber-50/70 via-[#fdfbf7] to-emerald-50/50 border border-amber-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Client View-Only Portal Credentials</span>
                    <span className="text-[9px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                      Auto-Generated
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    The couple can log in with this User ID & Password to view their wedding dashboard in read-only mode.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Client Username */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Marriage User ID / Username
                  </label>
                  {formData.client_username && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.client_username, "username")}
                      className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedField === "username" ? "✓ Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="client_username"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    value={formData.client_username}
                    onChange={handleChange}
                    placeholder="e.g. aaditya_ananya"
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Client Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Client Password
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer"
                      title="Generate new password"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Regen</span>
                    </button>
                    {formData.client_password && (
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.client_password, "password")}
                        className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        {copiedField === "password" ? "✓ Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="client_password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    value={formData.client_password}
                    onChange={handleChange}
                    placeholder="e.g. Aaditya@2026"
                    className="w-full bg-white border border-amber-200 rounded-xl pl-3 pr-8 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Event Notes / Description
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Royal Palace Wedding with 3-day celebrations..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#84e030]"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#0f2922] hover:bg-[#163a30] text-white text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer btn-interactive disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#84e030]" />
                <span>{initialData ? "Update Marriage Card" : "Create & Generate Access"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
