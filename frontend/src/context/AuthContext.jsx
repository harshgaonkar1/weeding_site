import React, { createContext, useContext, useState, useEffect } from "react";
import { api, DEFAULT_USERS } from "../services/api";

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
      setUser(DEFAULT_USERS.callCenter);
      setToken(`mock_callcenter_${Date.now()}`);
      setIsLoginModalOpen(false);
      setIsAdminPasswordModalOpen(false);
    } else if (roleType === "marriage_client") {
      const targetWedding =
        wedding ||
        (user && user.wedding) || {
          id: "wedding_01",
          groom_name: "Aaditya Roy",
          bride_name: "Ananya Sharma",
          wedding_date: "2026-11-28",
          city: "Udaipur, Rajasthan",
          venue: "The Oberoi Udaivilas",
          cover_theme: "emerald",
          client_username: "aaditya_ananya",
        };

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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "guest",
        isAdmin,
        isCallCenter,
        isMarriageClient,
        isViewOnly,
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
