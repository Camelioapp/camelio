import React, { useMemo, useState } from "react";

const DEFAULT_COLORS = ["#a8b193", "#eaa5af", "#b5a7c8", "#eec988", "#a2badf"];

const FAMILY_SITUATIONS = [
  "Parent séparé",
  "Garde partagée",
  "Parent monoparental",
  "Parent en couple",
  "Autre situation",
];

const MAIN_GOALS = [
  "Mieux organiser la garde",
  "Centraliser les documents",
  "Suivre les rendez-vous",
  "Conserver les souvenirs",
  "Suivre les dépenses",
  "Un peu de tout",
];

const PRIORITY_SECTIONS = [
  "Calendrier",
  "Documents",
  "Photos",
  "Médical",
  "Factures et reçus",
  "Notes",
  "Plan parental",
  "Phrases mémorables",
];

const GIRL_PRESET_PHOTOS = Array.from({ length: 15 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `fille-${number}`,
    label: `Fille ${number}`,
    gender: "female",
    url: `/Profil/Fille/profil_${number}.png`,
  };
});

const BOY_PRESET_PHOTOS = Array.from({ length: 18 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `garcon-${number}`,
    label: `Garçon ${number}`,
    gender: "male",
    url: `/Profil/Garcon/Garcon_${number}.png`,
  };
});

const ALL_PRESET_PHOTOS = [...GIRL_PRESET_PHOTOS, ...BOY_PRESET_PHOTOS];

function getPresetPhotosByGender(gender) {
  if (gender === "female") return GIRL_PRESET_PHOTOS;
  if (gender === "male") return BOY_PRESET_PHOTOS;
  return ALL_PRESET_PHOTOS;
}

