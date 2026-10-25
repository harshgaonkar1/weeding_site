import React, { useState, useEffect } from "react";
import { MessageSquare, Bot, Sparkles, Send, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function SidebarChatWidget({
  onOpenChat,
  selectedWedding,
}) {
  const { user, isAdmin, isMarriageClient } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);

  // Poll or fetch latest message for unread badge
  useEffect(() => {
    const weddingId = selectedWedding?.id || user?.wedding_id || "wedding_01";
    let isMounted = true;

    const checkMessages = async () => {
      try {
        const msgs = await api.fetchMessages(weddingId);
        if (isMounted) {
          if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            setLatestMessage(last);

            const myRole = isAdmin ? "admin" : "client";
            const unread = msgs.filter((m) => m.sender_role !== myRole && !m.is_read).length;
            setUnreadCount(unread);
          } else {
            setLatestMessage(null);
            setUnreadCount(0);
          }
        }
      } catch (e) {}
    };

    checkMessages();
    const interval = setInterval(checkMessages, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedWedding?.id, user?.wedding_id, isAdmin]);

  // Only for user (marriage client) and admin
  if (!isAdmin && !isMarriageClient) return null;

  return (
    <div
      onClick={onOpenChat}
      className="mt-3 mx-1 p-3 bg-gradient-to-br from-[#0f2922] to-[#163a30] text-white rounded-2xl shadow-sm border border-emerald-900/60 cursor-pointer hover:shadow-md transition-all group select-none hover:scale-[1.01]"
      title="Direct Live Chat between Wedding Client & Admin"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#84e030] text-[#0f2922] flex items-center justify-center font-bold shadow-xs">
            <Bot className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>{isAdmin ? "Client Live Chat" : "Admin & Concierge"}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84e030] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84e030]"></span>
              </span>
            </h4>
            <span className="text-[10px] text-emerald-200/80">Direct Communication</span>
          </div>
        </div>

        {unreadCount > 0 && (
          <span className="bg-[#84e030] text-[#0f2922] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-2xs animate-bounce">
            {unreadCount} new
          </span>
        )}
      </div>

      {latestMessage ? (
        <p className="text-[11px] text-emerald-100/90 line-clamp-1 italic bg-black/20 px-2 py-1 rounded-lg border border-emerald-500/20">
          <strong>{latestMessage.sender_name?.split(" ")[0]}:</strong> "{latestMessage.message}"
        </p>
      ) : (
        <p className="text-[11px] text-emerald-200/70 italic">
          {isAdmin ? "Tap to message this wedding client" : "Tap to message Super Admin Manish"}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-[#84e030] pt-1 border-t border-emerald-800/60">
        <span>{isAdmin ? "Open Client Messenger" : "Chat with Admin"}</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );
}
