import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Heart,
  Plus,
  Quote,
  Search,
  Sparkles,
  Trash2,
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
    month: "long",
    day: "numeric",
  });
}

export default function MemorablePhrases({ children = [], onBack }) {
  const [phrases, setPhrases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    phrase: "",
    childId: "",
    date: getTodayDate(),
    context: "",
  });

  const childOptions = useMemo(() => {
    return children.map((child) => ({
      id: child.id || child.name,
      name: child.name || child.firstName || "Enfant",
    }));
  }, [children]);

  const filteredPhrases = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return phrases;

    return phrases.filter((item) => {
      return (
        item.phrase.toLowerCase().includes(normalizedSearch) ||
        item.context.toLowerCase().includes(normalizedSearch) ||
        item.childName.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [phrases, searchTerm]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
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
      childName: selectedChild?.name || "Général",
      date: formData.date || getTodayDate(),
      context: formData.context.trim(),
      favorite: false,
    };

    setPhrases((current) => [newPhrase, ...current]);

    setFormData({
      phrase: "",
      childId: "",
      date: getTodayDate(),
      context: "",
    });
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="relative bg-[#FFF7FB] p-5">
          <div className="absolute right-5 top-5 hidden h-20 w-20 rounded-full bg-[#F3D8E6] opacity-70 md:block" />
          <div className="absolute right-20 top-12 hidden h-8 w-8 rounded-full bg-[#E9B6CE] opacity-60 md:block" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D99AB9] text-white shadow-sm">
              <Quote className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#B8819C]">
                Souvenirs
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#55534C]">
                Phrases mémorables
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#746F64]">
                Gardez une trace des petites phrases, mots drôles, réflexions
                touchantes et moments spontanés des enfants.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D99AB9] text-white">
            <Plus className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-bold text-[#55534C]">Ajouter une phrase</h3>
            <p className="text-sm text-[#746F64]">
              Inscrivez la phrase exactement comme vous souhaitez la conserver.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-[#55534C]">
              Phrase mémorable
            </label>

            <textarea
              className={textareaClass}
              value={formData.phrase}
              onChange={(event) => handleChange("phrase", event.target.value)}
              placeholder='Ex. "Quand je serai grand, je vais être inventeur de dinosaures."'
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#55534C]">
              Associé à
            </label>

            <select
              className={inputClass}
              value={formData.childId}
              onChange={(event) => handleChange("childId", event.target.value)}
            >
              <option value="">Général</option>

              {childOptions.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-[#55534C]">Date</label>

            <input
              type="date"
              className={inputClass}
              value={formData.date}
              onChange={(event) => handleChange("date", event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-bold text-[#55534C]">
              Contexte ou souvenir lié
            </label>

            <input
              className={inputClass}
              value={formData.context}
              onChange={(event) => handleChange("context", event.target.value)}
              placeholder="Ex. Pendant le souper, après l’école, en voiture..."
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddPhrase}
          disabled={!formData.phrase.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D99AB9] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#C783A6] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          <Plus className="h-4 w-4" />
          Ajouter la phrase
        </button>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold text-[#55534C]">Souvenirs enregistrés</h3>
            <p className="text-sm text-[#746F64]">
              {phrases.length} phrase{phrases.length > 1 ? "s" : ""} conservée
              {phrases.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B0A3]" />

            <input
              className="w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] py-3 pl-11 pr-4 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher une phrase..."
            />
          </div>
        </div>

        {filteredPhrases.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[#E9D7C4] bg-[#FFFDF8] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF7FB] text-[#D99AB9]">
              <Sparkles className="h-7 w-7" />
            </div>

            <h4 className="mt-4 font-bold text-[#55534C]">
              Aucune phrase à afficher
            </h4>

            <p className="mt-2 text-sm leading-6 text-[#746F64]">
              Ajoutez une première phrase pour commencer à bâtir votre petit
              coffre à souvenirs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPhrases.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-[#EFE4D6] bg-[#FFFDF8] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-lg font-bold leading-7 text-[#55534C]">
                      “{item.phrase}”
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#746F64]">
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#EFE4D6]">
                        {item.childName}
                      </span>

                      <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[#EFE4D6]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(item.date)}
                      </span>
                    </div>

                    {item.context ? (
                      <p className="mt-3 text-sm leading-6 text-[#746F64]">
                        {item.context}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                        item.favorite
                          ? "bg-[#FBE6EF] text-[#D99AB9]"
                          : "bg-white text-[#B8B0A3] ring-1 ring-[#EFE4D6] hover:text-[#D99AB9]"
                      }`}
                      aria-label="Marquer comme favori"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={item.favorite ? "currentColor" : "none"}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePhrase(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#B8B0A3] ring-1 ring-[#EFE4D6] transition hover:text-[#C86D6D]"
                      aria-label="Supprimer la phrase"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl border border-[#EFE4D6] bg-white px-5 py-3 text-sm font-bold text-[#746F64] shadow-sm transition hover:bg-[#FFF7FB] md:hidden"
        >
          Retour au tableau de bord
        </button>
      ) : null}
    </div>
  );
}
