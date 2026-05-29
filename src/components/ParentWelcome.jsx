import React, { useMemo, useState } from "react";
import { Check, Heart, Sparkles } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

export default function ParentWelcome({ profile = {}, onCompleted }) {
  const initialName = useMemo(
    () => profile?.displayName || profile?.name || profile?.nickname || "",
    [profile]
  );

  const [displayName, setDisplayName] = useState(initialName);
  const [familyRole, setFamilyRole] = useState(profile?.familyRole || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const payload = {
      displayName: displayName.trim(),
      name: displayName.trim(),
      familyRole: familyRole.trim(),
      welcomeCompleted: true,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de compléter l’accueil.");
      }

      onCompleted?.(data?.profile || { ...profile, ...payload });
    } catch (error) {
      setErrorMessage(error?.message || "Une erreur est survenue.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#4F4A45]/35 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-[32px] border border-[#EFE4D6] bg-[#FFFDF8] p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F7F3FF] text-[#8F7AB8]">
            <Heart className="h-8 w-8" />
          </div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EAF0E3] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6F7B57]">
            <Sparkles className="h-3.5 w-3.5" /> Bienvenue
          </p>
          <h2 className="text-2xl font-black text-[#4F4A45] sm:text-3xl">
            Bienvenue dans Camelio
          </h2>
          <p className="mt-2 text-sm font-medium text-[#8B8278]">
            Confirme ton profil parent avant de continuer vers ton espace familial.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#746F64]">Ton nom</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ex. Emmanuel"
              className="w-full rounded-2xl border border-[#EFE4D6] bg-white px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#746F64]">Rôle familial</span>
            <input
              value={familyRole}
              onChange={(event) => setFamilyRole(event.target.value)}
              placeholder="Ex. Papa, maman, parent"
              className="w-full rounded-2xl border border-[#EFE4D6] bg-white px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-2xl bg-[#FFF1F3] px-4 py-3 text-sm font-bold text-[#B56F78]">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#A8B193] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
        >
          {isSaving ? "Enregistrement..." : "Continuer"}
          <Check className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
