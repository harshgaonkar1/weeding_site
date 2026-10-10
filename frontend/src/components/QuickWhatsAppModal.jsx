import React, { useState, useEffect } from "react";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  X,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  normalizePhoneNumber,
  formatPhoneNumber,
  buildGuestMessage,
  sendWhatsAppMessage,
  sanitizeUnicodeText,
  DEFAULT_TEMPLATES,
} from "../utils/whatsappUtils";

export default function QuickWhatsAppModal({
  isOpen,
  guest,
  wedding,
  onClose,
  onSent,
}) {
  if (!isOpen || !guest) return null;

  const [message, setMessage] = useState(() => sanitizeUnicodeText(DEFAULT_TEMPLATES[0].text));
  const [copied, setCopied] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);

  const normalizedPhone = normalizePhoneNumber(guest.contact);
  const isValidPhone = Boolean(normalizedPhone);

  useEffect(() => {
    if (guest && isOpen) {
      setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
      setMessage(sanitizeUnicodeText(DEFAULT_TEMPLATES[0].text));
    }
  }, [guest, isOpen]);

  const compiledMessage = buildGuestMessage({
    template: message,
    guest,
    wedding,
    varOn: false,
  });

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setMessage(sanitizeUnicodeText(tmpl.text));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (!isValidPhone) return;
    const success = sendWhatsAppMessage(normalizedPhone, compiledMessage);
    if (success) {
      if (onSent) onSent(guest);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25d366]/15 text-[#128c7e] flex items-center justify-center font-bold text-base shadow-2xs">
              <MessageSquare className="w-5 h-5 text-[#25d366]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Send WhatsApp to {guest.guest_name}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {guest.side || "Groom"}
                </span>
              </h3>
              <p className="text-xs font-mono font-semibold text-slate-500">
                {isValidPhone ? formatPhoneNumber(normalizedPhone) : `⚠️ Invalid: ${guest.contact || "No number"}`}
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Quick Template Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Message Template:
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

          {/* Editable Draft */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Draft Message:
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#fbfdfb] border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 leading-relaxed font-sans resize-none"
            />
          </div>

          {/* Live Preview Box */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">
              Personalized Preview:
            </label>
            <div className="bg-[#0b141a] text-[#e9edef] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap font-sans border border-slate-800 shadow-inner">
              <p>{compiledMessage}</p>
              <div className="text-[9px] text-emerald-300/60 text-right mt-1.5 font-mono">
                WhatsApp • Preview
              </div>
            </div>
          </div>

          {/* Warning if Invalid Phone */}
          {!isValidPhone && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                This guest has no valid contact number. Please edit their contact details first.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!isValidPhone}
              onClick={handleSend}
              className="bg-[#25d366] hover:bg-[#20bd5a] disabled:opacity-40 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all btn-interactive"
            >
              <Send className="w-4 h-4" />
              <span>Launch WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
