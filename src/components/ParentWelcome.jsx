import React, { useMemo, useState } from "react";
import {
  Camera,
  Check,
  Image as ImageIcon,
  LogOut,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

const familyRoleOptions = [
  "Papa",
  "Maman",
  "Grand-papa",
  "Grand-maman",
  "Beau-papa",
  "Belle-maman",
  "Tuteur",
  "Tutrice",
  "Oncle",
  "Tante",
  "Autre",
];

const presetPhotos = [
  "/Profil/Fille/profil_01.png",
  "/Profil/Fille/profil_02.png",
  "/Profil/Fille/profil_03.png",
  "/Profil/Fille/profil_04.png",
  "/Profil/Fille/profil_05.png",
  "/Profil/Fille/profil_06.png",
  "/Profil/Garcon/Garcon_01.png",
  "/Profil/Garcon/Garcon_02.png",
  "/Profil/Garcon/Garcon_03.png",
  "/Profil/Garcon/Garcon_04.png",
  "/Profil/Garcon/Garcon_05.png",
  "/Profil/Garcon/Garcon_06.png",
];

function looksLikeEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function cleanCandidateName(value = "") {
  const cleaned = String(value || "").trim();
  return looksLikeEmail(cleaned) ? "" : cleaned;
}

function getInitials(value = "") {
  const cleaned = cleanCandidateName(value);
  if (!cleaned) return "C";

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function clampPhotoPosition(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.min(100, Math.max(0, number));
}

export default function ParentWelcome({ profile, onCompleted }) {
  const cognitoName = cleanCandidateName(
    profile?.nickname ||
      profile?.preferredNickname ||
      profile?.displayName ||
      profile?.name ||
      profile?.given_name ||
      profile?.preferred_username ||
      ""
  );

  const [displayNameValue, setDisplayNameValue] = useState(cognitoName);
  const [nickname, setNickname] = useState(profile?.nickname || cognitoName || "");
  const [familyRole, setFamilyRole] = useState(profile?.familyRole || "Papa");
  const [profilePhoto, setProfilePhoto] = useState(profile?.profilePhoto || "");
  const [profilePhotoS3Key, setProfilePhotoS3Key] = useState(
    profile?.profilePhotoS3Key || ""
  );
  const [localPhotoFile, setLocalPhotoFile] = useState(null);
  const [photoPosition, setPhotoPosition] = useState(
    profile?.profilePhotoPosition || { x: 50, y: 50 }
  );
  const [photoZoom, setPhotoZoom] = useState(Number(profile?.profilePhotoZoom) || 1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const helloName = useMemo(() => {
    return cleanCandidateName(nickname) || cleanCandidateName(displayNameValue) || "bienvenue";
  }, [displayNameValue, nickname]);

  function handleLogout() {
    window.location.href = `${API_BASE_URL}/logout`;
  }

  function selectPresetPhoto(url) {
    setProfilePhoto(url);
    setProfilePhotoS3Key("");
    setLocalPhotoFile(null);
    setPhotoPosition({ x: 50, y: 50 });
    setPhotoZoom(1);
    setError("");
  }

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setError("Choisissez une image valide.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La photo doit faire moins de 5 Mo.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPhotoFile(file);
    setProfilePhoto(previewUrl);
    setProfilePhotoS3Key("");
    setPhotoPosition({ x: 50, y: 50 });
    setPhotoZoom(1);
    setError("");
  }

  async function uploadProfilePhotoIfNeeded() {
    if (!localPhotoFile) {
      return {
        profilePhoto,
        profilePhotoS3Key,
      };
    }

    const presignResponse = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: localPhotoFile.name || "photo-profil.jpg",
        fileType: localPhotoFile.type || "image/jpeg",
        fileSize: localPhotoFile.size,
        childId: "parent-profile",
      }),
    });

    const presignData = await presignResponse.json().catch(() => ({}));

    if (!presignResponse.ok) {
      throw new Error(
        presignData?.message ||
          "Impossible de préparer l’importation de la photo de profil."
      );
    }

    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": localPhotoFile.type || "image/jpeg",
      },
      body: localPhotoFile,
    });

    if (!uploadResponse.ok) {
      throw new Error("Impossible d’importer la photo de profil dans l’espace sécurisé.");
    }

    return {
      profilePhoto: presignData.downloadUrl || "",
      profilePhotoS3Key: presignData.s3Key || "",
    };
  }

  async function saveWelcomeProfile() {
    const cleanDisplayName = cleanCandidateName(displayNameValue);
    const cleanNickname = cleanCandidateName(nickname);

    if (!cleanDisplayName && !cleanNickname) {
      setError("Inscrivez le nom ou le surnom que vous voulez utiliser dans Camelio.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");
      setError("");

      const uploadedPhoto = await uploadProfilePhotoIfNeeded();
      const preferredDisplayName = cleanNickname || cleanDisplayName;

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preferredDisplayName,
          displayName: preferredDisplayName,
          nickname: cleanNickname,
          familyRole,
          profilePhoto: uploadedPhoto.profilePhoto,
          profilePhotoS3Key: uploadedPhoto.profilePhotoS3Key,
          profilePhotoPosition: {
            x: clampPhotoPosition(photoPosition.x),
            y: clampPhotoPosition(photoPosition.y),
          },
          profilePhotoZoom: Math.min(2.5, Math.max(1, Number(photoZoom) || 1)),
          welcomeCompleted: true,
          onboarding: {
            userWelcomeCompleted: true,
            userWelcomeCompletedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible d’enregistrer votre profil.");
      }

      onCompleted(data.profile);
    } catch (saveError) {
      setError(saveError?.message || "Impossible d’enregistrer votre profil.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#4f4a45]/35 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[34px] border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-[0_24px_80px_rgba(79,74,69,0.22)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef0e7] text-[#8f9874]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a8b193]">
                Bienvenue
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#4f4a45]">
                Bonjour, {helloName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665e]">
                Prenons un court moment pour créer votre profil parent. Ensuite, vous pourrez activer votre espace Camelio, démarrer un essai gratuit ou utiliser un code invité reçu par courriel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#eadfcf] bg-white px-4 py-2 text-xs font-bold text-[#6f665e] shadow-sm transition hover:bg-[#f8f3ea]"
          >
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl border border-[#dce3cf] bg-[#f4f7ee] px-4 py-3 text-sm font-semibold text-[#6f785f]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#f1c9c9] bg-[#fff7f7] px-4 py-3 text-sm font-semibold text-[#b9544a]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-[220px_1fr]">
          <div className="rounded-[28px] border border-[#eadfcf] bg-white p-4 text-center shadow-sm">
            <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#eef0e7] text-3xl font-black text-[#8f9874] shadow-md">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profil"
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${clampPhotoPosition(photoPosition.x)}% ${clampPhotoPosition(photoPosition.y)}%`,
                    transform: `scale(${Math.min(2.5, Math.max(1, Number(photoZoom) || 1))})`,
                  }}
                />
              ) : (
                getInitials(nickname || displayNameValue)
              )}
            </div>

            <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#eadfcf] bg-[#fffdf8] px-4 py-2 text-xs font-bold text-[#6f665e] transition hover:bg-[#f8f3ea]">
              <Camera className="h-4 w-4" />
              Importer une photo
              <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
            </label>

            {profilePhoto ? (
              <div className="mt-4 space-y-3 rounded-3xl bg-[#fbf7ef] p-3 text-left">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8b193]">
                    <span>Zoom</span>
                    <span>{Number(photoZoom).toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="h-3 w-3 text-[#8b8278]" />
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.1"
                      value={photoZoom}
                      onChange={(event) => setPhotoZoom(Number(event.target.value))}
                      className="w-full accent-[#a8b193]"
                    />
                    <Plus className="h-3 w-3 text-[#8b8278]" />
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8b193]">
                    Recadrage horizontal
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={photoPosition.x}
                    onChange={(event) =>
                      setPhotoPosition((current) => ({ ...current, x: Number(event.target.value) }))
                    }
                    className="w-full accent-[#a8b193]"
                  />
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a8b193]">
                    Recadrage vertical
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={photoPosition.y}
                    onChange={(event) =>
                      setPhotoPosition((current) => ({ ...current, y: Number(event.target.value) }))
                    }
                    className="w-full accent-[#a8b193]"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                Nom ou prénom
              </span>
              <input
                value={displayNameValue}
                onChange={(event) => setDisplayNameValue(event.target.value)}
                placeholder="Exemple : Emmanuel"
                className="mt-2 w-full rounded-2xl border border-[#eadfcf] bg-white px-4 py-3 text-sm font-semibold text-[#4f4a45] outline-none transition focus:border-[#a8b193]"
              />
              <p className="mt-1 text-xs text-[#8b8278]">
                Camelio évite d’utiliser votre courriel comme nom affiché.
              </p>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                Surnom préféré
              </span>
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Exemple : Poupa"
                className="mt-2 w-full rounded-2xl border border-[#eadfcf] bg-white px-4 py-3 text-sm font-semibold text-[#4f4a45] outline-none transition focus:border-[#a8b193]"
              />
              <p className="mt-1 text-xs text-[#8b8278]">
                Exemple : mes enfants me surnomment Poupa.
              </p>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                Vous êtes
              </span>
              <select
                value={familyRole}
                onChange={(event) => setFamilyRole(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#eadfcf] bg-white px-4 py-3 text-sm font-semibold text-[#4f4a45] outline-none transition focus:border-[#a8b193]"
              >
                {familyRoleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-[24px] border border-[#eadfcf] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#a8b193]" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                  Images prédéfinies
                </p>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {presetPhotos.map((photo) => {
                  const isSelected = profilePhoto === photo;

                  return (
                    <button
                      type="button"
                      key={photo}
                      onClick={() => selectPresetPhoto(photo)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border bg-[#fbf7ef] transition ${
                        isSelected
                          ? "border-[#a8b193] ring-2 ring-[#a8b193]/35"
                          : "border-[#eadfcf] hover:border-[#cbbca9]"
                      }`}
                    >
                      <img src={photo} alt="Profil prédéfini" className="h-full w-full object-cover" />
                      {isSelected ? (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#a8b193] text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-[#d8c8b6] bg-white/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                Étape suivante
              </p>
              <p className="mt-2 text-xs leading-5 text-[#8b8278]">
                Après l’enregistrement du profil dans DynamoDB, Camelio vous demandera d’activer votre espace avec un essai gratuit, un code d’accès ou un code invité reçu par courriel.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eadfcf] bg-white px-5 py-3 text-sm font-bold text-[#6f665e] shadow-sm transition hover:bg-[#f8f3ea]"
          >
            <LogOut className="h-4 w-4" />
            Me déconnecter
          </button>

          <button
            type="button"
            onClick={saveWelcomeProfile}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-full bg-[#a8b193] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#96a17f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>
        </div>
      </div>
    </div>
  );
}
