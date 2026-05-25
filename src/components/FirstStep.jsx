import React, { useMemo, useState } from "react";

const STORAGE_KEY = "camelio_first_step_completed";
const SETUP_DATA_KEY = "camelio_initial_setup";

const CHILD_COLORS = ["#a8b193", "#eaa5af", "#b5a7c8", "#eec988", "#a2badf"];

const FAMILY_SITUATIONS = [
  { id: "separated", label: "Parent séparé" },
  { id: "shared_custody", label: "Garde partagée" },
  { id: "single_parent", label: "Parent monoparental" },
  { id: "couple", label: "Parent en couple" },
  { id: "other", label: "Autre situation" },
];

const ALL_SECTIONS = [
  { id: "calendar", label: "Calendrier" },
  { id: "documents", label: "Documents" },
  { id: "photos", label: "Photos" },
  { id: "medical", label: "Médical" },
  { id: "invoices", label: "Factures et reçus" },
  { id: "notes", label: "Notes" },
  { id: "parentalPlan", label: "Plan parental" },
  { id: "custodyCalculator", label: "Calculateur de journées" },
  { id: "memorablePhrases", label: "Phrases mémorables" },
];

const AVATAR_PRESETS = [
  {
    id: "bear",
    label: "Ours",
    background: "#f3eadf",
    icon: "🐻",
  },
  {
    id: "cat",
    label: "Chat",
    background: "#f8dfe6",
    icon: "🐱",
  },
  {
    id: "fox",
    label: "Renard",
    background: "#f4d6b8",
    icon: "🦊",
  },
  {
    id: "rabbit",
    label: "Lapin",
    background: "#e9e0f3",
    icon: "🐰",
  },
  {
    id: "panda",
    label: "Panda",
    background: "#dce8f7",
    icon: "🐼",
  },
];

