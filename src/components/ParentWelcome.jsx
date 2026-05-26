import React, { useState } from "react";
import { Camera, Sparkles } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.camelio.app";

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

export default function ParentWelcome({ profile, onCompleted }) {
  const initialName = profile?.name || profile?.displayName || profile?.email || "";
  const [displayNameValue, setDisplayNameValue] = useState(initialName);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [familyRole, setFamilyRole] = useState(profile?.familyRole || "Papa");
  const [profilePhoto, setProfilePhoto] = useState(profile?.profilePhoto || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setError("Choisissez une image valide.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(String(reader.result || ""));
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function saveWelcomeProfile() {
    try {
      setIsSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayNameValue.trim(),
          displayName: displayNameValue.trim(),
          nickname: nickname.trim(),
          familyRole,
          profilePhoto,
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
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[34px] border border-[#eadfcf] bg-[#fffdf8] p-5 shadow-[0_24px_80px_rgba(79,74,69,0.22)] sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef0e7] text-[#8f9874]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a8b193]">
              Bienvenue
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#4f4a45]">
              Bonjour, {initialName || "bienvenue dans Camelio"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f665e]">
              Prenons un court moment pour créer votre profil parent. Ensuite, vous pourrez activer votre espace Camelio ou utiliser un code invité reçu par courriel.
            </p>
          </div>
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

        <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="rounded-[28px] border border-[#eadfcf] bg-white p-4 text-center shadow-sm">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#eef0e7] text-3xl font-black text-[#8f9874] shadow-md">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profil" className="h-full w-full object-cover" />
              ) : (
                (displayNameValue || profile?.email || "C").trim().charAt(0).toUpperCase()
              )}
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#eadfcf] bg-[#fffdf8] px-4 py-2 text-xs font-bold text-[#6f665e] transition hover:bg-[#f8f3ea]">
              <Camera className="h-4 w-4" />
              Choisir une photo
              <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
            </label>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                Nom affiché
              </span>
              <input
                value={displayNameValue}
                onChange={(event) => setDisplayNameValue(event.target.value)}
                placeholder="Votre nom"
                className="mt-2 w-full rounded-2xl border border-[#eadfcf] bg-white px-4 py-3 text-sm font-semibold text-[#4f4a45] outline-none transition focus:border-[#a8b193]"
              />
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

            <div className="rounded-[24px] border border-dashed border-[#d8c8b6] bg-white/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8b193]">
                Étape suivante
              </p>
              <p className="mt-2 text-xs leading-5 text-[#8b8278]">
                Après l’enregistrement, Camelio vous demandera d’activer votre espace avec un essai gratuit, un code d’accès ou un code invité reçu par courriel.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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

