import React, { useEffect, useMemo, useState } from "react";
import {
  Baby,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Footprints,
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
  WandSparkles,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";
const STORAGE_KEY = "camelio-carnet-souvenirs";

const chapters = [
  {
    id: "before-birth",
    label: "Avant ma naissance",
    shortLabel: "Avant ma naissance",
    icon: Baby,
    accent: "#A2BADF",
    soft: "#EEF5FB",
    description: "Échographies, souvenirs de grossesse et messages avant l’arrivée.",
  },
  {
    id: "firsts",
    label: "Premiers moments",
    shortLabel: "Premiers moments",
    icon: Star,
    accent: "#EAA5AF",
    soft: "#FBECEF",
    description: "Premiers pas, premiers mots, premières dents, mains et pieds.",
  },
  {
    id: "growth",
    label: "Croissance",
    shortLabel: "Croissance",
    icon: Ruler,
    accent: "#EEC988",
    soft: "#FFF7E7",
    description: "Grandeurs, photos et notes de croissance au fil du temps.",
  },
  {
    id: "family",
    label: "Famille",
    shortLabel: "Famille",
    icon: UsersRound,
    accent: "#B5A7C8",
    soft: "#F4F0FA",
    description: "Arbre généalogique, parrain, marraine et personnes importantes.",
  },
  {
    id: "wins",
    label: "Succès et plus",
    shortLabel: "Succès et plus",
    icon: Trophy,
    accent: "#E8A07E",
    soft: "#FFF1EA",
    description: "Réussites, trophées, photos favorites et petites victoires.",
  },
  {
    id: "timeline",
    label: "Ligne du temps",
    shortLabel: "Photos annuelles",
    icon: School,
    accent: "#A8B193",
    soft: "#EEF0E7",
    description: "Photo annuelle et rentrée scolaire, année après année.",
  },
  {
    id: "sleep",
    label: "Sommeil",
    shortLabel: "Sommeil",
    icon: Moon,
    accent: "#8FB8DE",
    soft: "#EEF5FB",
    description: "Heures de coucher, réveil et petites routines.",
  },
  {
    id: "likes",
    label: "Ce que j’aime",
    shortLabel: "J’aime",
    icon: Heart,
    accent: "#EAA5AF",
    soft: "#FBECEF",
    description: "Goûts mensuels les deux premières années, puis annuels.",
  },
  {
    id: "gallery",
    label: "Galerie souvenir",
    shortLabel: "Galerie",
    icon: ImageIcon,
    accent: "#D4A85F",
    soft: "#FFF8EC",
    description: "Photos choisies depuis la section Photos et cadres favoris.",
  },
];

const memoryTypes = [
  { id: "ultrasound", label: "Échographie", chapter: "before-birth" },
  { id: "pregnancy", label: "Souvenir de grossesse", chapter: "before-birth" },
  { id: "school", label: "Rentrée scolaire", chapter: "timeline" },
  { id: "annual_photo", label: "Photo annuelle", chapter: "timeline" },
  { id: "growth", label: "Suivi de grandeur", chapter: "growth" },
  { id: "first_step", label: "Premier pas", chapter: "firsts" },
  { id: "first_word", label: "Premier mot", chapter: "firsts" },
  { id: "first_tooth", label: "Première dent perdue", chapter: "firsts" },
  { id: "hands_feet", label: "Photo des mains ou des pieds", chapter: "firsts" },
  { id: "sleep", label: "Coucher et réveil", chapter: "sleep" },
  { id: "likes", label: "Ce que j’aime", chapter: "likes" },
  { id: "gallery", label: "Photo souvenir", chapter: "gallery" },
  { id: "godparent", label: "Parrain ou marraine", chapter: "family" },
  { id: "family_tree", label: "Arbre généalogique", chapter: "family" },
  { id: "win", label: "Succès ou trophée", chapter: "wins" },
  { id: "frame", label: "Cadre photo", chapter: "gallery" },
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

function getChapter(chapterId) {
  return chapters.find((chapter) => chapter.id === chapterId) || chapters[0];
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

function MemoryCard({ entry, onDelete }) {
  const type = getMemoryType(entry.type);
  const chapter = getChapter(type.chapter);

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
            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: chapter.accent }}>
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

function BookCover({ child, memories, onOpen }) {
  const childName = getChildName(child);
  const coverPhoto =
    child?.photo ||
    child?.image ||
    child?.avatar ||
    memories.find((memory) => memory.photo)?.photo ||
    "";

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#EADFCF] bg-[#FFF7EE] p-5 shadow-[0_16px_45px_rgba(79,74,69,0.10)]">
      <div className="absolute -left-8 top-10 h-44 w-12 rounded-full bg-white/70 blur-sm" />
      <div className="absolute right-6 top-7 text-[#EEC988]">
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="absolute bottom-8 left-10 text-[#EEC988]">
        <Sparkles className="h-5 w-5" />
      </div>

      <div className="relative mx-auto max-w-md rounded-[28px] bg-[#FFFDF8] px-6 py-7 text-center shadow-[inset_0_0_0_1px_rgba(234,223,207,0.9),0_18px_35px_rgba(79,74,69,0.12)]">
        <p className="font-serif text-lg font-bold leading-tight text-[#A35A4D]">
          Le livre souvenir
          <br />
          de {childName}
        </p>
        <p className="mt-1 text-xs font-semibold text-[#8B8278]">
          {memories.length} souvenir{memories.length > 1 ? "s" : ""} conservé{memories.length > 1 ? "s" : ""}
        </p>

        <div className="relative mx-auto mt-5 flex h-36 w-36 items-center justify-center rounded-full bg-[#F8F3EA] p-2 shadow-inner">
          {coverPhoto ? (
            <img src={coverPhoto} alt={childName} className="h-full w-full rounded-full object-cover" />
          ) : (
            <BookOpen className="h-14 w-14 text-[#B5A7C8]" />
          )}
          <span className="absolute -bottom-2 -left-2 rounded-full bg-[#F4F0FA] p-2 text-[#B5A7C8]">
            <Heart className="h-5 w-5" />
          </span>
          <span className="absolute -right-2 top-4 rounded-full bg-[#FFF8EC] p-2 text-[#EEC988]">
            <Star className="h-5 w-5" />
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-6 rounded-full bg-[#E98EA1] px-8 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95"
        >
          Ouvrir le livre
        </button>
      </div>
    </div>
  );
}

function ChapterButton({ chapter, count, active, onClick }) {
  const Icon = chapter.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[92px] rounded-[22px] border p-3 text-center shadow-sm transition hover:-translate-y-0.5 ${
        active ? "border-[#B5A7C8] bg-[#FFFDF8]" : "border-[#EADFCF] bg-white"
      }`}
    >
      <span
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl"
        style={{ backgroundColor: chapter.soft, color: chapter.accent }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-2 block text-[11px] font-black leading-tight text-[#4F4A45]">
        {chapter.shortLabel}
      </span>
      <span className="mt-1 block text-[10px] font-bold text-[#9A948C]">
        {count} élément{count > 1 ? "s" : ""}
      </span>
    </button>
  );
}

export default function CarnetSouvenirs({ children = [], onBack = () => {} }) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || "");
  const [activeChapter, setActiveChapter] = useState("overview");
  const [memories, setMemories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [bookPageIndex, setBookPageIndex] = useState(0);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState("");

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

        setPhotos(Array.isArray(data.photos) ? data.photos : []);
      } catch (error) {
        console.error("Erreur chargement photos pour carnet souvenir:", error);
      }
    }

    async function loadMemoryBook() {
      setIsLoadingMemories(true);
      setMemoryError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/memory-book`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger le carnet souvenir.");
        }

        let serverMemories = Array.isArray(data.memories) ? data.memories : [];
        const localMemories = readStoredMemories();

        if (serverMemories.length === 0 && localMemories.length > 0) {
          const migratedMemories = [];

          for (const memory of localMemories) {
            try {
              const migrationResponse = await fetch(`${API_BASE_URL}/api/memory-book`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...memory,
                  photo: String(memory.photo || "").startsWith("https://") ? memory.photo : "",
                }),
              });

              const migrationData = await migrationResponse.json().catch(() => ({}));
              if (migrationResponse.ok && migrationData.memory) {
                migratedMemories.push(migrationData.memory);
              }
            } catch (error) {
              console.error("Erreur migration carnet souvenir:", error);
            }
          }

          if (migratedMemories.length > 0) {
            localStorage.removeItem(STORAGE_KEY);
            serverMemories = migratedMemories;
          }
        }

        setMemories(serverMemories);
      } catch (error) {
        console.error("Erreur chargement carnet souvenir:", error);
        if (mounted) setMemoryError(error?.message || "Impossible de charger le carnet souvenir.");
      } finally {
        if (mounted) setIsLoadingMemories(false);
      }
    }

    loadPhotos();
    loadMemoryBook();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedChild = useMemo(() => {
    return children.find((child) => child.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const childMemories = useMemo(() => {
    return memories
      .filter((memory) => memory.childId === selectedChild?.id)
      .map((memory) => ({ ...memory, photo: getMemoryPhoto(memory) }))
      .sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
  }, [memories, selectedChild, photos]);

  const chapterCounts = useMemo(() => {
    return chapters.reduce((acc, chapter) => {
      acc[chapter.id] = childMemories.filter((memory) => getMemoryType(memory.type).chapter === chapter.id).length;
      return acc;
    }, {});
  }, [childMemories]);

  const visibleMemories = useMemo(() => {
    if (activeChapter === "overview" || activeChapter === "book") return childMemories;
    return childMemories.filter((memory) => getMemoryType(memory.type).chapter === activeChapter);
  }, [activeChapter, childMemories]);

  const bookPages = useMemo(() => {
    const introPage = {
      id: "intro",
      title: `Le livre souvenir de ${getChildName(selectedChild)}`,
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
    event.target.value = "";
    setMemoryError("Pour conserver une photo dans le carnet, ajoutez-la d’abord dans la section Photos, puis sélectionnez-la ici.");
  }

  function selectExistingPhoto(photo) {
    const url = photo.url || photo.photoUrl || photo.downloadUrl || photo.image || photo.src || "";
    if (!url) return;

    setMemoryError("");
    setForm((current) => ({
      ...current,
      photo: url,
      sourcePhotoId: photo.id || photo.photoId || "",
    }));
  }

  function getMemoryPhoto(memory) {
    if (memory.sourcePhotoId) {
      const sourcePhoto = photos.find((photo) => {
        const photoId = photo.id || photo.photoId || "";
        return photoId === memory.sourcePhotoId;
      });

      const sourceUrl = sourcePhoto?.url || sourcePhoto?.photoUrl || sourcePhoto?.downloadUrl || sourcePhoto?.image || sourcePhoto?.src || "";
      if (sourceUrl) return sourceUrl;
    }

    return String(memory.photo || "").startsWith("https://") ? memory.photo : "";
  }

  async function addMemory() {
    if (!selectedChild || isSavingMemory) return;

    const type = getMemoryType(form.type);
    const title = form.title.trim() || type.label;
    const payload = {
      childId: selectedChild.id,
      type: form.type,
      title,
      date: form.date,
      note: form.note.trim(),
      pregnancyWeek: form.pregnancyWeek,
      heightCm: form.heightCm,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
      photo: String(form.photo || "").startsWith("https://") ? form.photo : "",
      sourcePhotoId: form.sourcePhotoId,
    };

    setIsSavingMemory(true);
    setMemoryError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/memory-book`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible d’ajouter ce souvenir.");
      }

      setMemories((current) => [data.memory, ...current].filter(Boolean));
      setActiveChapter(type.chapter);
      setForm({ ...emptyForm, type: form.type });
      setBookPageIndex(0);
    } catch (error) {
      console.error("Erreur ajout souvenir:", error);
      setMemoryError(error?.message || "Impossible d’ajouter ce souvenir.");
    } finally {
      setIsSavingMemory(false);
    }
  }

  async function deleteMemory(memoryId) {
    if (!memoryId) return;

    setMemoryError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/memory-book/${encodeURIComponent(memoryId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de retirer ce souvenir.");
      }

      setMemories((current) => current.filter((memory) => memory.id !== memoryId));
      setBookPageIndex(0);
    } catch (error) {
      console.error("Erreur suppression souvenir:", error);
      setMemoryError(error?.message || "Impossible de retirer ce souvenir.");
    }
  }

  if (children.length === 0) {
    return (
      <div className="rounded-[30px] border border-[#EADFCF] bg-white p-8 text-center shadow-sm">
        <BookOpen className="mx-auto h-12 w-12 text-[#B5A7C8]" />
        <h2 className="mt-4 text-2xl font-black text-[#4F4A45]">Carnet souvenir</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7D756E]">
          Ajoutez d’abord un profil enfant pour créer ses souvenirs, ses photos d’échographie, ses premières fois et son livre résumé.
        </p>
        <button type="button" onClick={onBack} className="mt-5 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-black text-white">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const selectedMemoryType = getMemoryType(form.type);
  const selectedMemoryChapter = getChapter(selectedMemoryType.chapter);
  const currentBookPage = bookPages[Math.min(bookPageIndex, bookPages.length - 1)] || bookPages[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[34px] border border-[#EADFCF] bg-[#FFFDF8] p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A8B193]">Carnet souvenir</p>
            <h2 className="mt-1 text-2xl font-black text-[#4F4A45]">Livre résumé</h2>
          </div>

          <select
            value={selectedChild?.id || ""}
            onChange={(event) => setSelectedChildId(event.target.value)}
            className="max-w-[210px] rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-sm font-bold text-[#4F4A45] shadow-sm outline-none focus:border-[#A8B193]"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {getChildName(child)}
              </option>
            ))}
          </select>
        </div>

        <BookCover child={selectedChild} memories={childMemories} onOpen={() => setActiveChapter("book")} />

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[#4F4A45]">Aperçu des chapitres</h3>
            <span className="rounded-full bg-[#F8F3EA] px-3 py-1 text-xs font-bold text-[#8B8278]">
              {getAgeTrackingLabel(selectedChild)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {chapters.slice(0, 5).map((chapter) => (
              <ChapterButton
                key={chapter.id}
                chapter={chapter}
                count={chapterCounts[chapter.id] || 0}
                active={activeChapter === chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
              />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {chapters.slice(5).map((chapter) => (
              <ChapterButton
                key={chapter.id}
                chapter={chapter}
                count={chapterCounts[chapter.id] || 0}
                active={activeChapter === chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {activeChapter === "book" ? (
        <section className="rounded-[34px] border border-[#EADFCF] bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A8B193]">Livre résumé</p>
              <h3 className="mt-1 text-2xl font-black text-[#4F4A45]">Feuilleter le carnet</h3>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setBookPageIndex((current) => Math.max(0, current - 1))} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFCF] text-[#7D756E]">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setBookPageIndex((current) => Math.min(bookPages.length - 1, current + 1))} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFCF] text-[#7D756E]">
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
        </section>
      ) : null}

      {activeChapter !== "book" ? (
        <div className="grid gap-5 lg:grid-cols-[370px_1fr]">
          <section className="rounded-[34px] border border-[#EADFCF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: selectedMemoryChapter.accent }}>
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: selectedMemoryChapter.accent }}>Ajouter</p>
                <h3 className="text-lg font-black text-[#4F4A45]">Nouveau souvenir</h3>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Type</span>
                <select value={form.type} onChange={(event) => updateForm("type", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#4F4A45] outline-none">
                  {memoryTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Titre</span>
                <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Exemple : Première échographie" className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Date</span>
                <input type="date" value={form.date} onChange={(event) => updateForm("date", event.target.value)} className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
              </label>

              {form.type === "ultrasound" || form.type === "pregnancy" ? (
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Semaines de grossesse</span>
                  <input type="number" min="1" max="42" value={form.pregnancyWeek} onChange={(event) => updateForm("pregnancyWeek", event.target.value)} placeholder="Exemple : 12" className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
                </label>
              ) : null}

              {form.type === "growth" ? (
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">Grandeur en cm</span>
                  <input type="number" min="0" value={form.heightCm} onChange={(event) => updateForm("heightCm", event.target.value)} placeholder="Exemple : 92" className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
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
                <textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} rows={4} placeholder="Ajoutez un petit souvenir, une phrase, une émotion ou un détail important." className="mt-2 w-full resize-none rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#4F4A45] outline-none" />
              </label>

              <div className="rounded-[24px] border border-dashed border-[#D8C8B6] bg-[#FFFDF8] p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#A8B193]">
                  <Camera className="h-4 w-4" />
                  Photo
                </div>

                {form.photo ? <img src={form.photo} alt="Aperçu" className="mt-3 h-32 w-full rounded-2xl object-cover" /> : null}

                <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#6F665E] hover:bg-[#F8F3EA]">
                  Importer depuis Photos d’abord
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

              {memoryError ? (
                <p className="rounded-2xl border border-[#EAA5AF]/40 bg-[#FBECEF] px-4 py-3 text-sm font-bold leading-5 text-[#9A4E5B]">
                  {memoryError}
                </p>
              ) : null}

              <button type="button" onClick={addMemory} disabled={isSavingMemory} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A8B193] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60">
                <CheckCircle2 className="h-5 w-5" />
                {isSavingMemory ? "Ajout en cours..." : "Ajouter au carnet"}
              </button>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#EADFCF] bg-[#FFFDF8] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: activeChapter === "overview" ? "#B5A7C8" : getChapter(activeChapter).accent }}>
                  {activeChapter === "overview" ? "Tous les souvenirs" : getChapter(activeChapter).label}
                </p>
                <h3 className="mt-1 text-2xl font-black text-[#4F4A45]">
                  {visibleMemories.length} souvenir{visibleMemories.length > 1 ? "s" : ""}
                </h3>
              </div>

              <button type="button" onClick={() => setActiveChapter("overview")} className="rounded-full border border-[#EADFCF] bg-white px-4 py-2 text-xs font-bold text-[#7D756E] hover:bg-[#F8F3EA]">
                Voir tout
              </button>
            </div>

            {activeChapter === "overview" ? (
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-[#EADFCF] bg-white p-4">
                  <Sparkles className="h-5 w-5 text-[#EEC988]" />
                  <p className="mt-2 text-2xl font-black text-[#4F4A45]">{childMemories.length}</p>
                  <p className="text-xs font-bold text-[#8B8278]">souvenirs conservés</p>
                </div>
                <div className="rounded-[24px] border border-[#EADFCF] bg-white p-4">
                  <Footprints className="h-5 w-5 text-[#EAA5AF]" />
                  <p className="mt-2 text-2xl font-black text-[#4F4A45]">{chapterCounts.firsts || 0}</p>
                  <p className="text-xs font-bold text-[#8B8278]">premiers moments</p>
                </div>
                <div className="rounded-[24px] border border-[#EADFCF] bg-white p-4">
                  <WandSparkles className="h-5 w-5 text-[#B5A7C8]" />
                  <p className="mt-2 text-2xl font-black text-[#4F4A45]">{childMemories.filter((memory) => memory.photo).length}</p>
                  <p className="text-xs font-bold text-[#8B8278]">photos ajoutées</p>
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-[24px] border border-[#EADFCF] bg-white p-4">
                <p className="text-sm font-bold leading-6 text-[#6F665E]">{getChapter(activeChapter).description}</p>
              </div>
            )}

            {isLoadingMemories ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#D8C8B6] bg-white text-center">
                <Sparkles className="h-10 w-10 animate-pulse text-[#B5A7C8]" />
                <p className="mt-3 text-sm font-bold text-[#7D756E]">Chargement du carnet souvenir...</p>
              </div>
            ) : visibleMemories.length === 0 ? (
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
                  <MemoryCard key={entry.id} entry={entry} onDelete={deleteMemory} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