function createAvatarDataUrl(avatar) {
  const svg = `
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" rx="120" fill="${avatar.background}" />
      <circle cx="120" cy="120" r="86" fill="white" opacity="0.55" />
      <text x="120" y="142" text-anchor="middle" font-size="82" font-family="Arial, sans-serif">${avatar.icon}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getRecommendedSectionIds(situation) {
  const baseSections = [
    "calendar",
    "documents",
    "photos",
    "medical",
    "notes",
    "memorablePhrases",
  ];

  if (situation === "couple" || situation === "single_parent") {
    return baseSections;
  }

  if (situation === "separated" || situation === "shared_custody") {
    return [
      "calendar",
      "documents",
      "photos",
      "medical",
      "invoices",
      "notes",
      "parentalPlan",
      "custodyCalculator",
      "memorablePhrases",
    ];
  }

  return baseSections;
}

function getRemovedSectionLabels(situation) {
  const recommended = getRecommendedSectionIds(situation);

  return ALL_SECTIONS.filter((section) => !recommended.includes(section.id)).map(
    (section) => section.label
  );
}

function buildEmptyChild(index) {
  const avatar = AVATAR_PRESETS[index % AVATAR_PRESETS.length];

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `child-${Date.now()}-${index}`,
    firstName: "",
    lastName: "",
    nickname: "",
    birthDate: "",
    color: CHILD_COLORS[index % CHILD_COLORS.length],
    photo: createAvatarDataUrl(avatar),
    image: createAvatarDataUrl(avatar),
    avatar: createAvatarDataUrl(avatar),
    defaultAvatarId: avatar.id,
  };
}

export default function FirstStep({ onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [familySituation, setFamilySituation] = useState("separated");
  const [childrenCount, setChildrenCount] = useState(1);
  const [children, setChildren] = useState([buildEmptyChild(0)]);
  const [selectedSections, setSelectedSections] = useState(
    getRecommendedSectionIds("separated")
  );

  const removedSections = useMemo(() => {
    return getRemovedSectionLabels(familySituation);
  }, [familySituation]);

  const progressWidth = `${(step / 3) * 100}%`;

  const updateFamilySituation = (situationId) => {
    setFamilySituation(situationId);
    setSelectedSections(getRecommendedSectionIds(situationId));
  };

  const updateChildrenCount = (value) => {
    const count = Math.max(0, Math.min(10, Number(value) || 0));
    setChildrenCount(count);

    setChildren((current) => {
      const next = [...current];

      while (next.length < count) {
        next.push(buildEmptyChild(next.length));
      }

      return next.slice(0, count);
    });
  };

  const updateChild = (index, field, value) => {
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index
          ? {
              ...child,
              [field]: value,
            }
          : child
      )
    );
  };

  const updateChildAvatar = (index, avatar) => {
    const avatarUrl = createAvatarDataUrl(avatar);

    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index
          ? {
              ...child,
              photo: avatarUrl,
              image: avatarUrl,
              avatar: avatarUrl,
              defaultAvatarId: avatar.id,
            }
          : child
      )
    );
  };

  const toggleSection = (sectionId) => {
    setSelectedSections((current) => {
      if (current.includes(sectionId)) {
        return current.filter((id) => id !== sectionId);
      }

      return [...current, sectionId];
    });
  };

  const skipCurrentStep = () => {
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    completeSetup(true);
  };

  const completeSetup = (skipped = false) => {
    const setupData = {
      completedAt: new Date().toISOString(),
      skipped,
      familySituation,
      children,
      selectedSections,
      hiddenSections: ALL_SECTIONS.filter(
        (section) => !selectedSections.includes(section.id)
      ).map((section) => section.id),
    };

    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(SETUP_DATA_KEY, JSON.stringify(setupData));

    if (typeof onComplete === "function") {
      onComplete(setupData);
    }
  };

  const skipAll = () => {
    localStorage.setItem(STORAGE_KEY, "true");

    if (typeof onSkip === "function") {
      onSkip();
      return;
    }

    if (typeof onComplete === "function") {
      onComplete({
        skipped: true,
        completedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#f8f3ed] via-[#fbf3f6] to-[#f3f6fb] px-6 py-5 md:px-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-[#5b6b8a]">
                Configuration initiale de votre espace Camelio
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Bienvenue dans Camelio
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#465a78]">
                Avant de commencer, prenons quelques minutes pour bien configurer
                l’application comme premier pas. Ces informations permettront à
                Camelio de mieux organiser votre calendrier, vos documents, vos
                souvenirs et les informations importantes liées à vos enfants.
              </p>
            </div>

            <button
              type="button"
              onClick={skipAll}
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-[#5b6b8a] transition hover:bg-white/70"
            >
              Configurer plus tard
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#5b6b8a]">
              <span>Étape {step} de 3</span>
              <span>
                {step === 1 && "Votre situation"}
                {step === 2 && "Vos enfants"}
                {step === 3 && "Vos premières sections"}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#a8b193] transition-all duration-300"
                style={{ width: progressWidth }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-7 md:px-8">
          {step === 1 && (
            <section>
              <h3 className="text-2xl font-bold text-slate-950">
                Votre situation
              </h3>

              <p className="mt-2 text-sm text-[#5b6b8a]">
                Cette étape nous aide à adapter Camelio à votre réalité
                familiale.
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-[#5b6b8a]">
                Cette étape est optionnelle. Vous pourrez compléter ou modifier
                ces informations plus tard.
              </div>

              <div className="mt-7">
                <p className="mb-3 text-sm font-bold text-[#33415c]">
                  Quelle est votre situation familiale?
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  {FAMILY_SITUATIONS.map((situation) => {
                    const isSelected = familySituation === situation.id;

                    return (
                      <button
                        key={situation.id}
                        type="button"
                        onClick={() => updateFamilySituation(situation.id)}
                        className={`rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition ${
                          isSelected
                            ? "border-[#a8b193] bg-[#f3f6ef] text-slate-950 shadow-sm"
                            : "border-slate-200 bg-white text-[#465a78] hover:border-[#a8b193]"
                        }`}
                      >
                        {situation.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {removedSections.length > 0 && (
                <div className="mt-6 rounded-2xl bg-[#f6f0e6] px-5 py-4 text-sm leading-6 text-[#465a78]">
                  Selon votre réponse, certaines sections seront masquées par
                  défaut, car Camelio estime que vous utiliserez davantage le
                  profil de l’enfant et les sections essentielles. Par exemple :
                  {` ${removedSections.join(", ")}.`} Vous pourrez toutefois
                  les activer au besoin dans les paramètres.
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section>
              <h3 className="text-2xl font-bold text-slate-950">
                Vos enfants
              </h3>

              <p className="mt-2 text-sm text-[#5b6b8a]">
                Ajoutez les enfants pour lesquels vous souhaitez organiser votre
                espace Camelio.
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-[#5b6b8a]">
                Cette étape est optionnelle. Vous pourrez compléter ou modifier
                ces informations plus tard.
              </div>

              <div className="mt-7">
                <label className="mb-2 block text-sm font-bold text-[#33415c]">
                  Combien d’enfants souhaitez-vous ajouter?
                </label>

                <input
                  type="number"
                  min="0"
                  max="10"
                  value={childrenCount}
                  onChange={(event) => updateChildrenCount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                />
              </div>

              <div className="mt-6 space-y-5">
                {children.map((child, index) => (
                  <div
                    key={child.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h4 className="text-lg font-bold text-slate-950">
                        Enfant {index + 1}
                      </h4>

                      <div
                        className="h-10 w-10 rounded-full border-4 border-white shadow"
                        style={{ backgroundColor: child.color }}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold text-[#5b6b8a]">
                          Prénom
                        </label>
                        <input
                          type="text"
                          value={child.firstName}
                          onChange={(event) =>
                            updateChild(index, "firstName", event.target.value)
                          }
                          placeholder="Ex. Emma"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-[#5b6b8a]">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={child.lastName}
                          onChange={(event) =>
                            updateChild(index, "lastName", event.target.value)
                          }
                          placeholder="Ex. Tremblay"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-[#5b6b8a]">
                          Surnom
                        </label>
                        <input
                          type="text"
                          value={child.nickname}
                          onChange={(event) =>
                            updateChild(index, "nickname", event.target.value)
                          }
                          placeholder="Ex. Mimi"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-[#5b6b8a]">
                          Date de naissance
                        </label>
                        <input
                          type="date"
                          value={child.birthDate}
                          onChange={(event) =>
                            updateChild(index, "birthDate", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-xs font-bold text-[#5b6b8a]">
                        Photo par défaut
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {AVATAR_PRESETS.map((avatar) => {
                          const avatarUrl = createAvatarDataUrl(avatar);
                          const isSelected = child.defaultAvatarId === avatar.id;

                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => updateChildAvatar(index, avatar)}
                              className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 bg-white shadow-sm transition ${
                                isSelected
                                  ? "border-slate-950"
                                  : "border-white hover:border-[#a8b193]"
                              }`}
                              title={avatar.label}
                            >
                              <img
                                src={avatarUrl}
                                alt={avatar.label}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>

                      <p className="mt-2 text-xs leading-5 text-[#5b6b8a]">
                        Cette photo sera utilisée par défaut dans le profil de
                        l’enfant et pourra être modifiée plus tard.
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-xs font-bold text-[#5b6b8a]">
                        Couleur associée à l’enfant
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {CHILD_COLORS.map((color) => {
                          const isSelected = child.color === color;

                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateChild(index, "color", color)}
                              className={`h-9 w-9 rounded-full border-4 transition ${
                                isSelected
                                  ? "border-slate-950"
                                  : "border-white"
                              } shadow`}
                              style={{ backgroundColor: color }}
                              aria-label={`Choisir la couleur ${color}`}
                            />
                          );
                        })}
                      </div>

                      <p className="mt-2 text-xs leading-5 text-[#5b6b8a]">
                        Cette couleur sera notamment utilisée dans le calendrier
                        pour identifier rapidement les journées, événements et
                        informations associés à l’enfant.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h3 className="text-2xl font-bold text-slate-950">
                Vos premières sections
              </h3>

              <p className="mt-2 text-sm text-[#5b6b8a]">
                Camelio a sélectionné certaines sections selon votre situation.
                Vous pouvez en ajouter ou en retirer selon vos besoins.
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-[#5b6b8a]">
                Cette étape est optionnelle. Vous pourrez compléter ou modifier
                ces informations plus tard.
              </div>

              {removedSections.length > 0 && (
                <div className="mt-5 rounded-2xl bg-[#f6f0e6] px-5 py-4 text-sm leading-6 text-[#465a78]">
                  Certaines sections ont été masquées par défaut, car elles
                  semblent moins prioritaires pour votre situation actuelle. Par
                  exemple, un parent en couple ou un parent solo n’a pas
                  nécessairement besoin du plan parental, du calculateur de
                  journées ou des factures à rembourser. Vous pouvez toutefois
                  les activer maintenant ou plus tard dans les paramètres.
                </div>
              )}

              <div className="mt-7">
                <p className="mb-3 text-sm font-bold text-[#33415c]">
                  Quelles sections souhaitez-vous utiliser en priorité?
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  {ALL_SECTIONS.map((section) => {
                    const isSelected = selectedSections.includes(section.id);

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className={`rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition ${
                          isSelected
                            ? "border-[#a8b193] bg-[#f3f6ef] text-slate-950 shadow-sm"
                            : "border-slate-200 bg-white text-[#465a78] hover:border-[#a8b193]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{section.label}</span>
                          {isSelected && (
                            <span className="rounded-full bg-[#a8b193] px-2 py-1 text-xs text-white">
                              Activée
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#f6f0e6] px-5 py-4 text-sm text-[#465a78]">
                Vous pourrez activer, masquer ou modifier ces sections plus tard
                dans les paramètres.
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-5 md:px-8">
          <button
            type="button"
            onClick={skipCurrentStep}
            className="rounded-2xl px-5 py-3 text-sm font-bold text-[#5b6b8a] transition hover:bg-slate-50"
          >
            Sauter cette étape
          </button>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-[#465a78] transition hover:bg-slate-50"
              >
                Retour
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={() => completeSetup(false)}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
              >
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}