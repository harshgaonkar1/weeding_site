import { useEffect, useState } from "react";
import { socket } from "../services/socket";
import { BACKEND_SERVER_URL } from "../config/apiConfig";

const API_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  BACKEND_SERVER_URL ||
  "http://localhost:5000";

export default function WeddingChat({ weddingId, token, isAdmin }) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const cleanWeddingId = String(weddingId || "").replace(/^wedding:/, "").trim();

  // Load history for this wedding
  useEffect(() => {
    if (!cleanWeddingId) return;
    fetch(`${API_URL}/weddings/${encodeURIComponent(cleanWeddingId)}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.error("history load failed:", err));
  }, [cleanWeddingId, token]);

  // Socket connection and listeners (React 18 Strict Mode safe - Rule 2 & 8)
  useEffect(() => {
    if (!cleanWeddingId) return;

    const onConnect = () => {
      setIsConnected(true);
      if (isAdmin) socket.emit("join_wedding", cleanWeddingId);
    };
    const onDisconnect = () => setIsConnected(false);
    const onMessage = (msg) => {
      if (!msg || !msg.id) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    };

    socket.auth = { token };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message", onMessage);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message", onMessage);
      socket.disconnect();
    };
  }, [cleanWeddingId, token, isAdmin]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("message", input.trim(), (res) => {
      if (!res?.ok) alert(res?.error || "Failed to send");
    });
    setInput("");
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Wedding Room Chat</h3>
        <p className="text-xs">
          Status:{" "}
          <span className={isConnected ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </p>
      </div>

      <ul className="space-y-2 max-h-72 overflow-y-auto mb-4">
        {messages.map((m) => (
          <li key={m.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>{m.sender_name} <span className="text-[10px] text-slate-400 font-normal">({m.sender_role})</span></span>
              <small className="text-slate-400 font-normal">{new Date(m.created_at).toLocaleTimeString()}</small>
            </div>
            <div className="mt-1 text-slate-800">{m.message}</div>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="text-xs text-slate-400 italic text-center py-4">No messages yet</li>
        )}
      </ul>

      <div className="flex gap-2">
        <input
          className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="px-4 py-2 bg-[#84e030] text-[#0f2922] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
