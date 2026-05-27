import React, { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
  X,
  AlertTriangle,
  UserRound,
  Pencil,
  Save,
  Camera,
  UsersRound,
  Check,
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
  guestAccounts = [],
  activeGuestAccountId = "",
  onSelectGuestAccount = () => {},
  onBack = () => {},
  onUpdated = () => {},
}) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [shareLabel, setShareLabel] = useState(
    sharedProfile?.customShareLabel ||
      sharedProfile?.shareLabel ||
      sharedProfile?.label ||
      sharedProfile?.guestAccessCode ||
      "Accès invité"
  );
  const [sharePhoto, setSharePhoto] = useState(
    sharedProfile?.customSharePhoto || sharedProfile?.sharePhoto || ""
  );
  const [sharePhotoS3Key, setSharePhotoS3Key] = useState(
    sharedProfile?.customSharePhotoS3Key || ""
  );
  const [localPhotoFile, setLocalPhotoFile] = useState(null);
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelMessage, setLabelMessage] = useState("");
  const [labelError, setLabelError] = useState("");

  const invitedByName = useMemo(() => {
    return String(
      sharedProfile?.sourceOwnerName ||
        sharedProfile?.ownerName ||
        sharedProfile?.sharedByName ||
        ""
    ).trim();
  }, [sharedProfile]);

  const invitedByEmail = useMemo(() => {
    return String(
      sharedProfile?.sourceOwnerEmail ||
        sharedProfile?.ownerEmail ||
        sharedProfile?.sharedByEmail ||
        ""
    ).trim();
  }, [sharedProfile]);

  const invitedByLabel =
    invitedByName || invitedByEmail || "la personne qui vous a invité";

  const shareId = String(sharedProfile?.id || sharedProfile?.shareId || "").trim();

  useEffect(() => {
    setShareLabel(
      sharedProfile?.customShareLabel ||
        sharedProfile?.shareLabel ||
        sharedProfile?.label ||
        sharedProfile?.guestAccessCode ||
        "Accès invité"
    );
    setSharePhoto(sharedProfile?.customSharePhoto || sharedProfile?.sharePhoto || "");
    setSharePhotoS3Key(sharedProfile?.customSharePhotoS3Key || "");
    setLocalPhotoFile(null);
    setLabelMessage("");
    setLabelError("");
  }, [
    sharedProfile?.id,
    sharedProfile?.customShareLabel,
    sharedProfile?.shareLabel,
    sharedProfile?.label,
    sharedProfile?.guestAccessCode,
    sharedProfile?.customSharePhoto,
    sharedProfile?.sharePhoto,
    sharedProfile?.customSharePhotoS3Key,
  ]);

  const handleSharePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setLabelError("Choisissez une image valide.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLabelError("La photo doit faire moins de 5 Mo.");
      return;
    }

    setLocalPhotoFile(file);
    setSharePhoto(URL.createObjectURL(file));
    setSharePhotoS3Key("");
    setLabelMessage("");
    setLabelError("");
  };

  const uploadSharePhotoIfNeeded = async () => {
    if (!localPhotoFile) {
      return {
        customSharePhoto: sharePhoto,
        customSharePhotoS3Key: sharePhotoS3Key,
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: localPhotoFile.name || "photo-partage.jpg",
        fileType: localPhotoFile.type || "image/jpeg",
        fileSize: localPhotoFile.size,
        childId: `guest-share-${shareId || "profile"}`,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Impossible de préparer l’importation de la photo.");
    }

    const uploadResponse = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": localPhotoFile.type || "image/jpeg" },
      body: localPhotoFile,
    });

    if (!uploadResponse.ok) {
      throw new Error("Impossible d’importer la photo dans l’espace sécurisé.");
    }

    return {
      customSharePhoto: data.downloadUrl || "",
      customSharePhotoS3Key: data.s3Key || "",
    };
  };

  const handleSaveShareLabel = async () => {
    const cleanLabel = shareLabel.trim();

    if (!sharedProfile?.id) {
      setLabelError("Cet accès invité est introuvable.");
      return;
    }

    if (!cleanLabel) {
      setLabelError("Inscrivez un nom pour ce partage.");
      return;
    }

    try {
      setLabelLoading(true);
      setLabelMessage("");
      setLabelError("");

      const uploadedPhoto = await uploadSharePhotoIfNeeded();

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/imported/${sharedProfile.id}/label`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: cleanLabel,
            customSharePhoto: uploadedPhoto.customSharePhoto,
            customSharePhotoS3Key: uploadedPhoto.customSharePhotoS3Key,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de modifier le nom du partage.");
      }

      setSharePhoto(data.share?.customSharePhoto || uploadedPhoto.customSharePhoto || "");
      setSharePhotoS3Key(data.share?.customSharePhotoS3Key || uploadedPhoto.customSharePhotoS3Key || "");
      setLocalPhotoFile(null);
      setLabelMessage("Le profil invité a été modifié.");
      onUpdated();
    } catch (error) {
      setLabelError(error.message || "Impossible de modifier le nom du partage.");
    } finally {
      setLabelLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;
  };

  const handleRemoveGuestAccess = async () => {
    if (!shareId) {
      setRemoveError(
        "Impossible de retrouver l’accès invité à retirer. Déconnectez-vous, puis reconnectez-vous avant de réessayer."
      );
      return;
    }

    try {
      setRemoveLoading(true);
      setRemoveError("");

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/imported/${encodeURIComponent(
          shareId
        )}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            confirmation,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Impossible de retirer cet accès invité."
        );
      }

      window.location.href = data.redirectUrl || "/";
    } catch (error) {
      setRemoveError(
        error.message || "Une erreur est survenue lors du retrait de l’accès invité."
      );
    } finally {
      setRemoveLoading(false);
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

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#FFFDF8] px-4 py-3 ring-1 ring-[#EADFCF]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                  Connecté avec
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-[#4F4A45]">
                  {userEmail || "Courriel non disponible"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF8] px-4 py-3 ring-1 ring-[#EADFCF]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                  Invité par
                </p>

                <div className="mt-1 flex items-start gap-2">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#A8B193]" />

                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-[#4F4A45]">
                      {invitedByLabel}
                    </p>

                    {invitedByName && invitedByEmail ? (
                      <p className="mt-0.5 break-all text-xs font-semibold text-[#7D756E]">
                        {invitedByEmail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SimpleCard>

      {guestAccounts.length > 1 ? (
        <SimpleCard>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4E8F4] text-[#9A7CB0]">
              <UsersRound className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#3F3B35]">Changer de profil invité</p>
              <p className="mt-1 text-sm leading-6 text-[#6B6258]">
                Sélectionnez l’espace partagé que vous voulez consulter ou modifier.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {guestAccounts.map((account) => {
                  const accountPhoto = account.customSharePhoto || account.share?.customSharePhoto || "";
                  const isActive = account.accountId === activeGuestAccountId;

                  return (
                    <button
                      key={account.accountId}
                      type="button"
                      onClick={() => onSelectGuestAccount(account.accountId)}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        isActive
                          ? "border-[#B5A7C8] bg-[#F8F2FB]"
                          : "border-[#EADFCF] bg-[#FFFDF8] hover:bg-[#F8F3EA]"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F4E8F4] text-[#9A7CB0]">
                        {accountPhoto ? (
                          <img src={accountPhoto} alt="Profil invité" className="h-full w-full object-cover" />
                        ) : (
                          <UsersRound className="h-5 w-5" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#3F3B35]">
                          {account.label || "Invité (partagé)"}
                        </span>
                        <span className="block truncate text-xs font-semibold text-[#8B8278]">
                          {account.description || "Accès limité et partagé"}
                        </span>
                      </span>

                      {isActive ? <Check className="h-5 w-5 shrink-0 text-[#8FA173]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SimpleCard>
      ) : null}

      <SimpleCard>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4E8F4] text-[#9A7CB0]">
            <Pencil className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#3F3B35]">Nom du partage</p>
            <p className="mt-1 text-sm leading-6 text-[#6B6258]">
              Ce nom apparaît dans le sélecteur de compte pour distinguer vos différents accès invités.
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F4E8F4] text-[#9A7CB0] ring-1 ring-[#E6D8EF]">
                {sharePhoto ? (
                  <img src={sharePhoto} alt="Profil du partage" className="h-full w-full object-cover" />
                ) : (
                  <UsersRound className="h-8 w-8" />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#6B6258] transition hover:bg-[#F8F3EA]">
                  <Camera className="h-4 w-4" />
                  Choisir une photo
                  <input type="file" accept="image/*" onChange={handleSharePhotoChange} className="hidden" />
                </label>

                {sharePhoto ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSharePhoto("");
                      setSharePhotoS3Key("");
                      setLocalPhotoFile(null);
                      setLabelMessage("");
                      setLabelError("");
                    }}
                    className="rounded-2xl border border-[#EADFCF] bg-white px-4 py-3 text-sm font-bold text-[#8B8278] transition hover:bg-[#F8F3EA]"
                  >
                    Retirer la photo
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={shareLabel}
                onChange={(event) => {
                  setShareLabel(event.target.value);
                  setLabelMessage("");
                  setLabelError("");
                }}
                className="w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none transition focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]"
                placeholder="Ex. Famille Emma"
                maxLength={80}
                disabled={labelLoading}
              />

              <button
                type="button"
                onClick={handleSaveShareLabel}
                disabled={labelLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {labelLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

            {labelMessage ? (
              <p className="mt-3 rounded-2xl bg-[#F3F6ED] px-4 py-3 text-sm font-bold text-[#6F785F] ring-1 ring-[#D8E0C7]">
                {labelMessage}
              </p>
            ) : null}

            {labelError ? (
              <p className="mt-3 rounded-2xl bg-[#FFF0EF] px-4 py-3 text-sm font-bold text-[#A94444] ring-1 ring-[#F1C9C9]">
                {labelError}
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
              Retirer mon compte invité associé à {invitedByLabel}
            </p>

            <p className="mt-1 text-sm leading-6 text-[#8F4F4F]">
              Cette action retire seulement votre accès invité à cet espace
              partagé. Elle ne supprime pas votre compte de connexion et ne
              supprime aucune donnée du parent qui vous a donné accès.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmation("");
            setRemoveError("");
            setShowRemoveModal(true);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#A94444] bg-white px-4 py-3 text-sm font-bold text-[#A94444] transition hover:bg-[#A94444] hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          Retirer mon accès invité
        </button>
      </SimpleCard>

      {showRemoveModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-[#EFE4D6]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E1E1] text-[#A94444]">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#8F4F4F]">
                    Retirer l’accès invité
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#5F5A50]">
                    Vous êtes sur le point de retirer votre accès invité associé
                    à <span className="font-bold">{invitedByLabel}</span>.
                    Cette action ne supprime pas votre compte Camelio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                disabled={removeLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4E4] text-[#3F3D38] ring-1 ring-[#E8D8BE] transition hover:bg-[#F4DFC0] disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E8B8B8] bg-[#FFF8F8] p-4">
              <p className="text-sm leading-6 text-[#8F4F4F]">
                Pour confirmer, inscrivez exactement le mot suivant :
              </p>

              <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-[#8F4F4F] ring-1 ring-[#E8B8B8]">
                retirer
              </p>

              <input
                className="mt-3 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Inscrire retirer"
                disabled={removeLoading}
              />

              {removeError ? (
                <p className="mt-3 rounded-2xl bg-[#F8E1E1] px-4 py-3 text-sm font-bold text-[#9A4F4F] ring-1 ring-[#E8B8B8]">
                  {removeError}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowRemoveModal(false)}
                  disabled={removeLoading}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#3F3D38] ring-1 ring-[#D8C8AF] transition hover:bg-[#FFF4E4] disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleRemoveGuestAccess}
                  disabled={
                    removeLoading ||
                    confirmation.trim().toLowerCase() !== "retirer"
                  }
                  className="rounded-2xl bg-[#A94444] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#923A3A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removeLoading
                    ? "Retrait en cours..."
                    : "Retirer définitivement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
