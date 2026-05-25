import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  KeyRound,
  Mail,
  Pencil,
  RefreshCcw,
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
    icon: Eye,
  },
  {
    id: "edit",
    title: "Modifier",
    shortTitle: "Modifier",
    icon: Pencil,
  },
  {
    id: "delete",
    title: "Modifier et supprimer",
    shortTitle: "Supprimer",
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

function cleanSecurityCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 7);
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
  if (!value) return "Non précisé";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non précisé";

  return date.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

  if (cleanItems.length === 0) return "Non précisé";
  if (cleanItems.length === 1) return cleanItems[0];
  if (cleanItems.length === 2) return `${cleanItems[0]} et ${cleanItems[1]}`;

  return `${cleanItems.slice(0, -1).join(", ")} et ${
    cleanItems[cleanItems.length - 1]
  }`;
}

function getStatusLabel(status) {
  if (status === "accepted") return "Importé";
  if (status === "revoked") return "Retiré";
  return "En attente";
}

function getStatusClasses(status) {
  if (status === "accepted") return "bg-[#EEF7F0] text-[#5C8A64]";
  if (status === "revoked") return "bg-[#FFF0EF] text-[#B9544A]";
  return "bg-[#F3F6ED] text-[#6F785F]";
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
  const [expandedShareId, setExpandedShareId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingShare, setEditingShare] = useState(null);
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
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

  const [showImportKey, setShowImportKey] = useState(false);
  const [securityCodeToImport, setSecurityCodeToImport] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const invitationTokenFromUrl = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("invite") || "";
    } catch {
      return "";
    }
  }, []);

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

    return `${greeting}\n\nJe te partage un accès Camelio pour ${childText}.\n\nTu auras accès aux sections suivantes : ${sectionText}.\n\nTu vas recevoir une invitation par courriel avec un lien sécurisé. Je te transmettrai aussi une clé de sécurité à 7 chiffres à inscrire dans Camelio.`;
  }, [inviteeName, selectedChildren, selectedSectionIds, sectionPermissions]);

  const canSubmit =
    isValidEmail(inviteeEmail) &&
    selectedChildIds.length > 0 &&
    selectedSectionIds.length > 0;

  useEffect(() => {
    loadShares();
  }, []);

  useEffect(() => {
    if (invitationTokenFromUrl) {
      setShowImportKey(true);
    }
  }, [invitationTokenFromUrl]);

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

      const nextShares = Array.isArray(data.shares) ? data.shares : [];
      setShares(nextShares);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextShares));
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

  function updateSharesLocally(nextShares) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextShares));
    setShares(nextShares);
  }

  function resetForm() {
    setEditingShare(null);
    setInviteeName("");
    setInviteeEmail("");
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

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(share) {
    setEditingShare(share);
    setInviteeName(share.inviteeName || "");
    setInviteeEmail(share.inviteeEmail || "");
    setSelectedChildIds(Array.isArray(share.childIds) ? share.childIds : []);
    setSelectedSectionIds(
      Array.isArray(share.sectionIds) && share.sectionIds.length > 0
        ? share.sectionIds
        : ["children", "calendar", "documents"]
    );
    setSectionPermissions(share.sectionPermissions || {});
    setNote(share.note || "");
    setUseAutomaticMessage(false);
    setMessage("");
    setShowForm(true);
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
        setSectionPermissions((currentPermissions) => {
          const nextPermissions = { ...currentPermissions };
          delete nextPermissions[sectionId];
          return nextPermissions;
        });

        return current.filter((id) => id !== sectionId);
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

  function buildPayload() {
    const cleanSectionPermissions = selectedSectionIds.reduce(
      (accumulator, sectionId) => {
        accumulator[sectionId] = sectionPermissions[sectionId] || "read";
        return accumulator;
      },
      {}
    );

    return {
      id: editingShare?.id || createShareId(),
      inviteeName: inviteeName.trim(),
      inviteeEmail: inviteeEmail.trim().toLowerCase(),
      childIds: selectedChildIds,
      children: selectedChildren.map((child) => ({
        id: child.id,
        name: displayName(child),
      })),
      sectionIds: selectedSectionIds,
      sectionPermissions: cleanSectionPermissions,
      permission: getHighestPermission(cleanSectionPermissions),
      note: note.trim(),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        "Ajoute un courriel valide, au moins un enfant et au moins une section."
      );
      return;
    }

    const payload = buildPayload();
    const isEditing = Boolean(editingShare?.id);
    const url = isEditing
      ? `${API_BASE_URL}/api/profile-shares/${editingShare.id}`
      : `${API_BASE_URL}/api/profile-shares`;

    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.share) {
          const createdOrUpdatedShare = data.share;
          setShares((current) => {
            const exists = current.some((share) => share.id === createdOrUpdatedShare.id);
            return exists
              ? current.map((share) =>
                  share.id === createdOrUpdatedShare.id ? createdOrUpdatedShare : share
                )
              : [createdOrUpdatedShare, ...current];
          });
        }

        throw new Error(data?.details || data?.message || "Impossible de créer le partage.");
      }

      const savedShare = data.share || payload;

      setShares((current) => {
        const exists = current.some((share) => share.id === savedShare.id);
        return exists
          ? current.map((share) => (share.id === savedShare.id ? savedShare : share))
          : [savedShare, ...current];
      });

      setExpandedShareId(savedShare.id);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Erreur création ou modification du partage:", error);
      setMessage(
        error?.message ||
          "Impossible d’envoyer l’invitation. Vérifie Resend ou la configuration du backend."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeShare(shareId) {
    try {
      await fetch(`${API_BASE_URL}/api/profile-shares/${shareId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.warn("Suppression distante impossible, suppression locale:", error);
    }

    const nextShares = shares.filter((share) => share.id !== shareId);
    updateSharesLocally(nextShares);
  }

  async function regenerateShare(shareId) {
    try {
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/${shareId}/regenerate-link`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de recréer le lien.");
      }

      setShares((current) =>
        current.map((share) => (share.id === shareId ? data.share : share))
      );
      setExpandedShareId(shareId);
      setMessage("Nouveau lien sécurisé envoyé. La nouvelle clé est affichée dans l’accès.");
    } catch (error) {
      console.error("Erreur recréation du lien:", error);
      setMessage(error?.message || "Impossible de recréer le lien sécurisé.");
    }
  }

  async function importSecurityKey(event) {
    event.preventDefault();

    const securityCode = cleanSecurityCode(securityCodeToImport);

    if (!/^\d{7}$/.test(securityCode)) {
      setImportMessage("La clé doit contenir 7 chiffres.");
      return;
    }

    if (!invitationTokenFromUrl) {
      setImportMessage("Le lien d’invitation est manquant ou expiré.");
      return;
    }

    try {
      setIsImporting(true);
      setImportMessage("");

      const response = await fetch(`${API_BASE_URL}/api/profile-shares/import-key`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationToken: invitationTokenFromUrl,
          securityCode,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible d’importer la clé.");
      }

      setImportMessage("La clé a été importée avec succès.");
      setSecurityCodeToImport("");
      await loadShares();
    } catch (error) {
      console.error("Erreur importation clé:", error);
      setImportMessage(error?.message || "Impossible d’importer la clé.");
    } finally {
      setIsImporting(false);
    }
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

  function getShareChildrenText(share) {
    return formatList((share.children || []).map((child) => child.name));
  }

  function copySecurityCode(code) {
    if (!code) return;

    navigator.clipboard?.writeText(code).catch(() => {});
    setMessage("Clé copiée.");
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
              Le lien sécurisé est valide 1 journée. La clé de sécurité à 7 chiffres
              est visible seulement ici, sur la plateforme.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowImportKey(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#6B625A] shadow-sm transition hover:bg-[#FAF4EC]"
            >
              <KeyRound className="h-4 w-4" />
              Inscrire une clé
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            >
              <UserPlus className="h-4 w-4" />
              Nouveau partage
            </button>
          </div>
        </div>
      </div>

      {showImportKey ? (
        <div className="rounded-[30px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                Importation
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
                Inscrire une clé de sécurité
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#7D756E]">
                Ouvrez le lien sécurisé reçu par courriel, puis inscrivez la clé
                de 7 chiffres transmise par la personne qui partage l’accès.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowImportKey(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7D756E] shadow-sm"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={importSecurityKey} className="flex flex-col gap-3 md:flex-row">
            <input
              className="w-full rounded-3xl border border-[#EADFCF] bg-white px-4 py-3 text-sm text-[#4F4A45] outline-none transition placeholder:text-[#B8AA9A] focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
              value={securityCodeToImport}
              onChange={(event) => setSecurityCodeToImport(cleanSecurityCode(event.target.value))}
              placeholder="Clé de 7 chiffres"
              inputMode="numeric"
            />

            <button
              type="submit"
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              {isImporting ? "Importation..." : "Importer"}
            </button>
          </form>

          {importMessage ? (
            <p className="mt-3 rounded-2xl border border-[#EADFCF] bg-white p-3 text-sm font-semibold text-[#6B625A]">
              {importMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <div className="rounded-[30px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                {editingShare ? "Modification" : "Invitation"}
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
                {editingShare ? "Modifier l’accès" : "Créer un accès partagé"}
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
                          <p className="text-xs text-[#8B8278]">Profil enfant</p>
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
                  const currentPermission = sectionPermissions[section.id] || "read";

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
                                onClick={() => updateSectionPermission(section.id, option.id)}
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
                    Ce message sera inclus dans le courriel d’invitation.
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
                  Générer un message
                </button>
              </div>

              <textarea
                className="min-h-[130px] w-full resize-none rounded-3xl border border-[#EADFCF] bg-white px-4 py-4 text-sm leading-6 text-[#4F4A45] outline-none transition placeholder:text-[#B8AA9A] focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setUseAutomaticMessage(false);
                }}
                placeholder="Ex. Voici l’accès au profil de Léo pour consulter le calendrier et les documents."
              />
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
                {isSaving
                  ? "Enregistrement..."
                  : editingShare
                    ? "Modifier l’accès"
                    : "Envoyer l’invitation"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {message && !showForm ? (
        <div className="rounded-2xl border border-[#EEC988] bg-[#FFF8E8] p-3 text-sm font-semibold text-[#8A6F34]">
          {message}
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

            <p className="mt-3 font-bold text-[#4F4A45]">Aucun profil partagé</p>
            <p className="mt-1 text-sm text-[#7D756E]">
              Les invitations créées apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => {
              const sectionDetails = getShareSectionDetails(share);
              const expanded = expandedShareId === share.id;
              const highestPermission = getPermissionLabel(
                getHighestPermission(share.sectionPermissions || {})
              );

              return (
                <div
                  key={share.id}
                  className="rounded-3xl border border-[#EADFCF] bg-[#FFFDF8] p-4"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedShareId(expanded ? "" : share.id)}
                    className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#4F4A45]">
                          {share.inviteeName || "Invitation"}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                            share.status
                          )}`}
                        >
                          {getStatusLabel(share.status)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#7D756E]">
                        {share.inviteeEmail}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#5F5A52]">
                        Enfant partagé : {getShareChildrenText(share)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-[#8B8278]">
                      {expanded ? "Masquer" : "Voir l’accès"}
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {expanded ? (
                    <div className="mt-4 border-t border-[#EADFCF] pt-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#EADFCF] bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Courriel
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#4F4A45]">
                            {share.inviteeEmail || "Non précisé"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#EADFCF] bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Type de permission
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#4F4A45]">
                            {highestPermission}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#EADFCF] bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Date de création
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#4F4A45]">
                            {formatDate(share.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#EADFCF] bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Lien sécurisé
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#4F4A45]">
                            Expire le {formatDateTime(share.invitationExpiresAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#EADFCF] bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                          Clé de sécurité
                        </p>
                        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-[#F8F3EA] px-4 py-3">
                            <KeyRound className="h-5 w-5 text-[#A8B193]" />
                            <span className="font-mono text-2xl font-black tracking-[0.25em] text-[#4F4A45]">
                              {share.securityCode || "-------"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => copySecurityCode(share.securityCode)}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#6B625A] transition hover:bg-[#FAF4EC]"
                          >
                            <Copy className="h-4 w-4" />
                            Copier
                          </button>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-[#8B8278]">
                          Cette clé ne devrait pas être envoyée dans le courriel. Elle peut être
                          partagée séparément avec la personne invitée.
                        </p>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-bold text-[#5F5A52]">
                          Sections et permissions
                        </p>

                        {sectionDetails.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sectionDetails.map((detail) => (
                              <span
                                key={detail.id}
                                className="rounded-full border border-[#EADFCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B625A]"
                              >
                                {detail.title} · {getPermissionLabel(detail.permission)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-[#7D756E]">Non précisé</p>
                        )}
                      </div>

                      {share.importedAt ? (
                        <div className="mt-4 rounded-2xl border border-[#EADFCF] bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Importation
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#4F4A45]">
                            Importé le {formatDateTime(share.importedAt)}
                          </p>
                          {share.importedByEmail ? (
                            <p className="mt-1 text-sm text-[#7D756E]">
                              Par {share.importedByEmail}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditForm(share)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#6B625A] transition hover:bg-[#FAF4EC]"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier l’accès
                        </button>

                        <button
                          type="button"
                          onClick={() => regenerateShare(share.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#6B625A] transition hover:bg-[#FAF4EC]"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Recréer le lien
                        </button>

                        <button
                          type="button"
                          onClick={() => removeShare(share.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F1C9C9] bg-white px-4 py-2 text-xs font-bold text-[#B9544A] transition hover:bg-[#FFF0EF]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Retirer l’accès
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
