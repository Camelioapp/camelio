import React, { useMemo, useState } from "react";

const STORAGE_KEY = "camelio_first_step_completed";
const SETUP_DATA_KEY = "camelio_initial_setup";

const CHILD_COLORS = [
  { id: "sage", label: "Sauge", value: "#A8B193" },
  { id: "rose", label: "Rose", value: "#E99AAA" },
  { id: "blue", label: "Bleu doux", value: "#8FB8DE" },
  { id: "mauve", label: "Mauve", value: "#AA90C8" },
  { id: "gold", label: "Doré", value: "#D4A85F" },
  { id: "peach", label: "Pêche", value: "#E8A07E" },
  { id: "mint", label: "Menthe", value: "#7CBFA2" },
  { id: "lavender", label: "Lavande", value: "#C7B3E5" },
  { id: "mustard", label: "Moutarde", value: "#D9BF5E" },
  { id: "olive", label: "Olive", value: "#8E9A72" },
  { id: "coral", label: "Corail", value: "#E8786D" },
  { id: "teal", label: "Sarcelle", value: "#5BAEAA" },
  { id: "sky", label: "Ciel", value: "#76BFE3" },
  { id: "grape", label: "Raisin", value: "#8F78B8" },
  { id: "sand", label: "Sable", value: "#D8C49A" },
];

const FAMILY_SITUATIONS = [
  {
    id: "couple",
    label: "En couple",
    description:
      "Deux parents dans le même foyer ou une organisation familiale commune.",
  },
  {
    id: "single_full",
    label: "Monoparental, garde complète",
    description: "Un parent principal avec garde complète.",
  },
  {
    id: "solo_shared",
    label: "Soloparental, garde partagée ou non partagée",
    description:
      "Un parent qui souhaite organiser la garde, les documents et les suivis.",
  },
  {
    id: "other",
    label: "Autre situation",
    description: "Une autre réalité familiale ou une configuration particulière.",
  },
];

const ALL_SECTIONS = [
  { id: "calendar", label: "Calendrier" },
  { id: "documents", label: "Documents" },
  { id: "photos", label: "Photos" },
  { id: "sante", label: "Médical" },
  { id: "invoices", label: "Factures et reçus" },
  { id: "notes", label: "Notes" },
  { id: "parental-plan", label: "Plan parental" },
  { id: "calculator", label: "Calculateur de journées" },
  { id: "memorable-phrases", label: "Phrases mémorables" },
];

/*
  Important :
  Les chemins doivent correspondre exactement aux noms des fichiers dans public.

  Exemple attendu :
  public/Profil/Fille/profil_01.png devient /Profil/Fille/profil_01.png
  public/Profil/Garcon/Garcon_01.png devient /Profil/Garcon/Garcon_01.png
*/
const girlPresetPhotos = Array.from({ length: 15 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `fille-profil-${number}`,
    label: `Fille ${number}`,
    gender: "female",
    src: `/Profil/Fille/profil_${number}.png`,
  };
});

const boyPresetPhotos = Array.from({ length: 18 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `garcon-profil-${number}`,
    label: `Garçon ${number}`,
    gender: "male",
    src: `/Profil/Garcon/Garcon_${number}.png`,
  };
});

const PUBLIC_AVATARS = [...girlPresetPhotos, ...boyPresetPhotos];

function getDefaultColor(index) {
  return CHILD_COLORS[index % CHILD_COLORS.length];
}

function getAvatarsForGender(gender) {
  if (gender === "female") {
    return PUBLIC_AVATARS.filter((avatar) => avatar.gender === "female");
  }

  if (gender === "male") {
    return PUBLIC_AVATARS.filter((avatar) => avatar.gender === "male");
  }

  return PUBLIC_AVATARS;
}

function getFallbackAvatar(index, gender = "") {
  const avatars = getAvatarsForGender(gender);

  return avatars[index % avatars.length] || PUBLIC_AVATARS[0];
}

function getRecommendedSectionIds(situation) {
  if (situation === "couple") {
    return [
      "children",
      "calendar",
      "documents",
      "photos",
      "sante",
      "notes",
      "memorable-phrases",
    ];
  }

  if (situation === "single_full") {
    return [
      "children",
      "calendar",
      "documents",
      "photos",
      "sante",
      "notes",
      "memorable-phrases",
    ];
  }

  if (situation === "solo_shared") {
    return [
      "children",
      "calendar",
      "documents",
      "photos",
      "sante",
      "invoices",
      "notes",
      "parental-plan",
      "calculator",
      "memorable-phrases",
    ];
  }

  return [
    "children",
    "calendar",
    "documents",
    "photos",
    "sante",
    "notes",
    "memorable-phrases",
  ];
}

function getDisabledSectionLabels(situation) {
  const recommended = getRecommendedSectionIds(situation);

  return ALL_SECTIONS.filter((section) => !recommended.includes(section.id)).map(
    (section) => section.label
  );
}

