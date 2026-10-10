import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  Phone,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Search,
  Eye,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Heart,
  Calendar,
  MapPin,
  Plane,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  normalizePhoneNumber,
  formatPhoneNumber,
  varyMessage,
  buildGuestMessage,
  sendWhatsAppMessage,
  createPRNG,
  DEFAULT_TEMPLATES,
  HAS_NAME,
} from "../utils/whatsappUtils";

export default function WhatsAppMessagingSection({
  guests = [],
  selectedWedding = null,
  weddings = [],
  onSelectWedding,
}) {
  const { user, isAdmin, isCallCenter } = useAuth();

  // ------------------- CAMPAIGN STORAGE STATE -------------------
  const [campaigns, setCampaigns] = useState(() => {
    try {
      const idx = JSON.parse(localStorage.getItem("rsvp:index") || "[]");
      return Array.isArray(idx) ? idx : [];
    } catch (e) {
      return [];
    }
  });

  const [activeCampaignId, setActiveCampaignId] = useState(() => {
    return sessionStorage.getItem("rsvp:active") || localStorage.getItem("rsvp:last") || "";
  });

  // Current Campaign Data
  const [campaignName, setCampaignName] = useState("Default Campaign");
  const [masterMessage, setMasterMessage] = useState(
    DEFAULT_TEMPLATES[0].text
  );
  const [varOn, setVarOn] = useState(true);
  const [varLevel, setVarLevel] = useState("low");
  const [generatedSig, setGeneratedSig] = useState("");
  const [guestStatuses, setGuestStatuses] = useState({}); // { [guestId]: "NOT SENT" | "OPENED" | "SENT" }
  const [generatedMessages, setGeneratedMessages] = useState({}); // { [guestId]: string }

  // ------------------- RECIPIENT TARGETING & SELECTION -------------------
  const [targetFilter, setTargetFilter] = useState("all"); // 'all' | 'single' | 'rsvp_pending' | 'rsvp_confirmed' | 'bride' | 'groom' | 'missing_flight' | 'uncalled'
  const [selectedSingleGuestId, setSelectedSingleGuestId] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState(new Set());
  const [searchInQueue, setSearchInQueue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'NOT SENT' | 'OPENED' | 'SENT'

  // Modals & UI States
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [newCampaignInput, setNewCampaignInput] = useState("");
  const [viewingMessageGuest, setViewingMessageGuest] = useState(null);
  const [previewGuestIndex, setPreviewGuestIndex] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const textareaRef = useRef(null);

  const showToast = (text, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Helper for signature to check if generated messages are outdated
  const currentSig = useMemo(() => {
    return `${masterMessage}|${varOn}|${varLevel}`;
  }, [masterMessage, varOn, varLevel]);

  const isGenerated = Boolean(generatedSig && generatedSig === currentSig);

  // ------------------- LOAD / INIT ACTIVE CAMPAIGN -------------------
  useEffect(() => {
    if (!campaigns.length) {
      // Create initial default campaign if none exists
      const initialId = "campaign_001";
      const initialName = selectedWedding
        ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name} - Broadcast`
        : "Wedding RSVP Broadcast";
      const defaultCamp = {
        id: initialId,
        name: initialName,
        message: DEFAULT_TEMPLATES[0].text,
        varOn: true,
        level: "low",
        statuses: {},
        generatedSig: "",
        generatedMessages: {},
      };
      localStorage.setItem(`rsvp:c:${initialId}`, JSON.stringify(defaultCamp));
      localStorage.setItem("rsvp:index", JSON.stringify([{ id: initialId, name: initialName }]));
      setCampaigns([{ id: initialId, name: initialName }]);
      setActiveCampaignId(initialId);
      setCampaignName(initialName);
      setMasterMessage(defaultCamp.message);
      setVarOn(defaultCamp.varOn);
      setVarLevel(defaultCamp.level);
    } else {
      let targetId = activeCampaignId;
      if (!targetId || !campaigns.some((c) => c.id === targetId)) {
        targetId = campaigns[0].id;
      }
      setActiveCampaignId(targetId);
      try {
        const stored = JSON.parse(localStorage.getItem(`rsvp:c:${targetId}`) || "null");
        if (stored) {
          setCampaignName(stored.name || "Campaign");
          setMasterMessage(stored.message ?? DEFAULT_TEMPLATES[0].text);
          setVarOn(stored.varOn ?? true);
          setVarLevel(stored.level ?? "low");
          setGeneratedSig(stored.generatedSig ?? "");
          setGuestStatuses(stored.statuses ?? {});
          setGeneratedMessages(stored.generatedMessages ?? {});
        }
      } catch (e) {
        console.error("Error loading campaign from storage:", e);
      }
    }
  }, [activeCampaignId, campaigns.length]);

  // Save current campaign changes to localStorage
  const saveCampaignState = (overrides = {}) => {
    if (!activeCampaignId) return;
    const payload = {
      id: activeCampaignId,
      name: overrides.name ?? campaignName,
      message: overrides.message ?? masterMessage,
      varOn: overrides.varOn ?? varOn,
      level: overrides.level ?? varLevel,
      generatedSig: overrides.generatedSig ?? generatedSig,
      statuses: overrides.statuses ?? guestStatuses,
      generatedMessages: overrides.generatedMessages ?? generatedMessages,
    };
    try {
      localStorage.setItem(`rsvp:c:${activeCampaignId}`, JSON.stringify(payload));
      sessionStorage.setItem("rsvp:active", activeCampaignId);
      localStorage.setItem("rsvp:last", activeCampaignId);
    } catch (e) {
      console.warn("Storage full or write error:", e);
    }
  };

  // Switch Active Campaign
  const handleSwitchCampaign = (id) => {
    setActiveCampaignId(id);
    sessionStorage.setItem("rsvp:active", id);
    localStorage.setItem("rsvp:last", id);
    try {
      const stored = JSON.parse(localStorage.getItem(`rsvp:c:${id}`) || "null");
      if (stored) {
        setCampaignName(stored.name || "Campaign");
        setMasterMessage(stored.message ?? DEFAULT_TEMPLATES[0].text);
        setVarOn(stored.varOn ?? true);
        setVarLevel(stored.level ?? "low");
        setGeneratedSig(stored.generatedSig ?? "");
        setGuestStatuses(stored.statuses ?? {});
        setGeneratedMessages(stored.generatedMessages ?? {});
        showToast(`Opened campaign: ${stored.name}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create New Campaign
  const handleCreateCampaign = () => {
    const name = newCampaignInput.trim();
    if (!name) return;
    const id = `campaign_${Date.now().toString(36)}`;
    const newCamp = {
      id,
      name,
      message: masterMessage || DEFAULT_TEMPLATES[0].text,
      varOn: true,
      level: "low",
      statuses: {},
      generatedSig: "",
      generatedMessages: {},
    };
    try {
      localStorage.setItem(`rsvp:c:${id}`, JSON.stringify(newCamp));
      const updatedIdx = [...campaigns, { id, name }];
      localStorage.setItem("rsvp:index", JSON.stringify(updatedIdx));
      setCampaigns(updatedIdx);
      setActiveCampaignId(id);
      setCampaignName(name);
      setGuestStatuses({});
      setGeneratedMessages({});
      setGeneratedSig("");
      setIsNewCampaignModalOpen(false);
      setNewCampaignInput("");
      showToast(`Campaign "${name}" created!`);
    } catch (e) {
      showToast("Could not create campaign", true);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = () => {
    if (!activeCampaignId) return;
    if (campaigns.length <= 1) {
      showToast("Cannot delete the only campaign.", true);
      return;
    }
    const currentName = campaignName;
    try {
      localStorage.removeItem(`rsvp:c:${activeCampaignId}`);
      const filtered = campaigns.filter((c) => c.id !== activeCampaignId);
      localStorage.setItem("rsvp:index", JSON.stringify(filtered));
      setCampaigns(filtered);
      handleSwitchCampaign(filtered[0].id);
      showToast(`Campaign "${currentName}" deleted.`);
    } catch (e) {
      showToast("Error deleting campaign", true);
    }
  };

  // ------------------- NORMALIZE DIRECTORY GUESTS -------------------
  const processedGuests = useMemo(() => {
    const seen = new Set();
    return guests.map((g) => {
      const rawContact = g.contact || "";
      const normalizedPhone = normalizePhoneNumber(rawContact);
      const isValid = Boolean(normalizedPhone);
      const isDup = isValid && seen.has(normalizedPhone);
      if (isValid) seen.add(normalizedPhone);

      const status = guestStatuses[g.id] || "NOT SENT";
      const customMsg = generatedMessages[g.id] || "";

      return {
        ...g,
        rawContact,
        phone: normalizedPhone,
        isValid,
        isDup,
        status,
        msg: customMsg,
      };
    });
  }, [guests, guestStatuses, generatedMessages]);

  // Filter based on Target Selection Dropdown
  const targetedGuests = useMemo(() => {
    let list = processedGuests;

    if (targetFilter === "single") {
      if (selectedSingleGuestId) {
        list = list.filter((g) => g.id === selectedSingleGuestId);
      } else if (list.length > 0) {
        list = [list[0]];
      }
    } else if (targetFilter === "rsvp_pending") {
      list = list.filter((g) => (g.rsvp_status || "").toLowerCase() === "pending");
    } else if (targetFilter === "rsvp_confirmed") {
      list = list.filter((g) => (g.rsvp_status || "").toLowerCase() === "confirmed");
    } else if (targetFilter === "bride") {
      list = list.filter((g) => (g.side || "").toLowerCase() === "bride");
    } else if (targetFilter === "groom") {
      list = list.filter((g) => (g.side || "").toLowerCase() === "groom");
    } else if (targetFilter === "missing_flight") {
      list = list.filter(
        (g) => !g.arrival_flight_train_no && !g.arrival_date && !g.departure_flight_train_no
      );
    } else if (targetFilter === "uncalled") {
      list = list.filter((g) => !g.call_count || Number(g.call_count) <= 1);
    }

    return list;
  }, [processedGuests, targetFilter, selectedSingleGuestId]);

  // Filter with Search query & Status tab in table
  const filteredQueue = useMemo(() => {
    let list = targetedGuests;
    if (statusFilter !== "ALL") {
      list = list.filter((g) => g.status === statusFilter);
    }
    if (searchInQueue.trim()) {
      const q = searchInQueue.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, "");
      list = list.filter(
        (g) =>
          g.guest_name.toLowerCase().includes(q) ||
          (g.contact && g.contact.toLowerCase().includes(q)) ||
          (qDigits && g.phone && g.phone.replace(/\D/g, "").includes(qDigits))
      );
    }
    return list;
  }, [targetedGuests, statusFilter, searchInQueue]);

  // Statistics on targeted recipients
  const stats = useMemo(() => {
    const total = targetedGuests.length;
    const valid = targetedGuests.filter((g) => g.isValid).length;
    const invalid = total - valid;
    const sent = targetedGuests.filter((g) => g.status === "SENT").length;
    const opened = targetedGuests.filter((g) => g.status === "OPENED").length;
    const notSent = total - sent - opened;
    const duplicates = targetedGuests.filter((g) => g.isDup).length;
    return { total, valid, invalid, sent, opened, notSent, duplicates };
  }, [targetedGuests]);

  // ------------------- GENERATE MESSAGES -------------------
  const handleGenerateMessages = () => {
    if (!targetedGuests.length) {
      showToast("No guests found in the selected target group.", true);
      return;
    }
    if (!masterMessage.trim()) {
      showToast("Please enter a message draft first.", true);
      return;
    }

    const seed = (Math.random() * 4294967296) >>> 0;
    const newMessages = { ...generatedMessages };

    targetedGuests.forEach((g, index) => {
      const prng = createPRNG(seed + index * 7919);
      const built = buildGuestMessage({
        template: masterMessage,
        guest: g,
        wedding: selectedWedding,
        varOn,
        level: varLevel,
        randFn: prng,
      });
      newMessages[g.id] = built;
    });

    const newSig = currentSig;
    setGeneratedMessages(newMessages);
    setGeneratedSig(newSig);

    saveCampaignState({
      generatedMessages: newMessages,
      generatedSig: newSig,
      message: masterMessage,
      varOn,
      level: varLevel,
    });

    showToast(`✓ Generated personalized messages for ${targetedGuests.length} guests!`);
  };

  // Insert token chip into message textarea
  const handleInsertToken = (token) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMasterMessage((prev) => `${prev} ${token}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = masterMessage;
    const updated = text.substring(0, start) + token + text.substring(end);
    setMasterMessage(updated);
    saveCampaignState({ message: updated });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);
  };

  // Load Preset Template
  const handleSelectTemplate = (templateText) => {
    setMasterMessage(templateText);
    saveCampaignState({ message: templateText });
    showToast("Template applied! Press 'Generate Messages' to update queue.");
  };

  // ------------------- STATUS & SENDING ACTIONS -------------------
  const updateGuestStatus = (guestId, newStatus) => {
    const updated = { ...guestStatuses, [guestId]: newStatus };
    setGuestStatuses(updated);
    saveCampaignState({ statuses: updated });
  };

  const handleSendSingleGuest = (guest) => {
    if (!guest || !guest.isValid) {
      showToast("Cannot send: Invalid or missing phone number.", true);
      return;
    }

    // Use pre-generated message if available, otherwise compile dynamically on the fly
    const msgToSend =
      guest.msg ||
      buildGuestMessage({
        template: masterMessage,
        guest,
        wedding: selectedWedding,
        varOn,
        level: varLevel,
      });

    // Update status to OPENED
    if (guest.status === "NOT SENT") {
      updateGuestStatus(guest.id, "OPENED");
    }

    const success = sendWhatsAppMessage(guest.phone, msgToSend);
    if (success) {
      showToast(`Opening WhatsApp for ${guest.guest_name}...`);
    }
  };

  // Step-by-step Batch "Send Next Pending" helper
  const handleSendNextPending = () => {
    const nextPending = targetedGuests.find(
      (g) => g.isValid && (g.status === "NOT SENT" || g.status === "OPENED")
    );
    if (!nextPending) {
      showToast("🎉 All valid guests have been sent messages!");
      return;
    }
    handleSendSingleGuest(nextPending);
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Message copied to clipboard!");
  };

  // Preview Guest item for the real-time smartphone bubble
  const currentPreviewGuest = useMemo(() => {
    if (!targetedGuests.length) return null;
    const safeIdx = Math.max(0, Math.min(previewGuestIndex, targetedGuests.length - 1));
    return targetedGuests[safeIdx];
  }, [targetedGuests, previewGuestIndex]);

  const currentPreviewMessage = useMemo(() => {
    if (!currentPreviewGuest) return "";
    if (isGenerated && currentPreviewGuest.msg) {
      return currentPreviewGuest.msg;
    }
    return buildGuestMessage({
      template: masterMessage,
      guest: currentPreviewGuest,
      wedding: selectedWedding,
      varOn: false,
    });
  }, [currentPreviewGuest, isGenerated, masterMessage, selectedWedding]);

  return (
    <div className="p-5 md:p-7 space-y-6 flex-1 animate-fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold animate-fadeInUp ${
            toastMsg.isError
              ? "bg-rose-900 text-white border border-rose-700"
              : "bg-[#0f2922] text-[#84e030] border border-[#84e030]/40 shadow-emerald-950/40"
          }`}
        >
          {toastMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#84e030]" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ================= HEADER & CAMPAIGN CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              WhatsApp Broadcast & Message Desk
            </h1>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
              {isAdmin ? "Super Admin Desk" : "Call Desk Telecaller"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Draft personalized WhatsApp messages with anti-ban variations and dispatch directly to guest contacts.
          </p>
        </div>

        {/* Campaign Switcher / Management */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[200px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Campaign
            </label>
            <div className="relative">
              <select
                value={activeCampaignId}
                onChange={(e) => handleSwitchCampaign(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer appearance-none pr-8"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="mt-4 sm:mt-0 self-end bg-[#0f2922] hover:bg-[#163a30] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs btn-interactive"
            title="Create new message campaign"
          >
            <Plus className="w-3.5 h-3.5 text-[#84e030]" />
            <span>+ New Campaign</span>
          </button>

          {campaigns.length > 1 && (
            <button
              type="button"
              onClick={handleDeleteCampaign}
              className="mt-4 sm:mt-0 self-end bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              title="Delete current campaign"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= TARGET SELECTION & FILTER BANNER ================= */}
      <div className="bg-gradient-to-r from-[#f7fbf8] to-[#f0f9f3] p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Target Audience Dropdown */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Target Recipients ({targetedGuests.length} Guests)</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="bg-white border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-[220px]"
              >
                <option value="all">👥 All Guests in Directory ({processedGuests.length})</option>
                <option value="single">🎯 Send to a Particular Guest</option>
                <option value="rsvp_pending">⏳ RSVP Pending Only</option>
                <option value="rsvp_confirmed">✓ RSVP Confirmed Only</option>
                <option value="bride">👰 Bride's Side Only</option>
                <option value="groom">🤵 Groom's Side Only</option>
                <option value="missing_flight">✈️ Missing Travel / Flight Details</option>
                <option value="uncalled">📞 Telecalling Queue (0-1 Calls)</option>
              </select>

              {/* If "Particular Guest" is selected, render live guest selection dropdown */}
              {targetFilter === "single" && (
                <div className="animate-fadeIn flex-1 min-w-[240px]">
                  <select
                    value={selectedSingleGuestId || (processedGuests[0]?.id ?? "")}
                    onChange={(e) => setSelectedSingleGuestId(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-950 shadow-2xs focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    {processedGuests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.guest_name} ({g.side}) • {g.isValid ? formatPhoneNumber(g.phone) : "⚠️ No valid phone"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Contact Verification Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-emerald-100/90 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{stats.valid} Valid Contacts</span>
            </span>

            {stats.invalid > 0 && (
              <span className="bg-amber-100/90 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>{stats.invalid} Missing / Invalid</span>
              </span>
            )}

            {stats.duplicates > 0 && (
              <span className="bg-sky-100 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-xl font-bold shadow-2xs">
                {stats.duplicates} Duplicate Phones
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= TWO-COLUMN WORKSPACE: DRAFT & PREVIEW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: MESSAGE COMPOSER & TEMPLATES (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          {/* Preset Template Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Quick Templates
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {DEFAULT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.text)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#f8fafc] hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-slate-200 transition-all cursor-pointer shrink-0 shadow-2xs btn-interactive"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Master Message Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Message Master Template</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({masterMessage.length} chars)
                </span>
              </label>

              {!HAS_NAME.test(masterMessage) && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Tip: Add {"{{NAME}}"} for personalization</span>
                </span>
              )}
            </div>

            <textarea
              ref={textareaRef}
              rows={6}
              value={masterMessage}
              onChange={(e) => {
                setMasterMessage(e.target.value);
                saveCampaignState({ message: e.target.value });
              }}
              placeholder="Type your message here... Use {{NAME}} to automatically personalize for each guest."
              className="w-full bg-[#fbfdfb] border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white leading-relaxed resize-y shadow-inner font-sans"
            />
          </div>

          {/* Clickable Token Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 block">
              Click to insert dynamic tags:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "{{NAME}}", desc: "Guest Name" },
                { label: "{{WEDDING}}", desc: "Couple Wedding Title" },
                { label: "{{VENUE}}", desc: "Venue / City" },
                { label: "{{DATE}}", desc: "Wedding Date" },
                { label: "{{SIDE}}", desc: "Bride / Groom Side" },
                { label: "{{GROOM}}", desc: "Groom Name" },
                { label: "{{BRIDE}}", desc: "Bride Name" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleInsertToken(chip.label)}
                  title={`Inserts ${chip.desc}`}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#edf9df] text-[#1c4d25] hover:bg-[#d8f5b8] border border-[#c3eeb0] transition-colors cursor-pointer shadow-2xs"
                >
                  +{chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anti-Ban Variation Engine Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="varToggle"
                  checked={varOn}
                  onChange={(e) => {
                    setVarOn(e.target.checked);
                    saveCampaignState({ varOn: e.target.checked });
                  }}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="varToggle" className="cursor-pointer select-none">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Anti-Ban Message Variation Engine</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Randomizes emojis & phrase synonyms so WhatsApp does not flag messages as bulk spam.
                  </p>
                </label>
              </div>

              {varOn && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[11px] font-bold text-slate-600">Level:</span>
                  <select
                    value={varLevel}
                    onChange={(e) => {
                      setVarLevel(e.target.value);
                      saveCampaignState({ level: e.target.value });
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-2xs"
                  >
                    <option value="low">Low (Subtle Emojis)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Max Diversity)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Generate Messages Action */}
            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <div className="text-xs font-bold">
                {isGenerated ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{targetedGuests.length} messages generated & ready</span>
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Click Generate to build unique variations</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateMessages}
                className="bg-[#0f2922] hover:bg-[#163a30] text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 cursor-pointer shadow-sm btn-interactive"
              >
                <Sparkles className="w-4 h-4 text-[#84e030]" />
                <span>{isGenerated ? "Regenerate Variations" : "Generate Messages"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME SMARTPHONE PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800 flex-1 flex flex-col justify-between text-slate-100">
            {/* Phone Header Bar */}
            <div className="bg-slate-800/90 rounded-2xl px-3.5 py-2.5 flex items-center justify-between border border-slate-700/60 mb-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                  {currentPreviewGuest ? currentPreviewGuest.guest_name.charAt(0).toUpperCase() : "G"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white truncate max-w-[130px]">
                    {currentPreviewGuest ? currentPreviewGuest.guest_name : "Select Guest"}
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    {currentPreviewGuest?.phone ? formatPhoneNumber(currentPreviewGuest.phone) : "WhatsApp"}
                  </p>
                </div>
              </div>

              {/* Guest Carousel Nav */}
              {targetedGuests.length > 1 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewGuestIndex((prev) =>
                        prev > 0 ? prev - 1 : targetedGuests.length - 1
                      )
                    }
                    className="p-1 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Previous guest preview"
                  >
                    ←
                  </button>
                  <span className="text-[10px] text-slate-400 px-1 font-mono">
                    {previewGuestIndex + 1}/{targetedGuests.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewGuestIndex((prev) =>
                        prev < targetedGuests.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="p-1 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Next guest preview"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp Chat Wallpaper & Bubble */}
            <div className="flex-1 bg-[#0b141a] rounded-2xl p-4 flex flex-col justify-end min-h-[220px] relative overflow-hidden border border-slate-800">
              {/* Subtle WhatsApp wallpaper pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#84e030_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Incoming / Outgoing WhatsApp Bubble */}
              <div className="bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-xs p-3.5 shadow-md max-w-[92%] self-end relative text-xs leading-relaxed font-sans whitespace-pre-wrap animate-fadeIn">
                <p>{currentPreviewMessage || "Your drafted personalized message will appear here."}</p>
                <div className="text-[9px] text-emerald-200/60 text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                  <span>Just now</span>
                  <span>✓✓</span>
                </div>
              </div>
            </div>

            {/* Direct Send from Preview */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  currentPreviewMessage &&
                  handleCopyMessage(currentPreviewMessage, currentPreviewGuest?.id)
                }
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === currentPreviewGuest?.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!currentPreviewGuest || !currentPreviewGuest.isValid}
                onClick={() => currentPreviewGuest && handleSendSingleGuest(currentPreviewGuest)}
                className="bg-[#25d366] hover:bg-[#20bd5a] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all btn-interactive"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BATCH SENDING QUEUE & RECIPIENTS TABLE ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs space-y-4 p-5 md:p-6">
        {/* Table Top Controls & Step-by-Step Dispatcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Broadcast Queue & Delivery Status</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredQueue.length} {filteredQueue.length === 1 ? "Guest" : "Guests"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sent: <b className="text-emerald-700">{stats.sent}</b> • Opened:{" "}
              <b className="text-sky-700">{stats.opened}</b> • Pending:{" "}
              <b className="text-slate-700">{stats.notSent}</b>
            </p>
          </div>

          {/* Quick Filter Tabs & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {["ALL", "NOT SENT", "OPENED", "SENT"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search within Queue */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInQueue}
                onChange={(e) => setSearchInQueue(e.target.value)}
                placeholder="Search recipient..."
                className="bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Prominent "Send Next Pending" Button */}
            <button
              type="button"
              onClick={handleSendNextPending}
              className="bg-[#0f2922] hover:bg-[#163a30] text-[#84e030] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer btn-interactive"
              title="Opens WhatsApp for the next pending guest with 1 click"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Next Pending</span>
            </button>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">Sr</th>
                <th className="py-3 px-4 min-w-[200px]">Guest Name & Side</th>
                <th className="py-3 px-4 min-w-[180px]">Contact & WhatsApp</th>
                <th className="py-3 px-3 w-32">Status</th>
                <th className="py-3 px-4 min-w-[240px]">Rendered Message</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQueue.map((g, idx) => {
                const isSent = g.status === "SENT";
                const isOpened = g.status === "OPENED";
                const rendered =
                  g.msg ||
                  buildGuestMessage({
                    template: masterMessage,
                    guest: g,
                    wedding: selectedWedding,
                    varOn: false,
                  });

                return (
                  <tr
                    key={g.id}
                    className="hover:bg-[#f8fdfa] transition-colors duration-150 group"
                  >
                    {/* Sr No */}
                    <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                      {g.sr_no || idx + 1}
                    </td>

                    {/* Name & Side */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {g.guest_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{g.guest_name}</p>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                              (g.side || "").toLowerCase() === "bride"
                                ? "bg-rose-50 text-rose-800"
                                : "bg-sky-50 text-sky-800"
                            }`}
                          >
                            {g.side || "Groom"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Validation */}
                    <td className="py-3 px-4">
                      {g.isValid ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">
                            {formatPhoneNumber(g.phone)}
                          </span>
                          {g.isDup && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                              dup
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded">
                          {g.rawContact ? `Invalid: ${g.rawContact}` : "No phone provided"}
                        </span>
                      )}
                    </td>

                    {/* Delivery Status Selector */}
                    <td className="py-3 px-3">
                      <select
                        value={g.status}
                        onChange={(e) => updateGuestStatus(g.id, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                          isSent
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : isOpened
                            ? "bg-sky-100 text-sky-900 border-sky-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        <option value="NOT SENT">⚪ NOT SENT</option>
                        <option value="OPENED">🔵 OPENED</option>
                        <option value="SENT">🟢 SENT</option>
                      </select>
                    </td>

                    {/* Rendered Message Sneak Peek */}
                    <td className="py-3 px-4">
                      <p
                        title={rendered}
                        className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed"
                      >
                        {rendered}
                      </p>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingMessageGuest({ ...g, renderedMessage: rendered })}
                          title="View Full Message"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={!g.isValid}
                          onClick={() => handleSendSingleGuest(g)}
                          title="Open WhatsApp with personalized message"
                          className="bg-[#25d366] hover:bg-[#20bd5a] disabled:opacity-40 text-slate-950 font-bold text-[11px] px-3 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-2xs btn-interactive"
                        >
                          <Send className="w-3 h-3" />
                          <span>SEND</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredQueue.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No recipients match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: VIEW FULL MESSAGE MODAL ================= */}
      {viewingMessageGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  {viewingMessageGuest.guest_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {viewingMessageGuest.guest_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {viewingMessageGuest.phone || "No phone"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingMessageGuest(null)}
                className="w-7 h-7 rounded-full bg-white text-slate-400 hover:text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingMessageGuest.renderedMessage}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyMessage(
                      viewingMessageGuest.renderedMessage,
                      viewingMessageGuest.id
                    )
                  }
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>

                <button
                  type="button"
                  disabled={!viewingMessageGuest.isValid}
                  onClick={() => {
                    handleSendSingleGuest(viewingMessageGuest);
                    setViewingMessageGuest(null);
                  }}
                  className="bg-[#25d366] hover:bg-[#20bd5a] disabled:opacity-40 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm btn-interactive"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CREATE NEW CAMPAIGN MODAL ================= */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Create New Message Campaign
            </h3>
            <p className="text-xs text-slate-500">
              Enter a name for this broadcast campaign (e.g. "Sangeet Event Reminder", "Travel Ticket Followup").
            </p>

            <input
              type="text"
              autoFocus
              value={newCampaignInput}
              onChange={(e) => setNewCampaignInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCampaign()}
              placeholder="e.g. Sangeet Evening Reminder"
              className="w-full bg-[#f8fafc] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewCampaignModalOpen(false);
                  setNewCampaignInput("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={!newCampaignInput.trim()}
                className="bg-[#0f2922] hover:bg-[#163a30] disabled:opacity-40 text-[#84e030] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-sm btn-interactive"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
