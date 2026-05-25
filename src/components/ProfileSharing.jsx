import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Eye,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { SectionTitle } from "./shared.jsx";
import { displayName, sections } from "./sectionsData.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

const LOCAL_STORAGE_KEY = "camelio_profile_shares";

const permissionOptions = [
  {
    id: "read",
    title: "Lecture seule",
    shortTitle: "Lecture",
    description: "La personne peut consulter les informations partagées.",
    icon: Eye,
  },
  {
    id: "edit",
    title: "Modifier",
    shortTitle: "Modifier",
    description:
      "La personne peut consulter et modifier les informations partagées.",
    icon: Pencil,
  },
  {
    id: "delete",
    title: "Modifier et supprimer",
    shortTitle: "Supprimer",
    description:
      "La personne peut consulter, modifier et supprimer les informations partagées.",
    icon: Trash2,
  },
];

const shareableSectionIds = [
  "children",
  "photos",
  "memorable-phrases",
  "calendar",
  "sante",
  "documents",
  "invoices",
  "calculator",
  "parental-plan",
  "notes",
];

function createShareId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `share-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function cleanImportAccessKey(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80);
}

function getChildInitials(child) {
  const first =
    child?.firstName?.trim()?.[0] ||
    child?.nickname?.trim()?.[0] ||
    child?.name?.trim()?.[0] ||
    "";

  const last = child?.lastName?.trim()?.[0] || "";

  return `${first}${last}`.toUpperCase() || "?";
}

function getChildPhoto(child) {
  return child?.avatar || child?.photo || child?.image || "";
}

function formatDate(value) {
  if (!value) return "À l’instant";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "À l’instant";

  return date.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPermissionLabel(permission) {
  return (
    permissionOptions.find((option) => option.id === permission)?.title ||
    "Lecture seule"
  );
}

function getHighestPermission(sectionPermissions = {}) {
  const values = Object.values(sectionPermissions);

  if (values.includes("delete")) return "delete";
  if (values.includes("edit")) return "edit";

  return "read";
}

function formatList(items = []) {
  const cleanItems = items.filter(Boolean);

  if (cleanItems.length === 0) return "";
  if (cleanItems.length === 1) return cleanItems[0];
  if (cleanItems.length === 2) return `${cleanItems[0]} et ${cleanItems[1]}`;

  return `${cleanItems.slice(0, -1).join(", ")} et ${
    cleanItems[cleanItems.length - 1]
  }`;
}

function ChildAvatar({ child, selected }) {
  const photo = getChildPhoto(child);

  return (
    <div
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] text-sm font-bold shadow-sm ${
        selected ? "border-[#A8B193]" : "border-white"
      }`}
      style={{
        backgroundColor: child?.color === "rose" ? "#FFF1F4" : "#EEF0E7",
        color: child?.color === "rose" ? "#B96B77" : "#6F785F",
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={displayName(child)}
          className="h-full w-full object-cover"
        />
      ) : (
        getChildInitials(child)
      )}

      {selected ? (
        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#A8B193] text-white ring-2 ring-white">
          <Check className="h-3 w-3" />
        </span>
      ) : null}
    </div>
  );
}

function PermissionButton({ option, selected, onClick }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
        selected
          ? "border-[#A8B193] bg-[#A8B193] text-white"
          : "border-[#EADFCF] bg-white text-[#7D756E] hover:bg-[#FAF4EC]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {option.shortTitle}
    </button>
  );
}

