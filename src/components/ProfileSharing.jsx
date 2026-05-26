import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { SectionTitle } from "./shared.jsx";
import { displayName, sections } from "./sectionsData.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

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

const wizardSteps = [
  { id: 1, title: "Rechercher" },
  { id: 2, title: "Utilisateur" },
  { id: 3, title: "Accès" },
  { id: 4, title: "Confirmation" },
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
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

function getStatusLabel(share) {
  if (share.status === "accepted") return "Accès donné";
  if (share.status === "revoked") return "Retiré";
  if (share.emailStatus === "failed") return "Courriel échoué";
  if (share.emailStatus === "sent") return "Courriel envoyé";

  return "En attente";
}

function getStatusClasses(share) {
  if (share.status === "accepted") return "bg-[#EEF0E7] text-[#6F785F]";
  if (share.status === "revoked") return "bg-[#FFF0EF] text-[#B9544A]";
  if (share.emailStatus === "failed") return "bg-[#FFF8E8] text-[#8A6F34]";

  return "bg-[#F8F3EA] text-[#8B8278]";
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
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [expandedShareId, setExpandedShareId] = useState("");
  const [message, setMessage] = useState("");

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMessage, setWizardMessage] = useState("");
  const [wizardError, setWizardError] = useState("");

  const [searchEmail, setSearchEmail] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [foundUser, setFoundUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const shareableSections = useMemo(() => {
    return sections.filter((section) =>
      shareableSectionIds.includes(section.id)
    );
  }, []);

  const selectedChildren = useMemo(() => {
    return children.filter((child) => selectedChildIds.includes(child.id));
  }, [children, selectedChildIds]);

  const canSearch = isValidEmail(searchEmail);

  const canChooseAccess =
    Boolean(selectedUser?.userId) &&
    selectedChildIds.length > 0 &&
    selectedSectionIds.length > 0;

  useEffect(() => {
    loadShares();
  }, []);

  async function loadShares() {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/profile-shares`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de charger les partages.");
      }

      setShares(Array.isArray(data.shares) ? data.shares : []);
    } catch (error) {
      console.error("Erreur chargement partages:", error);
      setShares([]);
    } finally {
      setIsLoading(false);
    }
  }

  function resetWizard() {
    setWizardStep(1);
    setWizardMessage("");
    setWizardError("");
    setSearchEmail("");
    setSearchName("");
    setSearchStatus("idle");
    setFoundUser(null);
    setSelectedUser(null);
    setSelectedChildIds([]);
    setSelectedSectionIds(["children", "calendar", "documents"]);
    setSectionPermissions({
      children: "read",
      calendar: "read",
      documents: "read",
    });
    setNote("");
  }

  function openWizard() {
    resetWizard();
    setMessage("");
    setShowWizard(true);
  }

  function closeWizard() {
    setShowWizard(false);
    resetWizard();
  }

  function setWizardInfo(text) {
    setWizardError("");
    setWizardMessage(text || "");
  }

  function setWizardProblem(text) {
    setWizardMessage("");
    setWizardError(text || "");
  }

  async function searchUserByEmail() {
  if (!canSearch) {
    setWizardProblem("Ajoute un courriel valide avant de rechercher.");
    return;
  }

  try {
    setSearchStatus("loading");
    setWizardMessage("");
    setWizardError("");
    setFoundUser(null);
    setSelectedUser(null);

    const cleanEmail = searchEmail.trim().toLowerCase();

    const response = await fetch(
      `${API_BASE_URL}/api/profile-shares/users/search?email=${encodeURIComponent(
        cleanEmail
      )}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    // Cas normal : aucun utilisateur trouvé
    if (
      response.status === 404 ||
      data?.found === false ||
      data?.error === "user_not_found"
    ) {
      setSearchStatus("not-found");
      setWizardStep(2);
      setWizardMessage("");
      setWizardError("");
      setSearchName("");
      return;
    }

    if (!response.ok) {
      throw new Error(
        data?.message || "Impossible de rechercher cet utilisateur."
      );
    }

    if (data?.found && data?.user) {
      setFoundUser(data.user);
      setSelectedUser(data.user);
      setSearchName(data.user.name || "");
      setSearchStatus("found");
      setWizardStep(2);
      setWizardInfo("Utilisateur trouvé. Vous pouvez continuer.");
      return;
    }

    // Cas normal : réponse OK, mais aucun compte
    setSearchStatus("not-found");
    setWizardStep(2);
    setWizardMessage("");
    setWizardError("");
    setSearchName("");
  } catch (error) {
    console.error("Erreur recherche utilisateur:", error);
    setSearchStatus("error");
    setWizardProblem(
      error?.message || "Impossible de rechercher cet utilisateur."
    );
  }
}

  async function inviteToCreateAccount() {
    try {
      setIsSaving(true);
      setWizardMessage("");
      setWizardError("");

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/users/invite-create-account`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: searchEmail.trim().toLowerCase(),
            name: searchName.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible d’envoyer l’invitation.");
      }

      if (data?.user) {
        setFoundUser(data.user);
        setSelectedUser(data.user);
        setSearchName(data.user.name || searchName);
        setSearchStatus("found");
      }

      setWizardInfo(
        data?.message ||
          "Invitation envoyée. La personne doit créer son compte avant d’être sélectionnable."
      );
    } catch (error) {
      setWizardProblem(error?.message || "Impossible d’envoyer l’invitation.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createCognitoAccount() {
    try {
      setIsSaving(true);
      setWizardMessage("");
      setWizardError("");

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/users/create-cognito`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: searchEmail.trim().toLowerCase(),
            name: searchName.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de créer le compte.");
      }

      if (data?.user?.userId) {
        setFoundUser(data.user);
        setSelectedUser(data.user);
        setSearchName(data.user.name || searchName);
        setSearchStatus("found");
        setWizardStep(3);
        setWizardInfo("Compte trouvé ou créé. Vous pouvez choisir les accès.");
      } else {
        setWizardInfo(
          data?.message ||
            "Compte créé. La personne doit compléter l’activation reçue par courriel."
        );
      }
    } catch (error) {
      setWizardProblem(error?.message || "Impossible de créer le compte.");
    } finally {
      setIsSaving(false);
    }
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
      if (current.includes(sectionId)) {
        setSectionPermissions((permissions) => {
          const next = { ...permissions };
          delete next[sectionId];
          return next;
        });

        return current.filter((id) => id !== sectionId);
      }

      setSectionPermissions((permissions) => ({
        ...permissions,
        [sectionId]: permissions[sectionId] || "read",
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

  async function createShare() {
    if (!canChooseAccess) {
      setWizardProblem(
        "Sélectionne un utilisateur, au moins un enfant et au moins une section."
      );
      return;
    }

    const cleanSectionPermissions = selectedSectionIds.reduce(
      (acc, sectionId) => {
        acc[sectionId] = sectionPermissions[sectionId] || "read";
        return acc;
      },
      {}
    );

    const payload = {
      targetUserId: selectedUser.userId,
      inviteeUserId: selectedUser.userId,
      inviteeName: selectedUser.name || searchName.trim(),
      inviteeEmail: selectedUser.email || searchEmail.trim().toLowerCase(),
      childIds: selectedChildIds,
      children: selectedChildren.map((child) => ({
        id: child.id,
        name: displayName(child),
        color: child.color || "sage",
        photo: child.photo || child.avatar || child.image || "",
      })),
      sectionIds: selectedSectionIds,
      sectionPermissions: cleanSectionPermissions,
      permission: getHighestPermission(cleanSectionPermissions),
      note: note.trim(),
    };

    try {
      setIsSaving(true);
      setWizardMessage("");
      setWizardError("");

      const response = await fetch(`${API_BASE_URL}/api/profile-shares`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de créer le partage.");
      }

      if (data?.share) {
        setShares((current) => [
          data.share,
          ...current.filter((share) => share.id !== data.share?.id),
        ]);
      }

      setWizardStep(4);
      setWizardInfo(data?.message || "L’accès partagé a été créé.");
    } catch (error) {
      setWizardProblem(error?.message || "Impossible de créer le partage.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resendEmail(shareId) {
    try {
      setActionLoadingId(`resend-${shareId}`);
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/${shareId}/resend`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de renvoyer le courriel.");
      }

      if (data.share) {
        setShares((current) =>
          current.map((share) => (share.id === shareId ? data.share : share))
        );
      }

      setMessage(data?.message || "Courriel renvoyé.");
    } catch (error) {
      setMessage(error?.message || "Impossible de renvoyer le courriel.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function revokeShare(shareId) {
    const previousShares = shares;

    try {
      setMessage("");

      setShares((current) => current.filter((share) => share.id !== shareId));

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/${shareId}/revoke`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de retirer l’accès.");
      }

      setMessage("L’accès partagé a été retiré.");
    } catch (error) {
      setShares(previousShares);
      setMessage(error?.message || "Impossible de retirer l’accès.");
    }
  }

  async function copyInviteLink(share) {
    if (!share?.inviteUrl) {
      setMessage("Aucun lien disponible.");
      return;
    }

    try {
      await navigator.clipboard.writeText(share.inviteUrl);
      setMessage("Lien copié.");
    } catch {
      setMessage("Impossible de copier le lien automatiquement.");
    }
  }

  function renderWizardStep() {
    if (wizardStep === 1) {
      return (
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#EADFCF] bg-white p-5">
            <h3 className="text-lg font-bold text-[#4F4A45]">
              Rechercher l’utilisateur Camelio
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#7D756E]">
              Avant de donner un accès, Camelio vérifie si un compte existe déjà
              avec ce courriel.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-3xl border border-[#EADFCF] px-4 py-3 text-sm outline-none focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                type="email"
                value={searchEmail}
                onChange={(event) => {
                  setSearchEmail(event.target.value);
                  setWizardMessage("");
                  setWizardError("");
                  setSearchStatus("idle");
                }}
                placeholder="courriel@exemple.com"
              />

              <button
                type="button"
                onClick={searchUserByEmail}
                disabled={!canSearch || searchStatus === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {searchStatus === "loading" ? "Recherche..." : "Rechercher"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (wizardStep === 2) {
      return (
        <div className="space-y-4">
          {searchStatus === "found" && selectedUser ? (
            <div className="rounded-3xl border border-[#D8E0C7] bg-[#F3F6ED] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A8B193] text-white">
                  <UserCheck className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-[#4F4A45]">
                    Utilisateur trouvé
                  </h3>

                  <p className="mt-1 text-sm text-[#6F685F]">
                    {selectedUser.name || "Sans nom"}
                  </p>

                  <p className="text-sm font-semibold text-[#6F785F]">
                    {selectedUser.email}
                  </p>

                  <p className="mt-2 text-xs text-[#7D756E]">
                    Source :{" "}
                    {selectedUser.source === "cognito"
                      ? "Compte Cognito"
                      : "Profil Camelio"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setWizardMessage("");
                    setWizardError("");
                    setWizardStep(3);
                  }}
                  className="rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white"
                >
                  Continuer vers les accès
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#EADFCF] bg-white p-5">
              <h3 className="text-lg font-bold text-[#4F4A45]">
  Aucun compte Camelio trouvé
</h3>

<div className="mt-3 rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3">
  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
    Courriel recherché
  </p>

  <p className="mt-1 break-all text-sm font-bold text-[#4F4A45]">
    {searchEmail.trim().toLowerCase() || "Aucun courriel indiqué"}
  </p>
</div>

<p className="mt-3 text-sm leading-6 text-[#7D756E]">
  Aucun utilisateur n’a été trouvé avec ce courriel. Vérifie d’abord qu’il n’y a
  pas de coquille. Si le courriel est exact, la personne doit créer un compte
  Camelio avant que tu puisses lui donner un accès partagé.
</p>

              <label className="mt-4 block text-sm font-semibold text-[#4F4A45]">
                Nom de la personne, optionnel
              </label>

              <input
                className="mt-2 w-full rounded-3xl border border-[#EADFCF] px-4 py-3 text-sm outline-none focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="Ex. Thomas"
              />

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                
                <button
  type="button"
  onClick={() => {
    setWizardMessage("");
    setWizardError("");
    setSearchStatus("idle");
    setWizardStep(1);
  }}
  disabled={isSaving}
  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E] disabled:opacity-50"
>
  <Pencil className="h-4 w-4" />
  Modifier le courriel
</button>
                <button
                  type="button"
                  onClick={inviteToCreateAccount}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E] disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  Inviter à créer un compte
                </button>

                <button
                  type="button"
                  onClick={createCognitoAccount}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B5A7C8] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Créer le compte pour elle
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (wizardStep === 3) {
      return (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#EADFCF] bg-white p-5">
            <h3 className="text-lg font-bold text-[#4F4A45]">
              Choisir les enfants à partager
            </h3>

            {children.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#D8D2C6] bg-[#FFFDF8] p-5 text-center text-sm font-semibold text-[#7D756E]">
                Aucun enfant disponible pour le moment.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {children.map((child) => {
                  const selected = selectedChildIds.includes(child.id);

                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child.id)}
                      className={`flex items-center gap-3 rounded-3xl border p-3 text-left ${
                        selected
                          ? "border-[#A8B193] bg-[#F3F6ED]"
                          : "border-[#EADFCF] bg-white"
                      }`}
                    >
                      <ChildAvatar child={child} selected={selected} />

                      <div>
                        <p className="font-bold text-[#4F4A45]">
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

          <div className="rounded-3xl border border-[#EADFCF] bg-white p-5">
            <h3 className="text-lg font-bold text-[#4F4A45]">
              Choisir les accès par section
            </h3>

            <div className="mt-4 space-y-3">
              {shareableSections.map((section) => {
                const Icon = section.icon;
                const selected = selectedSectionIds.includes(section.id);
                const currentPermission =
                  sectionPermissions[section.id] || "read";

                return (
                  <div
                    key={section.id}
                    className={`rounded-3xl border p-4 ${
                      selected
                        ? "border-[#B5A7C8] bg-[#F7F3FF]"
                        : "border-[#EADFCF] bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                            selected
                              ? "bg-[#B5A7C8] text-white"
                              : "bg-[#F8F3EA] text-[#8B8278]"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-bold text-[#4F4A45]">
                            {section.title}
                          </p>
                          <p className="text-xs text-[#8B8278]">
                            {section.description}
                          </p>
                        </div>
                      </button>

                      {selected ? (
                        <div className="flex flex-wrap gap-2">
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

          <div className="rounded-3xl border border-[#EADFCF] bg-white p-5">
            <label className="text-sm font-semibold text-[#4F4A45]">
              Message de confirmation, optionnel
            </label>

            <textarea
              className="mt-2 min-h-[120px] w-full rounded-3xl border border-[#EADFCF] px-4 py-3 text-sm outline-none focus:border-[#A8B193] focus:ring-4 focus:ring-[#A8B193]/15"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex. Je t’ai donné accès au calendrier et aux documents importants."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={createShare}
              disabled={!canChooseAccess || isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSaving ? "Création..." : "Créer le partage"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-[#D8E0C7] bg-[#F3F6ED] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#A8B193] text-white">
          <Check className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-xl font-bold text-[#4F4A45]">
          Accès partagé créé
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#6F685F]">
          L’utilisateur sélectionné a maintenant un accès limité aux sections
          que tu as choisies. Un courriel de confirmation est envoyé si la
          configuration courriel est active.
        </p>

        <button
          type="button"
          onClick={() => {
            closeWizard();
            loadShares();
          }}
          className="mt-5 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white"
        >
          Terminer
        </button>
      </div>
    );
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
        subtitle="Recherchez un compte Camelio, sélectionnez l’utilisateur, puis choisissez les accès à partager."
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
              Le partage se fait maintenant avec un compte Camelio existant. Si
              aucun compte n’existe, invitez la personne à créer son compte ou
              créez un compte Cognito pour elle.
            </p>
          </div>

          <button
            type="button"
            onClick={openWizard}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <UserPlus className="h-4 w-4" />
            Nouveau partage
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-[#EEC988] bg-[#FFF8E8] p-3 text-sm font-semibold text-[#8A6F34]">
          {message}
        </div>
      ) : null}

      {showWizard ? (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-[#4F4A45]/35 p-3 py-8 backdrop-blur-sm">
          <div className="relative z-[10000] w-full max-w-4xl rounded-[34px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                  Nouveau partage
                </p>

                <h3 className="mt-1 text-2xl font-bold text-[#4F4A45]">
                  Assistant de partage
                </h3>
              </div>

              <button
                type="button"
                onClick={closeWizard}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7D756E] shadow-sm"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2">
              {wizardSteps.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-3 py-3 text-center ${
                    wizardStep >= step.id
                      ? "border-[#A8B193] bg-[#F3F6ED] text-[#6F785F]"
                      : "border-[#EADFCF] bg-white text-[#8B8278]"
                  }`}
                >
                  <p className="text-xs font-bold">Étape {step.id}</p>
                  <p className="mt-1 text-xs font-semibold">{step.title}</p>
                </div>
              ))}
            </div>

            {wizardMessage ? (
              <div className="mb-4 rounded-2xl border border-[#D8E0C7] bg-[#F3F6ED] px-4 py-3 text-sm font-semibold text-[#6F785F]">
                {wizardMessage}
              </div>
            ) : null}

            {wizardError ? (
              <div className="mb-4 rounded-2xl border border-[#F1C9C9] bg-[#FFF0EF] px-4 py-3 text-sm font-semibold text-[#B9544A]">
                {wizardError}
              </div>
            ) : null}

            {renderWizardStep()}
          </div>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-[#EADFCF] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
              Accès
            </p>

            <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
              Partages actifs et en attente
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
              Les accès créés apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => {
              const expanded = expandedShareId === share.id;
              const sectionDetails = getShareSectionDetails(share);
              const childrenNames =
                (share.children || []).map((child) => child.name).join(", ") ||
                "Non précisé";

              return (
                <div
                  key={share.id}
                  className="rounded-3xl border border-[#EADFCF] bg-[#FFFDF8] p-4"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedShareId((current) =>
                        current === share.id ? "" : share.id
                      )
                    }
                    className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#4F4A45]">
                          {share.inviteeName || "Invitation"}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                            share
                          )}`}
                        >
                          {getStatusLabel(share)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#7D756E]">
                        {share.inviteeEmail}
                      </p>

                      <p className="mt-2 text-sm text-[#5F5A52]">
                        <strong>Enfant(s) :</strong> {childrenNames}
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#B8AA9A] transition ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expanded ? (
                    <div className="mt-4 border-t border-[#EADFCF] pt-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Courriel
                          </p>
                          <p className="mt-1 text-sm text-[#4F4A45]">
                            {share.inviteeEmail || "Non précisé"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Création
                          </p>
                          <p className="mt-1 text-sm text-[#4F4A45]">
                            {formatDate(share.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Expiration du lien
                          </p>
                          <p className="mt-1 text-sm text-[#4F4A45]">
                            {formatDateTime(share.expiresAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">
                            Statut courriel
                          </p>
                          <p className="mt-1 text-sm text-[#4F4A45]">
                            {share.emailStatus === "sent"
                              ? "Envoyé"
                              : share.emailStatus === "failed"
                                ? "Échec"
                                : "En attente"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-bold text-[#5F5A52]">
                          Sections et permissions :
                        </p>

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
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyInviteLink(share)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#7D756E]"
                        >
                          <Copy className="h-4 w-4" />
                          Copier le lien
                        </button>

                        <button
                          type="button"
                          onClick={() => resendEmail(share.id)}
                          disabled={actionLoadingId === `resend-${share.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          Renvoyer le courriel
                        </button>

                        <button
                          type="button"
                          onClick={() => revokeShare(share.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F1C9C9] bg-white px-4 py-2 text-xs font-bold text-[#B9544A]"
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