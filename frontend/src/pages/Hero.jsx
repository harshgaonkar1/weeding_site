import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Download,
  RefreshCw,
  Plus,
  AlertCircle,
  Heart,
  ArrowLeft,
  PlusCircle,
  Calendar,
  Sparkles,
  PhoneCall,
  Headphones,
  FileSpreadsheet,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import FilterBar from "../components/FilterBar";
import GuestTable from "../components/GuestTable";
import GuestModal from "../components/GuestModal";
import GuestDetailsDrawer from "../components/GuestDetailsDrawer";
import DeleteModal from "../components/DeleteModal";
import WeddingCard from "../components/WeddingCard";
import WeddingModal from "../components/WeddingModal";
import WeddingCredentialsModal from "../components/WeddingCredentialsModal";
import LoginModal from "../components/LoginModal";
import CallLogModal from "../components/CallLogModal";
import AdminPasswordModal from "../components/AdminPasswordModal";
import GoogleSheetModal from "../components/GoogleSheetModal";
import WhatsAppMessageModal from "../components/WhatsAppMessageModal";
import AnalyticsView from "../components/AnalyticsView";
import ChatBotModal from "../components/ChatBotModal";
import CircularChatWidget from "../components/CircularChatWidget";
import LoginPage from "./LoginPage";
import { api, calculateStatsFromList } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Hero() {
  const {
    user,
    isAdmin,
    isCallCenter,
    isMarriageClient,
    isViewOnly,
    canEditGuests,
    canUpdateCallLogs,
    canSendWhatsApp,
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginModalTab,
    isAdminPasswordModalOpen,
    setIsAdminPasswordModalOpen,
  } = useAuth();

  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState(isMarriageClient ? "directory" : "weddings"); // 'weddings' or 'directory'
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Guests & Statistics State
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("All");
  const [rsvpFilter, setRsvpFilter] = useState("All");
  const [idCardFilter, setIdCardFilter] = useState("All");
  const [callAttemptsFilter, setCallAttemptsFilter] = useState("All");

  // Guest Modals State
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [viewingGuest, setViewingGuest] = useState(null);
  const [deletingGuest, setDeletingGuest] = useState(null);
  const [callingGuest, setCallingGuest] = useState(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppModalInitialGuest, setWhatsAppModalInitialGuest] = useState(null);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);
  const [isDeletingGuest, setIsDeletingGuest] = useState(false);

  // Wedding / Marriage Card Modals State
  const [isWeddingModalOpen, setIsWeddingModalOpen] = useState(false);
  const [editingWedding, setEditingWedding] = useState(null);
  const [deletingWedding, setDeletingWedding] = useState(null);
  const [isSubmittingWedding, setIsSubmittingWedding] = useState(false);
  const [isDeletingWedding, setIsDeletingWedding] = useState(false);

  // Wedding Credentials Modal State (For sharing generated login info)
  const [credentialsModalWedding, setCredentialsModalWedding] = useState(null);
  const [isNewlyCreatedWedding, setIsNewlyCreatedWedding] = useState(false);

  // Google Sheet Sync Modal State
  const [googleSheetModalWedding, setGoogleSheetModalWedding] = useState(null);

  // Live Chat Bot / Admin & Client Messenger State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Load Weddings (only called on mount and after explicit wedding creation/updates)
  const loadWeddings = useCallback(async () => {
    try {
      const data = await api.fetchWeddings();
      setWeddings(data || []);
      if (!isMarriageClient && Array.isArray(data) && data.length > 0) {
        const savedId = localStorage.getItem("manish_selected_wedding_id");
        if (savedId) {
          const matched = data.find((w) => w.id === savedId);
          if (matched) setSelectedWedding(matched);
        }
      }
    } catch (e) {
      console.error("Error fetching weddings:", e);
    }
  }, [isMarriageClient]);

  useEffect(() => {
    if (selectedWedding?.id && selectedWedding.id !== "all") {
      try {
        localStorage.setItem("manish_selected_wedding_id", selectedWedding.id);
      } catch (e) {}
    }
  }, [selectedWedding]);

  // 1b. Handle Marriage Client Scoping & Role Switching
  useEffect(() => {
    if (isMarriageClient && user?.wedding_id) {
      setActiveTab((prev) => (prev === "weddings" ? "directory" : prev));
      const matched =
        weddings.find((w) => w.id === user.wedding_id) ||
        user.wedding || {
          id: user.wedding_id,
          groom_name: user.name?.split("&")[0]?.trim() || "Groom",
          bride_name: user.name?.split("&")[1]?.trim() || "Bride",
          wedding_date: user.wedding_date || "",
          venue: user.venue || "",
          city: user.city || "",
          cover_theme: user.cover_theme || "emerald",
        };
      setSelectedWedding(matched);
    } else if (!isMarriageClient) {
      loadWeddings();
    }
  }, [isMarriageClient, user?.wedding_id, user?.role, loadWeddings]);

  // 2. Load Guests & Stats (scoped strictly to selected wedding)
  const selectedWeddingId = selectedWedding ? selectedWedding.id : null;
  const activeWeddingRef = useRef(selectedWeddingId);

  useEffect(() => {
    activeWeddingRef.current = selectedWeddingId;
  }, [selectedWeddingId]);

  const loadGuests = useCallback(async () => {
    // If no wedding is selected and we are on the weddings dashboard, do not fetch guests
    if (!selectedWedding && activeTab === "weddings" && !isMarriageClient) {
      setLoading(false);
      return;
    }

    const targetWeddingId = selectedWeddingId || (isMarriageClient ? user?.wedding_id : "all");
    const requestedId = targetWeddingId;

    try {
      setLoading(true);
      const [guestRes, statsRes] = await Promise.all([
        api.fetchGuests({
          weddingId: targetWeddingId,
          side: sideFilter,
          search: searchQuery,
          rsvp: rsvpFilter,
          idCard: idCardFilter,
          callAttempts: callAttemptsFilter,
        }),
        api.fetchStats(targetWeddingId),
      ]);

      // Guard: Only commit results if the user has not switched away to another wedding
      if (
        activeWeddingRef.current === requestedId ||
        (!activeWeddingRef.current && requestedId === "all")
      ) {
        setGuests(guestRes.data || []);
        setStats(statsRes || calculateStatsFromList(guestRes.data || []));
      }
    } catch (err) {
      console.error("Error loading guests:", err);
    } finally {
      if (
        activeWeddingRef.current === requestedId ||
        (!activeWeddingRef.current && requestedId === "all")
      ) {
        setLoading(false);
      }
    }
  }, [
    selectedWedding,
    selectedWeddingId,
    activeTab,
    isMarriageClient,
    user?.wedding_id,
    sideFilter,
    searchQuery,
    rsvpFilter,
    idCardFilter,
    callAttemptsFilter,
  ]);

  // Strict client-side filter: ONLY guests belonging to this wedding can EVER be displayed.
  // This guarantees that even during state transitions or API re-fetching, guests from another marriage
  // are never visible for even a single frame!
  const displayedGuests = useMemo(() => {
    if (selectedWedding && selectedWedding.id && selectedWedding.id !== "all") {
      return guests.filter((g) => g.wedding_id === selectedWedding.id);
    }
    return guests;
  }, [guests, selectedWedding]);

  useEffect(() => {
    loadWeddings();
  }, [loadWeddings]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // ------------------- WEDDING ACTIONS -------------------
  const handleSelectWedding = (wedding) => {
    if (wedding) {
      activeWeddingRef.current = wedding.id;
      // Immediately reset guests and stats so no stale data from another marriage flashes
      setGuests([]);
      setStats({});
      setLoading(true);
      // Reset search and filter states for clean scoped browsing
      setSearchQuery("");
      setSideFilter("All");
      setRsvpFilter("All");
      setIdCardFilter("All");
      setCallAttemptsFilter("All");
      setSelectedWedding(wedding);
      setActiveTab("directory");
    } else {
      activeWeddingRef.current = null;
      setSelectedWedding(null);
      setGuests([]);
      setStats({});
      setActiveTab("weddings");
    }
  };

  const handleOpenAddWeddingModal = () => {
    if (!isAdmin) {
      showToast("Only Admin can create new Marriage Cards", "error");
      return;
    }
    setEditingWedding(null);
    setIsWeddingModalOpen(true);
  };

  const handleOpenEditWeddingModal = (wedding) => {
    if (!isAdmin) {
      showToast("Only Admin can edit Marriage Cards", "error");
      return;
    }
    setEditingWedding(wedding);
    setIsWeddingModalOpen(true);
  };

  const handleWeddingSubmit = async (formData) => {
    setIsSubmittingWedding(true);
    try {
      if (editingWedding) {
        const updated = await api.updateWedding(editingWedding.id, formData);
        showToast("Marriage Card updated!");
        const mergedWedding = { ...editingWedding, ...formData, ...(updated || {}) };
        setWeddings((prev) =>
          prev.map((w) => (w.id === editingWedding.id ? { ...w, ...mergedWedding } : w))
        );
        if (selectedWedding?.id === editingWedding.id) {
          setSelectedWedding((prev) => ({ ...prev, ...mergedWedding }));
        }
      } else {
        const created = await api.createWedding(formData);
        showToast("New Marriage Card & Client Portal Created!");
        if (created) {
          setWeddings((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
        }
        setSelectedWedding(created);
        setActiveTab("directory");
        setCredentialsModalWedding(created);
        setIsNewlyCreatedWedding(true);
      }
      setIsWeddingModalOpen(false);
      setEditingWedding(null);
      await loadWeddings();
    } catch (err) {
      showToast("Error saving marriage card", "error");
    } finally {
      setIsSubmittingWedding(false);
    }
  };

  const handleDeleteWeddingConfirm = async () => {
    if (!deletingWedding) return;
    if (!isAdmin) {
      showToast("Only Admin can delete Marriage Cards", "error");
      return;
    }
    const delId = deletingWedding.id;
    try {
      setIsDeletingWedding(true);

      // 1. Optimistically remove wedding & its guests from local state immediately
      setWeddings((prev) => prev.filter((w) => w.id !== delId));
      setGuests((prev) => prev.filter((g) => g.wedding_id !== delId));

      // 2. Perform delete - cleans cache + syncs backend (graceful even if offline)
      await api.deleteWedding(delId);
      showToast("Marriage card removed");

      // 3. Navigate away if we were viewing the deleted wedding
      if (selectedWedding?.id === delId) {
        handleSelectWedding(null);
      }
      setDeletingWedding(null);
    } catch (err) {
      showToast("Failed to delete marriage card", "error");
      setDeletingWedding(null);
    } finally {
      setIsDeletingWedding(false);
    }
  };

  // ------------------- GUEST ACTIONS -------------------
  const handleOpenAddGuestModal = () => {
    if (!canEditGuests) {
      showToast(isCallCenter ? "Call center desk has view-only access to guest details" : "Read-only access in client portal mode", "error");
      return;
    }
    if (!selectedWedding && weddings.length > 0) {
      setSelectedWedding(weddings[0]);
    }
    setEditingGuest(null);
    setIsAddGuestModalOpen(true);
  };

  const handleOpenEditGuestModal = (guest) => {
    if (!canEditGuests) {
      showToast(isCallCenter ? "Call center desk cannot update guest details (view-only)" : "Read-only access in client portal mode", "error");
      return;
    }
    setEditingGuest(guest);
    setIsAddGuestModalOpen(true);
  };

  const handleGuestSubmit = async (formData) => {
    if (!canEditGuests) {
      showToast(isCallCenter ? "Call center desk cannot update guest details" : "Read-only access in client portal mode", "error");
      return;
    }
    setIsSubmittingGuest(true);
    try {
      const targetWeddingId =
        formData.wedding_id ||
        editingGuest?.wedding_id ||
        (selectedWedding && selectedWedding.id !== "all" ? selectedWedding.id : null) ||
        (weddings && weddings.length > 0 ? weddings[0].id : "");

      const payload = {
        ...(editingGuest || {}),
        ...formData,
        wedding_id: targetWeddingId,
      };

      // Safely ensure last_call_summary is NEVER the guest's name
      if (
        payload.last_call_summary !== null &&
        payload.last_call_summary !== undefined &&
        payload.guest_name &&
        String(payload.last_call_summary).trim().toLowerCase() === String(payload.guest_name).trim().toLowerCase()
      ) {
        payload.last_call_summary = null;
      }

      // If creating a brand new guest, ensure call tracking starts strictly at 0
      if (!editingGuest) {
        payload.call_count = 0;
        payload.call_status = "Not Called";
        payload.last_called_at = null;
        payload.last_call_summary = null;
      } else {
        const sStr = String(payload.call_status || "");
        if (sStr === "1" || sStr === "2" || (!isNaN(Number(sStr)) && sStr !== "" && sStr !== "Not Called")) {
          payload.call_status = Number(payload.call_count) > 0 ? "Connected" : "Not Called";
        }
        if (!payload.last_call_summary && Number(payload.call_count) === 1 && !payload.last_called_at) {
          payload.call_count = 0;
        }
      }

      if (editingGuest) {
        const updatedGuest = await api.updateGuest(editingGuest.id, payload);
        const merged = { ...editingGuest, ...payload, ...(updatedGuest || {}) };
        setGuests((prev) =>
          prev.map((g) => (g.id === editingGuest.id ? merged : g))
        );
        if (viewingGuest?.id === editingGuest.id) {
          setViewingGuest(merged);
        }
        showToast("Guest updated successfully!");
      } else {
        const created = await api.createGuest(payload);
        showToast("Guest added to directory!");
        if (created) {
          setGuests((prev) => [created, ...prev.filter((g) => g.id !== created.id)]);
        }
      }
      setIsAddGuestModalOpen(false);
      setEditingGuest(null);
      try {
        await Promise.all([loadGuests(), loadWeddings()]);
      } catch (refreshErr) {
        console.warn("Background refresh notice after guest save:", refreshErr);
      }
    } catch (err) {
      console.error("Error saving guest:", err);
      showToast(err?.message ? `Error: ${err.message}` : "Error saving guest", "error");
    } finally {
      setIsSubmittingGuest(false);
    }
  };

  const handleDeleteGuestConfirm = async (id) => {
    if (isViewOnly || !isAdmin) {
      showToast("Only Admin can delete guest records", "error");
      return;
    }
    setIsDeletingGuest(true);
    try {
      setGuests((prev) => prev.filter((g) => g.id !== id));
      if (viewingGuest?.id === id) {
        setViewingGuest(null);
      }
      await api.deleteGuest(id);
      showToast("Guest entry removed");
      setDeletingGuest(null);
      await Promise.all([loadGuests(), loadWeddings()]);
    } catch (err) {
      showToast("Failed to delete guest", "error");
    } finally {
      setIsDeletingGuest(false);
    }
  };

  // Call Logger Trigger
  const handleOpenCallLogs = (guest) => {
    setCallingGuest(guest);
  };

  const handleQuickUpdateRsvp = async (guest, newRsvp) => {
    if (!canEditGuests) {
      showToast(isCallCenter ? "Call center desk cannot update guest details" : "Read-only access in client portal mode", "error");
      return;
    }
    const previousRsvp = guest.rsvp_status;
    const updatedGuest = { ...guest, rsvp_status: newRsvp };

    // Optimistic UI update
    setGuests((prev) =>
      prev.map((g) => (g.id === guest.id ? updatedGuest : g))
    );
    setStats(() => {
      const currentList = guests.map((g) => (g.id === guest.id ? updatedGuest : g));
      return calculateStatsFromList(currentList);
    });

    try {
      await api.updateGuest(guest.id, {
        ...updatedGuest,
        wedding_id: guest.wedding_id || selectedWedding?.id || (weddings && weddings[0]?.id) || "",
      });
      showToast(`RSVP updated to ${newRsvp} for ${guest.guest_name}`);
    } catch (err) {
      // Revert on error
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, rsvp_status: previousRsvp } : g))
      );
      showToast("Failed to update RSVP: " + err.message, "error");
    }
  };

  const handleCallLogged = async () => {
    showToast("Call Checkpoint & Summary saved!");
    await loadGuests();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.exportCsv(
        selectedWedding?.id || "all",
        sideFilter,
        "All",
        callAttemptsFilter
      );
      showToast("CSV exported!");
    } catch (err) {
      showToast("Failed to export CSV", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await loadWeddings();
      await loadGuests();
      showToast("Data refreshed!");
    } catch (err) {
      showToast("Sync failed", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // If user is not logged in, show dedicated Full Login Page
  if (!user) {
    return <LoginPage />;
  }

  const nextSrNo =
    displayedGuests.length > 0
      ? Math.max(...displayedGuests.map((g) => Number(g.sr_no) || 0)) + 1
      : 1;

  const totalGlobalGuests = weddings.reduce(
    (acc, w) => acc + (w.total_guests || 0),
    0
  );
  const totalGlobalConfirmed = weddings.reduce(
    (acc, w) => acc + (w.confirmed_guests || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f7f4ee] p-0 sm:p-2 md:p-6 text-slate-800 flex justify-center font-sans antialiased selection:bg-[#722233]/20 selection:text-[#4a0e17]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-slideIn ${
            toast.type === "error"
              ? "bg-rose-900 text-white"
              : "bg-[#4a0e17] text-[#eedfc8] border border-[#eedfc8]/30 shadow-rose-950/20"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main App Container */}
      <div className="w-full max-w-[1440px] bg-white rounded-none sm:rounded-[28px] shadow-sm border-0 sm:border border-slate-200/80 flex flex-col md:flex-row overflow-hidden min-h-screen md:min-h-[92vh]">
        {/* Left Sidebar (Desktop Static + Mobile Slide-Out Drawer) */}
        <Sidebar
          totalCount={
            selectedWedding
              ? stats.totalRegistered ?? displayedGuests.length
              : totalGlobalGuests
          }
          totalWeddingsCount={weddings.length}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileNavOpen(false);
          }}
          onOpenAddModal={() => {
            setIsMobileNavOpen(false);
            handleOpenAddGuestModal();
          }}
          onOpenAddWeddingModal={() => {
            setIsMobileNavOpen(false);
            handleOpenAddWeddingModal();
          }}
          selectedWedding={selectedWedding}
          weddings={weddings}
          onSelectWedding={(w) => {
            setIsMobileNavOpen(false);
            handleSelectWedding(w);
          }}
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
          onOpenChat={() => setIsChatModalOpen(true)}
        />

        {/* Right Main Content */}
        <main className="flex-1 flex flex-col bg-[#fcfdfc] overflow-y-auto min-w-0">
          {/* Top Header Bar */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenAddModal={handleOpenAddGuestModal}
            selectedWedding={selectedWedding}
            weddings={weddings}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />

          {/* Banner 1: Call Center Active Notice */}
          {isCallCenter && (
            <div className="bg-gradient-to-r from-[#fbf6ef] via-[#f7f1e6] to-[#fdfbf7] border-b border-[#e6dbc8] px-6 py-2 flex items-center justify-between text-xs text-[#5c1322] animate-fadeIn">
              <div className="flex items-center gap-2 font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8f273c] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5c1322]"></span>
                </span>
                <Headphones className="w-4 h-4 text-[#722233]" />
                <span>Call Center Telecaller Desk • View-Only Guest Directory • Call Logging & WhatsApp Messaging Enabled</span>
              </div>
              <span className="text-[10px] font-extrabold bg-[#eedfc8] text-[#4a0e17] px-2.5 py-0.5 rounded-full border border-[#dfcbb1] shadow-2xs">
                Call Desk & WhatsApp
              </span>
            </div>
          )}

          {/* Banner 2: Marriage Client View-Only Notice */}
          {isMarriageClient && (
            <div className="bg-gradient-to-r from-amber-50 via-rose-50/50 to-amber-50 border-b border-amber-200/90 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs shadow-2xs">
                  <Heart className="w-3.5 h-3.5" />
                </span>
                <span>
                  {selectedWedding
                    ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name}'s Private Wedding Portal`
                    : "Wedding Client Portal"}
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-300/80">
                  View Only Dashboard
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev === "analytics" ? "directory" : "analytics"))}
                  className="bg-white hover:bg-amber-100/70 text-amber-950 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-800" />
                  <span>{activeTab === "analytics" ? "Guest Directory Table" : "Analytics & Graphs"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatModalOpen(true)}
                  className="bg-[#5c1322] hover:bg-[#480e1b] text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#eedfc8]" />
                  <span>Chat with Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= VIEW 1: MARRIAGE CARDS HUB (ALL WEDDINGS) ================= */}
          {!isMarriageClient && activeTab === "weddings" && (
            <div className="p-5 md:p-7 space-y-5 flex-1 animate-fadeIn">
              {/* Header Title & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Marriage Cards
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a wedding to manage its guest directory, view client login credentials, and manage call center logs.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <button
                      onClick={handleOpenAddWeddingModal}
                      className="bg-[#5c1322] hover:bg-[#480e1b] text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto shadow-xs btn-interactive"
                    >
                      <PlusCircle className="w-4 h-4 text-[#eedfc8]" />
                      <span>+ New Wedding</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Marriage Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                {weddings.map((wedding) => (
                  <WeddingCard
                    key={wedding.id}
                    wedding={wedding}
                    onSelect={handleSelectWedding}
                    onEdit={isAdmin ? handleOpenEditWeddingModal : null}
                    onDelete={isAdmin ? (w) => setDeletingWedding(w) : null}
                    onViewCredentials={(w) => {
                      setCredentialsModalWedding(w);
                      setIsNewlyCreatedWedding(false);
                    }}
                    onOpenGoogleSheet={
                      !isMarriageClient && !isViewOnly
                        ? (w) => {
                            setGoogleSheetModalWedding(w);
                          }
                        : null
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================= VIEW 2: GUEST DIRECTORY & CALL DESK ================= */}
          {activeTab === "directory" && (
            <div className="p-3 sm:p-5 md:p-7 space-y-3.5 sm:space-y-4 flex-1 animate-fadeIn min-w-0">
              {/* Back to All Weddings Bar & Wedding Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  {!isMarriageClient && (
                    <button
                      type="button"
                      onClick={() => handleSelectWedding(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5c1322] hover:text-[#380911] mb-1 cursor-pointer transition-all hover:-translate-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← All Weddings</span>
                    </button>
                  )}

                  <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="truncate">
                      {selectedWedding
                        ? `${selectedWedding.groom_name} & ${selectedWedding.bride_name}`
                        : "Guest Directory"}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f4ebe1] text-[#5c1322] border border-[#e3d3be] shadow-2xs shrink-0">
                      {stats?.totalRegistered !== undefined
                        ? `${stats.totalRegistered} Guests`
                        : selectedWedding?.total_guests !== undefined
                        ? `${selectedWedding.total_guests} Guests`
                        : `${displayedGuests.length} Guests`}
                    </span>
                    {isMarriageClient && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eedfc8] text-[#4a0e17] border border-[#dfcbb1] shrink-0">
                        View Only
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {selectedWedding?.wedding_date && `${selectedWedding.wedding_date} • `}
                    {selectedWedding?.venue || selectedWedding?.city || "Venue"}
                  </p>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {!isMarriageClient && !isViewOnly && (
                    <button
                      onClick={() =>
                        setGoogleSheetModalWedding(
                          selectedWedding || (weddings && weddings[0])
                        )
                      }
                      className="bg-[#f7f2ea] hover:bg-[#eedfc8]/60 border border-[#e3d3be] text-[#5c1322] text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs btn-interactive"
                      title="Live Google Sheet Two-Way Sync"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#722233]" />
                      <span>Google Sheet Sync</span>
                    </button>
                  )}

                  {canSendWhatsApp && (
                    <button
                      onClick={() => {
                        setWhatsAppModalInitialGuest(null);
                        setIsWhatsAppModalOpen(true);
                      }}
                      className="bg-[#25d366]/15 hover:bg-[#25d366]/25 border border-[#25d366]/40 text-[#0f532a] text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs btn-interactive"
                      title="Open WhatsApp Message Desk for this Marriage"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#16a34a]" />
                      <span>WhatsApp Messages</span>
                    </button>
                  )}

                  <button
                    onClick={handleExportCsv}
                    disabled={isExporting}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs btn-interactive"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleSyncData}
                    disabled={isSyncing}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1 cursor-pointer shadow-2xs btn-interactive"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? "animate-spin" : ""}`} />
                  </button>

                  {!isViewOnly && (
                    <button
                      onClick={handleOpenAddGuestModal}
                      className="bg-[#5c1322] hover:bg-[#480e1b] text-white text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs btn-interactive"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#eedfc8]" />
                      <span>Add Guest</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metric Summary Cards */}
              <StatsCards stats={stats} />

              {/* Filter and Search Bar */}
              <FilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sideFilter={sideFilter}
                setSideFilter={setSideFilter}
                rsvpFilter={rsvpFilter}
                setRsvpFilter={setRsvpFilter}
                idCardFilter={idCardFilter}
                setIdCardFilter={setIdCardFilter}
                callAttemptsFilter={callAttemptsFilter}
                setCallAttemptsFilter={setCallAttemptsFilter}
              />

              {/* Guest Directory Table */}
              <GuestTable
                guests={displayedGuests}
                loading={loading}
                onEditGuest={handleOpenEditGuestModal}
                onDeleteGuest={(guest) => setDeletingGuest(guest)}
                onViewGuest={(guest) => setViewingGuest(guest)}
                onOpenCallLogs={handleOpenCallLogs}
                onOpenQuickWhatsApp={(guest) => {
                  setWhatsAppModalInitialGuest(guest);
                  setIsWhatsAppModalOpen(true);
                }}
                onUpdateRsvp={handleQuickUpdateRsvp}
              />
            </div>
          )}

          {/* ================= VIEW 3: ANALYTICS & TRENDS (BAR GRAPH, LINE GRAPH, LOGISTICS) ================= */}
          {activeTab === "analytics" && (
            <AnalyticsView
              guests={displayedGuests}
              wedding={selectedWedding || (weddings && weddings[0])}
              weddings={weddings}
              onSelectWedding={handleSelectWedding}
              isAdmin={isAdmin}
              isMarriageClient={isMarriageClient}
            />
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialTab={loginModalTab}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* 2. Call Center Log & Checkpoint Modal */}
      <CallLogModal
        isOpen={Boolean(callingGuest)}
        guest={callingGuest}
        wedding={selectedWedding}
        onClose={() => {
          setCallingGuest(null);
          loadGuests();
        }}
        onCallLogged={handleCallLogged}
      />

      {/* 3. Add / Edit Marriage Card Modal */}
      <WeddingModal
        isOpen={isWeddingModalOpen}
        onClose={() => {
          setIsWeddingModalOpen(false);
          setEditingWedding(null);
        }}
        onSubmit={handleWeddingSubmit}
        initialData={editingWedding}
        isSubmitting={isSubmittingWedding}
      />

      {/* 4. Wedding Credentials & Share Modal */}
      <WeddingCredentialsModal
        isOpen={Boolean(credentialsModalWedding)}
        wedding={credentialsModalWedding}
        onClose={() => {
          setCredentialsModalWedding(null);
          setIsNewlyCreatedWedding(false);
        }}
        isNewlyCreated={isNewlyCreatedWedding}
      />

      {/* 5. Add / Edit Guest Modal */}
      <GuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => {
          setIsAddGuestModalOpen(false);
          setEditingGuest(null);
        }}
        onSubmit={handleGuestSubmit}
        initialData={editingGuest}
        isSubmitting={isSubmittingGuest}
        nextSrNo={nextSrNo}
        currentWeddingId={selectedWedding?.id || (weddings && weddings[0]?.id) || ""}
      />

      {/* 6. Guest Details Drawer */}
      <GuestDetailsDrawer
        isOpen={Boolean(viewingGuest)}
        guest={viewingGuest}
        onClose={() => setViewingGuest(null)}
        onEdit={canEditGuests ? (guest) => {
          setViewingGuest(null);
          handleOpenEditGuestModal(guest);
        } : null}
        onDelete={isAdmin ? (guest) => {
          setViewingGuest(null);
          setDeletingGuest(guest);
        } : null}
        onOpenCallLogs={(guest) => {
          setViewingGuest(null);
          handleOpenCallLogs(guest);
        }}
        onOpenQuickWhatsApp={(guest) => {
          setViewingGuest(null);
          setWhatsAppModalInitialGuest(guest);
          setIsWhatsAppModalOpen(true);
        }}
      />

      {/* 7. Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deletingGuest || deletingWedding)}
        wedding={deletingWedding}
        guest={deletingGuest}
        onClose={() => {
          setDeletingGuest(null);
          setDeletingWedding(null);
        }}
        onConfirm={
          deletingWedding ? handleDeleteWeddingConfirm : () => handleDeleteGuestConfirm(deletingGuest?.id)
        }
        title={deletingWedding ? "Delete Marriage Card" : "Delete Guest Record"}
        description={
          deletingWedding
            ? `Are you sure you want to delete ${deletingWedding?.groom_name} & ${deletingWedding?.bride_name}'s wedding card? All guest registrations and call records will be permanently removed.`
            : `Are you sure you want to delete ${deletingGuest?.guest_name}? This action cannot be undone.`
        }
        isDeleting={isDeletingGuest || isDeletingWedding}
      />

      {/* 8. Super Admin Password Verification Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={() => {
          showToast("Super Admin authenticated successfully!");
        }}
      />

      {/* 9. Marriage Guest Directory WhatsApp Message Desk Modal */}
      <WhatsAppMessageModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setWhatsAppModalInitialGuest(null);
        }}
        guests={displayedGuests}
        wedding={selectedWedding}
        initialGuest={whatsAppModalInitialGuest}
      />

      {/* 10. Google Sheet Real-Time Sync Modal */}
      <GoogleSheetModal
        isOpen={Boolean(googleSheetModalWedding)}
        wedding={googleSheetModalWedding}
        onClose={() => setGoogleSheetModalWedding(null)}
        onSyncSuccess={async ({ updatedWedding } = {}) => {
          showToast("✓ Google Sheet synchronized with database!");
          if (updatedWedding) {
            setWeddings((prev) =>
              prev.map((w) => (w.id === updatedWedding.id ? { ...w, ...updatedWedding } : w))
            );
            if (selectedWedding?.id === updatedWedding.id) {
              setSelectedWedding((prev) => ({ ...prev, ...updatedWedding }));
            }
          }
          await Promise.all([loadGuests(), loadWeddings()]);
        }}
      />

      {/* 11. Floating Circular Chatbot Section (Opens Wide on Click) */}
      <CircularChatWidget
        onOpenChat={() => setIsChatModalOpen(true)}
        selectedWedding={selectedWedding || (weddings && weddings[0])}
        isChatOpen={isChatModalOpen}
      />

      {/* 12. Live Chat Bot & Direct Messenger Modal (User & Admin Communication) */}
      <ChatBotModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        selectedWedding={selectedWedding || (weddings && weddings[0])}
        weddings={weddings}
        onSelectWedding={handleSelectWedding}
      />
    </div>
  );
}
