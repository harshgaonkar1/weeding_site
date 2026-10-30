import React, { useState, useEffect } from "react";
import { MessageSquare, Bot, Sparkles, Send, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { socket } from "../services/socket";

export default function SidebarChatWidget({
  onOpenChat,
  selectedWedding,
}) {
  const { user, isAdmin, isMarriageClient } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);

  const weddingId = selectedWedding?.id || user?.wedding_id || "wedding_01";
  const myRole = isAdmin ? "admin" : "client";

  // Fetch initial message history from database (no polling interval spam; live updates handled by Socket.IO)
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
    const cleanWId = String(weddingId).replace(/^wedding:/, "");

    const checkMessages = async () => {
      try {
        const msgs = await api.fetchMessages(cleanWId);
        if (isMounted) {
          if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            setLatestMessage(last);

            const unread = msgs.filter((m) => m.sender_role !== myRole && !m.is_read).length;
            setUnreadCount(unread);
          } else {
            setLatestMessage(null);
            setUnreadCount(0);
          }
        }
      } catch (e) {}
    };

    // Load once on mount or when wedding/role changes
    checkMessages();

    // Socket.IO passive listeners for live updates if socket is connected
    const handleNewMessage = (newMsg) => {
      if (!isMounted || !newMsg) return;
      if (newMsg.wedding_id !== cleanWId) return;
      setLatestMessage(newMsg);
      if (newMsg.sender_role !== myRole) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleMessagesRead = ({ wedding_id, reader_role }) => {
      if (!isMounted || wedding_id !== cleanWId) return;
      if (reader_role === myRole) {
        setUnreadCount(0);
      }
    };

    socket.on("message", handleNewMessage);
    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      isMounted = false;
      socket.off("message", handleNewMessage);
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [weddingId, myRole, isAdmin, isMarriageClient]);

  // Only for user (marriage client) and admin
  if (!isAdmin && !isMarriageClient) return null;

  return (
    <div
      onClick={onOpenChat}
      className="mt-2 mx-1 p-2 bg-gradient-to-r from-[#0b221c] via-[#0f2922] to-[#163a30] text-white rounded-2xl shadow-xs border border-emerald-900/60 cursor-pointer hover:shadow-md transition-all group select-none hover:scale-[1.01] flex items-center justify-between"
      title="Click to open wide live chat"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Circular Section Button */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#84e030] text-[#0f2922] flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5 stroke-[2.4]" />
          </div>
          {/* Live Online Ping Dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#84e030] ring-2 ring-[#0f2922]"></span>
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white truncate">
              {isAdmin ? "Client Live Chat" : "Admin & Concierge"}
            </h4>
            {unreadCount > 0 && (
              <span className="bg-[#84e030] text-[#0f2922] text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs animate-bounce shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-200/80 group-hover:text-[#84e030] transition-colors flex items-center gap-1">
            <span>Click to open wide</span>
            <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
          </p>
        </div>
      </div>

      <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#84e030]/20 flex items-center justify-center text-[#84e030] transition-colors shrink-0">
        <span className="text-xs font-bold">→</span>
      </div>
    </div>
  );
}
