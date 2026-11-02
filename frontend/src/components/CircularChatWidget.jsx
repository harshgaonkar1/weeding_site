import React, { useState, useEffect, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
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

  const weddingId = selectedWedding?.id || user?.wedding_id || "wedding_01";
  const myRole = isAdmin ? "admin" : "client";
  const cleanWId = String(weddingId).replace(/^wedding:/, "");
  const lastSeenKey = `chat_last_seen_${cleanWId}_${myRole}`;

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setUnreadCount(0);
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
      setUnreadCount(0);
      return;
    }

    if (!weddingId) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;

    const checkMessages = async () => {
      try {
        const msgs = await api.fetchMessages(cleanWId);
        if (isMounted) {
          if (msgs && msgs.length > 0) {
            const lastSeenVal = localStorage.getItem(lastSeenKey);
            const lastSeenTime = lastSeenVal ? new Date(lastSeenVal).getTime() : 0;

            // Only count genuine unseen messages from the other sender
            const unseenMsgs = msgs.filter((m) => {
              if (m.sender_role === myRole) return false;
              if (m.is_read) return false;
              if (lastSeenVal) {
                const msgTime = new Date(m.created_at).getTime();
                return msgTime > lastSeenTime;
              }
              return true;
            });

            // If chat is currently open, everything is already seen
            if (isChatOpenRef.current) {
              setUnreadCount(0);
              return;
            }

            setUnreadCount(unseenMsgs.length);
          } else {
            setUnreadCount(0);
          }
        }
      } catch (e) {}
    };

    // Initial check
    checkMessages();

    // Background safety sync (30s) + on tab focus
    const syncInterval = setInterval(checkMessages, 30000);
    window.addEventListener("focus", checkMessages);

    // Socket.IO real-time listener for live instant messages
    const handleNewMessage = (newMsg) => {
      if (!isMounted || !newMsg) return;
      const msgWeddingId = String(newMsg.wedding_id || "").replace(/^wedding:/, "");
      if (myRole === "client" && msgWeddingId !== cleanWId) return;

      if (newMsg.sender_role !== myRole) {
        if (isChatOpenRef.current) {
          // Chat is currently open: seen immediately
          setUnreadCount(0);
          try {
            localStorage.setItem(lastSeenKey, new Date().toISOString());
          } catch (e) {}
        } else {
          // Chat is closed: live incoming message triggers notification dot
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    const handleMessagesRead = ({ wedding_id, reader_role }) => {
      if (!isMounted) return;
      const cleanEventWId = String(wedding_id || "").replace(/^wedding:/, "");
      if (cleanEventWId !== cleanWId) return;
      if (reader_role === myRole) {
        setUnreadCount(0);
        try {
          localStorage.setItem(lastSeenKey, new Date().toISOString());
        } catch (e) {}
      }
    };

    socket.on("receive_message", handleNewMessage);
    socket.on("message", handleNewMessage);
    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      window.removeEventListener("focus", checkMessages);
      socket.off("receive_message", handleNewMessage);
      socket.off("message", handleNewMessage);
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [weddingId, myRole, isAdmin, isMarriageClient, cleanWId, lastSeenKey]);

  const handleOpenClick = () => {
    setUnreadCount(0);
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
      {/* Hover Tooltip pill on desktop when idle */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-2 ml-1">
        <div className="bg-[#4a0e17] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-[#eedfc8]/40 flex items-center gap-2 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#eedfc8] animate-pulse"></span>
          <span>{isAdmin ? "Client Live Chat" : "Admin & Concierge"}</span>
          <span className="text-[#eedfc8] text-[10px]">Open wide ↗</span>
        </div>
      </div>

      {/* Main Circular Section Button */}
      <button
        type="button"
        onClick={handleOpenClick}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#3b0b14] via-[#5c1322] to-[#7d1f33] text-[#eedfc8] shadow-2xl shadow-rose-950/60 border-2 border-[#eedfc8]/50 hover:border-[#eedfc8] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 relative group/btn focus:outline-none focus:ring-4 focus:ring-[#722233]/40"
        title={isAdmin ? "Open Client Messenger" : "Chat with Admin Manish"}
        aria-label="Open live chat"
      >
        {/* Glowing pulse ring around circle when there are new messages */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-[#eedfc8]/30 animate-ping opacity-75 pointer-events-none"></span>
        )}

        {/* Bot Icon */}
        <div className="relative flex items-center justify-center">
          <Bot className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2] text-[#eedfc8] drop-shadow-sm group-hover/btn:rotate-6 transition-transform" />
          <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Dot indicating that there is a new message (instead of popup) */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 z-10"
            title={`${unreadCount} new message${unreadCount > 1 ? "s" : ""}`}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-tr from-rose-500 to-amber-400 ring-2 ring-[#3b0b14] shadow-md"></span>
          </span>
        )}
      </button>
    </aside>
  );
}
