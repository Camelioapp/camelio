import React, { useEffect, useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Billing from "./components/billing.jsx";
import LandingPage from "./LandingPage.jsx";
import Invitation from "./pages/Invitation.jsx";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [parentProfile, setParentProfile] = useState({
    name: "",
    email: "",
    phone: "",
    userId: "",
  });

  const currentPath = window.location.pathname;

  const loadParentProfile = async () => {
    try {
      setProfileLoading(true);

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger le profil utilisateur."
        );
      }

      if (data.profile) {
        setParentProfile({
          name: data.profile.name || data.profile.displayName || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          userId: data.profile.userId || "",
        });
      }
    } catch (error) {
      console.error("PROFILE LOAD ERROR:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!mounted) return;

        const authenticated = Boolean(data.authenticated);
        setIsAuthenticated(authenticated);

        if (authenticated) {
          await loadParentProfile();
        }
      } catch (error) {
        console.error("AUTH CHECK ERROR:", error);

        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (currentPath === "/invitation") {
    return <Invitation />;
  }

  /*
    Route publique de la landing page.
    Accessible ici :
    https://camelio.app/accueil
  */
  if (currentPath === "/accueil") {
  return <LandingPage />;
}

  /*
    Route billing existante.
  */
  if (currentPath === "/billing") {
    return <Billing />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F3EA] text-[#55534C]">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <WelcomeScreen />;
  }

  return (
    <Dashboard
      parentProfile={parentProfile}
      setParentProfile={setParentProfile}
    />
  );
}