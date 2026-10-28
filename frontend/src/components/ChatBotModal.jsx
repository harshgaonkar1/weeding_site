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
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  getSocket,
  joinWeddingChat,
  leaveWeddingChat,
  sendSocketMessage,
  markSocketMessagesRead,
  emitTyping,
} from "../services/socket";

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

  // Active wedding context for conversation (guaranteed valid ID fallback)
  const [activeWeddingId, setActiveWeddingId] = useState(
    selectedWedding?.id || user?.wedding_id || (weddings && weddings[0]?.id) || "wedding_01"
  );
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [remoteTypingUser, setRemoteTypingUser] = useState(null);

  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // Sync active wedding ID when selectedWedding or weddings change
  useEffect(() => {
    const validWedding = selectedWedding?.id || user?.wedding_id || (weddings && weddings.length > 0 && weddings[0]?.id);
    if (validWedding && (!activeWeddingId || activeWeddingId === "wedding_01")) {
      setActiveWeddingId(validWedding);
    } else if (selectedWedding?.id && activeWeddingId !== selectedWedding.id) {
      setActiveWeddingId(selectedWedding.id);
    }
  }, [selectedWedding?.id, user?.wedding_id, weddings]);

  // Load message history from DB
  const loadMessages = async (wId = activeWeddingId) => {
    const targetWId = wId || activeWeddingId || "wedding_01";
    try {
      const data = await api.fetchMessages(targetWId);
      if (data && Array.isArray(data)) {
        setMessages((prev) => {
          // Keep any optimistic unsent messages currently in local state
          const optimistic = prev.filter((m) => m.id && m.id.startsWith("msg_temp_"));
          const seen = new Set();
          const unique = [];

          // Add database messages first
          data.forEach((m) => {
            if (m && m.id && !seen.has(m.id)) {
              seen.add(m.id);
              unique.push(m);
            }
          });

          // Append any optimistic messages that haven't been confirmed yet
          optimistic.forEach((opt) => {
            if (!unique.some((u) => u.message === opt.message && u.sender_role === opt.sender_role)) {
              unique.push(opt);
            }
          });

          return unique;
        });
      }
      // Mark messages as read for this role
      const myRole = isAdmin ? "admin" : "client";
      api.markMessagesRead(targetWId, myRole);
      markSocketMessagesRead(targetWId, myRole);
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }
  };

  // Socket.IO Real-Time Connection & Live Listener
  useEffect(() => {
    if (!isOpen) return;
    const targetWId = activeWeddingId || selectedWedding?.id || user?.wedding_id || "wedding_01";

    // 1. Initial fetch from database to display all past message history
    loadMessages(targetWId);

    // 2. Connect to Socket.IO and join wedding room
    const socket = getSocket();
    setIsSocketLive(Boolean(socket?.connected));

    joinWeddingChat(targetWId);

    const onConnect = () => {
      setIsSocketLive(true);
      joinWeddingChat(targetWId);
    };
    const onDisconnect = () => setIsSocketLive(false);

    // Incoming Live Message Handler (0ms instant streaming)
    const onNewMessage = (newMsg) => {
      if (!newMsg || (newMsg.wedding_id !== targetWId && newMsg.wedding_id !== activeWeddingId)) return;

      setMessages((prev) => {
        // If identical id already present, keep
        if (prev.some((m) => m.id === newMsg.id)) return prev;

        // If this confirms an optimistic temporary message, swap the temp ID with real ID
        const optIdx = prev.findIndex(
          (m) =>
            m.id &&
            m.id.startsWith("msg_temp_") &&
            m.sender_role === newMsg.sender_role &&
            m.message === newMsg.message
        );

        if (optIdx !== -1) {
          const next = [...prev];
          next[optIdx] = newMsg;
          return next;
        }

        return [...prev, newMsg];
      });

      // Clear typing indicator once a message arrives
      setRemoteTypingUser(null);
      if (newMsg.sender_role === "bot") {
        setIsSending(false);
      }

      // Auto mark as read if message is from the other party
      const myRole = isAdmin ? "admin" : "client";
      if (newMsg.sender_role !== myRole) {
        markSocketMessagesRead(targetWId, myRole);
      }
    };

    // Live Read Receipts
    const onMessagesRead = ({ wedding_id, reader_role }) => {
      if (wedding_id !== targetWId) return;
      setMessages((prev) =>
        prev.map((m) => (m.sender_role !== reader_role ? { ...m, is_read: true } : m))
      );
    };

    // Remote Typing Indicator
    const onUserTyping = ({ user_name, is_typing }) => {
      if (is_typing) {
        setRemoteTypingUser(user_name);
      } else {
        setRemoteTypingUser(null);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_message", onNewMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("user_typing", onUserTyping);

    // Fast fallback sync every 8 seconds
    const backupInterval = setInterval(() => {
      loadMessages(targetWId);
    }, 8000);

    return () => {
      leaveWeddingChat(targetWId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNewMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("user_typing", onUserTyping);
      clearInterval(backupInterval);
    };
  }, [isOpen, activeWeddingId]);

  // Smooth scroll to bottom on message change or typing
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isSending, remoteTypingUser]);

  if (!isOpen) return null;

  // Active Wedding details
  const currentWedding =
    weddings.find((w) => w.id === activeWeddingId) ||
    selectedWedding || {
      id: activeWeddingId,
      groom_name: user?.name?.split("&")[0]?.trim() || "Groom",
      bride_name: user?.name?.split("&")[1]?.trim() || "Bride",
    };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Emit live typing indicator
    const myName = isAdmin
      ? user?.name || "Admin"
      : user?.name || `${currentWedding.groom_name} & ${currentWedding.bride_name}`;

    emitTyping(activeWeddingId, myName, val.length > 0);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(activeWeddingId, myName, false);
    }, 2000);
  };

  const handleSendMessage = async (customText = null) => {
    if (isSendingRef.current) return;

    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    isSendingRef.current = true;
    setIsSending(true);
    setInputText("");

    const targetWeddingId =
      activeWeddingId ||
      selectedWedding?.id ||
      user?.wedding_id ||
      (weddings && weddings[0]?.id) ||
      "wedding_01";

    const myRole = isAdmin ? "admin" : "client";
    const myName = isAdmin
      ? user?.name || "Manish (Admin)"
      : user?.name || `${currentWedding.groom_name} & ${currentWedding.bride_name}`;

    // Clear typing status
    emitTyping(targetWeddingId, myName, false);

    // 1. OPTIMISTIC INSTANT UI UPDATE (0ms latency!)
    // Appears on the user's screen in 0 milliseconds
    const tempId = `msg_temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimisticMsg = {
      id: tempId,
      wedding_id: targetWeddingId,
      sender_id: user?.id || (isAdmin ? "user_admin_01" : "client_user"),
      sender_name: myName,
      sender_role: myRole,
      message: textToSend,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const messagePayload = {
      ...optimisticMsg,
      trigger_bot_reply: !isAdmin,
    };

    try {
      // 2. Broadcast via live Socket.IO (instant transmission)
      sendSocketMessage(messagePayload);

      // 3. Dual-channel background persistence via REST API
      api.sendMessage(messagePayload).then((result) => {
        if (result?.bot_reply) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === result.bot_reply.id)) return prev;
            return [...prev, result.bot_reply];
          });
          setIsSending(false);
        }
      }).catch(() => {});
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      isSendingRef.current = false;
      // If admin, finish sending immediately; if client, keep bot typing indicator until bot replies
      if (isAdmin) {
        setIsSending(false);
      }
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
                {/* Live Socket Status Badge */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSocketLive
                      ? "bg-emerald-500/20 text-[#84e030] border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                  title={isSocketLive ? "Live Socket.IO Connected (Instant)" : "Connecting to Live Stream..."}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {isSocketLive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        isSocketLive ? "bg-[#84e030]" : "bg-amber-400"
                      }`}
                    ></span>
                  </span>
                  <span>{isSocketLive ? "Live (0ms)" : "Syncing"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-200/90 truncate">
                <span>
                  {isAdmin
                    ? "Direct communication channel with wedding client"
                    : "Live chat with Super Admin Manish & Bot Concierge"}
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
              title="Refresh messages from database"
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
                  Live Conversation History
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Send a message to discuss airport transfers, guest dietary preferences, room allocations, or RSVP updates. All chats are saved in database.
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
                        {isMe && (
                          <CheckCheck
                            className={`w-3 h-3 ${
                              msg.is_read ? "text-[#84e030]" : "text-emerald-200/60"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Remote user typing indicator */}
          {remoteTypingUser && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic px-2 py-1 bg-slate-100/80 rounded-xl max-w-fit">
              <span className="inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-75"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150"></span>
              </span>
              <span>{remoteTypingUser} is typing...</span>
            </div>
          )}

          {/* Bot is thinking / generating response */}
          {isSending && !isAdmin && (
            <div className="flex flex-col items-start my-1 animate-pulse">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-3.5 py-2 text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
                <Bot className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="italic text-[11px] font-medium">Emitly Concierge is typing a response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Sending Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
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
              disabled={!inputText.trim()}
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
