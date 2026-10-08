import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteModal({
  isOpen,
  guest,
  wedding,
  title,
  description,
  message,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  if (!isOpen) return null;

  const displayTitle =
    title ||
    (wedding
      ? "Delete Marriage Card?"
      : guest
      ? "Delete Guest Entry?"
      : "Confirm Deletion");

  const displayDescription =
    description ||
    message ||
    (wedding
      ? `Are you sure you want to delete ${wedding.groom_name} & ${wedding.bride_name}'s marriage card? All associated guest records and logistics will be permanently removed.`
      : guest
      ? `Are you sure you want to remove "${guest.guest_name}" (Sr #${guest.sr_no || 1})? This action cannot be undone.`
      : "Are you sure you want to delete this item? This action cannot be undone.");

  const handleConfirmClick = () => {
    if (onConfirm) {
      if (guest) {
        onConfirm(guest.id);
      } else if (wedding) {
        onConfirm(wedding.id);
      } else {
        onConfirm();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-scaleUp">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Title & Desc */}
        <h3 className="text-base font-bold text-slate-900">{displayTitle}</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {displayDescription}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
