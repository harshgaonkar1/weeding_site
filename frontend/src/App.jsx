import React from "react";
import Hero from "./pages/Hero";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

function MainApp() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ErrorBoundary>
      <Hero />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
