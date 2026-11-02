import React, { useState, useEffect, useRef } from "react";
import { Bot, MessageSquare, Sparkles, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { socket } from "../services/socket";

export default function CircularChatWidget({
  onOpenChat,
  selectedWedding,
  isChatOpen = false,
}) {
  const { user, isAdmin, isMarriageClient } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);
  const [showNotificationBubble, setShowNotificationBubble] = useState(false);

  const weddingId = selectedWedding?.id || user?.wedding_id || "wedding_01";
  const myRole = isAdmin ? "admin" : "client";
  const cleanWId = String(weddingId).replace(/^wedding:/, "");
  const lastSeenKey = `chat_last_seen_${cleanWId}_${myRole}`;

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setUnreadCount(0);
      setShowNotificationBubble(false);
      try {
        localStorage.setItem(lastSeenKey, new Date().toISOString());
      } catch (e) {}
    }
  }, [isChatOpen, lastSeenKey]);

  // Ensure socket is authenticated and connected for real-time live messaging
  useEffect(() => {
    if (!isAdmin && !isMarriageClient) return;
    const token = localStorage.getItem("manish_auth_token") || "";
    socket.auth = {
      token,
      weddingId: cleanWId,
      role: myRole,
      name: user?.name,
    };
    if (!socket.connected) {
      socket.connect();
    }
    if (isAdmin && cleanWId) {
      socket.emit("join_wedding", cleanWId);
    }
  }, [isAdmin, isMarriageClient, cleanWId, myRole, user?.name]);

  // Fetch message history and determine ONLY new unseen messages
  useEffect(() => {
    if (!isAdmin && !isMarriageClient) {
      setLatestMessage(null);
      setUnreadCount(0);
      return;
    }

    if (!weddingId) {
      setLatestMessage(null);
      setUnreadCount(0);
      return;
    }
    let isMounted = true;

    const checkMessages = async () => {
      try {
        const msgs = await api.fetchMessages(cleanWId);
        if (isMounted) {
          if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            setLatestMessage(last);

            const lastSeenVal = localStorage.getItem(lastSeenKey);
            const lastSeenTime = lastSeenVal ? new Date(lastSeenVal).getTime() : 0;

            // Only count and pop up genuine unseen messages from the other sender
            const unseenMsgs = msgs.filter((m) => {
              if (m.sender_role === myRole) return false;
              if (m.is_read) return false;
              if (lastSeenVal) {
                const msgTime = new Date(m.created_at).getTime();
                return msgTime > lastSeenTime;
              }
              return true;
            });

            // If chat is currently open, everything is already seen!
            if (isChatOpenRef.current) {
              setUnreadCount(0);
              setShowNotificationBubble(false);
              return;
            }

            // Only pop up if there are actual unseen messages! Never pop up seen messages.
            if (unseenMsgs.length > 0) {
              const latestUnseen = unseenMsgs[unseenMsgs.length - 1];
              setLatestMessage(latestUnseen);
              setUnreadCount(unseenMsgs.length);
              setShowNotificationBubble(true);
            } else {
              setUnreadCount(0);
              setShowNotificationBubble(false);
            }
          } else {
            setLatestMessage(null);
            setUnreadCount(0);
            setShowNotificationBubble(false);
          }
        }
      } catch (e) {}
    };

    // Initial check
    checkMessages();

    // Background sync check every 6 seconds to catch offline/tab-switched incoming messages
    const syncInterval = setInterval(checkMessages, 6000);

    // Socket.IO real-time listener for live instant messages
    const handleNewMessage = (newMsg) => {
      if (!isMounted || !newMsg) return;
      const msgWeddingId = String(newMsg.wedding_id || "").replace(/^wedding:/, "");
      if (myRole === "client" && msgWeddingId !== cleanWId) return;

      if (newMsg.sender_role !== myRole) {
        setLatestMessage(newMsg);

        if (isChatOpenRef.current) {
          // Chat is currently open: seen immediately
          setUnreadCount(0);
          setShowNotificationBubble(false);
          try {
            localStorage.setItem(lastSeenKey, new Date().toISOString());
          } catch (e) {}
        } else {
          // Chat is closed: LIVE INCOMING UNSEEN MESSAGE! Pop up immediately!
          setUnreadCount((prev) => prev + 1);
          setShowNotificationBubble(true);
        }
      }
    };

    const handleMessagesRead = ({ wedding_id, reader_role }) => {
      if (!isMounted) return;
      const cleanEventWId = String(wedding_id || "").replace(/^wedding:/, "");
      if (cleanEventWId !== cleanWId) return;
      if (reader_role === myRole) {
        setUnreadCount(0);
        setShowNotificationBubble(false);
        try {
          localStorage.setItem(lastSeenKey, new Date().toISOString());
        } catch (e) {}
      }
    };

    socket.on("message", handleNewMessage);
    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      socket.off("message", handleNewMessage);
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [weddingId, myRole, isAdmin, isMarriageClient, cleanWId, lastSeenKey]);

  const handleOpenClick = () => {
    setUnreadCount(0);
    setShowNotificationBubble(false);
    try {
      localStorage.setItem(lastSeenKey, new Date().toISOString());
    } catch (e) {}
    socket.emit("mark_read", { wedding_id: cleanWId, reader_role: myRole });
    api.markMessagesRead(cleanWId, myRole);
    if (onOpenChat) onOpenChat();
  };

  // Only for user (marriage client) and admin
  if (!isAdmin && !isMarriageClient) return null;

  return (
    <aside
      aria-label="Live Chat Assistant"
      className="fixed bottom-5 left-5 sm:bottom-7 sm:left-7 z-[60] flex flex-col items-start select-none group"
    >
      {/* Floating Unread Preview Speech Bubble (if there are new messages) */}
      {showNotificationBubble && latestMessage && unreadCount > 0 && (
        <div className="mb-3 max-w-xs sm:max-w-sm bg-[#0a1e18]/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-emerald-500/40 animate-bounce duration-1000 relative">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-[10px] font-extrabold text-[#84e030] uppercase tracking-wider flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84e030]"></span>
              </span>
              <span>New message from {latestMessage.sender_name?.split(" ")[0]}</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotificationBubble(false);
                setUnreadCount(0);
                try {
                  localStorage.setItem(lastSeenKey, new Date().toISOString());
                } catch (err) {}
              }}
              className="text-emerald-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full hover:bg-white/10"
              title="Dismiss preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p
            onClick={handleOpenClick}
            className="text-xs text-emerald-100/90 italic cursor-pointer line-clamp-2 hover:text-white transition-colors"
          >
            "{latestMessage.message}"
          </p>
          <div
            onClick={handleOpenClick}
            className="mt-1.5 pt-1 border-t border-emerald-800/60 flex items-center justify-between text-[10px] font-bold text-[#84e030] cursor-pointer"
          >
            <span>Click circle to open wide</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>

          {/* Little speech tail pointing to the circle */}
          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[#0a1e18] border-r border-b border-emerald-500/40 rotate-45"></div>
        </div>
      )}

      {/* Hover Tooltip pill on desktop when idle */}
      {!showNotificationBubble && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-2 ml-1">
          <div className="bg-[#0f2922] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-emerald-600/50 flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84e030] animate-pulse"></span>
            <span>{isAdmin ? "Client Live Chat" : "Admin & Concierge"}</span>
            <span className="text-[#84e030] text-[10px]">Open wide ↗</span>
          </div>
        </div>
      )}

      {/* Main Circular Section Button */}
      <button
        type="button"
        onClick={handleOpenClick}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#0b221c] via-[#0f2922] to-[#1a4a3b] text-[#84e030] shadow-2xl shadow-emerald-950/60 border-2 border-emerald-500/50 hover:border-[#84e030] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 relative group/btn focus:outline-none focus:ring-4 focus:ring-[#84e030]/30"
        title={isAdmin ? "Open Client Messenger (Wide View)" : "Chat with Admin Manish (Wide View)"}
        aria-label="Open live chat"
      >
        {/* Glowing pulse ring around circle */}
        <span className="absolute inset-0 rounded-full bg-[#84e030]/20 animate-ping opacity-25 pointer-events-none"></span>

        {/* Bot Icon */}
        <div className="relative flex items-center justify-center">
          <Bot className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2] text-[#84e030] drop-shadow-sm group-hover/btn:rotate-6 transition-transform" />
          <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Socket.IO Live Indicator Ping Dot */}
        <span className="absolute bottom-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#84e030] ring-2 ring-[#0f2922]"></span>
        </span>

        {/* Unread Message Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#84e030] text-[#0f2922] font-black text-[11px] px-2 py-0.5 rounded-full shadow-lg ring-2 ring-[#0f2922] animate-bounce">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </aside>
  );
}
