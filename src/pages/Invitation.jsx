import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole, LogIn, UserPlus } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.camelio.app";

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
    if (authenticated && token && invitation && !isImporting) {
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
          data?.message || "Cette invitation est introuvable ou expirée."
        );
      }

      setInvitation(data.invitation || null);
    } catch (loadError) {
      console.error("Erreur chargement invitation:", loadError);
      setError(loadError?.message || "Impossible de charger l’invitation.");
    } finally {
      setIsLoadingInvitation(false);
    }
  }

  async function importInvitation() {
    try {
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
        throw new Error(
          data?.message || "Impossible d’importer cette invitation."
        );
      }

      clearInvitationToken();

      setMessage("L’accès partagé a été ajouté à votre compte.");

      await onSessionRefresh();

      window.location.href = "/";
    } catch (importError) {
      console.error("Erreur import invitation:", importError);
      setError(
        importError?.message ||
          "Impossible d’ajouter cet accès partagé à votre compte."
      );
    } finally {
      setIsImporting(false);
    }
  }

  const invitedEmail = invitation?.inviteeEmail || "";
  const connectedEmail = user?.email || "";

  return (
    <div className="relative z-10 min-h-screen bg-[#fbf7ef] px-4 py-10 text-[#4f4a45]">
     <div className="relative z-20 mx-auto max-w-2xl rounded-[32px] border border-[#eadfcf] bg-[#fffdf8] p-6 shadow-sm md:p-8">
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
              Pour protéger les informations familiales, l’invitation fonctionne
              seulement avec l’adresse courriel à laquelle elle a été envoyée.
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
                  <strong>Enfant(s) :</strong>{" "}
                  {(invitation.children || [])
                    .map((child) => child.name)
                    .filter(Boolean)
                    .join(", ") || "Non précisé"}
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
                  invitée pour accéder à l’espace partagé.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
  type="button"
  onClick={() => {
    saveInvitationToken(token);
    window.location.href = `${API_BASE_URL}/login`;
  }}
  className="relative z-20 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#a8b193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
>
  <LogIn className="h-4 w-4" />
  Me connecter
</button>

<button
  type="button"
  onClick={() => {
    saveInvitationToken(token);
    window.location.href = `${API_BASE_URL}/signup`;
  }}
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
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#a8b193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
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