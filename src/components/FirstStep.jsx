import React, { useMemo, useState } from "react";
import { Check, ChevronRight, Heart, Plus, Sparkles, X } from "lucide-react";

const DEFAULT_SECTION_IDS = [
  "children",
  "calendar",
  "documents",
  "photos",
  "carnet-souvenirs",
  "memorable-phrases",
  "sante",
  "invoices",
  "calculator",
  "parental-plan",
  "notes",
];

const SECTION_OPTIONS = [
  { id: "children", label: "Profil enfant" },
  { id: "calendar", label: "Calendrier" },
  { id: "documents", label: "Documents" },
  { id: "photos", label: "Photos" },
  { id: "carnet-souvenirs", label: "Carnet souvenir" },
  { id: "memorable-phrases", label: "Phrases mémorables" },
  { id: "sante", label: "Médical" },
  { id: "invoices", label: "Factures/reçus" },
  { id: "calculator", label: "Calculateur de journées" },
  { id: "parental-plan", label: "Plan parental" },
  { id: "notes", label: "Notes" },
];

function createEmptyChild() {
  return {
    firstName: "",
    lastName: "",
    nickname: "",
    birthDate: "",
    gender: "",
    color: "sage",
  };
}

export default function FirstStep({ onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [children, setChildren] = useState([createEmptyChild()]);
  const [selectedSections, setSelectedSections] = useState(DEFAULT_SECTION_IDS);
  const [isSaving, setIsSaving] = useState(false);

  const hasAtLeastOneChild = useMemo(
    () => children.some((child) => child.firstName.trim()),
    [children]
  );

  function updateChild(index, field, value) {
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index ? { ...child, [field]: value } : child
      )
    );
  }

  function addChild() {
    setChildren((current) => [...current, createEmptyChild()]);
  }

  function removeChild(index) {
    setChildren((current) => {
      const next = current.filter((_, childIndex) => childIndex !== index);
      return next.length > 0 ? next : [createEmptyChild()];
    });
  }

  function toggleSection(sectionId) {
    if (sectionId === "children") return;

    setSelectedSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
    );
  }

  function buildSetupData(extra = {}) {
    const cleanChildren = children
      .map((child) => ({
        ...child,
        firstName: child.firstName.trim(),
        lastName: child.lastName.trim(),
        nickname: child.nickname.trim(),
      }))
      .filter((child) => child.firstName || child.nickname);

    const normalizedSections = Array.from(
      new Set(["children", ...selectedSections])
    );

    return {
      completedAt: new Date().toISOString(),
      children: cleanChildren,
      selectedSections: normalizedSections,
      hiddenSections: SECTION_OPTIONS.map((section) => section.id).filter(
        (sectionId) => !normalizedSections.includes(sectionId)
      ),
      ...extra,
    };
  }

  async function handleComplete() {
    setIsSaving(true);

    try {
      await onComplete?.(buildSetupData());
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkip() {
    setIsSaving(true);

    try {
      await onSkip?.(
        buildSetupData({
          skipped: true,
          children: [],
          selectedSections: DEFAULT_SECTION_IDS,
          hiddenSections: [],
        })
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#4F4A45]/35 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-[#EFE4D6] bg-[#FFFDF8] p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F7F3FF] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#8F7AB8]">
              <Sparkles className="h-3.5 w-3.5" /> Première configuration
            </p>
            <h2 className="text-2xl font-black text-[#4F4A45] sm:text-3xl">
              Préparons ton espace Camelio
            </h2>
            <p className="mt-2 text-sm font-medium text-[#8B8278]">
              Ajoute un enfant et choisis les sections à mettre de l’avant. Tu pourras tout modifier plus tard.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isSaving}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#8B8278] ring-1 ring-[#EFE4D6] transition hover:bg-[#F8F3EA] disabled:opacity-60"
          >
            Passer
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 text-sm font-bold text-[#746F64]">
          <div className={`rounded-2xl px-4 py-3 ${step === 1 ? "bg-[#EAF0E3] text-[#5F6F4F]" : "bg-[#F8F3EA]"}`}>
            1. Enfant
          </div>
          <div className={`rounded-2xl px-4 py-3 ${step === 2 ? "bg-[#EAF0E3] text-[#5F6F4F]" : "bg-[#F8F3EA]"}`}>
            2. Sections
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {children.map((child, index) => (
              <div key={index} className="rounded-[26px] border border-[#EFE4D6] bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[#4F4A45]">
                    <Heart className="h-4 w-4 text-[#EAA5AF]" /> Enfant {index + 1}
                  </div>
                  {children.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="rounded-full p-2 text-[#B56F78] transition hover:bg-[#FFF1F3]"
                      aria-label="Retirer cet enfant"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={child.firstName}
                    onChange={(event) => updateChild(index, "firstName", event.target.value)}
                    placeholder="Prénom"
                    className="rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
                  />
                  <input
                    value={child.lastName}
                    onChange={(event) => updateChild(index, "lastName", event.target.value)}
                    placeholder="Nom"
                    className="rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
                  />
                  <input
                    value={child.nickname}
                    onChange={(event) => updateChild(index, "nickname", event.target.value)}
                    placeholder="Surnom"
                    className="rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
                  />
                  <input
                    type="date"
                    value={child.birthDate}
                    onChange={(event) => updateChild(index, "birthDate", event.target.value)}
                    className="rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none focus:border-[#A8B193]"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addChild}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#D8CBE8] bg-[#F7F3FF] px-4 py-3 text-sm font-black text-[#7D67A8]"
            >
              <Plus className="h-4 w-4" /> Ajouter un enfant
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTION_OPTIONS.map((section) => {
              const isSelected = selectedSections.includes(section.id);
              const isRequired = section.id === "children";

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                    isSelected
                      ? "border-[#A8B193] bg-[#EAF0E3] text-[#5F6F4F]"
                      : "border-[#EFE4D6] bg-white text-[#8B8278] hover:bg-[#F8F3EA]"
                  }`}
                >
                  <span>{section.label}</span>
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                  {isRequired ? <span className="text-xs font-bold text-[#A8B193]">Requis</span> : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => (step === 1 ? handleSkip() : setStep(1))}
            disabled={isSaving}
            className="rounded-full px-5 py-3 text-sm font-black text-[#8B8278] transition hover:bg-[#F8F3EA] disabled:opacity-60"
          >
            {step === 1 ? "Configurer plus tard" : "Retour"}
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              Continuer <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSaving || !hasAtLeastOneChild}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {isSaving ? "Enregistrement..." : "Terminer"}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
