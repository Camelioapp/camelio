import React, { useEffect, useMemo, useState } from "react";
import {
  Baby,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Moon,
  Plus,
  Ruler,
  School,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";
const STORAGE_KEY = "camelio-carnet-souvenirs";

const tabs = [
  { id: "overview", label: "Aperçu", icon: Sparkles },
  { id: "before-birth", label: "Avant ma naissance", icon: Baby },
  { id: "timeline", label: "Ligne du temps", icon: School },
  { id: "growth", label: "Grandeurs", icon: Ruler },
  { id: "firsts", label: "Premiers moments", icon: Star },
  { id: "sleep", label: "Sommeil", icon: Moon },
  { id: "likes", label: "Ce que j’aime", icon: Heart },
  { id: "gallery", label: "Galerie", icon: ImageIcon },
  { id: "family", label: "Famille", icon: UsersRound },
  { id: "wins", label: "Succès", icon: Trophy },
  { id: "book", label: "Livre résumé", icon: BookOpen },
];

const memoryTypes = [
  { id: "ultrasound", label: "Échographie", tab: "before-birth" },
  { id: "pregnancy", label: "Souvenir de grossesse", tab: "before-birth" },
  { id: "school", label: "Rentrée scolaire", tab: "timeline" },
  { id: "annual_photo", label: "Photo annuelle", tab: "timeline" },
  { id: "growth", label: "Suivi de grandeur", tab: "growth" },
  { id: "first_step", label: "Premier pas", tab: "firsts" },
  { id: "first_word", label: "Premier mot", tab: "firsts" },
  { id: "first_tooth", label: "Première dent perdue", tab: "firsts" },
  { id: "hands_feet", label: "Photo des mains ou des pieds", tab: "firsts" },
  { id: "sleep", label: "Coucher et réveil", tab: "sleep" },
  { id: "likes", label: "Ce que j’aime", tab: "likes" },
  { id: "gallery", label: "Photo souvenir", tab: "gallery" },
  { id: "godparent", label: "Parrain ou marraine", tab: "family" },
  { id: "family_tree", label: "Arbre généalogique", tab: "family" },
  { id: "win", label: "Succès ou trophée", tab: "wins" },
  { id: "frame", label: "Cadre photo", tab: "gallery" },
];

const quickCards = [
  {
    tab: "before-birth",
    title: "Avant ma naissance",
    text: "Ajoutez les photos d’échographie, les souvenirs de grossesse et les messages écrits avant l’arrivée de l’enfant.",
    icon: Baby,
    color: "#B5A7C8",
  },
  {
    tab: "firsts",
    title: "Premiers moments",
    text: "Conservez les premiers pas, premiers mots, premières dents perdues, mains, pieds et petites grandes premières fois.",
    icon: Star,
    color: "#EAA5AF",
  },
  {
    tab: "growth",
    title: "Croissance",
    text: "Suivez les grandeurs, les étapes de croissance et les notes importantes au fil des années.",
    icon: Ruler,
    color: "#A8B193",
  },
  {
    tab: "book",
    title: "Livre résumé",
    text: "Consultez les souvenirs comme un petit livre, avec des pages construites à partir des sections remplies.",
    icon: BookOpen,
    color: "#EEC988",
  },
];

const emptyForm = {
  type: "ultrasound",
  title: "",
  date: "",
  note: "",
  pregnancyWeek: "",
  heightCm: "",
  bedtime: "",
  wakeTime: "",
  photo: "",
  sourcePhotoId: "",
};

function getChildName(child) {
  return child?.nickname || child?.name || child?.firstName || "Enfant";
}

function getMemoryType(memoryType) {
  return memoryTypes.find((type) => type.id === memoryType) || memoryTypes[0];
}

function getAgeTrackingLabel(child = {}) {
  if (!child.birthDate) return "Suivi annuel";

  const birth = new Date(`${child.birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "Suivi annuel";

  const today = new Date();
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    today.getMonth() -
    birth.getMonth();

  return months < 24 ? "Suivi mensuel recommandé" : "Suivi annuel recommandé";
}

function readStoredMemories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Erreur lecture carnet souvenir:", error);
    return [];
  }
}

function writeStoredMemories(memories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (error) {
    console.error("Erreur sauvegarde carnet souvenir:", error);
  }
}

function EntryCard({ entry, onDelete }) {
  const type = getMemoryType(entry.type);

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#EADFCF] bg-white shadow-sm">
      {entry.photo ? (
        <div className="h-44 overflow-hidden bg-[#F8F3EA]">
          <img src={entry.photo} alt={entry.title || type.label} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#A8B193]">
              {type.label}
            </p>
            <h4 className="mt-1 text-lg font-black text-[#4F4A45]">
              {entry.title || type.label}
            </h4>
          </div>

          {entry.date ? (
            <span className="rounded-full bg-[#F8F3EA] px-3 py-1 text-xs font-bold text-[#7D756E]">
              {entry.date}
            </span>
          ) : null}
        </div>

        <div className="mt-3 grid gap-2 text-sm text-[#6F665E]">
          {entry.pregnancyWeek ? <p>{entry.pregnancyWeek} semaine(s) de grossesse</p> : null}
          {entry.heightCm ? <p>Grandeur : {entry.heightCm} cm</p> : null}
          {entry.bedtime || entry.wakeTime ? (
            <p>
              Coucher : {entry.bedtime || "à compléter"}, réveil : {entry.wakeTime || "à compléter"}
            </p>
          ) : null}
          {entry.note ? <p className="leading-6">{entry.note}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="mt-4 rounded-full border border-[#EADFCF] px-4 py-2 text-xs font-bold text-[#8B8278] transition hover:bg-[#F8F3EA]"
        >
          Retirer
        </button>
      </div>
    </article>
  );
}

export default function CarnetSouvenirs({ children = [], onBack = () => {} }) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || "");
  const [activeTab, setActiveTab] = useState("overview");
  const [memories, setMemories] = useState(() => readStoredMemories());
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [bookPageIndex, setBookPageIndex] = useState(0);

  useEffect(() => {
    if (!selectedChildId && children[0]?.id) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    let mounted = true;

    async function loadPhotos() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/photos`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        if (!mounted || !response.ok) return;

        const serverPhotos = Array.isArray(data.photos) ? data.photos : [];
        setPhotos(serverPhotos);
      } catch (error) {
        console.error("Erreur chargement photos pour carnet souvenir:", error);
      }
    }

    loadPhotos();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    writeStoredMemories(memories);
  }, [memories]);

  const selectedChild = useMemo(() => {
    return children.find((child) => child.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const childMemories = useMemo(() => {
    return memories
      .filter((memory) => memory.childId === selectedChild?.id)
      .sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
  }, [memories, selectedChild]);

  const visibleMemories = useMemo(() => {
    if (activeTab === "overview" || activeTab === "book") return childMemories;

    return childMemories.filter((memory) => getMemoryType(memory.type).tab === activeTab);
  }, [activeTab, childMemories]);

  const bookPages = useMemo(() => {
    const introPage = {
      id: "intro",
      title: `Le carnet de ${getChildName(selectedChild)}`,
      note: "Un résumé doux des moments importants, des photos, des premières fois et des souvenirs précieux.",
      type: "book",
      photo: selectedChild?.photo || selectedChild?.image || selectedChild?.avatar || "",
    };

    return [introPage, ...childMemories].filter(Boolean);
  }, [childMemories, selectedChild]);

  const selectedSourcePhotos = useMemo(() => {
    if (!selectedChild?.id) return photos.slice(0, 12);

    return photos
      .filter((photo) => {
        const childIds = Array.isArray(photo.children) ? photo.children : [];
        return childIds.length === 0 || childIds.includes(selectedChild.id) || photo.childId === selectedChild.id;
      })
      .slice(0, 12);
  }, [photos, selectedChild]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type?.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateForm("photo", String(reader.result || ""));
      updateForm("sourcePhotoId", "");
    };
    reader.readAsDataURL(file);
  }

  function selectExistingPhoto(photo) {
    const url = photo.url || photo.photoUrl || photo.downloadUrl || photo.image || photo.src || "";
    if (!url) return;

    setForm((current) => ({
      ...current,
      photo: url,
      sourcePhotoId: photo.id || photo.photoId || "",
    }));
  }

  function addMemory() {
    if (!selectedChild) return;

    const type = getMemoryType(form.type);
    const title = form.title.trim() || type.label;

    const entry = {
      id: `memory-${Date.now()}`,
      childId: selectedChild.id,
      type: form.type,
      title,
      date: form.date,
      note: form.note.trim(),
      pregnancyWeek: form.pregnancyWeek,
      heightCm: form.heightCm,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
      photo: form.photo,
      sourcePhotoId: form.sourcePhotoId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMemories((current) => [entry, ...current]);
    setActiveTab(type.tab);
    setForm({ ...emptyForm, type: form.type });
    setBookPageIndex(0);
  }

  function deleteMemory(memoryId) {
    setMemories((current) => current.filter((memory) => memory.id !== memoryId));
    setBookPageIndex(0);
  }

  if (children.length === 0) {
    return (
      <div className="rounded-[30px] border border-[#EADFCF] bg-white p-8 text-center shadow-sm">
        <BookOpen className="mx-auto h-12 w-12 text-[#B5A7C8]" />
        <h2 className="mt-4 text-2xl font-black text-[#4F4A45]">Carnet souvenir</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7D756E]">
          Ajoutez d’abord un profil enfant pour créer ses souvenirs, ses photos d’échographie, ses premières fois et son livre résumé.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-black text-white"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const currentBookPage = bookPages[Math.min(bookPageIndex, bookPages.length - 1)] || bookPages[0];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-[#EADFCF] bg-[#FFFDF8] shadow-sm">
        <div className="grid gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B5A7C8]">
              Carnet souvenir
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-[#4F4A45]">
              Les moments précieux de {getChildName(selectedChild)}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F665E]">
              Rassemblez les échographies, la rentrée scolaire, les premiers moments, les grandeurs, les habitudes de sommeil, les goûts, les succès et les photos préférées dans un seul carnet.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#EADFCF] bg-white p-4">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-[#A8B193]">
              Profil enfant
            </label>
            <select
              value={selectedChild?.id || ""}
              onChange={(event) => setSelectedChildId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#4F4A45] outline-none focus:border-[#A8B193]"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {getChildName(child)}
                </option>
              ))}
            </select>
            <div className="mt-4 rounded-2xl bg-[#F8F3EA] px-4 py-3 text-xs font-bold text-[#7D756E]">
              {getAgeTrackingLabel(selectedChild)} pour la section “Ce que j’aime”.
            </div>
          </div>
        </div>

        <div className="border-t border-[#EADFCF] bg-white/70 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition ${
                    active
                      ? "bg-[#B5A7C8] text-white shadow-sm"
                      : "bg-white text-[#7D756E] hover:bg-[#F8F3EA]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.tab}
                type="button"
                onClick={() => setActiveTab(card.tab)}
                className="rounded-[28px] border border-[#EADFCF] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: card.color }}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-black text-[#4F4A45]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#7D756E]">{card.text}</p>
              </button>
            );
          })}
        </div>
      ) : null}

      {activeTab === "book" ? (
        <div className="rounded-[34px] border border-[#EADFCF] bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A8B193]">Livre résumé</p>
              <h3 className="mt-1 text-2xl font-black text-[#4F4A45]">Feuilleter le carnet</h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBookPageIndex((current) => Math.max(0, current - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFCF] text-[#7D756E]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setBookPageIndex((current) => Math.min(bookPages.length - 1, current + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFCF] text-[#7D756E]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mx-auto grid min-h-[360px] max-w-3xl overflow-hidden rounded-[32px] border border-[#EADFCF] bg-[#FFFDF8] shadow-inner md:grid-cols-2">
            <div className="flex items-center justify-center bg-[#F8F3EA] p-6">
              {currentBookPage?.photo ? (
                <img src={currentBookPage.photo} alt={currentBookPage.title} className="max-h-[300px] rounded-[24px] object-cover shadow-sm" />
              ) : (
                <BookOpen className="h-20 w-20 text-[#B5A7C8]" />
              )}
            </div>
            <div className="flex flex-col justify-center p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B5A7C8]">
                Page {bookPageIndex + 1} de {bookPages.length}
              </p>
              <h4 className="mt-2 text-2xl font-black text-[#4F4A45]">
                {currentBookPage?.title || "Souvenir"}
              </h4>
              {currentBookPage?.date ? <p className="mt-2 text-sm font-bold text-[#8B8278]">{currentBookPage.date}</p> : null}
              <p className="mt-4 text-sm leading-7 text-[#6F665E]">
                {currentBookPage?.note || "Ajoutez des souvenirs pour enrichir ce livre résumé."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab !== "book" ? (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="rounded-[34px] border border-[#EADFCF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A8B193] text-white">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A8B193]">Ajouter</p>
                <h3 className="text-lg font-black text-[#4F4A45]">Nouveau souvenir</h3>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Type</span>
                <select
                  value={form.type}
                  onChange={(event) => updateForm("type", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#4F4A45] outline-none"
                >
                  {memoryTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Titre</span>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Exemple : Première échographie"
                  className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none"
                />
              </label>

              {form.type === "ultrasound" || form.type === "pregnancy" ? (
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Semaines de grossesse</span>
                  <input
                    type="number"
                    min="1"
                    max="42"
                    value={form.pregnancyWeek}
                    onChange={(event) => updateForm("pregnancyWeek", event.target.value)}
                    placeholder="Exemple : 12"
                    className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none"
                  />
                </label>
              ) : null}

              {form.type === "growth" ? (
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Grandeur en cm</span>
                  <input
                    type="number"
                    min="0"
                    value={form.heightCm}
                    onChange={(event) => updateForm("heightCm", event.target.value)}
                    placeholder="Exemple : 92"
                    className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none"
                  />
                </label>
              ) : null}

              {form.type === "sleep" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Coucher</span>
                    <input type="time" value={form.bedtime} onChange={(event) => updateForm("bedtime", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Réveil</span>
                    <input type="time" value={form.wakeTime} onChange={(event) => updateForm("wakeTime", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
                  </label>
                </div>
              ) : null}

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Note</span>
                <textarea
                  value={form.note}
                  onChange={(event) => updateForm("note", event.target.value)}
                  rows={4}
                  placeholder="Ajoutez un petit souvenir, une phrase, une émotion ou un détail important."
                  className="mt-2 w-full resize-none rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none"
                />
              </label>

              <div className="rounded-[24px] border border-dashed border-[#D8C8B6] bg-[#FFFDF8] p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">
                  <Camera className="h-4 w-4" />
                  Photo
                </div>

                {form.photo ? (
                  <img src={form.photo} alt="Aperçu" className="mt-3 h-32 w-full rounded-2xl object-cover" />
                ) : null}

                <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#6F665E] hover:bg-[#F8F3EA]">
                  Importer une photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>

                {selectedSourcePhotos.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold text-[#8B8278]">Ou choisir depuis la section Photos</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedSourcePhotos.map((photo, index) => {
                        const url = photo.url || photo.photoUrl || photo.downloadUrl || photo.image || photo.src || "";
                        if (!url) return null;

                        return (
                          <button key={photo.id || photo.photoId || index} type="button" onClick={() => selectExistingPhoto(photo)} className="aspect-square overflow-hidden rounded-2xl border border-[#EADFCF] bg-white">
                            <img src={url} alt="Photo existante" className="h-full w-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={addMemory}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A8B193] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95"
              >
                <CheckCircle2 className="h-5 w-5" />
                Ajouter au carnet
              </button>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B5A7C8]">
                  {tabs.find((tab) => tab.id === activeTab)?.label || "Souvenirs"}
                </p>
                <h3 className="mt-1 text-2xl font-black text-[#4F4A45]">
                  {visibleMemories.length} souvenir{visibleMemories.length > 1 ? "s" : ""}
                </h3>
              </div>
            </div>

            {visibleMemories.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#D8C8B6] bg-white text-center">
                <Sparkles className="h-12 w-12 text-[#B5A7C8]" />
                <h4 className="mt-4 text-lg font-black text-[#4F4A45]">Aucun souvenir ici pour le moment</h4>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#7D756E]">
                  Ajoutez une échographie, une première fois, une grandeur, une photo ou une réussite pour remplir cette section.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {visibleMemories.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onDelete={deleteMemory} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
