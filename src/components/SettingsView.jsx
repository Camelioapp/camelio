import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  EyeOff,
  GripVertical,
  LogOut,
  Palette,
  RotateCcw,
  Settings,
  UserRound,
} from "lucide-react";

import { SectionTitle, Field, InfoBox } from "./shared";
import { sections, sectionThemes, getSectionTheme } from "./sectionsData.js";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]";

const APP_VERSION = "1.0.0";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

function SectionOrderItem({
  section,
  index,
  total,
  moveSection,
  removeSection,
  sectionThemeOverrides,
  setSectionThemeOverrides,
}) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const Icon = section.icon;
  const theme = getSectionTheme(section, sectionThemeOverrides);

  const selectedThemeKey =
    sectionThemeOverrides[section.id] || section.defaultTheme || "gray";

  const changeTheme = (themeKey) => {
    setSectionThemeOverrides((current) => ({
      ...current,
      [section.id]: themeKey,
    }));

    setIsColorPickerOpen(false);
  };

  return (
    <div
      className="relative rounded-2xl border p-3 shadow-sm"
      style={{
        backgroundColor: theme.bgColor,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 shrink-0 text-[#B8B0A3]" />

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: theme.iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#55534C]">{section.title}</p>
          <p className="text-xs text-[#746F64]">Position {index + 1}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setIsColorPickerOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#746F64] ring-1 ring-[#EFE4D6]"
            title="Changer la couleur"
          >
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: theme.iconColor }}
            />
          </button>

          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveSection(index, index - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => moveSection(index, index + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-40"
          >
            <ArrowDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => removeSection(section.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#C96F6F] ring-1 ring-[#F2CACA]"
            title="Masquer cette section"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isColorPickerOpen && (
        <div className="absolute right-3 top-14 z-20 w-64 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-[#EFE4D6]">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#55534C]">
            <Palette className="h-4 w-4" />
            Choisir une couleur
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Object.entries(sectionThemes).map(([themeKey, themeValue]) => (
              <button
                key={themeKey}
                type="button"
                onClick={() => changeTheme(themeKey)}
                className={`h-9 rounded-full border-2 transition hover:scale-105 ${
                  selectedThemeKey === themeKey
                    ? "border-[#55534C]"
                    : "border-[#EFE4D6]"
                }`}
                style={{ backgroundColor: themeValue.iconColor }}
                title={themeValue.label}
                aria-label={`Couleur ${themeValue.label}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsView({
  parentProfile,
  setParentProfile,
  sectionOrderIds,
  setSectionOrderIds,
  sectionThemeOverrides,
  setSectionThemeOverrides,
}) {
  const availableSections = sections.filter(
    (section) => section.id !== "settings"
  );

  const orderedSections = sectionOrderIds
    .map((id) => availableSections.find((section) => section.id === id))
    .filter(Boolean);

  const hiddenSections = availableSections.filter(
    (section) => !sectionOrderIds.includes(section.id)
  );

  const moveSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= orderedSections.length) return;

    const updated = [...sectionOrderIds];
    const [movedSection] = updated.splice(fromIndex, 1);

    updated.splice(toIndex, 0, movedSection);

    setSectionOrderIds(updated);
  };

  const removeSection = (sectionId) => {
    setSectionOrderIds((current) => current.filter((id) => id !== sectionId));
  };

  const restoreSection = (sectionId) => {
    setSectionOrderIds((current) => {
      if (current.includes(sectionId)) return current;
      return [...current, sectionId];
    });
  };

  const resetSections = () => {
    setSectionOrderIds(availableSections.map((section) => section.id));
    setSectionThemeOverrides({});
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Paramètres"
        subtitle="Profil parent, personnalisation des sections, couleurs, abonnement et version de l’application."
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
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#55534C]">
              Personnaliser les sections
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Changez l’ordre, la couleur ou masquez les sections affichées sur
              le Dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={resetSections}
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#FFFDF8] px-3 py-2 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>

        <div className="space-y-3">
          {orderedSections.map((section, index) => (
            <SectionOrderItem
              key={section.id}
              section={section}
              index={index}
              total={orderedSections.length}
              moveSection={moveSection}
              removeSection={removeSection}
              sectionThemeOverrides={sectionThemeOverrides}
              setSectionThemeOverrides={setSectionThemeOverrides}
            />
          ))}
        </div>

        {hiddenSections.length > 0 && (
          <div className="mt-6 rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
            <h4 className="font-bold text-[#55534C]">Sections masquées</h4>

            <div className="mt-3 flex flex-wrap gap-2">
              {hiddenSections.map((section) => {
                const Icon = section.icon;
                const theme = getSectionTheme(section, sectionThemeOverrides);

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => restoreSection(section.id)}
                    className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-[#55534C] ring-1 ring-[#EFE4D6]"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: theme.iconColor }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    Réactiver {section.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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