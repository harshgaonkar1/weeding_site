import React, { createContext, useContext, useState, useEffect } from "react";
import { api, DEFAULT_USERS } from "../services/api";
import { getSocket } from "../services/socket";

const AuthContext = createContext(null);

// Purge any legacy persistent localStorage auth tokens / user profiles
try {
  localStorage.removeItem("manish_auth_user");
  localStorage.removeItem("manish_auth_token");
} catch (e) {}

export const AuthProvider = ({ children }) => {
  // Initialize user from sessionStorage (closing browser/tab requires password login on reopen)
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("manish_auth_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem("manish_auth_token") || null;
    } catch (e) {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState("admin");
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  const openLoginModal = (tab = "admin") => {
    setLoginModalTab(tab);
    setIsLoginModalOpen(true);
  };

  // Sync to sessionStorage (session-scoped: cleared automatically on browser/tab close)
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("manish_auth_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("manish_auth_user");
    }
    try {
      localStorage.removeItem("manish_auth_user");
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("manish_auth_token", token);
    } else {
      sessionStorage.removeItem("manish_auth_token");
    }
    try {
      localStorage.removeItem("manish_auth_token");
    } catch (e) {}
  }, [token]);

  // Keep Call Center user assignment strictly up-to-date with backend DB
  useEffect(() => {
    if (user?.id && user?.role === "call_center") {
      api
        .getMe(user.id)
        .then((fresh) => {
          if (
            fresh &&
            (fresh.wedding_id !== user.wedding_id ||
              fresh.assigned_wedding_name !== user.assigned_wedding_name)
          ) {
            setUser((prev) => ({
              ...prev,
              ...fresh,
            }));
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  // Listen for real-time user reassignment events from admin
  useEffect(() => {
    const handleDataChanged = (payload) => {
      if (!payload) return;
      if (
        (payload.action === "user_updated" || payload.type === "user_updated") &&
        user?.id &&
        payload.userId === user.id
      ) {
        setUser((prev) => ({
          ...prev,
          ...(payload.user || {}),
          wedding_id: payload.wedding_id || payload.user?.wedding_id || prev?.wedding_id,
          assigned_wedding_name:
            payload.user?.assigned_wedding_name || prev?.assigned_wedding_name,
        }));
      }
    };

    try {
      const socket = getSocket();
      if (socket) {
        socket.on("data_changed", handleDataChanged);
        return () => {
          socket.off("data_changed", handleDataChanged);
        };
      }
    } catch (e) {}
  }, [user?.id]);

  const login = async (identifier, password) => {
    // Purge any stale cache to ensure fresh data loads from the database
    try {
      sessionStorage.removeItem("manish_weddings_data");
      sessionStorage.removeItem("manish_guest_data_v3");
      sessionStorage.removeItem("manish_call_logs_v1");
      sessionStorage.removeItem("manish_selected_wedding_id");
      localStorage.removeItem("manish_weddings_data");
      localStorage.removeItem("manish_guest_data_v3");
      localStorage.removeItem("manish_call_logs_v1");
      localStorage.removeItem("manish_selected_wedding_id");
    } catch (e) {}

    const result = await api.login(identifier, password);
    if (result && result.user) {
      setUser(result.user);
      setToken(result.token || `token_${Date.now()}`);
      sessionStorage.setItem("manish_auth_user", JSON.stringify(result.user));
      sessionStorage.setItem("manish_auth_token", result.token || `token_${Date.now()}`);
      setIsLoginModalOpen(false);
      setIsAdminPasswordModalOpen(false);
      return result.user;
    }
    throw new Error("Login failed");
  };

  const loginAsAdmin = async (password) => {
    return await login("admin@weddingsite.com", password);
  };

  const quickLogin = (roleType, wedding = null) => {
    try {
      sessionStorage.removeItem("manish_weddings_data");
      sessionStorage.removeItem("manish_guest_data_v3");
      sessionStorage.removeItem("manish_call_logs_v1");
      sessionStorage.removeItem("manish_selected_wedding_id");
      localStorage.removeItem("manish_weddings_data");
      localStorage.removeItem("manish_guest_data_v3");
      localStorage.removeItem("manish_call_logs_v1");
      localStorage.removeItem("manish_selected_wedding_id");
    } catch (e) {}

    if (roleType === "admin") {
      setUser(DEFAULT_USERS.admin);
      setToken(`mock_admin_${Date.now()}`);
      setIsLoginModalOpen(false);
      setIsAdminPasswordModalOpen(false);
    } else if (roleType === "call_center") {
      const targetWId = wedding?.id || DEFAULT_USERS.callCenter.wedding_id || "all";
      const callerUser = {
        ...DEFAULT_USERS.callCenter,
        wedding_id: targetWId,
        assigned_weddings: [targetWId],
        assigned_wedding_name: wedding
          ? `${wedding.groom_name} & ${wedding.bride_name}`
          : DEFAULT_USERS.callCenter.assigned_wedding_name || "All Marriages",
      };
      setUser(callerUser);
      setToken(`mock_callcenter_${Date.now()}`);
      setIsLoginModalOpen(false);
      setIsAdminPasswordModalOpen(false);
    } else if (roleType === "marriage_client") {
      const targetWedding =
        wedding ||
        (user && user.wedding) ||
        null;

      if (!targetWedding) return;

      const clientUser = {
        id: `marriage_${targetWedding.id}`,
        name: `${targetWedding.groom_name} & ${targetWedding.bride_name}`,
        email: `${targetWedding.client_username || targetWedding.id}@weddingportal.com`,
        username: targetWedding.client_username || targetWedding.id,
        role: "marriage_client",
        wedding_id: targetWedding.id,
        venue: targetWedding.venue,
        city: targetWedding.city,
        wedding_date: targetWedding.wedding_date,
        cover_theme: targetWedding.cover_theme,
        avatar: null,
        is_view_only: true,
        wedding: targetWedding,
      };
      setUser(clientUser);
      setToken(`mock_client_${targetWedding.id}_${Date.now()}`);
      setIsLoginModalOpen(false);
      setIsAdminPasswordModalOpen(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      sessionStorage.clear();
      localStorage.removeItem("manish_auth_user");
      localStorage.removeItem("manish_auth_token");
      localStorage.removeItem("manish_weddings_data");
      localStorage.removeItem("manish_guest_data_v3");
      localStorage.removeItem("manish_call_logs_v1");
      localStorage.removeItem("manish_selected_wedding_id");
      localStorage.removeItem("manish_custom_users");
    } catch (e) {}
    openLoginModal("admin");
  };

  const isAdmin = user?.role === "admin";
  const isCallCenter = user?.role === "call_center";
  const isMarriageClient = user?.role === "marriage_client";
  const isViewOnly = user?.role === "marriage_client" || Boolean(user?.is_view_only);
  const weddingId = user?.wedding_id || null;

  // Granular capability permissions
  const canEditGuests = isAdmin; // Only Super Admin can add, edit, or delete guest records
  const canUpdateCallLogs = isAdmin || isCallCenter; // Call center & Admin can update call logs
  const canSendWhatsApp = isAdmin || isCallCenter; // Call center & Admin can send WhatsApp messages

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "guest",
        isAdmin,
        isCallCenter,
        isMarriageClient,
        isViewOnly,
        canEditGuests,
        canUpdateCallLogs,
        canSendWhatsApp,
        weddingId,
        token,
        login,
        loginAsAdmin,
        quickLogin,
        logout,
        setUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginModalTab,
        setLoginModalTab,
        openLoginModal,
        isAdminPasswordModalOpen,
        setIsAdminPasswordModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