export default function ProfileSharing({ children = [], onBack = () => {} }) {
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [importAccessKey, setImportAccessKey] = useState("");
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([
    "children",
    "calendar",
    "documents",
  ]);
  const [sectionPermissions, setSectionPermissions] = useState({
    children: "read",
    calendar: "read",
    documents: "read",
  });
  const [note, setNote] = useState("");
  const [useAutomaticMessage, setUseAutomaticMessage] = useState(false);
  const [message, setMessage] = useState("");

  const shareableSections = useMemo(() => {
    return sections.filter((section) => shareableSectionIds.includes(section.id));
  }, []);

  const selectedChildren = useMemo(() => {
    return children.filter((child) => selectedChildIds.includes(child.id));
  }, [children, selectedChildIds]);

  const automaticMessage = useMemo(() => {
    const personName = inviteeName.trim();
    const greeting = personName ? `Salut ${personName} 😊,` : "Salut 😊,";

    const childNames = selectedChildren.map((child) => displayName(child));
    const childText =
      childNames.length > 0 ? formatList(childNames) : "mes cocos précieux";

    const sectionDetails = selectedSectionIds
      .map((sectionId) => {
        const section = sections.find((item) => item.id === sectionId);
        if (!section) return null;

        return `${section.title} (${getPermissionLabel(
          sectionPermissions[sectionId] || "read"
        ).toLowerCase()})`;
      })
      .filter(Boolean);

    const sectionText =
      sectionDetails.length > 0
        ? formatList(sectionDetails)
        : "les sections sélectionnées";

    return `${greeting}

Je te partage un accès Camelio pour ${childText}.

Je t’ai préparé un accès personnalisé pour que tu puisses consulter facilement ce qui est important 😊

Tu auras accès aux sections suivantes : ${sectionText}.

Camelio nous permet de garder au même endroit les informations importantes, les souvenirs, les documents et les suivis liés aux enfants.

Tu vas recevoir une invitation par courriel avec un lien sécurisé pour créer ton accès ou te connecter à ton compte Camelio.

Au plaisir de partager cet espace avec toi 😊`;
  }, [inviteeName, selectedChildren, selectedSectionIds, sectionPermissions]);

  const canSubmit =
    isValidEmail(inviteeEmail) &&
    selectedChildIds.length > 0 &&
    selectedSectionIds.length > 0;

  useEffect(() => {
    loadShares();
  }, []);

  useEffect(() => {
    if (useAutomaticMessage) {
      setNote(automaticMessage);
    }
  }, [automaticMessage, useAutomaticMessage]);

  async function loadShares() {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/profile-shares`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de charger les partages.");
      }

      setShares(Array.isArray(data.shares) ? data.shares : []);
    } catch (error) {
      console.warn("Chargement local des partages:", error);

      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        setShares(saved ? JSON.parse(saved) : []);
      } catch {
        setShares([]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function saveLocalShares(nextShares) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextShares));
    setShares(nextShares);
  }

  function toggleChild(childId) {
    setSelectedChildIds((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId]
    );
  }

  function toggleSection(sectionId) {
    setSelectedSectionIds((current) => {
      const alreadySelected = current.includes(sectionId);

      if (alreadySelected) {
        const nextSectionIds = current.filter((id) => id !== sectionId);

        setSectionPermissions((currentPermissions) => {
          const nextPermissions = { ...currentPermissions };
          delete nextPermissions[sectionId];
          return nextPermissions;
        });

        return nextSectionIds;
      }

      setSectionPermissions((currentPermissions) => ({
        ...currentPermissions,
        [sectionId]: currentPermissions[sectionId] || "read",
      }));

      return [...current, sectionId];
    });
  }

  function updateSectionPermission(sectionId, permission) {
    if (!selectedSectionIds.includes(sectionId)) {
      setSelectedSectionIds((current) => [...current, sectionId]);
    }

    setSectionPermissions((current) => ({
      ...current,
      [sectionId]: permission,
    }));
  }

  function resetForm() {
    setInviteeName("");
    setInviteeEmail("");
    setImportAccessKey("");
    setSelectedChildIds([]);
    setSelectedSectionIds(["children", "calendar", "documents"]);
    setSectionPermissions({
      children: "read",
      calendar: "read",
      documents: "read",
    });
    setNote("");
    setUseAutomaticMessage(false);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        "Ajoute un courriel valide, au moins un enfant et au moins une section."
      );
      return;
    }

    const now = new Date().toISOString();

    const cleanSectionPermissions = selectedSectionIds.reduce(
      (accumulator, sectionId) => {
        accumulator[sectionId] = sectionPermissions[sectionId] || "read";
        return accumulator;
      },
      {}
    );

    const payload = {
      id: createShareId(),
      inviteeName: inviteeName.trim(),
      inviteeEmail: inviteeEmail.trim().toLowerCase(),
      importAccessKey: cleanImportAccessKey(importAccessKey),
      childIds: selectedChildIds,
      children: selectedChildren.map((child) => ({
        id: child.id,
        name: displayName(child),
      })),
      sectionIds: selectedSectionIds,
      sectionPermissions: cleanSectionPermissions,
      permission: getHighestPermission(cleanSectionPermissions),
      note: note.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/api/profile-shares`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de créer le partage.");
      }

      const createdShare = data.share || payload;

      setShares((current) => [createdShare, ...current]);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Erreur création du partage:", error);

      setMessage(
        error?.message ||
          "Impossible d’envoyer l’invitation. Vérifie la connexion ou la configuration du backend."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function removeShare(shareId) {
    const nextShares = shares.filter((share) => share.id !== shareId);
    saveLocalShares(nextShares);
  }

  function getShareSectionDetails(share) {
    const permissions = share.sectionPermissions || {};

    return (share.sectionIds || [])
      .map((sectionId) => {
        const section = sections.find((item) => item.id === sectionId);
        if (!section) return null;

        return {
          id: sectionId,
          title: section.title,
          permission: permissions[sectionId] || share.permission || "read",
        };
      })
      .filter(Boolean);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Partage de profil"
        subtitle="Partagez le profil et les contenus d’un enfant avec un autre usager Camelio."
        icon={UsersRound}
      />

      <div className="rounded-[28px] border border-[#EADFCF] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
              Accès familial
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
              Gérer les accès partagés
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7D756E]">
              Choisissez les enfants, les sections et le niveau d’autorisation
              pour chaque section. La personne invitée recevra une invitation
              pour créer son accès ou se connecter à Camelio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setMessage("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <UserPlus className="h-4 w-4" />
            Nouveau partage
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="rounded-[30px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                Invitation
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
                Créer un accès partagé
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7D756E] shadow-sm"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block w-full">
                <span className="mb-2 block text-sm font-semibold text-[#4F4A45]">
                  Nom de la personne
                </span>

                <input
                  className="w-full rounded-3xl border border-[#EADFCF] bg-white px-4 py-3 text-sm text-[#4F4A45] outline-none transition placeholder:text-[#B8AA9A] focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                  value={inviteeName}
                  onChange={(event) => setInviteeName(event.target.value)}
                  placeholder="Ex. Marie Tremblay"
                />
              </label>

              <label className="block w-full">
                <span className="mb-2 block text-sm font-semibold text-[#4F4A45]">
                  Courriel d’invitation
                </span>

                <input
                  className="w-full rounded-3xl border border-[#EADFCF] bg-white px-4 py-3 text-sm text-[#4F4A45] outline-none transition placeholder:text-[#B8AA9A] focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                  type="email"
                  value={inviteeEmail}
                  onChange={(event) => setInviteeEmail(event.target.value)}
                  placeholder="exemple@email.com"
                />
              </label>

              <label className="block w-full md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[#4F4A45]">
                  Clé d’importation ou d’accès
                </span>

                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8AA9A]" />

                  <input
                    className="w-full rounded-3xl border border-[#EADFCF] bg-white px-11 py-3 text-sm text-[#4F4A45] outline-none transition placeholder:text-[#B8AA9A] focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                    value={importAccessKey}
                    onChange={(event) =>
                      setImportAccessKey(cleanImportAccessKey(event.target.value))
                    }
                    placeholder="Ex. ACCES-MARIE-2026"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-[#8B8278]">
                  Cette clé sera ajoutée au lien sécurisé envoyé par courriel.
                  Si le champ est vide, le serveur pourra générer une clé
                  automatiquement.
                </p>
              </label>
            </div>

            <div>
              <p className="mb-2 block text-sm font-semibold text-[#4F4A45]">
                Enfants à partager
              </p>

              {children.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-[#D8D2C6] bg-white p-5 text-center">
                  <p className="text-sm font-semibold text-[#7D756E]">
                    Aucun enfant disponible pour le moment.
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {children.map((child) => {
                    const selected = selectedChildIds.includes(child.id);

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChild(child.id)}
                        className={`flex items-center gap-3 rounded-3xl border p-3 text-left transition ${
                          selected
                            ? "border-[#A8B193] bg-[#F3F6ED]"
                            : "border-[#EADFCF] bg-white hover:bg-[#FAF4EC]"
                        }`}
                      >
                        <ChildAvatar child={child} selected={selected} />

                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#4F4A45]">
                            {displayName(child)}
                          </p>
                          <p className="text-xs text-[#8B8278]">
                            Profil enfant
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex flex-col gap-1">
                <p className="block text-sm font-semibold text-[#4F4A45]">
                  Sections accessibles
                </p>
                <p className="text-xs leading-5 text-[#8B8278]">
                  Sélectionnez les sections à partager, puis choisissez le niveau
                  d’accès pour chacune.
                </p>
              </div>

              <div className="grid gap-3">
                {shareableSections.map((section) => {
                  const Icon = section.icon;
                  const selected = selectedSectionIds.includes(section.id);
                  const currentPermission =
                    sectionPermissions[section.id] || "read";

                  return (
                    <div
                      key={section.id}
                      className={`rounded-3xl border p-4 transition ${
                        selected
                          ? "border-[#B5A7C8] bg-[#F7F3FF]"
                          : "border-[#EADFCF] bg-white hover:bg-[#FAF4EC]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              selected
                                ? "bg-[#B5A7C8] text-white"
                                : "bg-[#F8F3EA] text-[#8B8278]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-bold text-[#4F4A45]">
                                {section.title}
                              </p>

                              {selected ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#8F9874]">
                                  <Check className="h-3 w-3" />
                                  Sélectionné
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs text-[#8B8278]">
                              {section.description}
                            </p>
                          </div>
                        </button>

                        {selected ? (
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            {permissionOptions.map((option) => (
                              <PermissionButton
                                key={option.id}
                                option={option}
                                selected={currentPermission === option.id}
                                onClick={() =>
                                  updateSectionPermission(section.id, option.id)
                                }
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="block text-sm font-semibold text-[#4F4A45]">
                    Message optionnel
                  </span>
                  <p className="mt-1 text-xs text-[#8B8278]">
                    Vous pouvez écrire votre propre message ou utiliser le
                    message automatique.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUseAutomaticMessage(true);
                    setNote(automaticMessage);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B5A7C8] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  <Sparkles className="h-5 w-5" />
                  Générer un message automatiquement
                </button>
              </div>

              <textarea
                className="min-h-[160px] w-full resize-none rounded-3xl border border-[#EADFCF] bg-white px-4 py-4 text-sm leading-6 text-[#4F4A45] outline-none transition placeholder:text-[#B8AA9A] focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setUseAutomaticMessage(false);
                }}
                placeholder="Ex. Voici l’accès au profil de Léo pour consulter le calendrier et les documents."
              />

              {useAutomaticMessage ? (
                <p className="mt-2 text-xs font-semibold text-[#8F9874]">
                  Le message automatique se mettra à jour selon la personne, les
                  enfants, les sections et les permissions choisies.
                </p>
              ) : null}
            </div>

            {message ? (
              <div className="rounded-2xl border border-[#EEC988] bg-[#FFF8E8] p-3 text-sm font-semibold text-[#8A6F34]">
                {message}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E]"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={!canSubmit || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {isSaving ? "Création..." : "Envoyer l’invitation"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-[#EADFCF] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
              Invitations
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
              Accès actifs et en attente
            </h3>
          </div>

          <ChevronDown className="h-5 w-5 text-[#B8AA9A]" />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-[#D8D2C6] bg-[#FFFDF8] p-6 text-center">
            <p className="text-sm font-semibold text-[#7D756E]">
              Chargement des partages...
            </p>
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D2C6] bg-[#FFFDF8] p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF0E7] text-[#8F9874]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <p className="mt-3 font-bold text-[#4F4A45]">
              Aucun profil partagé
            </p>

            <p className="mt-1 text-sm text-[#7D756E]">
              Les invitations créées apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => {
              const sectionDetails = getShareSectionDetails(share);

              return (
                <div
                  key={share.id}
                  className="rounded-3xl border border-[#EADFCF] bg-[#FFFDF8] p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#4F4A45]">
                          {share.inviteeName || "Invitation"}
                        </p>

                        <span className="rounded-full bg-[#F3F6ED] px-3 py-1 text-xs font-bold text-[#6F785F]">
                          {share.status === "accepted"
                            ? "Accepté"
                            : "En attente"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#7D756E]">
                        {share.inviteeEmail}
                      </p>

                      {share.importAccessKey ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#EADFCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B625A]">
                          <KeyRound className="h-3.5 w-3.5 text-[#A8B193]" />
                          Clé d’accès : {share.importAccessKey}
                        </div>
                      ) : null}

                      <p className="mt-3 text-sm leading-6 text-[#5F5A52]">
                        <strong>Enfants :</strong>{" "}
                        {(share.children || [])
                          .map((child) => child.name)
                          .join(", ") || "Non précisé"}
                      </p>

                      <div className="mt-3">
                        <p className="text-sm font-bold text-[#5F5A52]">
                          Sections et permissions :
                        </p>

                        {sectionDetails.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sectionDetails.map((detail) => (
                              <span
                                key={detail.id}
                                className="rounded-full border border-[#EADFCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B625A]"
                              >
                                {detail.title} ·{" "}
                                {getPermissionLabel(detail.permission)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-[#7D756E]">
                            Non précisé
                          </p>
                        )}
                      </div>

                      {share.note ? (
                        <div className="mt-3 rounded-2xl border border-[#EADFCF] bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Message
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#6B625A]">
                            {share.note}
                          </p>
                        </div>
                      ) : null}

                      <p className="mt-3 text-xs text-[#9A8D7C]">
                        Créé le {formatDate(share.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeShare(share.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F1C9C9] bg-white px-4 py-2 text-xs font-bold text-[#B9544A] transition hover:bg-[#FFF0EF]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Retirer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}