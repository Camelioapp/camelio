import React, { useEffect, useState } from "react";

import Dashboard from "./components/Dashboard.jsx";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import Login from "./pages/Login.jsx";
import Invitation from "./pages/Invitation.jsx";
import SharedDocument from "./pages/SharedDocument.jsx";
import LandingPage from "./LandingPage.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

function getPath() {
  return window.location.pathname || "/";
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search || "");
  return params.get("token") || params.get("invite") || "";
}

function getSavedInvitationToken() {
  return sessionStorage.getItem("camelio_invitation_token") || "";
}

function saveTokenIfPresent() {
  const token = getTokenFromUrl();

  if (token) {
    sessionStorage.setItem("camelio_invitation_token", token);
  }

  return token;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const [auth, setAuth] = useState({
    authenticated: false,
    user: null,
    referralCode: null,
  });

  const [parentProfile, setParentProfile] = useState(() => {
    let savedProfile = {};

    try {
      savedProfile = JSON.parse(
        localStorage.getItem("camelio_parent_profile_details") || "{}"
      );
    } catch (error) {
      console.error("Erreur lecture profil parent local:", error);
    }

    return {
      name: savedProfile.name || "",
      email: savedProfile.email || "",
      phone: savedProfile.phone || "",
      userId: savedProfile.userId || "",
      photoUrl: savedProfile.photoUrl || "",
      maritalStatus: savedProfile.maritalStatus || "",
    };
  });

  const path = getPath();

  useEffect(() => {
    saveTokenIfPresent();
    loadSession();
  }, []);

  async function loadSession() {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/me`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de vérifier la session.");
      }

      const nextAuth = {
        authenticated: Boolean(data?.authenticated),
        user: data?.user || null,
        referralCode: data?.referralCode || null,
      };

      setAuth(nextAuth);

      if (nextAuth.authenticated && nextAuth.user) {
        setParentProfile((current) => ({
          ...current,
          name:
            current.name ||
            nextAuth.user.name ||
            nextAuth.user.given_name ||
            "",
          email: nextAuth.user.email || current.email || "",
          phone: current.phone || "",
          photoUrl: current.photoUrl || "",
          maritalStatus: current.maritalStatus || "",
        }));
      }
    } catch (error) {
      console.error("Erreur vérification session:", error);

      setAuth({
        authenticated: false,
        user: null,
        referralCode: null,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function goToLogin() {
    const token = getTokenFromUrl() || getSavedInvitationToken();

    if (token) {
      sessionStorage.setItem("camelio_invitation_token", token);
    }

    window.location.href = `${API_BASE_URL}/login`;
  }

  function goToSignup() {
    const token = getTokenFromUrl() || getSavedInvitationToken();

    if (token) {
      sessionStorage.setItem("camelio_invitation_token", token);
    }

    window.location.href = `${API_BASE_URL}/signup`;
  }

  function goToLogout() {
    sessionStorage.removeItem("camelio_invitation_token");
    window.location.href = `${API_BASE_URL}/logout`;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf7ef] text-[#4f4a45]">
        <div className="rounded-[28px] border border-[#eadfcf] bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#8b8278]">
            Chargement de Camelio...
          </p>
        </div>
      </div>
    );
  }

  const invitationToken = getTokenFromUrl() || getSavedInvitationToken();

  if (path === "/accueil") {
    return <LandingPage onLogin={goToLogin} onSignup={goToSignup} />;
  }

  if (path.startsWith("/shared-document/")) {
    return <SharedDocument />;
  }

  if (path === "/invitation") {
    return (
      <Invitation
        authenticated={auth.authenticated}
        user={auth.user}
        onLogin={goToLogin}
        onSignup={goToSignup}
        onSessionRefresh={loadSession}
      />
    );
  }

  if (auth.authenticated && invitationToken) {
    window.history.replaceState(
      null,
      "",
      `/invitation?token=${encodeURIComponent(invitationToken)}`
    );

    return (
      <Invitation
        authenticated={auth.authenticated}
        user={auth.user}
        onLogin={goToLogin}
        onSignup={goToSignup}
        onSessionRefresh={loadSession}
      />
    );
  }

  if (path === "/login") {
    if (!auth.authenticated) {
      return <Login onLogin={goToLogin} onSignup={goToSignup} />;
    }

    return (
      <Dashboard
        parentProfile={parentProfile}
        setParentProfile={setParentProfile}
        onLogout={goToLogout}
      />
    );
  }

  if (!auth.authenticated) {
    return <WelcomeScreen onLogin={goToLogin} onSignup={goToSignup} />;
  }

  return (
    <Dashboard
      parentProfile={parentProfile}
      setParentProfile={setParentProfile}
      onLogout={goToLogout}
    />
  );
}