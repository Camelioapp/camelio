import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Heart,
  ImagePlus,
  Plus,
  Quote,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]";

const textareaClass =
  "mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date) {
  if (!date) return "Date non précisée";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date non précisée";
  }

  return parsedDate.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function displayChildName(child) {
  if (!child) return "Enfant";
  return child.nickname || child.firstName || child.name || "Enfant";
}

function AddPhrasePopup({
  childrenOptions,
  formData,
  setFormData,
  onClose,
  onSave,
}) {
  const selectedChildId = formData.childId || "";

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const photoUrl = URL.createObjectURL(file);

    setFormData((current) => ({
      ...current,
      photoFile: file,
      photoUrl,
    }));

    event.target.value = "";
  };

  const removePhoto = () => {
    setFormData((current) => ({
      ...current,
      photoFile: null,
      photoUrl: "",
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#3F3D38]">
              Phrase mémorable
            </h3>

            <p className="mt-1 text-sm text-[#746F64]">
              Ajoute une phrase, une date, un enfant et une photo souvenir.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7FB] text-[#746F64] ring-1 ring-[#F3D8E6]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-[#8A8378]">
              Phrase
            </label>

            <textarea
              className={textareaClass}
              value={formData.phrase}
              onChange={(event) => updateField("phrase", event.target.value)}
              placeholder={'"Papa, les nuages c’est du coton..."'}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-[#8A8378]">
              Enfant
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateField("childId", "")}
                className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                  selectedChildId === ""
                    ? "bg-[#8FA173] text-white ring-[#8FA173]"
                    : "bg-white text-[#746F64] ring-[#EFE4D6]"
                }`}
              >
                Non précisé
              </button>

              {childrenOptions.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => updateField("childId", child.id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                    selectedChildId === child.id
                      ? "bg-[#8FA173] text-white ring-[#8FA173]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-[#8A8378]">
              Date
            </label>

            <input
              type="date"
              className={inputClass}
              value={formData.date}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-[#8A8378]">
              Photo
            </label>

            {formData.photoUrl ? (
              <div className="mt-3 overflow-hidden rounded-3xl bg-[#FFF7FB] ring-1 ring-[#F3D8E6]">
                <img
                  src={formData.photoUrl}
                  alt="Souvenir"
                  className="h-52 w-full object-cover"
                />

                <div className="flex items-center justify-between gap-3 p-3">
                  <p className="text-sm font-bold text-[#746F64]">
                    Photo ajoutée
                  </p>

                  <button
                    type="button"
                    onClick={removePhoto}
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#FFF7FB] px-4 py-4 text-sm font-bold text-[#B8819C] ring-1 ring-[#F3D8E6]">
                <ImagePlus className="h-5 w-5" />
                Ajouter une photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-[#8A8378]">
              Contexte
            </label>

            <input
              className={inputClass}
              value={formData.context}
              onChange={(event) => updateField("context", event.target.value)}
              placeholder="Ex. Pendant le souper, après l’école..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={!formData.phrase.trim()}
              className="rounded-2xl bg-[#8FA173] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#7F9166] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemorablePhrases({ children = [], onBack }) {
  const [phrases, setPhrases] = useState([
    {
      id: "phrase-1",
      phrase: "Papa, les nuages c’est du coton pour les anges!",
      childId: children?.[0]?.id || children?.[0]?.name || "leo",
      childName: children?.[0] ? displayChildName(children[0]) : "Léo",
      date: "2025-12-04",
      context: "",
      favorite: false,
      photoUrl: "",
      photoFile: null,
    },
    {
      id: "phrase-2",
      phrase: "Maman, pourquoi le soleil se couche mais pas nous?",
      childId: children?.[1]?.id || children?.[1]?.name || "emma",
      childName: children?.[1] ? displayChildName(children[1]) : "Emma",
      date: "2025-08-03",
      context: "",
      favorite: false,
      photoUrl: "",
      photoFile: null,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChildFilter, setSelectedChildFilter] = useState("all");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const [formData, setFormData] = useState({
    phrase: "",
    childId: "",
    date: getTodayDate(),
    context: "",
    photoUrl: "",
    photoFile: null,
  });

  const childOptions = useMemo(() => {
    return children.map((child) => ({
      id: String(child.id || child.name),
      name: displayChildName(child),
      photo: child.photo || "",
    }));
  }, [children]);

  const filteredPhrases = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return phrases.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.phrase.toLowerCase().includes(normalizedSearch) ||
        item.context.toLowerCase().includes(normalizedSearch) ||
        item.childName.toLowerCase().includes(normalizedSearch);

      const matchesChild =
        selectedChildFilter === "all" ||
        String(item.childId) === String(selectedChildFilter);

      return matchesSearch && matchesChild;
    });
  }, [phrases, searchTerm, selectedChildFilter]);

  const resetForm = () => {
    setFormData({
      phrase: "",
      childId: "",
      date: getTodayDate(),
      context: "",
      photoUrl: "",
      photoFile: null,
    });
  };

  const handleAddPhrase = () => {
    const cleanedPhrase = formData.phrase.trim();

    if (!cleanedPhrase) return;

    const selectedChild = childOptions.find(
      (child) => String(child.id) === String(formData.childId)
    );

    const newPhrase = {
      id: `phrase-${Date.now()}`,
      phrase: cleanedPhrase,
      childId: formData.childId,
      childName: selectedChild?.name || "Non précisé",
      date: formData.date || getTodayDate(),
      context: formData.context.trim(),
      favorite: false,
      photoUrl: formData.photoUrl,
      photoFile: formData.photoFile,
    };

    setPhrases((current) => [newPhrase, ...current]);
    resetForm();
    setShowAddPopup(false);
  };

  const toggleFavorite = (phraseId) => {
    setPhrases((current) =>
      current.map((item) =>
        item.id === phraseId
          ? {
              ...item,
              favorite: !item.favorite,
            }
          : item
      )
    );
  };

  const deletePhrase = (phraseId) => {
    setPhrases((current) => current.filter((item) => item.id !== phraseId));
  };

  const sharePhrase = async (item) => {
    const text = `"${item.phrase}"\n\n${item.childName} · ${formatDate(
      item.date
    )}${item.context ? `\n${item.context}` : ""}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Phrase mémorable Camelio",
          text,
        });

        return;
      }

      await navigator.clipboard.writeText(text);
      setShareMessage("Phrase copiée. Tu peux maintenant la coller sur tes réseaux sociaux.");

      setTimeout(() => {
        setShareMessage("");
      }, 3500);
    } catch (error) {
      console.error("Erreur de partage:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] px-4 pb-8 pt-3 text-[#55534C]">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-[#8FA173]">
              Camelio
            </p>

            <h1 className="text-2xl font-black text-[#3F3D38]">
              Phrases mémorables
            </h1>
          </div>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8FA173] shadow-sm ring-1 ring-[#EFE4D6]"
              aria-label="Retour"
            >
              <ChevronDown className="h-5 w-5 rotate-90" />
            </button>
          ) : null}
        </header>

        <button
          type="button"
          onClick={() => setShowAddPopup(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F3EAFB] px-4 py-4 text-sm font-black text-[#A789C8] ring-1 ring-[#E5D5F2]"
        >
          <Quote className="h-5 w-5" />
          Ajouter une phrase
        </button>

        <section className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-[#EFE4D6]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B0A3]" />

            <input
              className="w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] py-3 pl-11 pr-4 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher une phrase..."
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedChildFilter("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ring-1 ${
                selectedChildFilter === "all"
                  ? "bg-[#8FA173] text-white ring-[#8FA173]"
                  : "bg-white text-[#746F64] ring-[#EFE4D6]"
              }`}
            >
              Tous
            </button>

            {childOptions.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildFilter(child.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ring-1 ${
                  selectedChildFilter === child.id
                    ? "bg-[#8FA173] text-white ring-[#8FA173]"
                    : "bg-white text-[#746F64] ring-[#EFE4D6]"
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </section>

        {shareMessage && (
          <div className="rounded-2xl bg-[#E8F3E3] px-4 py-3 text-sm font-bold text-[#5F7F52] ring-1 ring-[#C9DFC0]">
            {shareMessage}
          </div>
        )}

        <section className="space-y-3">
          {filteredPhrases.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#EFE4D6]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF7FB] text-[#D99AB9]">
                <Quote className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-black text-[#55534C]">
                Aucune phrase à afficher
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#746F64]">
                Ajoute une première phrase ou modifie ton filtre.
              </p>
            </div>
          ) : (
            filteredPhrases.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[1.5rem] bg-[#FFF7FB] p-4 shadow-sm ring-1 ring-[#F3CDD3]"
              >
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt="Souvenir associé à la phrase"
                    className="mb-4 h-52 w-full rounded-[1.25rem] object-cover"
                  />
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <Quote className="mt-1 h-5 w-5 shrink-0 text-[#D99AB9]" />

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold italic leading-7 text-[#55534C]">
                      "{item.phrase}"
                    </p>

                    {item.context ? (
                      <p className="mt-2 text-sm leading-6 text-[#746F64]">
                        {item.context}
                      </p>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#F0EAF8] px-3 py-1 text-xs font-black text-[#9A7BB7]">
                        {item.childName}
                      </span>

                      <span className="flex items-center gap-1 text-xs font-bold text-[#8A8378]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => sharePhrase(item)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8FA173] ring-1 ring-[#EFE4D6]"
                      aria-label="Partager"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ${
                        item.favorite
                          ? "bg-[#FBE6EF] text-[#D99AB9] ring-[#F3CDD3]"
                          : "bg-white text-[#B8B0A3] ring-[#EFE4D6]"
                      }`}
                      aria-label="Favori"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={item.favorite ? "currentColor" : "none"}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePhrase(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#B8B0A3] ring-1 ring-[#EFE4D6]"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      {showAddPopup && (
        <AddPhrasePopup
          childrenOptions={childOptions}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            resetForm();
            setShowAddPopup(false);
          }}
          onSave={handleAddPhrase}
        />
      )}
    </div>
  );
}