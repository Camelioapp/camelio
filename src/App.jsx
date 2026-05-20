import React, { useEffect, useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch(`${import.meta.env.VITE_API_URL}/me`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("ME RESPONSE:", data);

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