import React, { useEffect, useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Billing from "./components/Billing.jsx";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const currentPath = window.location.pathname;

  useEffect(() => {
    let mounted = true;

    fetch(`${API_URL}/me`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) return;
        setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch((error) => {
        console.error("AUTH CHECK ERROR:", error);

        if (mounted) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (currentPath === "/billing") {
    return <Billing />;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F3EA] text-[#55534C]">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <WelcomeScreen />;
  }

  return <Dashboard />;
}