function buildEmptyChild(index) {
  const color = getDefaultColor(index);
  const avatar = getFallbackAvatar(index);

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `child-${Date.now()}-${index}`,
    firstName: "",
    lastName: "",
    nickname: "",
    birthDate: "",
    gender: "",
    sex: "",
    color: color.id,
    colorHex: color.value,
    photo: avatar?.src || "",
    image: avatar?.src || "",
    avatar: avatar?.src || "",
    defaultAvatarId: avatar?.id || "",
  };
}

function AvatarPreview({ avatar, isSelected, onClick }) {
  return (
    <button
      key={avatar.id}
      type="button"
      onClick={onClick}
      className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border-4 bg-white shadow-sm transition hover:scale-105 ${
        isSelected ? "border-slate-950" : "border-white hover:border-[#a8b193]"
      }`}
      title={avatar.label}
    >
      <img
        src={avatar.src}
        alt={avatar.label}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.parentElement.classList.add("bg-slate-100");
        }}
      />
    </button>
  );
}

export default function FirstStep({ onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [familySituation, setFamilySituation] = useState("couple");
  const [childrenCount, setChildrenCount] = useState(1);
  const [children, setChildren] = useState([buildEmptyChild(0)]);
  const [selectedSections, setSelectedSections] = useState(
    getRecommendedSectionIds("couple")
  );

  const disabledSections = useMemo(() => {
    return getDisabledSectionLabels(familySituation);
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

  const updateChildGender = (index, gender) => {
    setChildren((current) =>
      current.map((child, childIndex) => {
        if (childIndex !== index) return child;

        const avatars = getAvatarsForGender(gender);
        const defaultAvatar = avatars[0] || PUBLIC_AVATARS[0];

        return {
          ...child,
          gender,
          sex: gender,
          photo: defaultAvatar?.src || "",
          image: defaultAvatar?.src || "",
          avatar: defaultAvatar?.src || "",
          defaultAvatarId: defaultAvatar?.id || "",
        };
      })
    );
  };

  const updateChildColor = (index, color) => {
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index
          ? {
              ...child,
              color: color.id,
              colorHex: color.value,
            }
          : child
      )
    );
  };

  const updateChildAvatar = (index, avatar) => {
    setChildren((current) =>
      current.map((child, childIndex) =>
        childIndex === index
          ? {
              ...child,
              photo: avatar.src,
              image: avatar.src,
              avatar: avatar.src,
              defaultAvatarId: avatar.id,
            }
          : child
      )
    );
  };

  const uploadChildAvatar = (index, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result;

      setChildren((current) =>
        current.map((child, childIndex) =>
          childIndex === index
            ? {
                ...child,
                photo: imageUrl,
                image: imageUrl,
                avatar: imageUrl,
                defaultAvatarId: "uploaded",
              }
            : child
        )
      );
    };

    reader.readAsDataURL(file);
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
    const setupData = {
      skipped: true,
      completedAt: new Date().toISOString(),
      familySituation,
      children: [],
      selectedSections: getRecommendedSectionIds(familySituation),
      hiddenSections: ALL_SECTIONS.filter(
        (section) => !getRecommendedSectionIds(familySituation).includes(section.id)
      ).map((section) => section.id),
    };

    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(SETUP_DATA_KEY, JSON.stringify(setupData));

    if (typeof onSkip === "function") {
      onSkip(setupData);
      return;
    }

    if (typeof onComplete === "function") {
      onComplete(setupData);
    }
  };

  return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 px-3 py-4 sm:px-4 sm:py-6">
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#f8f3ed] via-[#fbf3f6] to-[#f3f6fb] px-5 py-4 sm:px-6 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold leading-5 text-[#5b6b8a] sm:text-sm">
              Configuration initiale de votre espace Camelio
            </p>

            <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-950 md:text-3xl">
  Bienvenue dans Camelio
</h2>

            <p className="mt-2 max-w-2xl text-sm leading-5 text-[#465a78]">
  Prenons quelques minutes à configurer votre compte Camelio.
</p>
          </div>

          <button
            type="button"
            onClick={skipAll}
            className="self-start rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold text-[#5b6b8a] shadow-sm transition hover:bg-white sm:self-auto"
          >
            Configurer plus tard
          </button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-[#5b6b8a]">
            <span>Étape {step} de 3</span>

            <span className="text-right">
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

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6 md:px-8 md:py-7">
          
          {step === 1 && (
            <section>
              <h3 className="text-2xl font-bold text-slate-950">
                Votre situation
              </h3>

              <p className="mt-2 text-sm text-[#5b6b8a]">
                Cette étape nous aide à adapter Camelio à votre réalité familiale.
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
                        className={`rounded-2xl border px-5 py-4 text-left transition ${
                          isSelected
                            ? "border-[#a8b193] bg-[#f3f6ef] text-slate-950 shadow-sm"
                            : "border-slate-200 bg-white text-[#465a78] hover:border-[#a8b193]"
                        }`}
                      >
                        <span className="block text-sm font-bold">
                          {situation.label}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[#5b6b8a]">
                          {situation.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {disabledSections.length > 0 && (
                <div className="mt-6 rounded-2xl bg-[#fff4f6] px-5 py-4 text-sm leading-6 text-[#465a78]">
                  Selon votre réponse, certaines sections seront désactivées par
                  défaut, car Camelio estime que vous utiliserez davantage le
                  profil de l’enfant et les sections essentielles. Sections
                  désactivées :{" "}
                  <span className="font-bold text-[#eaa5af]">
                    {disabledSections.join(", ")}
                  </span>
                  . Vous pourrez toutefois les activer au besoin dans les
                  paramètres.
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

                <select
                  value={childrenCount}
                  onChange={(event) => updateChildrenCount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-[#465a78] outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                >
                  {Array.from({ length: 11 }, (_, index) => index).map(
                    (number) => (
                      <option key={number} value={number}>
                        {number} enfant{number > 1 ? "s" : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mt-6 space-y-5">
                {children.map((child, index) => {
                  const visibleAvatars = getAvatarsForGender(child.gender);

                  return (
                    <div
                      key={child.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <h4 className="text-lg font-bold text-slate-950">
                          Enfant {index + 1}
                        </h4>

                        {child.avatar ? (
                          <img
                            src={child.avatar}
                            alt="Photo sélectionnée"
                            className="h-12 w-12 rounded-full border-4 border-white object-cover shadow"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-full border-4 border-white shadow"
                            style={{ backgroundColor: child.colorHex }}
                          />
                        )}
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
                              updateChild(
                                index,
                                "firstName",
                                event.target.value
                              )
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
                              updateChild(
                                index,
                                "birthDate",
                                event.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-xs font-bold text-[#5b6b8a]">
                            Sexe de l’enfant
                          </label>

                          <select
                            value={child.gender}
                            onChange={(event) =>
                              updateChildGender(index, event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#465a78] outline-none transition focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                          >
                            <option value="">Sélectionner</option>
                            <option value="female">Fille</option>
                            <option value="male">Garçon</option>
                            <option value="other">Autre</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#5b6b8a]">
                              Photo par défaut
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#5b6b8a]">
                              Les photos affichées s’ajustent selon le sexe choisi.
                            </p>
                          </div>

                          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#465a78] shadow-sm transition hover:bg-slate-50">
                            Importer une photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                uploadChildAvatar(
                                  index,
                                  event.target.files?.[0]
                                )
                              }
                            />
                          </label>
                        </div>

                        {child.avatar && (
                          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                            <img
                              src={child.avatar}
                              alt="Photo sélectionnée"
                              className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-sm"
                            />

                            <div>
                              <p className="text-sm font-bold text-slate-950">
                                Photo sélectionnée
                              </p>

                              <p className="text-xs text-[#5b6b8a]">
                                Elle sera utilisée pour le profil de l’enfant.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid max-h-[250px] grid-cols-4 gap-3 overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-3 sm:grid-cols-6">
                          {visibleAvatars.map((avatar) => {
                            const isSelected =
                              child.defaultAvatarId === avatar.id;

                            return (
                              <AvatarPreview
                                key={avatar.id}
                                avatar={avatar}
                                isSelected={isSelected}
                                onClick={() => updateChildAvatar(index, avatar)}
                              />
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
                            const isSelected = child.color === color.id;

                            return (
                              <button
                                key={color.id}
                                type="button"
                                onClick={() => updateChildColor(index, color)}
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-4 transition ${
                                  isSelected
                                    ? "border-slate-950"
                                    : "border-white"
                                } shadow`}
                                style={{ backgroundColor: color.value }}
                                title={color.label}
                                aria-label={`Choisir la couleur ${color.label}`}
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
                  );
                })}
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
                Les sections moins pertinentes sont désactivées par défaut, mais
                vous pouvez les activer si vous en avez besoin.
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-[#5b6b8a]">
                Cette étape est optionnelle. Vous pourrez compléter ou modifier
                ces informations plus tard.
              </div>

              {disabledSections.length > 0 && (
                <div className="mt-5 rounded-2xl bg-[#fff4f6] px-5 py-4 text-sm leading-6 text-[#465a78]">
                  Sections désactivées par défaut :{" "}
                  <span className="font-bold text-[#eaa5af]">
                    {disabledSections.join(", ")}
                  </span>
                  . Vous pourrez toutefois les réactiver maintenant ou plus tard
                  dans les paramètres.
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
                            : "border-[#eaa5af]/70 bg-white text-[#465a78] hover:border-[#eaa5af]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{section.label}</span>

                          {isSelected ? (
                            <span className="rounded-full bg-[#a8b193] px-2 py-1 text-xs text-white">
                              Activée
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#eaa5af] px-2 py-1 text-xs text-white">
                              Désactivée
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
