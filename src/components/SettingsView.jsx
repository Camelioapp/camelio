import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Cookie,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Grid2X2,
  LogOut,
  Palette,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { SectionTitle, Field, InfoBox } from "./shared";
import { sections } from "./sectionsData";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]";

const APP_VERSION = "1.0.0";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const themeChoices = [
  {
    id: "rose",
    label: "Rose",
    bgColor: "#fff3f6",
    borderColor: "#f4c9d5",
    iconColor: "#e99aaa",
  },
  {
    id: "peche",
    label: "Pêche",
    bgColor: "#fff4f0",
    borderColor: "#efcabc",
    iconColor: "#df9f8a",
  },
  {
    id: "sage",
    label: "Sauge",
    bgColor: "#f7fbf3",
    borderColor: "#d8e6ca",
    iconColor: "#a8b58f",
  },
  {
    id: "vert",
    label: "Vert",
    bgColor: "#f4fbf8",
    borderColor: "#c8e4d8",
    iconColor: "#8fbfa8",
  },
  {
    id: "bleu",
    label: "Bleu",
    bgColor: "#f1f7ff",
    borderColor: "#c6daf4",
    iconColor: "#9ebbe1",
  },
  {
    id: "mauve",
    label: "Mauve",
    bgColor: "#f7f3ff",
    borderColor: "#d9cdf4",
    iconColor: "#ad9bcf",
  },
  {
    id: "dore",
    label: "Doré",
    bgColor: "#fff9ef",
    borderColor: "#ead7b8",
    iconColor: "#d8b77f",
  },
];

const privacyItems = [
  {
    id: "privacy",
    title: "Politique de confidentialité",
    description:
      "Consulter les informations sur la collecte, l’utilisation et la conservation des données.",
    icon: ShieldCheck,
    actionLabel: "Consulter",
    type: "pdf",
    path: "/politique-confidentialite-camelio.pdf",
  },
  {
    id: "terms",
    title: "Conditions d’utilisation",
    description:
      "Voir les règles d’utilisation de l’application et les responsabilités de l’utilisateur.",
    icon: FileText,
    actionLabel: "Consulter",
    type: "pdf",
    path: "/conditions-utilisation-camelio.pdf",
  },
  {
    id: "cookies",
    title: "Gestion des cookies",
    description:
      "Accepter, refuser ou modifier les préférences liées aux témoins.",
    icon: Cookie,
    actionLabel: "Gérer",
    type: "cookies",
  },
];

function hexFromClass(className = "", fallback = "#a8aa91") {
  const match = className.match(/#([0-9a-fA-F]{6})/);
  return match ? `#${match[1]}` : fallback;
}

function getBaseTheme(section) {
  return {
    bgColor: hexFromClass(section.bg, "#fffdf8"),
    borderColor: hexFromClass(section.border, "#eadfcf"),
    iconColor: hexFromClass(section.iconBg, "#a8aa91"),
  };
}

function DropdownSection({
  id,
  title,
  description,
  icon: Icon,
  iconColor = "#A8AA91",
  openSection,
  setOpenSection,
  children,
}) {
  const isOpen = openSection === id;

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#EFE4D6]">
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? null : id)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[#FFFDF8]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: iconColor }}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-[#55534C]">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              {description}
            </p>
          </div>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF8EC] text-[#746F64] ring-1 ring-[#EFE4D6] transition ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-[#EFE4D6] p-5">{children}</div>
      )}
    </section>
  );
}

