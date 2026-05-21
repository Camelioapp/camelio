import React from "react";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  GripVertical,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import { SectionTitle, Field, InfoBox } from "./shared";
import { sections } from "./sectionsData.js";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]";

const APP_VERSION = "1.0.0";
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

function SectionOrderItem({ section, index, total, moveSection }) {
  const Icon = section.icon;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]">
      <GripVertical className="h-5 w-5 shrink-0 text-[#B8B0A3]" />

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          section.iconBg || "bg-[#A8AA91]"
        } text-white`}
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
      </div>
    </div>
  );
}

export default function SettingsView({
  parentProfile,
  setParentProfile,
  sectionOrderIds,
  setSectionOrderIds,
}) {
  const orderedSections = sectionOrderIds
    .map((id) => sections.find((section) => section.id === id))
    .filter((section) => section && section.id !== "settings");

  const moveSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= orderedSections.length) return;

    const visibleSectionIds = orderedSections.map((section) => section.id);
    const [movedSection] = visibleSectionIds.splice(fromIndex, 1);

    visibleSectionIds.splice(toIndex, 0, movedSection);

    const finalOrder = [
      ...visibleSectionIds,
      ...sectionOrderIds.filter(
        (id) => !visibleSectionIds.includes(id) && id === "settings"
      ),
    ];

    setSectionOrderIds(finalOrder);
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Paramètres"
        subtitle="Profil parent, personnalisation des sections, abonnement et version de l’application."
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
        <div className="mb-5">
          <h3 className="font-bold text-[#55534C]">
            Personnaliser l’ordre des sections
          </h3>

          <p className="mt-1 text-sm leading-5 text-[#746F64]">
            Choisissez l’ordre d’affichage des sections, comme Profil enfant,
            Photos, Phrases mémorables, Calendrier ou Zone notes.
          </p>
        </div>

        <div className="space-y-3">
          {orderedSections.map((section, index) => (
            <SectionOrderItem
              key={section.id}
              section={section}
              index={index}
              total={orderedSections.length}
              moveSection={moveSection}
            />
          ))}
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