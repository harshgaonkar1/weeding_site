import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Phone,
  Search,
  ChevronDown,
  Eye,
  Sliders,
  Plane,
  Heart,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  normalizePhoneNumber,
  formatPhoneNumber,
  buildGuestMessage,
  sendWhatsAppMessage,
  sanitizeUnicodeText,
  createPRNG,
  DEFAULT_TEMPLATES,
  HAS_NAME,
} from "../utils/whatsappUtils";

export default function WhatsAppMessageModal({
  isOpen,
  onClose,
  guests = [],
  wedding = null,
  initialGuest = null,
}) {
  const { user, isAdmin, isCallCenter } = useAuth();
  if (!isOpen) return null;

  // ------------------- STATE -------------------
  // Target Mode: 'all' | 'single' | 'rsvp_pending' | 'rsvp_confirmed' | 'bride' | 'groom' | 'missing_travel'
  const [targetMode, setTargetMode] = useState(initialGuest ? "single" : "all");
  const [selectedGuestId, setSelectedGuestId] = useState(
    initialGuest?.id || (guests.length > 0 ? guests[0].id : "")
  );

  // Pre-drafted Template & Message Text
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [messageDraft, setMessageDraft] = useState(() => sanitizeUnicodeText(DEFAULT_TEMPLATES[0].text));

  // Anti-Ban Variation Settings (Optional)
  const [varOn, setVarOn] = useState(false);
  const [varLevel, setVarLevel] = useState("low");

  // Delivery Statuses stored per guest ID: { [guestId]: "NOT SENT" | "OPENED" | "SENT" }
  const [statuses, setStatuses] = useState(() => {
    try {
      const key = `wedding_wa_status_${wedding?.id || "default"}`;
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (e) {
      return {};
    }
  });

  // Table search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  const textareaRef = useRef(null);

  const showToast = (text, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync initial guest if opened directly for a specific person
  useEffect(() => {
    if (initialGuest) {
      setTargetMode("single");
      setSelectedGuestId(initialGuest.id);
    }
  }, [initialGuest]);

  // Persist statuses to localStorage
  const updateStatus = (guestId, newStatus) => {
    setStatuses((prev) => {
      const updated = { ...prev, [guestId]: newStatus };
      try {
        const key = `wedding_wa_status_${wedding?.id || "default"}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // ------------------- NORMALIZED GUESTS IN THIS MARRIAGE -------------------
  const processedGuests = useMemo(() => {
    const seen = new Set();
    return guests.map((g) => {
      const rawContact = g.contact || "";
      const normalizedPhone = normalizePhoneNumber(rawContact);
      const isValid = Boolean(normalizedPhone);
      const isDup = isValid && seen.has(normalizedPhone);
      if (isValid) seen.add(normalizedPhone);

      const status = statuses[g.id] || "NOT SENT";
      return {
        ...g,
        rawContact,
        phone: normalizedPhone,
        isValid,
        isDup,
        status,
      };
    });
  }, [guests, statuses]);

  // Filtered by selected target mode
  const targetedGuests = useMemo(() => {
    let list = processedGuests;

    if (targetMode === "single") {
      const found = list.find((g) => g.id === selectedGuestId);
      return found ? [found] : list.slice(0, 1);
    } else if (targetMode === "rsvp_pending") {
      list = list.filter((g) => (g.rsvp_status || "").toLowerCase() === "pending");
    } else if (targetMode === "rsvp_confirmed") {
      list = list.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed");
    } else if (targetMode === "bride") {
      list = list.filter((g) => (g.side || "").toLowerCase() === "bride");
    } else if (targetMode === "groom") {
      list = list.filter((g) => (g.side || "").toLowerCase() === "groom");
    } else if (targetMode === "missing_travel") {
      list = list.filter(
        (g) => !g.arrival_flight_train_no && !g.arrival_date && !g.departure_flight_train_no
      );
    }

    return list;
  }, [processedGuests, targetMode, selectedGuestId]);

  // Table search & status filtering
  const displayQueue = useMemo(() => {
    let list = targetedGuests;
    if (statusFilter !== "ALL") {
      list = list.filter((g) => g.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, "");
      list = list.filter(
        (g) =>
          g.guest_name.toLowerCase().includes(q) ||
          (g.contact && g.contact.toLowerCase().includes(q)) ||
          (qDigits && g.phone && g.phone.replace(/\D/g, "").includes(qDigits))
      );
    }
    return list;
  }, [targetedGuests, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = targetedGuests.length;
    const valid = targetedGuests.filter((g) => g.isValid).length;
    const sent = targetedGuests.filter((g) => g.status === "SENT").length;
    const opened = targetedGuests.filter((g) => g.status === "OPENED").length;
    const pending = total - sent - opened;
    return { total, valid, sent, opened, pending };
  }, [targetedGuests]);

  // Selected individual guest (for Single Person Mode)
  const currentSingleGuest = useMemo(() => {
    if (targetMode === "single") {
      return processedGuests.find((g) => g.id === selectedGuestId) || processedGuests[0] || null;
    }
    return targetedGuests[0] || null;
  }, [targetMode, processedGuests, selectedGuestId, targetedGuests]);

  // Personalized message for the preview
  const previewMessage = useMemo(() => {
    if (!currentSingleGuest) return "";
    return buildGuestMessage({
      template: messageDraft,
      guest: currentSingleGuest,
      wedding,
      varOn: false,
    });
  }, [messageDraft, currentSingleGuest, wedding]);

  // ------------------- ACTIONS -------------------
  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setMessageDraft(sanitizeUnicodeText(tmpl.text));
    showToast(`Loaded: ${tmpl.title}`);
  };

  const handleInsertToken = (token) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageDraft((prev) => sanitizeUnicodeText(`${prev} ${token}`));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const updated =
      messageDraft.substring(0, start) + token + messageDraft.substring(end);
    setMessageDraft(sanitizeUnicodeText(updated));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  const handleSendToGuest = (guest) => {
    if (!guest || !guest.isValid) {
      showToast("Cannot send: Invalid or missing phone number.", true);
      return;
    }

    // Build personalized message with anti-ban variation if enabled
    const msg = buildGuestMessage({
      template: messageDraft,
      guest,
      wedding,
      varOn,
      level: varLevel,
    });

    if (guest.status === "NOT SENT") {
      updateStatus(guest.id, "OPENED");
    }

    const success = sendWhatsAppMessage(guest.phone, msg);
    if (success) {
      showToast(`Opening WhatsApp for ${guest.guest_name}...`);
    }
  };

  const handleSendNextPending = () => {
    const next = targetedGuests.find(
      (g) => g.isValid && (g.status === "NOT SENT" || g.status === "OPENED")
    );
    if (!next) {
      showToast("✓ All valid recipients have been sent messages!");
      return;
    }
    handleSendToGuest(next);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Message copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-[28px] w-full max-w-5xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-fadeInUp ${
              toast.isError
                ? "bg-rose-900 text-white"
                : "bg-[#0f2922] text-[#84e030] border border-[#84e030]/40"
            }`}
          >
            {toast.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.text}</span>
          </div>
        )}

        {/* ================= MODAL HEADER ================= */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#f7fbf8] to-[#f2faf4]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#25d366]/20 text-[#128c7e] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <MessageSquare className="w-5 h-5 text-[#16a34a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  WhatsApp Message Desk
                </h2>
                <span className="text-[10px] bg-[#84e030]/20 text-[#165a2b] font-extrabold px-2.5 py-0.5 rounded-full border border-[#84e030]/40">
                  {wedding ? `${wedding.groom_name} & ${wedding.bride_name}` : "Wedding Directory"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Draft and dispatch personalized WhatsApp messages to guests in this marriage directory.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs">
          {/* 1. RECIPIENT TARGETING SELECTION */}
          <div className="bg-[#f8fafc] p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Select Target Recipients:</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={targetMode}
                  onChange={(e) => setTargetMode(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-0 max-w-full"
                >
                  <option value="all">👥 Send to All Guests ({processedGuests.length} Guests)</option>
                  <option value="single">🎯 Send to a Particular Person</option>
                  <option value="rsvp_pending">⏳ RSVP Pending Guests Only</option>
                  <option value="rsvp_confirmed">✓ RSVP Confirmed Guests Only</option>
                  <option value="bride">👰 Bride's Side Only</option>
                  <option value="groom">🤵 Groom's Side Only</option>
                  <option value="missing_travel">✈️ Missing Travel / Flight Details</option>
                </select>

                {/* If "Particular Person" is selected -> render search & selection dropdown */}
                {targetMode === "single" && (
                  <div className="flex-1 min-w-0 w-full sm:w-auto animate-fadeIn">
                    <select
                      value={selectedGuestId}
                      onChange={(e) => setSelectedGuestId(e.target.value)}
                      className="w-full bg-white border border-emerald-400 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-950 shadow-2xs focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                    >
                      {processedGuests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.guest_name} ({g.side || "Groom"}) • {g.isValid ? formatPhoneNumber(g.phone) : "⚠️ No valid phone"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-start md:self-auto text-xs">
              <span className="bg-emerald-100 text-emerald-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold border border-emerald-200 shadow-2xs text-[11px] sm:text-xs">
                {stats.valid} Valid Contacts
              </span>
              {stats.total - stats.valid > 0 && (
                <span className="bg-amber-100 text-amber-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold border border-amber-200 shadow-2xs text-[11px] sm:text-xs">
                  {stats.total - stats.valid} Missing Phone
                </span>
              )}
            </div>
          </div>

          {/* 2. TWO-COLUMN WORKSPACE: DRAFT & PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: PRE-DRAFTED TEMPLATES & EDITOR (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-4 md:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
              {/* Pre-Drafted Templates Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Pre-Drafted Message Templates:
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {DEFAULT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                        selectedTemplateId === tmpl.id
                          ? "bg-[#0f2922] text-[#84e030] border-[#0f2922] shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Draft Message:
                  </label>
                  {!HAS_NAME.test(messageDraft) && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Tip: Add {"{{NAME}}"} for guest name
                    </span>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  rows={5}
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Type message here... Use {{NAME}} for personalized name."
                  className="w-full bg-[#fbfdfb] border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 leading-relaxed font-sans resize-y"
                />
              </div>

              {/* Dynamic Tokens */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Insert Variables:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    "{{NAME}}",
                    "{{WEDDING}}",
                    "{{DATE}}",
                    "{{VENUE}}",
                    "{{SIDE}}",
                    "{{GROOM}}",
                    "{{BRIDE}}",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => handleInsertToken(token)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#edf9df] text-[#1c4d25] hover:bg-[#d8f5b8] border border-[#c3eeb0] transition-colors cursor-pointer"
                    >
                      +{token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anti-Ban Variation Settings */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 bg-[#f8fafc] p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modalVarToggle"
                    checked={varOn}
                    onChange={(e) => setVarOn(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="modalVarToggle" className="cursor-pointer select-none">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Randomize Variations (Anti-Spam)</span>
                    </span>
                  </label>
                </div>

                {varOn && (
                  <select
                    value={varLevel}
                    onChange={(e) => setVarLevel(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                  >
                    <option value="low">Low Variation</option>
                    <option value="medium">Medium Variation</option>
                    <option value="high">High Variation</option>
                  </select>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: SMARTPHONE PREVIEW (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-col justify-between text-slate-100">
              {/* Header inside phone */}
              <div className="bg-slate-800/90 rounded-xl px-3 py-2 flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {currentSingleGuest ? currentSingleGuest.guest_name.charAt(0).toUpperCase() : "G"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {currentSingleGuest ? currentSingleGuest.guest_name : "Guest Preview"}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      {currentSingleGuest?.phone ? formatPhoneNumber(currentSingleGuest.phone) : "WhatsApp"}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                  Live Preview
                </span>
              </div>

              {/* Chat Wallpaper & Bubble */}
              <div className="flex-1 bg-[#0b141a] rounded-xl p-3.5 flex flex-col justify-end min-h-[160px] relative overflow-hidden border border-slate-800">
                <div className="bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-xs p-3 shadow-md max-w-[95%] self-end relative text-xs leading-relaxed font-sans whitespace-pre-wrap">
                  <p>{previewMessage || "Your drafted personalized message will appear here."}</p>
                  <div className="text-[9px] text-emerald-300/60 text-right mt-1 font-mono">
                    ✓✓
                  </div>
                </div>
              </div>

              {/* Direct Actions in Preview */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(previewMessage, currentSingleGuest?.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === currentSingleGuest?.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {targetMode === "single" && (
                  <button
                    type="button"
                    disabled={!currentSingleGuest || !currentSingleGuest.isValid}
                    onClick={() => currentSingleGuest && handleSendToGuest(currentSingleGuest)}
                    className="bg-[#25d366] hover:bg-[#20bd5a] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all btn-interactive"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to {currentSingleGuest?.guest_name.split(" ")[0]}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. BATCH RECIPIENTS QUEUE & STATUS TABLE (For "All Guests" / Filtered Modes) */}
          {targetMode !== "single" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Recipients in this Wedding ({targetedGuests.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Sent: <b className="text-emerald-700">{stats.sent}</b> • Opened:{" "}
                      <b className="text-sky-700">{stats.opened}</b> • Pending:{" "}
                      <b className="text-slate-700">{stats.pending}</b>
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Pills */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                    {["ALL", "NOT SENT", "OPENED", "SENT"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === st
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Search within list */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name..."
                      className="bg-[#f8fafc] border border-slate-200 rounded-xl pl-7 pr-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  {/* Prominent "Send Next Pending" */}
                  <button
                    type="button"
                    onClick={handleSendNextPending}
                    className="bg-[#0f2922] hover:bg-[#163a30] text-[#84e030] font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer btn-interactive"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Next Pending</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 bg-opacity-95">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Guest Name</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Contact Number</th>
                      <th className="py-2.5 px-3 w-28">Status</th>
                      <th className="py-2.5 px-3 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {displayQueue.map((g, idx) => {
                      const isSent = g.status === "SENT";
                      const isOpened = g.status === "OPENED";

                      return (
                        <tr
                          key={g.id}
                          className="hover:bg-[#f8fdfa] transition-colors group"
                        >
                          <td className="py-2 px-3 text-center font-bold text-slate-400">
                            {g.sr_no || idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">
                                {g.guest_name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {g.side || "Groom"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {g.isValid ? (
                              <span className="font-mono font-semibold text-slate-800">
                                {formatPhoneNumber(g.phone)}
                              </span>
                            ) : (
                              <span className="text-rose-600 text-[11px]">
                                {g.rawContact ? `Invalid: ${g.rawContact}` : "No number"}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={g.status}
                              onChange={(e) => updateStatus(g.id, e.target.value)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                                isSent
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  : isOpened
                                  ? "bg-sky-100 text-sky-900 border-sky-300"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}
                            >
                              <option value="NOT SENT">NOT SENT</option>
                              <option value="OPENED">OPENED</option>
                              <option value="SENT">SENT</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              disabled={!g.isValid}
                              onClick={() => handleSendToGuest(g)}
                              className="bg-[#25d366] hover:bg-[#20bd5a] disabled:opacity-30 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 mx-auto cursor-pointer shadow-2xs btn-interactive"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>SEND</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {displayQueue.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          No guests match the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-[11px] text-slate-500 font-medium">
            Personalized WhatsApp sender for <b>{wedding ? `${wedding.groom_name} & ${wedding.bride_name}` : "current wedding directory"}</b>.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
