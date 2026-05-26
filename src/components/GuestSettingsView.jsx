import React, { useState } from "react";
import {
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

function SimpleCard({ children, className = "" }) {
  return (
    <section
      className={`rounded-[2rem] border border-[#EADFCF] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

export default function GuestSettingsView({
  sharedProfile = null,
  userEmail = "",
  onBack = () => {},
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError("");

      const response = await fetch(`${API_BASE_URL}/api/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          confirmation,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Impossible de supprimer le compte."
        );
      }

      localStorage.clear();

      window.location.href = data.redirectUrl || "https://camelio.app";
    } catch (error) {
      setDeleteError(
        error.message || "Une erreur est survenue lors de la suppression."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF0E7] text-[#7A8B69]">
              <Settings className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                Paramètres
              </p>

              <h2 className="text-2xl font-bold text-[#3F3B35]">
                Mon accès invité
              </h2>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
            Cette section permet de gérer votre session et les actions liées à
            votre compte invité.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-sm font-bold text-[#7D756E] transition hover:bg-[#F8F3EA]"
        >
          Retour
        </button>
      </div>

      <SimpleCard>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#A8B193] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#3F3B35]">Accès actuel</p>

            <p className="mt-1 text-sm leading-6 text-[#6B6258]">
              Vous consultez un espace partagé dans Camelio. Vos accès sont
              limités aux sections autorisées par la personne qui vous a invité.
            </p>

            {userEmail ? (
              <p className="mt-3 break-all rounded-2xl bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] ring-1 ring-[#EADFCF]">
                {userEmail}
              </p>
            ) : null}

            {sharedProfile?.ownerName ? (
              <p className="mt-3 text-sm text-[#7D756E]">
                Partagé par :{" "}
                <span className="font-bold text-[#4F4A45]">
                  {sharedProfile.ownerName}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </SimpleCard>

      <SimpleCard>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8FA173] text-white">
            <LogOut className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#3F3B35]">Déconnexion</p>

            <p className="mt-1 text-sm leading-6 text-[#6B6258]">
              Fermez votre session actuelle et retournez à la page d’accueil.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8FA173] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </SimpleCard>

      <SimpleCard className="border-[#F1C9C9] bg-[#FFF8F8]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E1E1] text-[#A94444]">
            <Trash2 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A94444]">
              Zone sensible
            </p>

            <p className="mt-1 font-bold text-[#8F4F4F]">
              Supprimer mon compte
            </p>

            <p className="mt-1 text-sm leading-6 text-[#8F4F4F]">
              Cette action supprime votre compte de connexion et les données
              associées à votre utilisateur. Elle ne supprime pas les données du
              parent qui vous a donné accès.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmation("");
            setDeleteError("");
            setShowDeleteModal(true);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#A94444] bg-white px-4 py-3 text-sm font-bold text-[#A94444] transition hover:bg-[#A94444] hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </button>
      </SimpleCard>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-[#EFE4D6]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E1E1] text-[#A94444]">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#8F4F4F]">
                    Supprimer le compte
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#5F5A50]">
                    Cette action est permanente. Pour confirmer, inscrivez
                    exactement le mot suivant :
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4E4] text-[#3F3D38] ring-1 ring-[#E8D8BE] transition hover:bg-[#F4DFC0] disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E8B8B8] bg-[#FFF8F8] p-4">
              <p className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#8F4F4F] ring-1 ring-[#E8B8B8]">
                supprimer
              </p>

              <input
                className="mt-3 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Inscrire supprimer"
                disabled={deleteLoading}
              />

              {deleteError ? (
                <p className="mt-3 rounded-2xl bg-[#F8E1E1] px-4 py-3 text-sm font-bold text-[#9A4F4F] ring-1 ring-[#E8B8B8]">
                  {deleteError}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#3F3D38] ring-1 ring-[#D8C8AF] transition hover:bg-[#FFF4E4] disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteLoading ||
                    confirmation.trim().toLowerCase() !== "supprimer"
                  }
                  className="rounded-2xl bg-[#A94444] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#923A3A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteLoading
                    ? "Suppression en cours..."
                    : "Supprimer définitivement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}