import React, { useState, useEffect, useRef } from "react";
import {
  PhoneCall,
  X,
  MessageSquare,
  Sparkles,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const CALL_OUTCOMES = [
  { value: "Connected", label: "Connected (Spoke with guest)" },
  { value: "RSVP Confirmed", label: "RSVP Confirmed on Call" },
  { value: "No Answer", label: "No Answer / Ringing" },
  { value: "Busy", label: "Busy / Line Engaged" },
  { value: "Callback Requested", label: "Callback Requested" },
  { value: "Declined RSVP", label: "Declined RSVP on Call" },
  { value: "Wrong Number", label: "Wrong Number / Unreachable" },
];

const SUGGESTED_NOTES_TAGS = [
  "Confirmed 3-day stay",
  "Needs airport shuttle",
  "Vegetarian food",
  "Jain food",
  "Traveling with family",
  "Room check-in early morning",
];

const normalizeRsvp = (status) => {
  if (!status) return "Confirmed";
  const s = String(status).toLowerCase().trim();
  if (s.includes("confirm") || s.includes("attend")) return "Confirmed";
  if (s.includes("pend")) return "Pending";
  if (s.includes("decline") || s.includes("regret") || s.includes("not")) return "Declined";
  return "Confirmed";
};

export default function CallLogModal({
  isOpen,
  guest,
  wedding,
  onClose,
  onCallLogged,
}) {
  const { user, isViewOnly } = useAuth();

  const [activeTab, setActiveTab] = useState("call_desk"); // 'call_desk' or 'edit_guest'
  const [callLogs, setCallLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingGuest, setIsSavingGuest] = useState(false);

  // Form State
  const [outcome, setOutcome] = useState("Connected");
  const [summary, setSummary] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [updateRsvp, setUpdateRsvp] = useState("Confirmed");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Inline Log Editing
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogSummary, setEditingLogSummary] = useState("");
  const [editingLogOutcome, setEditingLogOutcome] = useState("");

  // Editable Guest Details Form State
  const [guestFormData, setGuestFormData] = useState({
    guest_name: "",
    contact: "",
    side: "Groom",
    rsvp_status: "Confirmed",
    arrival_date: "",
    arrival_flight_train_no: "",
    departure_date: "",
    departure_flight_train_no: "",
    special_request: "",
  });

  const activeGuestIdRef = useRef(null);

  useEffect(() => {
    if (isOpen && guest) {
      if (activeGuestIdRef.current !== guest.id) {
        activeGuestIdRef.current = guest.id;
        loadLogs(guest.id);
        setSummary("");
        setCallbackDate("");
        setUpdateRsvp(normalizeRsvp(guest.rsvp_status));
        setErrorMsg("");
        setSuccessMsg("");
        setEditingLogId(null);
        setActiveTab("call_desk");

        setGuestFormData({
          guest_name: guest.guest_name || "",
          contact: guest.contact || "",
          side: guest.side || "Groom",
          rsvp_status: normalizeRsvp(guest.rsvp_status),
          arrival_date: guest.arrival_date || "",
          arrival_flight_train_no: guest.arrival_flight_train_no || "",
          departure_date: guest.departure_date || "",
          departure_flight_train_no: guest.departure_flight_train_no || "",
          special_request: guest.special_request || "",
        });
      }
    } else if (!isOpen) {
      activeGuestIdRef.current = null;
    }
  }, [isOpen, guest?.id]);

  const loadLogs = async (guestIdToLoad = guest?.id) => {
    if (!guestIdToLoad) return;
    setIsLoadingLogs(true);
    try {
      const res = await api.fetchGuestCallLogs(guestIdToLoad);
      setCallLogs(res.data || []);
    } catch (e) {
      console.error("Error loading call logs:", e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  if (!isOpen || !guest) return null;

  const currentCallCount = callLogs.length;
  const nextCallNumber = currentCallCount + 1;

  const handleAddTagToSummary = (tagText) => {
    setSummary((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tagText;
      return `${trimmed}. ${tagText}`;
    });
  };

  // Submit new call entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) {
      setErrorMsg("Please write discussion notes / summary in the text box.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await api.createCallLog({
        guest_id: guest.id,
        wedding_id: guest.wedding_id || wedding?.id || "wedding_01",
        agent_id: user?.id,
        agent_name: user?.name || "Call Desk Agent",
        call_outcome: outcome,
        call_summary: summary.trim(),
        callback_date: callbackDate || null,
        update_rsvp: updateRsvp || null,
      });

      setSuccessMsg(`✓ Call #${nextCallNumber} recorded!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      setSummary("");
      setCallbackDate("");
      await loadLogs(guest.id);

      if (onCallLogged) {
        onCallLogged();
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to save call");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save inline edit for past call log
  const handleSaveEditLog = async (logId) => {
    if (!editingLogSummary.trim()) return;
    try {
      await api.updateCallLog(
        logId,
        {
          call_outcome: editingLogOutcome,
          call_summary: editingLogSummary.trim(),
        },
        guest.id
      );

      setEditingLogId(null);
      await loadLogs(guest.id);
      if (onCallLogged) onCallLogged();
      setSuccessMsg("✓ Note updated!");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      console.error("Error updating call log:", err);
    }
  };

  // Delete a call log
  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Delete this call record?")) return;
    try {
      await api.deleteCallLog(logId, guest.id);
      await loadLogs(guest.id);
      if (onCallLogged) onCallLogged();
    } catch (err) {
      console.error("Error deleting log:", err);
    }
  };

  // Save guest details
  const handleSaveGuestDetails = async (e) => {
    e.preventDefault();
    setIsSavingGuest(true);
    setErrorMsg("");
    try {
      await api.updateGuest(guest.id, {
        ...guestFormData,
        wedding_id: guest.wedding_id || "wedding_01",
      });

      setSuccessMsg("✓ Guest details updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
      if (onCallLogged) onCallLogged();
    } catch (err) {
      setErrorMsg("Failed to update guest: " + err.message);
    } finally {
      setIsSavingGuest(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 my-4 relative flex flex-col max-h-[90vh] animate-bounceIn"
      >
        {/* Simple Header */}
        <div className="bg-gradient-to-r from-[#0f2922] via-[#163a30] to-[#0f2922] p-5 text-white relative shrink-0 overflow-hidden">
          {/* Ambient light */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#84e030]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button - High z-index, generous clickable area */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 border border-white/20 shadow-xs"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3 pr-12 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#84e030]/20 border border-[#84e030]/40 flex items-center justify-center text-[#84e030] font-black text-lg shrink-0 shadow-xs">
              {(guestFormData.guest_name || guest.guest_name || "G").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold tracking-tight">
                  {guestFormData.guest_name || guest.guest_name}
                </h3>
                <span className="text-[10px] bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-emerald-100 border border-white/10">
                  {guestFormData.side || guest.side || "Groom"} Side
                </span>
                <span className="text-[10px] font-extrabold bg-[#84e030] text-[#0f2922] px-2.5 py-0.5 rounded-full shadow-2xs">
                  {currentCallCount > 0 ? `✓ ${currentCallCount} Call${currentCallCount === 1 ? "" : "s"} Done` : "0 Calls"}
                </span>
              </div>

              {guestFormData.contact && (
                <a
                  href={`tel:${guestFormData.contact}`}
                  className="text-xs text-emerald-200 hover:text-white font-mono inline-flex items-center gap-1.5 mt-1 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#84e030]" />
                  <span>{guestFormData.contact}</span>
                </a>
              )}
            </div>
          </div>

          {/* Simple Tab Switcher */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/10 text-xs relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab("call_desk")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer btn-interactive ${
                activeTab === "call_desk"
                  ? "bg-white text-[#0f2922] shadow-xs"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📞 {isViewOnly ? "Call History & Responses" : "Log Call Notes"} ({callLogs.length})
            </button>

            {!isViewOnly && (
              <button
                type="button"
                onClick={() => setActiveTab("edit_guest")}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer btn-interactive ${
                  activeTab === "edit_guest"
                    ? "bg-[#84e030] text-[#0f2922] shadow-xs font-extrabold"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                ✏️ Edit Guest Info
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: LOG CALL & NOTES */}
          {activeTab === "call_desk" && (
            <>
              {/* Form - Only for Admin and Call Center Agents */}
              {!isViewOnly ? (
                <form onSubmit={handleSubmit} autoComplete="off" className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Log Checkpoint #{nextCallNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Agent: <strong>{user?.name || "Agent"}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Call Outcome
                      </label>
                      <select
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        {CALL_OUTCOMES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Update RSVP
                      </label>
                      <select
                        value={updateRsvp}
                        onChange={(e) => setUpdateRsvp(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="Confirmed">✓ Confirmed</option>
                        <option value="Pending">⏳ Pending</option>
                        <option value="Declined">✕ Declined</option>
                      </select>
                    </div>
                  </div>

                  {outcome === "Callback Requested" && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Callback Note / Time
                      </label>
                      <input
                        type="text"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        placeholder="e.g. Friday 4 PM"
                        className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Call Summary & Discussion Notes <span className="text-rose-500">*</span>
                    </label>

                    {/* Tag Suggestions */}
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {SUGGESTED_NOTES_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTagToSummary(tag)}
                          className="text-[10px] bg-white border border-slate-200 hover:bg-emerald-50 px-2 py-0.5 rounded text-slate-600 cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      required
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Type discussion points, travel confirmation, room requests, or follow-up notes..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84e030]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0f2922] hover:bg-[#163a30] text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#84e030]" />
                      <span>{isSubmitting ? "Saving..." : `Save Call #${nextCallNumber}`}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-[#f0fbf3] border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Call Center History & Responses</p>
                      <p className="text-[11px] text-slate-600">
                        Review all call checkpoints and guest responses logged by the call desk below.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-xs bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
                    {callLogs.length} Logged
                  </span>
                </div>
              )}

              {/* Past Call History */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Call History ({callLogs.length})</span>
                </h4>

                {callLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No calls logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {callLogs.map((log, index) => {
                      const isEditing = editingLogId === log.id;
                      return (
                        <div key={log.id || index} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                Call #{log.call_number || index + 1}
                              </span>
                              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                                {log.call_outcome}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>{log.called_at ? new Date(log.called_at).toLocaleDateString() : ""}</span>
                              {!isViewOnly && (
                                <>
                                  {!isEditing ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLogId(log.id);
                                        setEditingLogSummary(log.call_summary || "");
                                        setEditingLogOutcome(log.call_outcome || "Connected");
                                      }}
                                      className="text-emerald-700 hover:underline font-bold"
                                    >
                                      Edit Note
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditLog(log.id)}
                                      className="text-emerald-800 font-bold"
                                    >
                                      Save
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="text-slate-400 hover:text-rose-600"
                                    title="Delete note"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              rows={2}
                              value={editingLogSummary}
                              onChange={(e) => setEditingLogSummary(e.target.value)}
                              className="w-full bg-white border border-emerald-300 rounded p-1.5 text-xs text-slate-800"
                            />
                          ) : (
                            <p className="text-slate-700 whitespace-pre-line text-[11px] bg-white p-2 rounded border border-slate-100 leading-relaxed">
                              {log.call_summary}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Agent: <strong>{log.agent_name || "Sarah (Call Desk)"}</strong></span>
                            {log.callback_date && (
                              <span className="text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                                Callback: {log.callback_date}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: EDIT GUEST DETAILS */}
          {activeTab === "edit_guest" && (
            <form onSubmit={handleSaveGuestDetails} autoComplete="off" className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestFormData.guest_name}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, guest_name: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={guestFormData.contact}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, contact: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Side
                  </label>
                  <select
                    value={guestFormData.side}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, side: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="Groom">🤵 Groom Side</option>
                    <option value="Bride">👰 Bride Side</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={guestFormData.rsvp_status}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, rsvp_status: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="Confirmed">✓ Confirmed (Attending)</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Declined">✕ Regrets (Not Coming)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Arrival Date / Flight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08 Sep • AI-682"
                    value={guestFormData.arrival_date}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, arrival_date: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Departure Date / Flight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11 Sep • AI-894"
                    value={guestFormData.departure_date}
                    onChange={(e) =>
                      setGuestFormData({ ...guestFormData, departure_date: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Special Requests / Dietary Notes
                </label>
                <textarea
                  rows={2}
                  value={guestFormData.special_request}
                  onChange={(e) =>
                    setGuestFormData({ ...guestFormData, special_request: e.target.value })
                  }
                  placeholder="e.g. Veg meal, early check-in..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("call_desk")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSavingGuest}
                  className="bg-[#0f2922] hover:bg-[#163a30] text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#84e030]" />
                  <span>{isSavingGuest ? "Saving..." : "Save Guest Details"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
