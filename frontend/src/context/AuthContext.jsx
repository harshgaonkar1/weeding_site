import React, { createContext, useContext, useState, useEffect } from "react";
import { api, DEFAULT_USERS } from "../services/api";
import { getSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage or null (prompts login page)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("manish_auth_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("manish_auth_token") || null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState("admin");
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  const openLoginModal = (tab = "admin") => {
    setLoginModalTab(tab);
    setIsLoginModalOpen(true);
  };

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("manish_auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("manish_auth_user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("manish_auth_token", token);
    } else {
      localStorage.removeItem("manish_auth_token");
    }
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
    const result = await api.login(identifier, password);
    if (result && result.user) {
      setUser(result.user);
      setToken(result.token || `token_${Date.now()}`);
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
    localStorage.removeItem("manish_auth_user");
    localStorage.removeItem("manish_auth_token");
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
