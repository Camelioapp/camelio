import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  Mail,
  Pencil,
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

const nonShareableSectionIds = ["children"];

const shareableSectionIds = [
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

function getUserAutomaticName(user) {
  if (!user) return "";

  return (
    user.nickname ||
    user.displayName ||
    user.name ||
    user.givenName ||
    user.email ||
    "Sans nom"
  );
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
  const [accountCreationNotice, setAccountCreationNotice] = useState(null);
  const [inviteDraft, setInviteDraft] = useState(null);
  const [isInviteDraftOpen, setIsInviteDraftOpen] = useState(false);
  const [inviteEmailBody, setInviteEmailBody] = useState("");
  const [inviteEmailSubject, setInviteEmailSubject] = useState("Invitation à rejoindre Camelio");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMessage, setWizardMessage] = useState("");
  const [wizardError, setWizardError] = useState("");
  const [editingShareId, setEditingShareId] = useState("");

  const [searchEmail, setSearchEmail] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [foundUser, setFoundUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [sectionPermissions, setSectionPermissions] = useState({});
  const [note, setNote] = useState("");

  const shareableSections = useMemo(() => {
    return sections.filter((section) =>
      shareableSectionIds.includes(section.id)
    );
  }, []);

  const nonShareableSections = useMemo(() => {
    return sections.filter((section) =>
      nonShareableSectionIds.includes(section.id)
    );
  }, []);

  const selectedChildren = useMemo(() => {
    return children.filter((child) => selectedChildIds.includes(child.id));
  }, [children, selectedChildIds]);

  const canSearch = isValidEmail(searchEmail);

  const canChooseAccess =
    (Boolean(selectedUser?.userId) || Boolean(inviteDraft?.guestAccessCode) || isValidEmail(searchEmail)) &&
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
    setSelectedSectionIds([]);
    setSectionPermissions({});
    setEditingShareId("");
    setNote("");
  }

  function openWizard() {
    resetWizard();
    setMessage("");
    setShowWizard(true);
  }

  function openEditWizard(share) {
    const sectionIds = Array.isArray(share.sectionIds)
      ? share.sectionIds.filter((sectionId) => shareableSectionIds.includes(sectionId))
      : [];
    const childIds = Array.isArray(share.childIds)
      ? share.childIds
      : (share.children || []).map((child) => child.id).filter(Boolean);

    setEditingShareId(share.id || "");
    setWizardStep(3);
    setWizardMessage("");
    setWizardError("");
    setSearchEmail(share.inviteeEmail || "");
    setSearchName(share.inviteeName || "");
    setSearchStatus("found");

    setSelectedUser({
      userId:
        share.importedByUserId ||
        share.inviteeUserId ||
        share.targetUserId ||
        "",
      email: share.inviteeEmail || "",
      name: share.inviteeName || "",
    });

    setSelectedChildIds(childIds);
    setSelectedSectionIds(sectionIds);
    setSectionPermissions(
      Object.fromEntries(
        Object.entries(share.sectionPermissions || {}).filter(([sectionId]) =>
          shareableSectionIds.includes(sectionId)
        )
      )
    );
    setNote(share.note || "");
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
        const user = {
          ...data.user,
          name: getUserAutomaticName(data.user),
        };

        setFoundUser(user);
        setSelectedUser(user);
        setSearchName(getUserAutomaticName(user));
        setSearchStatus("found");
        setWizardStep(2);
        setWizardInfo("Utilisateur trouvé. Son nom a été récupéré automatiquement.");
        return;
      }

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
    const cleanEmail = searchEmail.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setWizardProblem("Ajoute un courriel valide avant de préparer l’invitation.");
      return;
    }

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
            email: cleanEmail,
            name: searchName.trim(),
            send: false,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Impossible de préparer l’invitation."
        );
      }

      const subject = data?.emailSubject || "Invitation à rejoindre Camelio";
      const body =
        data?.emailBody ||
        `Bonjour${searchName.trim() ? ` ${searchName.trim()}` : ""},\n\nJe t’invite à créer ton compte Camelio pour que je puisse te partager certaines informations familiales dans un espace sécurisé.\n\nTon code invité est : ${data?.guestAccessCode || ""}\n\nUtilise ce code avec le courriel ${cleanEmail} lors de ton inscription ou dans l’activation de ton espace invité.\n\nÀ bientôt!`;

      setInviteEmailSubject(subject);
      setInviteEmailBody(body);
      const preparedDraft = {
        email: cleanEmail,
        name: searchName.trim(),
        guestAccessCode: data?.guestAccessCode || "",
        sent: false,
      };

      setInviteDraft(preparedDraft);
      setIsInviteDraftOpen(true);
      setSelectedUser({
        userId: "",
        email: cleanEmail,
        name: searchName.trim() || cleanEmail,
        guestAccessCode: preparedDraft.guestAccessCode,
      });
      setSelectedSectionIds(["children"]);
      setSectionPermissions({ children: "read" });
    } catch (error) {
      console.error("Erreur préparation invitation création compte:", error);
      setWizardProblem(error?.message || "Impossible de préparer l’invitation.");
    } finally {
      setIsSaving(false);
    }
  }

  async function sendInviteDraft() {
    if (!inviteDraft?.email) return;

    try {
      setIsSendingInvite(true);
      setWizardMessage("");
      setWizardError("");

      const response = await fetch(
        `${API_BASE_URL}/api/profile-shares/users/invite-create-account`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteDraft.email,
            name: inviteDraft.name || searchName.trim(),
            guestAccessCode: inviteDraft.guestAccessCode,
            emailSubject: inviteEmailSubject,
            emailBody: inviteEmailBody,
            send: true,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Impossible d’envoyer l’invitation.");
      }

      setInviteDraft((current) => ({ ...(current || {}), sent: true }));
      setIsInviteDraftOpen(false);
      setWizardStep(3);
      setSelectedUser({
        userId: "",
        email: inviteDraft.email,
        name: inviteDraft.name || searchName.trim() || inviteDraft.email,
        guestAccessCode: inviteDraft.guestAccessCode,
      });
      setSelectedSectionIds(["children"]);
      setSectionPermissions({ children: "read" });
      setWizardInfo("Invitation envoyée. Par défaut, seul le profil d’enfant est partagé. Vous pouvez maintenant choisir les enfants et confirmer les accès.");
    } catch (error) {
      console.error("Erreur envoi invitation création compte:", error);
      setWizardProblem(error?.message || "Impossible d’envoyer l’invitation.");
    } finally {
      setIsSendingInvite(false);
    }
  }

  async function copyInviteDraftCode() {
    if (!inviteDraft?.guestAccessCode) {
      setWizardProblem("Aucun code invité disponible.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteDraft.guestAccessCode);
      setWizardInfo("Code invité copié.");
    } catch {
      setWizardProblem("Impossible de copier le code automatiquement.");
    }
  }

  async function copyInviteDraftEmail() {
    const text = `Objet : ${inviteEmailSubject}\n\n${inviteEmailBody}`;

    try {
      await navigator.clipboard.writeText(text);
      setWizardInfo("Courriel copié.");
    } catch {
      setWizardProblem("Impossible de copier le courriel automatiquement.");
    }
  }


  async function createCognitoAccount() {
    const cleanEmail = searchEmail.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setWizardProblem("Ajoute un courriel valide avant de créer le compte.");
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanEmail);
    } catch {
      // La copie n’est pas obligatoire.
    }

    setAccountCreationNotice({
      title: "Créer le compte",
      message:
        "Une page d’inscription va s’ouvrir. Créez le compte avec ce courriel. Lorsque le compte sera créé, revenez ici, retournez à l’étape 1 et recherchez le même courriel pour sélectionner l’utilisateur.",
      email: cleanEmail,
    });

    setWizardInfo(
      "Après avoir créé le compte, recommencez la recherche à l’étape 1 pour sélectionner l’utilisateur."
    );

    window.open(`${API_BASE_URL}/signup`, "_blank", "noopener,noreferrer");
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
        "Sélectionne au moins un enfant et au moins une section. Pour un nouveau compte, prépare d’abord l’invitation afin de générer le code invité."
      );
      return;
    }

    const allowedSelectedSectionIds = selectedSectionIds.filter((sectionId) =>
      shareableSectionIds.includes(sectionId)
    );

    if (allowedSelectedSectionIds.length !== selectedSectionIds.length) {
      setSelectedSectionIds(allowedSelectedSectionIds);
    }

    const cleanSectionPermissions = allowedSelectedSectionIds.reduce(
      (acc, sectionId) => {
        acc[sectionId] = sectionPermissions[sectionId] || "read";
        return acc;
      },
      {}
    );

    const inviteeEmail = selectedUser?.email || inviteDraft?.email || searchEmail.trim().toLowerCase();
    const inviteeName =
      getUserAutomaticName(selectedUser) ||
      inviteDraft?.name ||
      searchName.trim() ||
      inviteeEmail;

    const payload = {
      ...(selectedUser?.userId
        ? {
            targetUserId: selectedUser.userId,
            inviteeUserId: selectedUser.userId,
          }
        : {}),
      guestAccessCode: inviteDraft?.guestAccessCode || selectedUser?.guestAccessCode || "",
      inviteEmailAlreadySent: Boolean(inviteDraft?.sent),
      skipInvitationEmail: Boolean(inviteDraft?.sent),
      inviteeName,
      inviteeEmail,
      childIds: selectedChildIds,
      children: selectedChildren.map((child) => ({
        id: child.id,
        name: displayName(child),
        color: child.color || "sage",
        photo: child.photo || child.avatar || child.image || "",
      })),
      sectionIds: allowedSelectedSectionIds,
      sectionPermissions: cleanSectionPermissions,
      permission: getHighestPermission(cleanSectionPermissions),
      note: note.trim(),
    };

    try {
      setIsSaving(true);
      setWizardMessage("");
      setWizardError("");

      const isEditing = Boolean(editingShareId);

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/profile-shares/${editingShareId}`
          : `${API_BASE_URL}/api/profile-shares`,
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

let data = {};
try {
  data = responseText ? JSON.parse(responseText) : {};
} catch {
  data = { rawResponse: responseText };
}

if (!response.ok) {
  console.error("Erreur sauvegarde partage:", {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    data,
  });

  throw new Error(
    data?.message ||
      data?.error ||
      data?.rawResponse ||
      `Erreur ${response.status} pendant l’enregistrement du partage.`
  );
}

      if (data?.share) {
        setShares((current) => [
          data.share,
          ...current.filter((share) => share.id !== data.share?.id),
        ]);
      }

      setWizardStep(4);
      setWizardInfo(
        data?.message ||
          (isEditing
            ? "L’accès partagé a été modifié."
            : "L’accès partagé a été créé.")
      );
    } catch (error) {
      console.error("Erreur création ou modification du partage:", error);
      setWizardProblem(error?.message || "Impossible d’enregistrer le partage.");
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

  async function copyGuestCode(share) {
    if (!share?.guestAccessCode) {
      setMessage("Aucun code invité disponible.");
      return;
    }

    try {
      await navigator.clipboard.writeText(share.guestAccessCode);
      setMessage("Code invité copié.");
    } catch {
      setMessage("Impossible de copier le code automatiquement.");
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

                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                    Nom récupéré automatiquement
                  </p>

                  <p className="mt-1 text-base font-bold text-[#4F4A45]">
                    {getUserAutomaticName(selectedUser)}
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
                  {searchEmail.trim().toLowerCase() ||
                    "Aucun courriel indiqué"}
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#7D756E]">
                Aucun utilisateur n’a été trouvé avec ce courriel. Vérifie
                d’abord qu’il n’y a pas de coquille. Si le courriel est exact,
                la personne doit créer un compte Camelio avant que tu puisses
                lui donner un accès partagé.
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

              {inviteDraft?.guestAccessCode ? (
                <div className="mt-5 rounded-3xl border border-[#D8CBE8] bg-[#F7F3FF] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9D8BB7]">
                    Code invité associé à ce courriel
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="break-all text-xl font-black tracking-[0.08em] text-[#4F4A45]">
                      {inviteDraft.guestAccessCode}
                    </p>

                    <button
                      type="button"
                      onClick={copyInviteDraftCode}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CBE8] bg-white px-4 py-2 text-sm font-bold text-[#7D6A9A]"
                    >
                      <Copy className="h-4 w-4" />
                      Copier le code
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#7D6A9A]">
                    Ce code devra être utilisé avec le courriel {inviteDraft.email}.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    if (inviteDraft?.guestAccessCode) {
                      setIsInviteDraftOpen(true);
                      return;
                    }

                    inviteToCreateAccount();
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {isSaving ? "Préparation..." : inviteDraft?.guestAccessCode ? "Réouvrir l’invitation" : "Inviter à créer un compte"}
                </button>

                {inviteDraft?.guestAccessCode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setWizardMessage(
                        "Par défaut, seul le profil d’enfant est partagé. Vous pouvez maintenant choisir les enfants à partager."
                      );
                      setWizardError("");
                      setWizardStep(3);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A8B193] bg-white px-5 py-3 text-sm font-bold text-[#6F785F]"
                  >
                    Donner les accès
                  </button>
                ) : null}
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

          <div className="rounded-3xl border border-[#EADFCF] bg-white p-5">
            <h3 className="text-lg font-bold text-[#4F4A45]">
              Choisir les accès par section
            </h3>

            <div className="mt-3 rounded-3xl border border-[#EADFCF] bg-[#FBF7EF] px-4 py-3 text-sm text-[#6F665E]">
              Le <span className="font-bold text-[#4F4A45]">Profil enfant</span> ne peut pas être partagé directement.
              Cette section contient les informations de base de l’enfant et demeure accessible seulement avec le compte principal.
              Vous pouvez plutôt partager les sections autorisées ci-dessous, comme le calendrier, les photos, les documents ou la santé.
            </div>

            <div className="mt-4 space-y-3">
              {nonShareableSections.map((section) => {
                const Icon = section.icon;

                return (
                  <div
                    key={section.id}
                    className="rounded-3xl border border-[#EADFCF] bg-[#F3F1EC] p-4 opacity-75"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6E1D8] text-[#8B8278]">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-bold text-[#4F4A45]">
                            {section.title}
                          </p>
                          <p className="text-xs text-[#8B8278]">
                            Non partageable, compte principal seulement.
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center justify-center rounded-full border border-[#D8CDBE] bg-white px-3 py-2 text-xs font-bold text-[#8B8278]">
                        Non disponible
                      </span>
                    </div>
                  </div>
                );
              })}

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

          <div className="flex justify-end">
            <button
  type="button"
  onClick={createShare}
  disabled={!canChooseAccess || isSaving}
  className="inline-flex items-center justify-center rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
>
  {isSaving
    ? "Enregistrement..."
    : editingShareId
      ? "Enregistrer les modifications"
      : "Créer le partage"}
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
          {editingShareId ? "Accès partagé modifié" : "Accès partagé créé"}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#6F685F]">
          Les accès sélectionnés sont maintenant enregistrés.
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
              Le partage se fait avec un compte Camelio existant. Si aucun
              compte n’existe, invite la personne à créer son compte ou crée un
              compte pour elle.
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

      {accountCreationNotice ? (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-[#4F4A45]/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[30px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                  Compte requis
                </p>

                <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
                  {accountCreationNotice.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setAccountCreationNotice(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7D756E] shadow-sm"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#EADFCF] bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                Courriel à utiliser
              </p>

              <p className="mt-1 break-all text-sm font-bold text-[#4F4A45]">
                {accountCreationNotice.email}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#6F685F]">
              {accountCreationNotice.message}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setAccountCreationNotice(null);
                  setWizardStep(1);
                  setSearchStatus("idle");
                  setFoundUser(null);
                  setSelectedUser(null);
                  setWizardMessage("");
                  setWizardError("");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E]"
              >
                Retourner à l’étape 1
              </button>

              <button
                type="button"
                onClick={() => setAccountCreationNotice(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white"
              >
                J’ai compris
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {inviteDraft && isInviteDraftOpen ? (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-[#4F4A45]/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                  Invitation familiale
                </p>

                <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
                  Inviter à créer un compte
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#7D756E]">
                  Tu peux modifier le message avant l’envoi. Le code invité est unique et associé au courriel recherché.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteDraftOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7D756E] shadow-sm"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-[#EADFCF] bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                  Courriel associé
                </p>
                <p className="mt-1 break-all text-sm font-bold text-[#4F4A45]">
                  {inviteDraft.email}
                </p>
              </div>

              <div className="rounded-2xl border border-[#D8CBE8] bg-[#F7F3FF] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9D8BB7]">
                  Code invité
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="break-all text-sm font-black text-[#4F4A45]">
                    {inviteDraft.guestAccessCode || "Non disponible"}
                  </p>
                  <button
                    type="button"
                    onClick={copyInviteDraftCode}
                    className="inline-flex items-center justify-center rounded-full border border-[#D8CBE8] bg-white p-2 text-[#7D6A9A]"
                    aria-label="Copier le code invité"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                Objet
              </span>
              <input
                value={inviteEmailSubject}
                onChange={(event) => setInviteEmailSubject(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-white px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                Message
              </span>
              <textarea
                value={inviteEmailBody}
                onChange={(event) => setInviteEmailBody(event.target.value)}
                rows={10}
                className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-white px-4 py-3 text-sm leading-6 text-[#4F4A45] outline-none focus:border-[#A8B193]"
              />
            </label>

            <p className="mt-3 text-xs leading-5 text-[#8B8278]">
              Ce code devra être utilisé par la personne invitée lors de l’activation de son espace invité. Il ne fonctionne qu’avec le courriel associé.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={copyInviteDraftEmail}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E]"
              >
                <Copy className="h-4 w-4" />
                Copier le courriel
              </button>

              <button
                type="button"
                onClick={sendInviteDraft}
                disabled={isSendingInvite || inviteDraft.sent}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {inviteDraft.sent ? "Invitation envoyée" : isSendingInvite ? "Envoi..." : "Envoyer l’invitation"}
              </button>

              {inviteDraft?.sent ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteDraftOpen(false);
                    setWizardMessage(
                      "Invitation envoyée. Par défaut, seul le profil d’enfant est partagé. Vous pouvez maintenant choisir les enfants."
                    );
                    setWizardError("");
                    setWizardStep(3);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#A8B193] bg-white px-5 py-3 text-sm font-bold text-[#6F785F]"
                >
                  Donner les accès
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showWizard ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#4F4A45]/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-[#EADFCF] bg-[#FFFDF8] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#EADFCF] bg-[#FFFDF8] px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                  Partage de profil
                </p>

                <h3 className="mt-1 text-xl font-bold text-[#4F4A45]">
                  {editingShareId ? "Modifier le partage" : "Nouveau partage"}
                </h3>

                <p className="mt-1 text-sm text-[#7D756E]">
                  Étape {wizardStep} sur {wizardSteps.length} ·{" "}
                  {wizardSteps.find((step) => step.id === wizardStep)?.title}
                </p>
              </div>

              <button
                type="button"
                onClick={closeWizard}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7D756E] shadow-sm transition hover:bg-[#F8F3EA]"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-[#EADFCF] bg-white px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {wizardSteps.map((step) => {
                  const isActive = wizardStep === step.id;
                  const isCompleted = wizardStep > step.id;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                        isActive
                          ? "bg-[#A8B193] text-white"
                          : isCompleted
                            ? "bg-[#EEF0E7] text-[#6F785F]"
                            : "bg-[#F8F3EA] text-[#8B8278]"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          step.id
                        )}
                      </span>
                      {step.title}
                    </div>
                  );
                })}
              </div>
            </div>

            {(wizardMessage || wizardError) && (
              <div className="px-5 pt-4">
                {wizardMessage ? (
                  <div className="rounded-2xl border border-[#D8E0C7] bg-[#F3F6ED] px-4 py-3 text-sm font-semibold text-[#6F785F]">
                    {wizardMessage}
                  </div>
                ) : null}

                {wizardError ? (
                  <div className="rounded-2xl border border-[#F1C9C9] bg-[#FFF0EF] px-4 py-3 text-sm font-semibold text-[#B9544A]">
                    {wizardError}
                  </div>
                ) : null}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {renderWizardStep()}
            </div>

            {wizardStep > 1 && wizardStep < 4 ? (
              <div className="flex justify-between gap-3 border-t border-[#EADFCF] bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setWizardMessage("");
                    setWizardError("");
                    setWizardStep((current) => Math.max(1, current - 1));
                  }}
                  className="rounded-full border border-[#EADFCF] bg-white px-5 py-3 text-sm font-bold text-[#7D756E]"
                >
                  Retour
                </button>

                <button
                  type="button"
                  onClick={closeWizard}
                  className="rounded-full px-5 py-3 text-sm font-bold text-[#7D756E] transition hover:bg-[#F8F3EA]"
                >
                  Annuler
                </button>
              </div>
            ) : null}
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
              const visibleSectionDetails = sectionDetails.slice(0, 4);
              const hiddenSectionCount = Math.max(
                sectionDetails.length - 4,
                0
              );
              const childrenNames =
                (share.children || []).map((child) => child.name).join(", ") ||
                "Non précisé";

              return (
                <div
                  key={share.id}
                  className="overflow-hidden rounded-[2rem] border border-[#EADFCF] bg-[#FFFDF8] shadow-sm transition hover:shadow-md"
                >
                  <div className="p-4 md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-[#4F4A45]">
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

                        <p className="mt-1 break-all text-sm font-semibold text-[#6F785F]">
                          {share.inviteeEmail}
                        </p>

                        <p className="mt-3 text-sm leading-6 text-[#6B625A]">
                          <span className="font-bold text-[#4F4A45]">
                            Enfant(s) :
                          </span>{" "}
                          {childrenNames}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {visibleSectionDetails.map((detail) => (
                            <span
                              key={detail.id}
                              className="rounded-full border border-[#EADFCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B625A]"
                            >
                              {detail.title}
                            </span>
                          ))}

                          {hiddenSectionCount > 0 ? (
                            <span className="rounded-full bg-[#F3F0E8] px-3 py-1.5 text-xs font-bold text-[#8B8278]">
                              + {hiddenSectionCount} section(s)
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditWizard(share)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2.5 text-xs font-bold text-[#6B625A] transition hover:bg-[#F8F3EA]"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedShareId((current) =>
                              current === share.id ? "" : share.id
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2.5 text-xs font-bold text-[#6B625A] transition hover:bg-[#F8F3EA]"
                        >
                          Détails
                          <ChevronDown
                            className={`h-4 w-4 transition ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="border-t border-[#EADFCF] bg-white/60 p-4 md:p-5">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-3 ring-1 ring-[#F0E6D8]">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                            Création
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#4F4A45]">
                            {formatDate(share.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-[#F0E6D8]">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                            Expiration
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#4F4A45]">
                            {formatDateTime(share.expiresAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-[#F0E6D8]">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                            Courriel
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#4F4A45]">
                            {share.emailStatus === "sent"
                              ? "Envoyé"
                              : share.emailStatus === "failed"
                                ? "Échec"
                                : "En attente"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-[#F0E6D8] md:col-span-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8B193]">
                            Code utilisateur invité
                          </p>
                          <p className="mt-1 break-all text-sm font-black text-[#4F4A45]">
                            {share.guestAccessCode || "Non disponible"}
                          </p>
                          <p className="mt-1 text-xs text-[#8B8278]">
                            Ce code est unique et associé au courriel {share.inviteeEmail}.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-bold text-[#4F4A45]">
                          Sections et permissions
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

                      <div className="mt-5 flex flex-wrap gap-2">
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
                          onClick={() => copyGuestCode(share)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#7D756E]"
                        >
                          <Copy className="h-4 w-4" />
                          Copier le code
                        </button>

                        <button
                          type="button"
                          onClick={() => resendEmail(share.id)}
                          disabled={actionLoadingId === `resend-${share.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          Renvoyer
                        </button>

                        <button
                          type="button"
                          onClick={() => revokeShare(share.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F1C9C9] bg-white px-4 py-2 text-xs font-bold text-[#B9544A]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Retirer
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