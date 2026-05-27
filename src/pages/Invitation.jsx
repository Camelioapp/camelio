import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Home,
  LogIn,
  LogOut,
  UserPlus,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search || "");
  return params.get("token") || params.get("invite") || "";
}

function getSavedInvitationToken() {
  return sessionStorage.getItem("camelio_invitation_token") || "";
}

function saveInvitationToken(token) {
  if (token) {
    sessionStorage.setItem("camelio_invitation_token", token);
  }
}

function clearInvitationToken() {
  sessionStorage.removeItem("camelio_invitation_token");
}

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

export default function Invitation({
  authenticated = false,
  user = null,
  onLogin = () => {},
  onSignup = () => {},
  onSessionRefresh = () => {},
}) {
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasImportedRef = useRef(false);

  const token = useMemo(() => {
    return getTokenFromUrl() || getSavedInvitationToken();
  }, []);

  useEffect(() => {
    if (token) {
      saveInvitationToken(token);
    }

    loadInvitation();
  }, [token]);

  useEffect(() => {
    if (
      authenticated &&
      token &&
      invitation &&
      !isImporting &&
      !hasImportedRef.current
    ) {
      importInvitation();
    }
  }, [authenticated, token, invitation]);

  async function loadInvitation() {
    try {
      setIsLoadingInvitation(true);
      setError("");
      setMessage("");

      if (!token) {
        setError("Le lien d’invitation est manquant.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/invitation/${encodeURIComponent(
          token
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Cette invitation est introuvable ou expirée.")
        );
      }

      setInvitation(data?.invitation || null);

      if (data?.alreadyAccepted && authenticated) {
        clearInvitationToken();
        window.location.href = "/";
      }
    } catch (loadError) {
      console.error("Erreur chargement invitation:", loadError);
      setError(loadError?.message || "Impossible de charger l’invitation.");
    } finally {
      setIsLoadingInvitation(false);
    }
  }

  async function importInvitation() {
    try {
      hasImportedRef.current = true;

      setIsImporting(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/api/profile-shares/import`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (
          data?.error === "invitation_already_accepted" ||
          response.status === 409
        ) {
          clearInvitationToken();
          window.location.href = "/";
          return;
        }

        throw new Error(
          getErrorMessage(data, "Impossible d’importer cette invitation.")
        );
      }

      clearInvitationToken();
      setMessage("L’accès partagé a été ajouté à votre compte.");

      await onSessionRefresh();

      window.location.href = "/";
    } catch (importError) {
      console.error("Erreur import invitation:", importError);

      hasImportedRef.current = false;

      setError(
        importError?.message ||
          "Impossible d’ajouter cet accès partagé à votre compte."
      );
    } finally {
      setIsImporting(false);
    }
  }

  function handleLogin() {
    saveInvitationToken(token);
    window.location.href = `${API_BASE_URL}/login`;
  }

  function handleSignup() {
    saveInvitationToken(token);
    window.location.href = `${API_BASE_URL}/signup`;
  }

  function handleGoToDashboard() {
    clearInvitationToken();
    window.location.href = "/";
  }

  function handleLogout() {
    clearInvitationToken();
    window.location.href = `${API_BASE_URL}/logout`;
  }

  const invitedEmail = invitation?.inviteeEmail || "";
  const connectedEmail = user?.email || "";
  const childrenNames = (invitation?.children || [])
    .map((child) => child.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative z-10 min-h-screen bg-[#fbf7ef] px-4 py-10 text-[#4f4a45]">
      <div className="relative z-20 mx-auto max-w-2xl rounded-[32px] border border-[#eadfcf] bg-[#fffdf8] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef0e7] text-[#8f9874]">
              <LockKeyhole className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a8b193]">
                Invitation Camelio
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#4f4a45]">
                Vous avez reçu un accès partagé
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#6f685f]">
                Ce petit assistant vous guide pour créer ou utiliser un compte
                Camelio, puis activer uniquement les sections partagées avec vous.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {authenticated ? (
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#a8b193] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95"
              >
                <Home className="h-4 w-4" />
                Tableau de bord
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#eadfcf] bg-white px-4 py-2 text-xs font-bold text-[#7d756e] shadow-sm transition hover:bg-[#faf4ec]"
            >
              <LogOut className="h-4 w-4" />
              Me déconnecter
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-[#eadfcf] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
              Étape 1
            </p>
            <p className="mt-2 text-sm font-bold text-[#4f4a45]">
              Choisir un compte
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7d756e]">
              Connectez-vous ou créez un profil avec le courriel invité.
            </p>
          </div>

          <div className="rounded-3xl border border-[#eadfcf] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
              Étape 2
            </p>
            <p className="mt-2 text-sm font-bold text-[#4f4a45]">
              Code invité
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7d756e]">
              L’accès invité est lié au partage reçu, sans ouvrir tout le compte
              principal.
            </p>
          </div>

          <div className="rounded-3xl border border-[#eadfcf] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
              Étape 3
            </p>
            <p className="mt-2 text-sm font-bold text-[#4f4a45]">
              Espace partagé
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7d756e]">
              Vous verrez seulement les enfants, documents et sections partagés.
            </p>
          </div>
        </div>

        {isLoadingInvitation ? (
          <div className="mt-8 rounded-3xl border border-[#eadfcf] bg-white p-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#7d756e]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement de l’invitation...
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-3xl border border-[#f1c9c9] bg-[#fff0ef] p-5 text-sm font-semibold text-[#b9544a]">
            {error}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {authenticated ? (
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#a8b193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  <Home className="h-4 w-4" />
                  Aller au tableau de bord
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#f1c9c9] bg-white px-5 py-3 text-sm font-bold text-[#b9544a] shadow-sm transition hover:bg-[#fff7f7]"
              >
                <LogOut className="h-4 w-4" />
                Me déconnecter
              </button>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="mt-8 rounded-3xl border border-[#d8e0c7] bg-[#f3f6ed] p-5 text-sm font-semibold text-[#6f785f]">
            {message}
          </div>
        ) : null}

        {invitation ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-[#eadfcf] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a8b193]">
                Détails du partage
              </p>

              <div className="mt-4 grid gap-3 text-sm text-[#5f5a52]">
                <p>
                  <strong>Courriel invité :</strong>{" "}
                  {invitedEmail || "Non précisé"}
                </p>

                {connectedEmail ? (
                  <p>
                    <strong>Courriel connecté :</strong> {connectedEmail}
                  </p>
                ) : null}

                <p>
                  <strong>Enfant(s) :</strong> {childrenNames || "Non précisé"}
                </p>

                <p>
                  <strong>Statut :</strong> {invitation.status || "pending"}
                </p>
              </div>
            </div>

            {!authenticated ? (
              <div className="rounded-3xl border border-[#eadfcf] bg-white p-5">
                <p className="text-sm leading-6 text-[#6f685f]">
                  Connectez-vous ou créez votre compte avec l’adresse courriel
                  invitée. L’accès sera ensuite rattaché automatiquement à ce
                  compte.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="relative z-20 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#a8b193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                  >
                    <LogIn className="h-4 w-4" />
                    Me connecter
                  </button>

                  <button
                    type="button"
                    onClick={handleSignup}
                    className="relative z-20 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#eadfcf] bg-white px-5 py-3 text-sm font-bold text-[#7d756e] shadow-sm transition hover:bg-[#faf4ec]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Créer mon compte
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-[#eadfcf] bg-white p-5">
                {isImporting ? (
                  <div className="flex items-center gap-3 text-sm font-semibold text-[#7d756e]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Ajout de l’accès partagé...
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={importInvitation}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#a8b193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Activer mon accès partagé
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
