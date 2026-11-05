import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Headphones,
  UserPlus,
  Users,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit3,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Phone,
  Mail,
  Lock,
  RefreshCw,
  AlertCircle,
  Building2,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { api } from "../services/api";

export default function CallCenterManagementModal({
  isOpen,
  onClose,
  weddings = [],
  onUserUpdated,
}) {
  const [activeTab, setActiveTab] = useState("team"); // 'team' | 'create'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [weddingFilter, setWeddingFilter] = useState("all");

  // Create Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    wedding_id: "all",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    wedding_id: "all",
    newPassword: "",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Action Notification
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load users on modal open
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setFormError("");
      setFormSuccess("");
      setEditingUser(null);
      setDeletingUser(null);
    }
  }, [isOpen]);

  // Generate suggested credentials for Call Center agent
  const generateSuggestedCredentials = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `agent_${randomNum}`;
    const generatedPassword = `call${randomNum}`;
    setFormData((prev) => ({
      ...prev,
      email: prev.email || generatedUsername,
      password: generatedPassword,
    }));
    setShowPassword(true);
  };

  // Handle Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) {
      setFormError("Agent full name is required");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Username or email is required");
      return;
    }
    if (!formData.password.trim()) {
      setFormError("Password is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const targetWedding = weddings.find((w) => w.id === formData.wedding_id);
      const assignedName =
        formData.wedding_id === "all"
          ? "All Marriages"
          : targetWedding
          ? `${targetWedding.groom_name} & ${targetWedding.bride_name}`
          : formData.wedding_id;

      const newUser = await api.createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: "call_center",
        phone: formData.phone.trim() || null,
        wedding_id: formData.wedding_id || "all",
        assigned_weddings: [formData.wedding_id || "all"],
        assigned_wedding_name: assignedName,
      });

      setFormSuccess(`Call center agent "${newUser.name}" created successfully!`);
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        wedding_id: "all",
      });
      await loadUsers();
      if (onUserUpdated) onUserUpdated();
      showNotification(`Account "${newUser.name}" created & assigned!`);
      setTimeout(() => setActiveTab("team"), 1200);
    } catch (err) {
      setFormError(err.message || "Failed to create call center account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick reassign marriage directly from table
  const handleQuickReassign = async (user, newWeddingId) => {
    try {
      const targetWedding = weddings.find((w) => w.id === newWeddingId);
      const newWeddingName =
        newWeddingId === "all"
          ? "All Marriages"
          : targetWedding
          ? `${targetWedding.groom_name} & ${targetWedding.bride_name}`
          : newWeddingId;

      // Optimistic UI update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                wedding_id: newWeddingId,
                assigned_weddings: [newWeddingId],
                assigned_wedding_name: newWeddingName,
              }
            : u
        )
      );

      await api.updateUser(user.id, {
        wedding_id: newWeddingId,
        assigned_weddings: [newWeddingId],
        assigned_wedding_name: newWeddingName,
      });

      showNotification(`Assigned ${user.name} to ${newWeddingName}`);
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error("Reassign failed:", err);
      showNotification("Failed to update assignment", "error");
      loadUsers();
    }
  };

  // Open Edit Dialog
  const handleStartEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      wedding_id: user.wedding_id || "all",
      newPassword: "",
    });
    setEditError("");
  };

  // Save Edit User
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");

    try {
      setIsEditSubmitting(true);
      const targetWedding = weddings.find((w) => w.id === editFormData.wedding_id);
      const assignedName =
        editFormData.wedding_id === "all"
          ? "All Marriages"
          : targetWedding
          ? `${targetWedding.groom_name} & ${targetWedding.bride_name}`
          : editFormData.wedding_id;

      const payload = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim() || null,
        wedding_id: editFormData.wedding_id || "all",
        assigned_weddings: [editFormData.wedding_id || "all"],
        assigned_wedding_name: assignedName,
      };

      if (editFormData.newPassword && editFormData.newPassword.trim()) {
        payload.password = editFormData.newPassword.trim();
      }

      await api.updateUser(editingUser.id, payload);
      setEditingUser(null);
      await loadUsers();
      if (onUserUpdated) onUserUpdated();
      showNotification(`Updated profile for ${payload.name}`);
    } catch (err) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      setIsDeleting(true);
      await api.deleteUser(deletingUser.id);
      setDeletingUser(null);
      await loadUsers();
      if (onUserUpdated) onUserUpdated();
      showNotification(`Deleted account for ${deletingUser.name}`);
    } catch (err) {
      showNotification(err.message || "Failed to delete user", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  // Filter users
  const callCenterUsers = users.filter((u) => u.role === "call_center");
  const filteredUsers = callCenterUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.assigned_wedding_name && u.assigned_wedding_name.toLowerCase().includes(q));

    const matchWedding =
      weddingFilter === "all" ||
      u.wedding_id === weddingFilter ||
      (weddingFilter === "global" && (u.wedding_id === "all" || !u.wedding_id));

    return matchSearch && matchWedding;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#eedfc8] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#480e1b] via-[#5c1322] to-[#722233] px-6 py-5 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Headphones className="w-6 h-6 text-[#eedfc8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight font-serif text-white">
                  Call Center Team & Allocation
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eedfc8]/20 text-[#eedfc8] border border-[#eedfc8]/30">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-[#eedfc8]/80 mt-0.5">
                Create telecaller accounts, assign specific marriages, and manage call desk access.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between transition-all ${
              notification.type === "error"
                ? "bg-rose-50 text-rose-800 border-b border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {notification.msg}
            </span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Switcher & Quick Metrics */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-[#fdfbf7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#f4ebe1] p-1 rounded-2xl border border-[#e3d3be]">
            <button
              onClick={() => setActiveTab("team")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "team"
                  ? "bg-[#5c1322] text-white shadow-xs"
                  : "text-slate-700 hover:text-[#5c1322]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Call Center Agents ({callCenterUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "create"
                  ? "bg-[#5c1322] text-white shadow-xs"
                  : "text-slate-700 hover:text-[#5c1322]"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create New ID</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs font-bold text-slate-800">
              {weddings.length} Marriages Configured
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              Active Call Desk
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {/* TAB 1: TEAM DIRECTORY & REASSIGNMENT */}
          {activeTab === "team" && (
            <div className="space-y-4">
              {/* Search & Wedding Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search agent by name, username, phone or wedding..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 focus:border-[#5c1322]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter:</span>
                  <select
                    value={weddingFilter}
                    onChange={(e) => setWeddingFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20"
                  >
                    <option value="all">All Agents</option>
                    <option value="global">Global Desk (All Marriages)</option>
                    {weddings.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.groom_name} & {w.bride_name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={loadUsers}
                    title="Refresh agents"
                    className="p-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-slate-600 hover:text-[#5c1322] hover:bg-[#eedfc8]/40 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#5c1322]" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Agent Cards / Table */}
              {loading && filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#5c1322]" />
                  <span>Loading call center agents...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-[#fdfbf7] p-8">
                  <Headphones className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Call Center Agents Found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? "No agents matched your search query."
                      : "Create your first telecaller ID to begin assigning marriages and handling guest RSVPs."}
                  </p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5c1322] text-white text-xs font-bold hover:bg-[#480e1b] transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Call Center Account</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((agent) => {
                    const isGlobal = !agent.wedding_id || agent.wedding_id === "all";
                    return (
                      <div
                        key={agent.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#eedfc8] hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Agent Info */}
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5c1322] to-[#8f273c] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {agent.avatar ? (
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-full h-full object-cover rounded-2xl"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              agent.name?.charAt(0).toUpperCase() || "A"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-slate-900">{agent.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Active
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {agent.email}
                              </span>
                              {agent.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {agent.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Marriage Assignment Dropdown */}
                        <div className="flex-1 max-w-sm">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Assigned Marriage
                          </label>
                          <div className="relative">
                            <select
                              value={agent.wedding_id || "all"}
                              onChange={(e) => handleQuickReassign(agent, e.target.value)}
                              className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 ${
                                isGlobal
                                  ? "bg-amber-50/70 border-amber-300 text-amber-900"
                                  : "bg-[#fbf7f0] border-[#e3d3be] text-[#5c1322]"
                              }`}
                            >
                              <option value="all">🌟 All Marriages (Global Call Desk)</option>
                              {weddings.map((w) => (
                                <option key={w.id} value={w.id}>
                                  💍 {w.groom_name} & {w.bride_name} ({w.total_guests || 0} guests)
                                </option>
                              ))}
                            </select>
                            <Building2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                          <button
                            onClick={() => handleStartEdit(agent)}
                            title="Edit Agent Profile / Password"
                            className="p-2 rounded-xl bg-slate-50 hover:bg-[#eedfc8]/40 text-slate-600 hover:text-[#5c1322] border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingUser(agent)}
                            title="Delete Agent ID"
                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW CALL CENTER ID */}
          {activeTab === "create" && (
            <div className="max-w-2xl mx-auto py-2">
              <div className="mb-6 bg-gradient-to-r from-[#fbf8f2] to-[#f7f2ea] p-4 rounded-2xl border border-[#eedfc8]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#5c1322] text-[#eedfc8] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#5c1322] uppercase tracking-wider">
                      Marriage Scoping Guarantee
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      When a call center agent logs in with their credentials, their dashboard will automatically
                      and strictly display only the marriage assigned to them. Assigning <strong>"All Marriages"</strong> allows them to switch between all events freely.
                    </p>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Agent Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 focus:border-[#5c1322]"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 focus:border-[#5c1322]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username / Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Username / Login ID <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateSuggestedCredentials}
                        className="text-[11px] font-bold text-[#5c1322] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Auto-Suggest
                      </button>
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. priya or priya@emitly.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 focus:border-[#5c1322]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter secure password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 focus:border-[#5c1322]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Assign Marriage Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assign Marriage Allocation <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.wedding_id}
                      onChange={(e) => setFormData({ ...formData, wedding_id: e.target.value })}
                      className="w-full appearance-none px-3.5 py-3 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20 focus:border-[#5c1322]"
                    >
                      <option value="all">🌟 All Marriages (Global Call Desk - Agent can access all)</option>
                      {weddings.map((w) => (
                        <option key={w.id} value={w.id}>
                          💍 {w.groom_name} & {w.bride_name} — {w.venue || w.city || "Venue"} ({w.total_guests || 0} guests)
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select which marriage this telecaller will handle. They cannot access other clients' guest lists.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("team")}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#5c1322] hover:bg-[#480e1b] active:scale-98 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-[#eedfc8]" />
                        <span>Create Call Center Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* EDIT SUB-MODAL */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#eedfc8] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#5c1322]" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Edit Agent: {editingUser.name}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Login Username / Email</label>
                  <input
                    type="text"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Marriage
                  </label>
                  <select
                    value={editFormData.wedding_id}
                    onChange={(e) => setEditFormData({ ...editFormData, wedding_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20"
                  >
                    <option value="all">🌟 All Marriages (Global Call Desk)</option>
                    {weddings.map((w) => (
                      <option key={w.id} value={w.id}>
                        💍 {w.groom_name} & {w.bride_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password (Leave blank to keep existing)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password if changing"
                    value={editFormData.newPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#faf7f2] border border-[#e3d3be] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5c1322]/20"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#5c1322] hover:bg-[#480e1b] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {isEditSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {deletingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Delete Call Center Agent?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong>{deletingUser.name}</strong> ({deletingUser.email})? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Agent"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