export default function SettingsView({
  parentProfile = { name: "", email: "", phone: "", userId: "" },
  setParentProfile = () => {},
  sectionOrderIds,
  setSectionOrderIds,
  sectionThemeOverrides = {},
  setSectionThemeOverrides = () => {},
  defaultSectionOrder,
}) {
  const [openedSectionId, setOpenedSectionId] = useState(null);
  const [openMainSection, setOpenMainSection] = useState("profile");
  const [pdfModal, setPdfModal] = useState(null);
  const [showCookieModal, setShowCookieModal] = useState(false);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] =
    useState("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  const displayedUserId = useMemo(() => {
    const cleanUserId = String(parentProfile.userId || "")
      .replace(/\D/g, "")
      .slice(0, 7);

    return cleanUserId || "Non disponible";
  }, [parentProfile.userId]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Non applicable";

    try {
      return new Intl.DateTimeFormat("fr-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateValue));
    } catch (error) {
      return "Date invalide";
    }
  };

  const getDefaultTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  };

  const [subscription, setSubscription] = useState(() => {
    try {
      const savedSubscription = localStorage.getItem(
        "camelio_subscription_status"
      );

      if (savedSubscription) return JSON.parse(savedSubscription);
    } catch (error) {
      console.error("Erreur lecture abonnement:", error);
    }

    const trialEndDate = getDefaultTrialEndDate();

    return {
      planName: "Camelio Famille",
      subscriptionId: "trial_local",
      stripeSubscriptionId: "",
      status: "trialing",
      billingType: "free_trial",
      amountLabel: "Aucun paiement pendant l’essai gratuit",
      trialEndDate,
      nextPaymentDate: trialEndDate,
      cancelAtPeriodEnd: false,
      cancelEffectiveDate: null,
    };
  });

  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [subscriptionActionLoading, setSubscriptionActionLoading] =
    useState(false);

  const [cookiePreferences, setCookiePreferences] = useState(() => {
    try {
      const saved = localStorage.getItem("camelio_cookie_preferences");
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error("Erreur lecture préférences cookies:", error);
    }

    return {
      essential: true,
      analytics: false,
      preferences: false,
    };
  });

  const manageableSections = useMemo(() => {
    return sections.filter((section) => section.id !== "settings");
  }, []);

  const allSectionIds = useMemo(() => {
    return defaultSectionOrder?.length
      ? defaultSectionOrder
      : manageableSections.map((section) => section.id);
  }, [defaultSectionOrder, manageableSections]);

  const visibleSectionIds = useMemo(() => {
    if (Array.isArray(sectionOrderIds)) {
      return sectionOrderIds.filter((id) => allSectionIds.includes(id));
    }

    return allSectionIds;
  }, [sectionOrderIds, allSectionIds]);

  const orderedSections = useMemo(() => {
    const visible = visibleSectionIds
      .map((id) => manageableSections.find((section) => section.id === id))
      .filter(Boolean);

    const hidden = manageableSections.filter(
      (section) => !visibleSectionIds.includes(section.id)
    );

    return [...visible, ...hidden];
  }, [visibleSectionIds, manageableSections]);

  const saveSubscription = (updatedSubscription) => {
    setSubscription(updatedSubscription);
    localStorage.setItem(
      "camelio_subscription_status",
      JSON.stringify(updatedSubscription)
    );
  };

  const getSubscriptionStatusLabel = () => {
    if (subscription.cancelAtPeriodEnd) {
      return "Annulation programmée";
    }

    if (subscription.status === "trialing") {
      return "Essai gratuit actif";
    }

    if (subscription.status === "active") {
      return "Abonnement payant actif";
    }

    if (subscription.status === "canceled") {
      return "Abonnement annulé";
    }

    return "Statut inconnu";
  };

  const getSubscriptionStatusClass = () => {
    if (subscription.cancelAtPeriodEnd) {
      return "bg-[#FFF1D8] text-[#9A6A1F] ring-[#E8C98F]";
    }

    if (subscription.status === "active") {
      return "bg-[#E8F3E3] text-[#4F6B42] ring-[#C9DFC0]";
    }

    if (subscription.status === "trialing") {
      return "bg-[#EEF3FF] text-[#536B9C] ring-[#CAD8F4]";
    }

    return "bg-[#F8E1E1] text-[#9A4F4F] ring-[#E8B8B8]";
  };

  const handleCancelSubscription = () => {
    if (subscription.cancelAtPeriodEnd) return;

    const effectiveDate =
      subscription.trialEndDate || subscription.nextPaymentDate || null;

    const updatedSubscription = {
      ...subscription,
      cancelAtPeriodEnd: true,
      cancelEffectiveDate: effectiveDate,
    };

    saveSubscription(updatedSubscription);

    setSubscriptionMessage(
      "Votre abonnement est maintenant programmé pour prendre fin à la fin de la période gratuite."
    );
  };

  const startPaidSubscription = async () => {
    try {
      setSubscriptionActionLoading(true);
      setSubscriptionMessage("");

      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lookup_key: "camelio_monthly_595",
          trial: false,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Impossible de créer la session de paiement."
        );
      }

      if (!data.url) {
        throw new Error("Aucune URL Stripe reçue.");
      }

      window.location.href = data.url;
    } catch (error) {
      setSubscriptionMessage(
        error.message || "Une erreur est survenue lors du renouvellement."
      );
    } finally {
      setSubscriptionActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteAccountLoading(true);
      setDeleteAccountError("");

      const response = await fetch(`${API_BASE_URL}/api/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          confirmation: deleteAccountConfirmation,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Impossible de supprimer le compte."
        );
      }

      localStorage.removeItem("camelio_subscription_status");
      localStorage.removeItem("camelio_cookie_preferences");

      window.location.href = data.redirectUrl || "https://camelio.app";
    } catch (error) {
      setDeleteAccountError(
        error.message || "Une erreur est survenue lors de la suppression."
      );
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const moveSection = (sectionId, direction) => {
    if (!setSectionOrderIds) return;

    const currentIndex = visibleSectionIds.indexOf(sectionId);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= visibleSectionIds.length) return;

    const updated = [...visibleSectionIds];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(nextIndex, 0, moved);

    setSectionOrderIds(updated);
  };

  const hideSection = (sectionId) => {
    if (!setSectionOrderIds) return;
    setSectionOrderIds((current) => current.filter((id) => id !== sectionId));
  };

  const showSection = (sectionId) => {
    if (!setSectionOrderIds) return;

    setSectionOrderIds((current) => {
      if (current.includes(sectionId)) return current;
      return [...current, sectionId];
    });
  };

  const changeSectionTheme = (sectionId, theme) => {
    setSectionThemeOverrides((current) => ({
      ...current,
      [sectionId]: {
        bgColor: theme.bgColor,
        borderColor: theme.borderColor,
        iconColor: theme.iconColor,
      },
    }));
  };

  const resetSectionTheme = (sectionId) => {
    setSectionThemeOverrides((current) => {
      const updated = { ...current };
      delete updated[sectionId];
      return updated;
    });
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;
  };

  const handlePrivacyAction = (item) => {
    if (item.type === "pdf") {
      setPdfModal({
        title: item.title,
        path: item.path,
      });
      return;
    }

    if (item.type === "cookies") {
      setShowCookieModal(true);
    }
  };

  const saveCookiePreferences = (preferences) => {
    setCookiePreferences(preferences);

    localStorage.setItem(
      "camelio_cookie_preferences",
      JSON.stringify({
        ...preferences,
        savedAt: new Date().toISOString(),
      })
    );

    setShowCookieModal(false);
  };

  const acceptAllCookies = () => {
    saveCookiePreferences({
      essential: true,
      analytics: true,
      preferences: true,
    });
  };

  const refuseOptionalCookies = () => {
    saveCookiePreferences({
      essential: true,
      analytics: false,
      preferences: false,
    });
  };

  const saveCustomCookies = () => {
    saveCookiePreferences(cookiePreferences);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Paramètres"
        subtitle="Profil parent, sections, confidentialité, abonnement et version de l’application."
        icon={Settings}
      />

      <DropdownSection
        id="profile"
        title="Profil principal parent"
        description="Informations du compte principal."
        icon={UserRound}
        iconColor="#55534C"
        openSection={openMainSection}
        setOpenSection={setOpenMainSection}
      >
        <div className="space-y-5">
          <Field label="User ID">
            <input
              className={`${inputClass} cursor-not-allowed bg-[#F7F2EA] font-bold text-[#55534C]`}
              value={displayedUserId}
              readOnly
              placeholder="Non disponible"
            />

            <p className="mt-2 text-xs leading-relaxed text-[#8A8378]">
              Ce numéro provient du profil enregistré dans DynamoDB.
            </p>
          </Field>

          <Field label="Nom complet">
            <input
              className={inputClass}
              value={parentProfile.name}
              onChange={(event) =>
                setParentProfile({
                  ...parentProfile,
                  name: event.target.value,
                })
              }
              placeholder="Ex. John Doe"
            />
          </Field>

          <Field label="Courriel">
            <input
              type="email"
              className={`${inputClass} cursor-not-allowed bg-[#F7F2EA] font-bold text-[#55534C]`}
              value={parentProfile.email || "Non disponible"}
              readOnly
              placeholder="Non disponible"
            />

            <p className="mt-2 text-xs leading-relaxed text-[#8A8378]">
              Ce courriel est lié au compte de connexion et ne peut pas être
              modifié ici.
            </p>
          </Field>

          <Field label="Téléphone">
            <input
              type="tel"
              className={inputClass}
              value={parentProfile.phone}
              onChange={(event) =>
                setParentProfile({
                  ...parentProfile,
                  phone: event.target.value,
                })
              }
              placeholder="Ex. 514 555-1234"
            />
          </Field>
        </div>
      </DropdownSection>

      <DropdownSection
        id="sections"
        title="Personnaliser les sections"
        description="Modifier l’ordre, les couleurs et la visibilité du dashboard."
        icon={SlidersHorizontal}
        iconColor="#A8AA91"
        openSection={openMainSection}
        setOpenSection={setOpenMainSection}
      >
        <div className="space-y-3">
          {orderedSections.map((section) => {
            const Icon = section.icon;
            const isVisible = visibleSectionIds.includes(section.id);
            const isOpen = openedSectionId === section.id;
            const visibleIndex = visibleSectionIds.indexOf(section.id);
            const baseTheme = getBaseTheme(section);
            const activeTheme = sectionThemeOverrides[section.id] || baseTheme;

            return (
              <div
                key={section.id}
                className={`rounded-[1.5rem] border transition ${
                  isOpen ? "shadow-sm" : ""
                } ${!isVisible ? "opacity-60" : ""}`}
                style={{
                  backgroundColor: activeTheme.bgColor,
                  borderColor: activeTheme.borderColor,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenedSectionId(isOpen ? null : section.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: activeTheme.iconColor }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#55534C]">
                      {section.title}
                    </p>

                    <p className="text-xs text-[#746F64]">
                      {isVisible
                        ? `Position ${visibleIndex + 1}`
                        : "Masquée du dashboard"}
                    </p>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#746F64] ring-1 ring-white/70 transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    className="border-t p-4"
                    style={{ borderColor: activeTheme.borderColor }}
                  >
                    <div className="grid gap-3 md:grid-cols-3">
                      <button
                        type="button"
                        disabled={!isVisible || visibleIndex === 0}
                        onClick={() => moveSection(section.id, -1)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-[#55534C] ring-1 ring-white/70 transition hover:bg-white disabled:opacity-40"
                      >
                        <ArrowUp className="h-4 w-4" />
                        Monter
                      </button>

                      <button
                        type="button"
                        disabled={
                          !isVisible ||
                          visibleIndex === visibleSectionIds.length - 1
                        }
                        onClick={() => moveSection(section.id, 1)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-[#55534C] ring-1 ring-white/70 transition hover:bg-white disabled:opacity-40"
                      >
                        <ArrowDown className="h-4 w-4" />
                        Descendre
                      </button>

                      {isVisible ? (
                        <button
                          type="button"
                          onClick={() => hideSection(section.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-[#B86C6C] ring-1 ring-white/70 transition hover:bg-white"
                        >
                          <EyeOff className="h-4 w-4" />
                          Masquer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => showSection(section.id)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-[#7A8B69] ring-1 ring-white/70 transition hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                          Afficher
                        </button>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-[#746F64]" />

                        <p className="text-sm font-bold text-[#55534C]">
                          Couleur de la section
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {themeChoices.map((theme) => {
                          const selected =
                            activeTheme.iconColor === theme.iconColor;

                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() =>
                                changeSectionTheme(section.id, theme)
                              }
                              className={`flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-[#55534C] transition hover:scale-105 ${
                                selected
                                  ? "ring-2 ring-[#55534C]"
                                  : "ring-1 ring-white/70"
                              }`}
                            >
                              <span
                                className="h-5 w-5 rounded-full"
                                style={{ backgroundColor: theme.iconColor }}
                              />
                              {theme.label}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => resetSectionTheme(section.id)}
                        className="mt-3 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-[#746F64] transition hover:bg-white"
                      >
                        <Grid2X2 className="h-4 w-4" />
                        Réinitialiser la couleur
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DropdownSection>

      <DropdownSection
        id="privacy"
        title="Confidentialité et sécurité"
        description="Documents légaux et préférences de confidentialité."
        icon={ShieldCheck}
        iconColor="#8EA79B"
        openSection={openMainSection}
        setOpenSection={setOpenMainSection}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {privacyItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-[#EFE4D6] bg-[#FFFDF8] p-4 transition hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#A8AA91] text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[#55534C]">{item.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-[#746F64]">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrivacyAction(item)}
                  className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#55534C] ring-1 ring-[#EFE4D6] transition hover:bg-[#FFF7EA]"
                >
                  {item.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </DropdownSection>

      <DropdownSection
        id="subscription"
        title="Abonnement"
        description="Plan actuel, période gratuite, paiement et annulation."
        icon={CreditCard}
        iconColor="#EEC988"
        openSection={openMainSection}
        setOpenSection={setOpenMainSection}
      >
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-[#EFE4D6] bg-[#FFFDF8] p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8A096]">
                  Abonnement actuel
                </p>

                <h3 className="mt-2 text-xl font-bold text-[#3F3D38]">
                  {subscription.planName || "Camelio Famille"}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#746F64]">
                  Consultez les informations de votre abonnement, la date de fin
                  de l’essai gratuit et le prochain paiement prévu.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-xs font-bold ring-1 ${getSubscriptionStatusClass()}`}
              >
                {getSubscriptionStatusLabel()}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoBox
                label="Type d’abonnement"
                value={
                  subscription.billingType === "free_trial"
                    ? "Essai gratuit"
                    : "Abonnement payant"
                }
              />

              <InfoBox
                label="Date de fin de l’essai gratuit"
                value={
                  subscription.billingType === "free_trial"
                    ? formatDate(subscription.trialEndDate)
                    : "Non applicable"
                }
              />

              <InfoBox
                label="Date du prochain paiement"
                value={
                  subscription.cancelAtPeriodEnd
                    ? "Aucun paiement prévu après l’annulation"
                    : formatDate(subscription.nextPaymentDate)
                }
              />

              <InfoBox
                label="Fin prévue de l’abonnement"
                value={
                  subscription.cancelAtPeriodEnd
                    ? formatDate(subscription.cancelEffectiveDate)
                    : "Non programmée"
                }
              />
            </div>

            {subscription.cancelAtPeriodEnd ? (
              <div className="mt-5 rounded-[1.5rem] border border-[#E8C98F] bg-[#FFF8EA] p-4">
                <p className="font-bold text-[#7A5A24]">
                  Annulation programmée
                </p>

                <p className="mt-1 text-sm leading-relaxed text-[#7A5A24]">
                  Votre abonnement restera actif jusqu’au{" "}
                  {formatDate(subscription.cancelEffectiveDate)}. Aucun paiement
                  ne sera prélevé après cette date.
                </p>

                <div className="mt-4 rounded-[1.5rem] border border-[#D8E6CA] bg-white p-4">
                  <p className="font-bold text-[#3F3D38]">
                    Renouveler l’abonnement
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-[#746F64]">
                    Vous pouvez renouveler votre abonnement maintenant pour
                    continuer à utiliser Camelio après la fin de votre période
                    gratuite.
                  </p>

                  <button
                    type="button"
                    onClick={startPaidSubscription}
                    disabled={subscriptionActionLoading}
                    className="mt-4 w-full rounded-2xl bg-[#8FA173] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#7F9166] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {subscriptionActionLoading
                      ? "Redirection vers le paiement..."
                      : "Payer et renouveler mon abonnement"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-[#E8D8BE] bg-white p-4">
                <p className="font-bold text-[#3F3D38]">
                  Annuler l’abonnement
                </p>

                <p className="mt-1 text-sm leading-relaxed text-[#746F64]">
                  Si vous annulez pendant l’essai gratuit, l’accès restera actif
                  jusqu’à la fin de la période gratuite. L’abonnement prendra
                  ensuite fin automatiquement.
                </p>

                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="mt-4 w-full rounded-2xl bg-[#C96F6F] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B85F5F]"
                >
                  Annuler mon abonnement
                </button>
              </div>
            )}

            {subscriptionMessage && (
              <div className="mt-4 rounded-2xl bg-[#E8F3E3] px-4 py-3 text-sm font-bold text-[#4F6B42] ring-1 ring-[#C9DFC0]">
                {subscriptionMessage}
              </div>
            )}
          </div>
        </div>
      </DropdownSection>

      <DropdownSection
        id="account"
        title="Compte"
        description="Options du compte, déconnexion et suppression."
        icon={LogOut}
        iconColor="#C96F6F"
        openSection={openMainSection}
        setOpenSection={setOpenMainSection}
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C96F6F] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B85F5F]"
          >
            <LogOut className="h-5 w-5" />
            Se déconnecter
          </button>

          <div className="rounded-[1.5rem] border border-[#E8B8B8] bg-[#FFF8F8] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#A94444] text-white">
                <Trash2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#8F4F4F]">
                  Supprimer le compte
                </p>

                <p className="mt-1 text-sm leading-relaxed text-[#8F4F4F]">
                  Cette action supprimera les données associées au compte dans
                  DynamoDB, les fichiers dans S3 et le compte de connexion
                  Cognito. Cette action est définitive.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteAccountConfirmation("");
                setDeleteAccountError("");
                setShowDeleteAccountModal(true);
              }}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[#A94444] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#923A3A]"
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </DropdownSection>

      <div className="pb-5 text-center">
        <p className="text-xs font-bold text-[#A8A096]">
          Version de l’application {APP_VERSION}
        </p>
      </div>

      {pdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EFE4D6] p-4">
              <div>
                <h3 className="font-bold text-[#55534C]">{pdfModal.title}</h3>
                <p className="text-sm text-[#746F64]">
                  Document légal Camelio
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPdfModal(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF7EA] text-[#55534C] ring-1 ring-[#EFE4D6] transition hover:bg-[#F8EBD8]"
                aria-label="Fermer le document"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <iframe
              src={pdfModal.path}
              title={pdfModal.title}
              className="h-full w-full bg-[#F8F3EA]"
            />
          </div>
        </div>
      )}

      {showCookieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-[#EFE4D6]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7F9275] text-white shadow-sm">
                  <Cookie className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#3F3D38]">
                    Gestion des cookies
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5F5A50]">
                    Camelio utilise des cookies essentiels au fonctionnement de
                    l’application. Vous pouvez aussi accepter ou refuser les
                    cookies optionnels.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCookieModal(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF4E4] text-[#3F3D38] ring-1 ring-[#E8D8BE] transition hover:bg-[#F4DFC0]"
                aria-label="Fermer la gestion des cookies"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-[#D8C8AF] bg-[#FFFDF8] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-[#3F3D38]">
                      Cookies essentiels
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5F5A50]">
                      Nécessaires pour la connexion, la sécurité et le bon
                      fonctionnement de l’application.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#DDE8D6] px-4 py-2 text-xs font-bold text-[#4F6B42]">
                    Toujours actifs
                  </span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#D8C8AF] bg-[#FFFDF8] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-[#3F3D38]">
                      Cookies d’analyse
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5F5A50]">
                      Aident à comprendre l’utilisation de l’application afin
                      d’améliorer l’expérience.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCookiePreferences((current) => ({
                        ...current,
                        analytics: !current.analytics,
                      }))
                    }
                    className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                      cookiePreferences.analytics
                        ? "bg-[#5F7F52]"
                        : "bg-[#B9B2A5]"
                    }`}
                    aria-label="Activer ou désactiver les cookies d’analyse"
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition ${
                        cookiePreferences.analytics ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <p
                  className={`mt-3 text-xs font-bold ${
                    cookiePreferences.analytics
                      ? "text-[#5F7F52]"
                      : "text-[#8A6F5A]"
                  }`}
                >
                  {cookiePreferences.analytics ? "Activés" : "Désactivés"}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[#D8C8AF] bg-[#FFFDF8] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-[#3F3D38]">
                      Cookies de préférences
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5F5A50]">
                      Permettent de mémoriser certains choix d’affichage et de
                      personnalisation.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCookiePreferences((current) => ({
                        ...current,
                        preferences: !current.preferences,
                      }))
                    }
                    className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                      cookiePreferences.preferences
                        ? "bg-[#5F7F52]"
                        : "bg-[#B9B2A5]"
                    }`}
                    aria-label="Activer ou désactiver les cookies de préférences"
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition ${
                        cookiePreferences.preferences ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <p
                  className={`mt-3 text-xs font-bold ${
                    cookiePreferences.preferences
                      ? "text-[#5F7F52]"
                      : "text-[#8A6F5A]"
                  }`}
                >
                  {cookiePreferences.preferences ? "Activés" : "Désactivés"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={acceptAllCookies}
                className="rounded-2xl bg-[#5F7F52] px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#4E6D43]"
              >
                Tout accepter
              </button>

              <button
                type="button"
                onClick={saveCustomCookies}
                className="rounded-2xl bg-[#EEC988] px-4 py-4 text-sm font-bold text-[#3F3D38] shadow-sm transition hover:bg-[#E4BB72]"
              >
                Enregistrer mes choix
              </button>

              <button
                type="button"
                onClick={refuseOptionalCookies}
                className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-[#3F3D38] ring-1 ring-[#D8C8AF] transition hover:bg-[#FFF4E4]"
              >
                Refuser les cookies optionnels
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-[#EFE4D6]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#8F4F4F]">
                  Supprimer le compte
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#5F5A50]">
                  Cette action est permanente. Elle supprimera les informations
                  du compte dans DynamoDB, les fichiers liés dans S3 et le compte
                  Cognito utilisé pour la connexion.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deleteAccountLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4E4] text-[#3F3D38] ring-1 ring-[#E8D8BE] transition hover:bg-[#F4DFC0] disabled:opacity-50"
                aria-label="Fermer la suppression du compte"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-[#E8B8B8] bg-[#FFF8F8] p-4">
              <p className="text-sm font-bold text-[#8F4F4F]">
                Pour confirmer, inscrivez exactement :
              </p>

              <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-[#8F4F4F] ring-1 ring-[#E8B8B8]">
                supprimer
              </p>

              <input
                className={inputClass}
                value={deleteAccountConfirmation}
                onChange={(event) =>
                  setDeleteAccountConfirmation(event.target.value)
                }
                placeholder="Inscrire supprimer"
                disabled={deleteAccountLoading}
              />

              {deleteAccountError && (
                <p className="mt-3 rounded-2xl bg-[#F8E1E1] px-4 py-3 text-sm font-bold text-[#9A4F4F] ring-1 ring-[#E8B8B8]">
                  {deleteAccountError}
                </p>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={deleteAccountLoading}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#3F3D38] ring-1 ring-[#D8C8AF] transition hover:bg-[#FFF4E4] disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteAccountLoading ||
                    deleteAccountConfirmation.trim().toLowerCase() !==
                      "supprimer"
                  }
                  className="rounded-2xl bg-[#A94444] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#923A3A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteAccountLoading
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