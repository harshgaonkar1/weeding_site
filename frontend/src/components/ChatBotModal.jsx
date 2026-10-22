import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  PhoneCall,
  Clock,
  Heart,
  Plane,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const QUICK_CLIENT_PROMPTS = [
  "Airport shuttle & cab status update?",
  "Can we extend the RSVP deadline by 2 days?",
  "Need early check-in for arriving family members",
  "How many guests confirmed their flight tickets?",
];

const QUICK_ADMIN_REPLIES = [
  "Noted! The telecaller desk is contacting the guests right now.",
  "Airport pickup confirmed! Dedicated Innovas are on standby.",
  "Updated in the system and synchronized with Google Sheets.",
  "Will verify with hotel reception and confirm room allocation.",
];

export default function ChatBotModal({
  isOpen,
  onClose,
  selectedWedding,
  weddings = [],
  onSelectWedding,
}) {
  const { user, isAdmin, isMarriageClient } = useAuth();

  // Active wedding context for conversation
  const [activeWeddingId, setActiveWeddingId] = useState(
    selectedWedding?.id || user?.wedding_id || "wedding_01"
  );
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);

  // Sync active wedding ID when selectedWedding changes
  useEffect(() => {
    if (selectedWedding?.id) {
      setActiveWeddingId(selectedWedding.id);
    } else if (user?.wedding_id) {
      setActiveWeddingId(user.wedding_id);
    }
  }, [selectedWedding?.id, user?.wedding_id]);

  // Load messages function
  const loadMessages = async (wId = activeWeddingId) => {
    if (!wId) return;
    try {
      const data = await api.fetchMessages(wId);
      if (data && Array.isArray(data)) {
        // Deduplicate messages by id
        const seen = new Set();
        const unique = [];
        data.forEach((m) => {
          if (m && m.id && !seen.has(m.id)) {
            seen.add(m.id);
            unique.push(m);
          }
        });
        setMessages(unique);
      }
      // Mark messages as read for this role
      const myRole = isAdmin ? "admin" : "client";
      api.markMessagesRead(wId, myRole);
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }
  };

  // Poll for new messages every 3.5 seconds while open
  useEffect(() => {
    if (!isOpen) return;

    loadMessages(activeWeddingId);
    const interval = setInterval(() => {
      loadMessages(activeWeddingId);
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, activeWeddingId]);

  // Scroll to bottom on message change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // Active Wedding details
  const currentWedding =
    weddings.find((w) => w.id === activeWeddingId) ||
    selectedWedding || {
      id: activeWeddingId,
      groom_name: user?.name?.split("&")[0]?.trim() || "Groom",
      bride_name: user?.name?.split("&")[1]?.trim() || "Bride",
    };

  const handleSendMessage = async (customText = null) => {
    // Prevent double submission
    if (isSendingRef.current) return;

    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    isSendingRef.current = true;
    setIsSending(true);
    setInputText("");

    const myRole = isAdmin ? "admin" : "client";
    const myName = isAdmin
      ? user?.name || "Manish (Admin)"
      : user?.name || `${currentWedding.groom_name} & ${currentWedding.bride_name}`;

    try {
      // Send exactly 1 message
      const result = await api.sendMessage({
        wedding_id: activeWeddingId,
        sender_id: user?.id,
        sender_name: myName,
        sender_role: myRole,
        message: textToSend,
      });

      if (result?.data) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === result.data.id);
          if (exists) return prev;
          return [...prev, result.data];
        });
      }
      await loadMessages(activeWeddingId);
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[90vh] max-h-[700px] animate-scaleUp">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0f2922] to-[#184236] text-white flex items-center justify-between border-b border-emerald-900/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#84e030] text-[#0f2922] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Bot className="w-5 h-5 stroke-[2.4]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold truncate">
                  {isAdmin
                    ? `Chat with ${currentWedding.groom_name} & ${currentWedding.bride_name}`
                    : "Wedding Desk & Admin Chat"}
                </h3>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84e030]"></span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-200/90 truncate">
                <span>
                  {isAdmin
                    ? "Direct communication channel with wedding client"
                    : "Chatting with Super Admin Manish"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* If Admin, allow switching wedding channel */}
            {isAdmin && weddings.length > 1 && (
              <select
                value={activeWeddingId}
                onChange={(e) => {
                  setActiveWeddingId(e.target.value);
                  loadMessages(e.target.value);
                }}
                className="text-[11px] font-bold bg-[#163a30] text-emerald-100 border border-emerald-700/60 rounded-xl px-2 py-1 focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.groom_name} & {w.bride_name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setIsRefreshing(true);
                loadMessages(activeWeddingId).finally(() => setIsRefreshing(false));
              }}
              title="Refresh messages"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suggestion Quick Chips */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
            {isAdmin ? "Quick Replies:" : "Quick Inquiries:"}
          </span>
          {(isAdmin ? QUICK_ADMIN_REPLIES : QUICK_CLIENT_PROMPTS).map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[10.5px] bg-white hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              + {prompt}
            </button>
          ))}
        </div>

        {/* Messages List Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#fbfdfb]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Start Conversation
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Send a message to discuss airport transfers, guest dietary preferences, room allocations, or RSVP updates.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = isAdmin
                ? msg.sender_role === "admin"
                : msg.sender_role === "client";
              const isBot = msg.sender_role === "bot";
              const isAdminSender = msg.sender_role === "admin";

              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${
                    isBot ? "items-center" : isMe ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender Name & Role Pill */}
                  {!isBot && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-400 px-1">
                      <span className="font-semibold text-slate-600">{msg.sender_name}</span>
                      {isAdminSender && (
                        <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[9px] border border-amber-200">
                          Admin
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  {isBot ? (
                    <div className="my-1 max-w-[85%] bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-800">
                        <Bot className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Emitly Bot Concierge</span>
                      </div>
                      <p className="leading-relaxed">{msg.message}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        isMe
                          ? "bg-[#0f2922] text-white rounded-br-xs"
                          : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.message}</p>

                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9.5px] ${
                          isMe ? "text-emerald-200/70" : "text-slate-400"
                        }`}
                      >
                        <span>
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-[#84e030]" />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Sending Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isAdmin
                  ? "Reply to client as Super Admin Manish..."
                  : "Type a message or inquiry for Admin Manish..."
              }
              className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#84e030] resize-none transition-colors"
            />

            <button
              type="button"
              disabled={!inputText.trim() || isSending}
              onClick={() => handleSendMessage()}
              className="bg-[#0f2922] hover:bg-[#163a30] text-white p-2.5 rounded-2xl font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer transition-all shadow-xs shrink-0"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4 text-[#84e030]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
