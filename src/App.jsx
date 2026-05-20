import React, { useEffect, useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
      setIsAuthenticated(false);
      setAuthLoading(false);
    }, 3000);

    fetch(`${import.meta.env.VITE_API_URL}/me`, {
  credentials: "include",
  cache: "no-store",
  signal: controller.signal,
})
      .then((response) => response.json())
      .then((data) => {
  console.log("AUTH:", data.authenticated);
  setIsAuthenticated(Boolean(data.authenticated));
})
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        clearTimeout(timeout);
        setAuthLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F3EA] text-[#55534C]">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
  return <WelcomeScreen />;
}

  return <Dashboard />;
}