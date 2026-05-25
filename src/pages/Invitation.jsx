import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

function formatDateTime(value) {
  if (!value) return "Non précisé";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Non précisé";

  return date.toLocaleString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSections(sectionIds = [], sectionPermissions = {}) {
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return "Sections sélectionnées";
  }

  const labels = {
    children: "Profil enfant",
    photos: "Photos",
    "memorable-phrases": "Petites phrases",
    calendar: "Calendrier",
    sante: "Santé",
    documents: "Documents",
    invoices: "Factures",
    calculator: "Calculateur",
    "parental-plan": "Plan parental",
    notes: "Notes",
  };

  const permissionLabels = {
    read: "lecture seule",
    edit: "modification",
    delete: "modification et suppression",
  };

  return sectionIds
    .map((sectionId) => {
      const label = labels[sectionId] || sectionId;
      const permission = permissionLabels[sectionPermissions[sectionId]] || "lecture seule";
      return `${label} (${permission})`;
    })
    .join(", ");
}

export default function Invitation() {
  const token = useMemo(() => getTokenFromUrl(), []);
  const returnTo = `/invitation?token=${encodeURIComponent(token)}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInvitation() {
    if (!token) {
      setMessage("Le lien d’invitation est manquant.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/invitation/${encodeURIComponent(token)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de lire l’invitation.");
      }

      setInvitation(data.invitation);
    } catch (error) {
      setMessage(error?.message || "Impossible de lire l’invitation.");
    } finally {
      setIsLoading(false);
    }
  }

  async function acceptInvitation() {
    try {
      setIsAccepting(true);
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/api/profile-shares/accept`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible d’accepter l’invitation.");
      }

      setMessage("L’accès partagé a été ajouté à votre compte.");
      setInvitation((current) => ({
        ...current,
        status: "accepted",
      }));
    } catch (error) {
      setMessage(error?.message || "Impossible d’accepter l’invitation.");
    } finally {
      setIsAccepting(false);
    }
  }

  function goToLogin() {
    window.location.href = `${API_BASE_URL}/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  function goToSignup() {
    window.location.href = `${API_BASE_URL}/signup?returnTo=${encodeURIComponent(returnTo)}`;
  }

  const childNames =
    (invitation?.children || []).map((child) => child.name).join(", ") ||
    "Non précisé";

  return (
    <div className="min-h-screen bg-[#FFFDF8] px-4 py-10 text-[#4F4A45]">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-[#EADFCF] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#EEF0E7] text-[#6F785F]">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
              Invitation Camelio
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#4F4A45]">
              Vous avez reçu un accès partagé
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#7D756E]">
              Pour protéger les informations familiales, l’invitation fonctionne
              seulement avec l’adresse courriel à laquelle elle a été envoyée.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-[#EADFCF] bg-[#FFFDF8] p-6 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-[#A8B193]" />
            <p className="mt-3 text-sm font-semibold text-[#7D756E]">
              Validation de l’invitation...
            </p>
          </div>
        ) : invitation ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#EADFCF] bg-[#FFFDF8] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                Détails de l’invitation
              </p>

              <div className="mt-4 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#A8B193]" />
                  <div>
                    <p className="text-xs font-bold text-[#7D756E]">
                      Adresse invitée
                    </p>
                    <p className="text-sm font-semibold text-[#4F4A45]">
                      {invitation.inviteeEmail}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold text-[#7D756E]">
                    Enfant(s) partagé(s)
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#4F4A45]">
                    {childNames}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold text-[#7D756E]">
                    Accès reçu
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#4F4A45]">
                    {formatSections(
                      invitation.sectionIds,
                      invitation.sectionPermissions
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold text-[#7D756E]">
                    Expiration du lien
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#4F4A45]">
                    {formatDateTime(invitation.expiresAt)}
                  </p>
                </div>
              </div>
            </div>

            {message ? (
              <div className="rounded-2xl border border-[#EEC988] bg-[#FFF8E8] p-3 text-sm font-semibold text-[#8A6F34]">
                {message}
              </div>
            ) : null}

            {!invitation.authenticated ? (
              <div className="rounded-3xl border border-[#EADFCF] bg-white p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-1 h-5 w-5 shrink-0 text-[#A8B193]" />
                  <div>
                    <p className="font-bold text-[#4F4A45]">
                      Connectez-vous avec l’adresse invitée
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#7D756E]">
                      Si vous n’avez pas encore de compte Camelio, créez un
                      compte avec cette même adresse courriel.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={goToSignup}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                  >
                    <UserPlus className="h-4 w-4" />
                    Créer mon compte
                  </button>

                  <button
                    type="button"
                    onClick={goToLogin}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E] shadow-sm transition hover:bg-[#FAF4EC]"
                  >
                    <LogIn className="h-4 w-4" />
                    Me connecter
                  </button>
                </div>
              </div>
            ) : invitation.canAccept ? (
              <button
                type="button"
                onClick={acceptInvitation}
                disabled={isAccepting || invitation.status === "accepted"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {invitation.status === "accepted"
                  ? "Invitation acceptée"
                  : isAccepting
                    ? "Acceptation..."
                    : "Accepter l’accès partagé"}
              </button>
            ) : (
              <div className="rounded-2xl border border-[#F1C9C9] bg-[#FFF0EF] p-3 text-sm font-semibold text-[#B9544A]">
                Cette invitation est associée à une autre adresse courriel.
                Connectez-vous avec l’adresse utilisée pour recevoir
                l’invitation.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#F1C9C9] bg-[#FFF0EF] p-4 text-sm font-semibold text-[#B9544A]">
            {message || "Cette invitation est introuvable ou expirée."}
          </div>
        )}
      </div>
    </div>
  );
}