export default function FirstStep({
  isOpen = true,
  onClose,
  onComplete,
  apiUrl = import.meta.env.VITE_API_URL || "https://camelio.onrender.com",
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    familySituation: "",
    mainGoal: "",
    childrenCount: 1,
    children: [
      {
        firstName: "",
        lastName: "",
        nickname: "",
        birthDate: "",
        gender: "",
        color: DEFAULT_COLORS[0],
        avatar: "",
        photo: "",
        image: "",
        photoSource: "",
      },
    ],
    prioritySections: [],
  });

  const steps = useMemo(
    () => [
      {
        title: "Votre situation",
        subtitle:
          "Cette étape nous aide à adapter Camelio à votre réalité familiale.",
      },
      {
        title: "Vos enfants",
        subtitle:
          "Ajoutez les enfants pour lesquels vous souhaitez organiser votre espace Camelio.",
      },
      {
        title: "Vos premières sections",
        subtitle: "Choisissez les sections que vous souhaitez utiliser en priorité.",
      },
    ],
    []
  );

  if (!isOpen) return null;

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateChild = (index, key, value) => {
    setForm((current) => {
      const updatedChildren = [...current.children];

      updatedChildren[index] = {
        ...updatedChildren[index],
        [key]: value,
      };

      return {
        ...current,
        children: updatedChildren,
      };
    });
  };

  const updateChildGender = (index, gender) => {
    setForm((current) => {
      const updatedChildren = [...current.children];
      const currentChild = updatedChildren[index];

      updatedChildren[index] = {
        ...currentChild,
        gender,
        avatar: "",
        photo: "",
        image: "",
        photoSource: "",
      };

      return {
        ...current,
        children: updatedChildren,
      };
    });
  };

  const updateChildrenCount = (count) => {
    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10));

    setForm((current) => {
      const nextChildren = [...current.children];

      while (nextChildren.length < safeCount) {
        const nextIndex = nextChildren.length;

        nextChildren.push({
          firstName: "",
          lastName: "",
          nickname: "",
          birthDate: "",
          gender: "",
          color: DEFAULT_COLORS[nextIndex % DEFAULT_COLORS.length],
          avatar: "",
          photo: "",
          image: "",
          photoSource: "",
        });
      }

      return {
        ...current,
        childrenCount: safeCount,
        children: nextChildren.slice(0, safeCount),
      };
    });
  };

  const selectPresetPhoto = (index, photoUrl) => {
    setForm((current) => {
      const updatedChildren = [...current.children];

      updatedChildren[index] = {
        ...updatedChildren[index],
        avatar: photoUrl,
        photo: photoUrl,
        image: photoUrl,
        photoSource: "preset",
      };

      return {
        ...current,
        children: updatedChildren,
      };
    });
  };

  const handleUploadPhoto = (index, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez choisir une image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      setForm((current) => {
        const updatedChildren = [...current.children];

        updatedChildren[index] = {
          ...updatedChildren[index],
          avatar: result,
          photo: result,
          image: result,
          photoSource: "upload",
        };

        return {
          ...current,
          children: updatedChildren,
        };
      });
    };

    reader.readAsDataURL(file);
  };

  const toggleSection = (section) => {
    setForm((current) => {
      const exists = current.prioritySections.includes(section);

      return {
        ...current,
        prioritySections: exists
          ? current.prioritySections.filter((item) => item !== section)
          : [...current.prioritySections, section],
      };
    });
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    handleComplete(false);
  };

  const skipStep = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    handleComplete(true);
  };

  const handleConfigureLater = () => {
    handleComplete(true);
  };

  const handleComplete = async (skipped = false) => {
    setSaving(true);

    const payload = {
      onboardingCompleted: true,
      onboardingSkipped: skipped,
      onboardingCompletedAt: new Date().toISOString(),
      onboarding: {
        familySituation: form.familySituation,
        mainGoal: form.mainGoal,
        childrenCount: form.childrenCount,
        children: form.children.map((child) => ({
          firstName: child.firstName.trim(),
          lastName: child.lastName.trim(),
          nickname: child.nickname.trim(),
          birthDate: child.birthDate,
          gender: child.gender,
          color: child.color,
          avatar: child.avatar,
          photo: child.photo,
          image: child.image,
          photoSource: child.photoSource,
        })),
        prioritySections: form.prioritySections,
      },
    };

    try {
      const token = localStorage.getItem("camelio_token");

      await fetch(`${apiUrl}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (typeof onComplete === "function") {
        onComplete(payload);
      }

      if (typeof onClose === "function") {
        onClose();
      }
    } catch (error) {
      console.error("Erreur sauvegarde configuration initiale:", error);

      if (typeof onComplete === "function") {
        onComplete(payload);
      }

      if (typeof onClose === "function") {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-br from-[#f8f4ea] via-white to-[#f7edf0] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Configuration initiale de votre espace Camelio
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Bienvenue dans Camelio
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Avant de commencer, prenons quelques minutes pour bien configurer
                l’application comme premier pas. Ces informations permettront à
                Camelio de mieux organiser votre calendrier, vos documents, vos
                souvenirs et les informations importantes liées à vos enfants.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfigureLater}
              disabled={saving}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-700 disabled:opacity-50"
            >
              Configurer plus tard
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Étape {step + 1} de 3</span>
              <span>{steps[step].title}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#a8b193] transition-all duration-300"
                style={{ width: `${((step + 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {steps[step].title}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {steps[step].subtitle}
            </p>

            <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Cette étape est optionnelle. Vous pourrez compléter ou modifier ces
              informations plus tard.
            </p>
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quelle est votre situation familiale?
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {FAMILY_SITUATIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateForm("familySituation", item)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        form.familySituation === item
                          ? "border-[#a8b193] bg-[#a8b193]/15 text-slate-900"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#a8b193]/60"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quel est votre objectif principal avec Camelio?
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {MAIN_GOALS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateForm("mainGoal", item)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        form.mainGoal === item
                          ? "border-[#eaa5af] bg-[#eaa5af]/15 text-slate-900"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#eaa5af]/60"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Combien d’enfants souhaitez-vous ajouter?
                </label>

                <select
                  value={form.childrenCount}
                  onChange={(event) => updateChildrenCount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map(
                    (number) => (
                      <option key={number} value={number}>
                        {number} enfant{number > 1 ? "s" : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-5">
                {form.children.map((child, index) => {
                  const presetPhotos = getPresetPhotosByGender(child.gender);
                  const selectedPhoto = child.avatar || child.photo || child.image;

                  return (
                    <div
                      key={index}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h4 className="font-bold text-slate-800">
                          Enfant {index + 1}
                        </h4>

                        <div className="flex items-center gap-3">
                          {selectedPhoto ? (
                            <img
                              src={selectedPhoto}
                              alt=""
                              className="h-12 w-12 rounded-full border-4 border-white object-cover shadow"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full border-4 border-white shadow"
                              style={{ backgroundColor: child.color }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Prénom
                          </label>

                          <input
                            type="text"
                            value={child.firstName}
                            onChange={(event) =>
                              updateChild(index, "firstName", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                            placeholder="Ex. Emma"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Nom
                          </label>

                          <input
                            type="text"
                            value={child.lastName}
                            onChange={(event) =>
                              updateChild(index, "lastName", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                            placeholder="Ex. Tremblay"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Surnom
                          </label>

                          <input
                            type="text"
                            value={child.nickname}
                            onChange={(event) =>
                              updateChild(index, "nickname", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                            placeholder="Ex. Mimi"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Date de naissance
                          </label>

                          <input
                            type="date"
                            value={child.birthDate}
                            onChange={(event) =>
                              updateChild(index, "birthDate", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                          Sexe de l’enfant
                        </label>

                        <select
                          value={child.gender}
                          onChange={(event) =>
                            updateChildGender(index, event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#a8b193] focus:ring-4 focus:ring-[#a8b193]/15"
                        >
                          <option value="">Sélectionner</option>
                          <option value="female">Fille</option>
                          <option value="male">Garçon</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-semibold text-slate-500">
                          Couleur de l’enfant
                        </label>

                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateChild(index, "color", color)}
                              className={`h-9 w-9 rounded-full border-4 transition ${
                                child.color === color
                                  ? "border-slate-800"
                                  : "border-white"
                              } shadow`}
                              style={{ backgroundColor: color }}
                              aria-label={`Choisir la couleur ${color}`}
                            />
                          ))}
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Cette couleur sera notamment utilisée dans le calendrier.
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500">
                              Photo de profil
                            </label>

                            <p className="mt-1 text-xs text-slate-400">
                              Les photos proposées changent selon le sexe choisi.
                            </p>
                          </div>

                          <label className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50">
                            Importer une photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) =>
                                handleUploadPhoto(index, event.target.files?.[0])
                              }
                            />
                          </label>
                        </div>

                        <div className="grid max-h-[260px] grid-cols-4 gap-3 overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-3 sm:grid-cols-6">
                          {presetPhotos.map((photo) => {
                            const isSelected = selectedPhoto === photo.url;

                            return (
                              <button
                                key={photo.id}
                                type="button"
                                onClick={() => selectPresetPhoto(index, photo.url)}
                                className={`aspect-square overflow-hidden rounded-full border-4 bg-slate-50 transition hover:scale-105 ${
                                  isSelected
                                    ? "border-slate-900"
                                    : "border-white shadow"
                                }`}
                                title={photo.label}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.label}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          Si les images ne s’affichent pas, vérifie les noms exacts
                          des fichiers dans <strong>public/Profil/Fille</strong> et{" "}
                          <strong>public/Profil/Garcon</strong>.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quelles sections souhaitez-vous utiliser en priorité?
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {PRIORITY_SECTIONS.map((section) => {
                    const selected = form.prioritySections.includes(section);

                    return (
                      <button
                        key={section}
                        type="button"
                        onClick={() => toggleSection(section)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selected
                            ? "border-[#b5a7c8] bg-[#b5a7c8]/15 text-slate-900"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#b5a7c8]/60"
                        }`}
                      >
                        {section}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm text-slate-600">
                Vous pourrez activer, masquer ou modifier ces sections plus tard
                dans les paramètres.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={skipStep}
            disabled={saving}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            {step === steps.length - 1
              ? "Terminer sans compléter"
              : "Sauter cette étape"}
          </button>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                disabled={saving}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Retour
              </button>
            )}

            <button
              type="button"
              onClick={goNext}
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:opacity-50"
            >
              {saving
                ? "Sauvegarde..."
                : step === steps.length - 1
                  ? "Terminer la configuration"
                  : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}