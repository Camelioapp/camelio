import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Cookie,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Grid2X2,
  LifeBuoy,
  LogOut,
  Mail,
  Palette,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
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
    path: "/privacy",
  },
  {
    id: "terms",
    title: "Conditions d’utilisation",
    description:
      "Voir les règles d’utilisation de l’application et les responsabilités de l’utilisateur.",
    icon: FileText,
    actionLabel: "Consulter",
    path: "/terms",
  },
  {
    id: "cookies",
    title: "Gestion des cookies",
    description:
      "Accepter, refuser ou modifier les préférences liées aux témoins.",
    icon: Cookie,
    actionLabel: "Gérer",
    path: "/cookies",
  },
  {
    id: "download",
    title: "Télécharger mes données",
    description:
      "Demander une copie des informations associées au compte.",
    icon: Download,
    actionLabel: "Demander",
    path: "/data-export",
  },
  {
    id: "delete",
    title: "Supprimer mon compte",
    description:
      "Demander la suppression du compte et des données associées.",
    icon: Trash2,
    actionLabel: "Supprimer",
    path: "/delete-account",
    danger: true,
  },
  {
    id: "contact",
    title: "Contact confidentialité",
    description:
      "Contacter la personne responsable de la protection des renseignements personnels.",
    icon: Mail,
    actionLabel: "Contacter",
    path: "mailto:info@camelio.app?subject=Confidentialité%20et%20données",
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

export default function SettingsView({
  parentProfile = { name: "", email: "", phone: "" },
  setParentProfile = () => {},
  sectionOrderIds,
  setSectionOrderIds,
  sectionThemeOverrides = {},
  setSectionThemeOverrides = () => {},
  defaultSectionOrder,
}) {
  const [openedSectionId, setOpenedSectionId] = useState(null);

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

    setSectionOrderIds((current) =>
      current.filter((id) => id !== sectionId)
    );
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
    if (item.path.startsWith("mailto:")) {
      window.location.href = item.path;
      return;
    }

    window.location.href = item.path;
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Paramètres"
        subtitle="Profil parent, sections, confidentialité, abonnement et version de l’application."
        icon={Settings}
      />

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#55534C] p-3 text-white">
            <UserRound className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-bold text-[#55534C]">
              Profil principal parent
            </h3>
            <p className="text-sm text-[#746F64]">
              Informations du compte principal.
            </p>
          </div>
        </div>

        <div className="space-y-5">
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
              className={inputClass}
              value={parentProfile.email}
              onChange={(event) =>
                setParentProfile({
                  ...parentProfile,
                  email: event.target.value,
                })
              }
              placeholder="Ex. nom@email.com"
            />
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
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#8EA79B] p-3 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-bold text-[#55534C]">
              Confidentialité et sécurité
            </h3>
            <p className="text-sm text-[#746F64]">
              Gérez vos préférences de confidentialité, vos consentements et vos données personnelles.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-[1.5rem] border border-[#DDE9E3] bg-[#F7FBF8] p-4">
          <div className="flex gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#8EA79B] text-white">
              <LifeBuoy className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-bold text-[#55534C]">
                Vos données restent sous votre contrôle.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#746F64]">
                Vous pouvez consulter les documents légaux, gérer vos préférences,
                demander une copie de vos données ou demander la suppression du compte.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {privacyItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`rounded-[1.5rem] border p-4 transition hover:shadow-sm ${
                  item.danger
                    ? "border-[#F0D2D2] bg-[#FFF8F8]"
                    : "border-[#EFE4D6] bg-[#FFFDF8]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${
                      item.danger ? "bg-[#C96F6F]" : "bg-[#A8AA91]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[#55534C]">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-[#746F64]">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrivacyAction(item)}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    item.danger
                      ? "bg-[#C96F6F] text-white hover:bg-[#B85F5F]"
                      : "bg-white text-[#55534C] ring-1 ring-[#EFE4D6] hover:bg-[#FFF7EA]"
                  }`}
                >
                  {item.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#A8AA91] p-3 text-white">
            <SlidersHorizontal className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-bold text-[#55534C]">
              Personnaliser les sections
            </h3>
            <p className="text-sm text-[#746F64]">
              Cliquez sur l’engrenage pour modifier une section.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {orderedSections.map((section) => {
            const Icon = section.icon;
            const isVisible = visibleSectionIds.includes(section.id);
            const isOpen = openedSectionId === section.id;
            const visibleIndex = visibleSectionIds.indexOf(section.id);
            const baseTheme = getBaseTheme(section);
            const activeTheme =
              sectionThemeOverrides[section.id] || baseTheme;

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
                <div className="flex items-center gap-3 p-3">
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

                  <button
                    type="button"
                    onClick={() =>
                      setOpenedSectionId(isOpen ? null : section.id)
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#746F64] ring-1 ring-white/70 transition hover:scale-105 hover:bg-white"
                    aria-label={`Options de ${section.title}`}
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>

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
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-[#EEC988] p-3 text-white">
            <CreditCard className="h-5 w-5" />
          </div>

          <h3 className="font-bold text-[#55534C]">Abonnement</h3>
        </div>

        <InfoBox label="Plan actuel" value="Gratuit" />
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C96F6F] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B85F5F]"
        >
          <LogOut className="h-5 w-5" />
          Se déconnecter
        </button>
      </div>

      <div className="pb-5 text-center">
        <p className="text-xs font-bold text-[#A8A096]">
          Version de l’application {APP_VERSION}
        </p>
      </div>
    </div>
  );
}