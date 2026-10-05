import React from "react";
import Hero from "./pages/Hero";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

function MainApp() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return <Hero />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
