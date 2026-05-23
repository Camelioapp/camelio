import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Heart,
  ImagePlus,
  Palette,
  Quote,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]";

const textareaClass =
  "mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]";

const brandColors = [
  { id: "rose", label: "Rose", value: "#FCEEF3" },
  { id: "sauge", label: "Sauge", value: "#EEF4E8" },
  { id: "mauve", label: "Mauve", value: "#F2EAFB" },
  { id: "bleu", label: "Bleu", value: "#EDF5FF" },
  { id: "dore", label: "Doré", value: "#FFF5DF" },
];

const illustrationChoices = [
  { id: "clouds", label: "Nuages", icon: "☁️" },
  { id: "stars", label: "Étoiles", icon: "✨" },
  { id: "heart", label: "Coeur", icon: "💛" },
  { id: "sun", label: "Soleil", icon: "☀️" },
  { id: "none", label: "Aucune", icon: "" },
];

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
    month: "2-digit",
    day: "2-digit",
  });
}

function getMonthValue(date) {
  if (!date) return "";
  return date.slice(5, 7);
}

function getYearValue(date) {
  if (!date) return "";
  return date.slice(0, 4);
}

function displayChildName(child) {
  if (!child) return "Enfant";
  return child.nickname || child.firstName || child.name || "Enfant";
}

function getChildPhoto(childOptions, childId) {
  const child = childOptions.find(
    (item) => String(item.id) === String(childId)
  );

  return child?.photo || "";
}

function getChildName(childOptions, childId, fallback = "Non précisé") {
  const child = childOptions.find(
    (item) => String(item.id) === String(childId)
  );

  return child?.name || fallback;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);

  return lines;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function createShareImageBlob({ phrase, options }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");
  const background = options.backgroundColor || "#FCEEF3";

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  roundedRect(ctx, 70, 80, 940, 1190, 46);
  ctx.fill();

  if (options.illustration !== "none") {
    const selectedIllustration = illustrationChoices.find(
      (item) => item.id === options.illustration
    );

    ctx.font = "96px Arial";
    ctx.globalAlpha = 0.9;
    ctx.fillText(selectedIllustration?.icon || "✨", 810, 210);
    ctx.fillText(selectedIllustration?.icon || "✨", 100, 1160);
    ctx.globalAlpha = 1;
  }

  if (options.includeChildPhoto && phrase.childPhoto) {
    const childImage = await loadImage(phrase.childPhoto);

    if (childImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 245, 82, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(childImage, 458, 163, 164, 164);
      ctx.restore();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(540, 245, 88, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#D99AB9";
  ctx.font = "bold 82px Georgia";
  ctx.fillText("“", 120, 310);

  ctx.fillStyle = "#3F3D38";
  ctx.font = "bold italic 48px Georgia";

  const phraseLines = wrapText(ctx, phrase.phrase, 760);
  let y = options.includeChildPhoto && phrase.childPhoto ? 440 : 360;

  phraseLines.slice(0, 7).forEach((line) => {
    ctx.fillText(line, 150, y);
    y += 70;
  });

  ctx.fillStyle = "#8FA173";
  roundedRect(ctx, 150, y + 35, 260, 58, 29);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px Arial";
  ctx.fillText(phrase.childName || "Non précisé", 185, y + 73);

  ctx.fillStyle = "#746F64";
  ctx.font = "bold 28px Arial";
  ctx.fillText(formatDate(phrase.date), 690, y + 73);

  if (phrase.context) {
    ctx.fillStyle = "#746F64";
    ctx.font = "28px Arial";
    const contextLines = wrapText(ctx, phrase.context, 760);
    let contextY = y + 150;

    contextLines.slice(0, 3).forEach((line) => {
      ctx.fillText(line, 150, contextY);
      contextY += 44;
    });
  }

  ctx.fillStyle = "#A8B193";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Propulsé par Camelio", 150, 1190);

  ctx.fillStyle = "#746F64";
  ctx.font = "26px Arial";
  ctx.fillText("camelio.app", 150, 1230);

  const logo = await loadImage("/Logo/Camelio.png");

  if (logo) {
    ctx.drawImage(logo, 760, 1150, 150, 150);
  } else {
    ctx.fillStyle = "#8FA173";
    ctx.font = "bold 40px Arial";
    ctx.fillText("Camelio", 750, 1210);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
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
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ring-1 transition ${
                    selectedChildId === child.id
                      ? "bg-[#8FA173] text-white ring-[#8FA173]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  {child.photo ? (
                    <img
                      src={child.photo}
                      alt={child.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : null}

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

function ShareImagePopup({ phrase, onClose, onShare }) {
  const [options, setOptions] = useState({
    backgroundColor: "#FCEEF3",
    illustration: "clouds",
    includeChildPhoto: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#3F3D38]">
              Créer une image
            </h3>

            <p className="mt-1 text-sm text-[#746F64]">
              Personnalise l’image avant de la partager.
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

        <div
          className="rounded-[2rem] p-5 ring-1 ring-[#EFE4D6]"
          style={{ backgroundColor: options.backgroundColor }}
        >
          <div className="rounded-[1.5rem] bg-white/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <Quote className="h-7 w-7 text-[#D99AB9]" />

              {options.illustration !== "none" ? (
                <span className="text-3xl">
                  {
                    illustrationChoices.find(
                      (item) => item.id === options.illustration
                    )?.icon
                  }
                </span>
              ) : null}
            </div>

            {options.includeChildPhoto && phrase.childPhoto ? (
              <img
                src={phrase.childPhoto}
                alt={phrase.childName}
                className="mx-auto mt-4 h-20 w-20 rounded-full object-cover ring-4 ring-white"
              />
            ) : null}

            <p className="mt-5 text-center text-lg font-black italic leading-8 text-[#3F3D38]">
              “{phrase.phrase}”
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#8FA173] px-4 py-2 text-xs font-black text-white">
                {phrase.childName}
              </span>

              <span className="text-xs font-bold text-[#746F64]">
                {formatDate(phrase.date)}
              </span>
            </div>

            <div className="mt-6 border-t border-white/70 pt-4">
              <p className="text-xs font-black text-[#8FA173]">
                Propulsé par Camelio
              </p>
              <p className="text-xs font-bold text-[#746F64]">camelio.app</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#8A8378]" />
              <p className="text-sm font-black text-[#55534C]">
                Couleur du fond
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {brandColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() =>
                    setOptions((current) => ({
                      ...current,
                      backgroundColor: color.value,
                    }))
                  }
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ring-1 ${
                    options.backgroundColor === color.value
                      ? "bg-[#55534C] text-white ring-[#55534C]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full ring-1 ring-black/5"
                    style={{ backgroundColor: color.value }}
                  />
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-[#55534C]">Illustration</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {illustrationChoices.map((illustration) => (
                <button
                  key={illustration.id}
                  type="button"
                  onClick={() =>
                    setOptions((current) => ({
                      ...current,
                      illustration: illustration.id,
                    }))
                  }
                  className={`rounded-full px-4 py-2 text-xs font-black ring-1 ${
                    options.illustration === illustration.id
                      ? "bg-[#8FA173] text-white ring-[#8FA173]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  {illustration.icon} {illustration.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setOptions((current) => ({
                ...current,
                includeChildPhoto: !current.includeChildPhoto,
              }))
            }
            className={`w-full rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
              options.includeChildPhoto
                ? "bg-[#EEF4E8] text-[#5F7F52] ring-[#C9DFC0]"
                : "bg-white text-[#746F64] ring-[#EFE4D6]"
            }`}
          >
            {options.includeChildPhoto
              ? "Photo de l’enfant activée"
              : "Photo de l’enfant désactivée"}
          </button>

          <button
            type="button"
            onClick={() => onShare(options)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8FA173] px-4 py-4 text-sm font-black text-white shadow-sm"
          >
            <Share2 className="h-5 w-5" />
            Générer et partager l’image
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemorablePhrases({ children = [], onBack }) {
  const childOptions = useMemo(() => {
    return children.map((child) => ({
      id: String(child.id || child.name),
      name: displayChildName(child),
      photo: child.photo || "",
    }));
  }, [children]);

  const [phrases, setPhrases] = useState([
    {
      id: "phrase-1",
      phrase: "Papa, les nuages c’est du coton pour les anges!",
      childId: childOptions?.[0]?.id || "leo",
      childName: childOptions?.[0]?.name || "Loan",
      childPhoto: childOptions?.[0]?.photo || "",
      date: "2025-12-04",
      context: "",
      favorite: false,
      photoUrl: "",
      photoFile: null,
    },
    {
      id: "phrase-2",
      phrase: "Maman, pourquoi le soleil se couche mais pas nous?",
      childId: childOptions?.[1]?.id || "nora",
      childName: childOptions?.[1]?.name || "Nora",
      childPhoto: childOptions?.[1]?.photo || "",
      date: "2025-08-03",
      context: "",
      favorite: false,
      photoUrl: "",
      photoFile: null,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChildFilter, setSelectedChildFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [sharePhraseItem, setSharePhraseItem] = useState(null);
  const [shareMessage, setShareMessage] = useState("");

  const [formData, setFormData] = useState({
    phrase: "",
    childId: "",
    date: getTodayDate(),
    context: "",
    photoUrl: "",
    photoFile: null,
  });

  const availableYears = useMemo(() => {
    const years = new Set();

    phrases.forEach((item) => {
      const year = getYearValue(item.date);
      if (year) years.add(year);
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [phrases]);

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

      const matchesMonth =
        selectedMonthFilter === "all" ||
        getMonthValue(item.date) === selectedMonthFilter;

      const matchesYear =
        selectedYearFilter === "all" ||
        getYearValue(item.date) === selectedYearFilter;

      return matchesSearch && matchesChild && matchesMonth && matchesYear;
    });
  }, [
    phrases,
    searchTerm,
    selectedChildFilter,
    selectedMonthFilter,
    selectedYearFilter,
  ]);

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
      childPhoto: selectedChild?.photo || "",
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

  const handleShareImage = async (options) => {
    if (!sharePhraseItem) return;

    try {
      const blob = await createShareImageBlob({
        phrase: sharePhraseItem,
        options,
      });

      const file = new File([blob], "phrase-camelio.png", {
        type: "image/png",
      });

      const text = `Phrase mémorable créée avec Camelio · camelio.app`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Phrase mémorable Camelio",
          text,
          files: [file],
        });

        setSharePhraseItem(null);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "phrase-camelio.png";
      link.click();
      URL.revokeObjectURL(url);

      setShareMessage(
        "Image téléchargée. Tu peux maintenant la publier sur tes réseaux sociaux."
      );

      setSharePhraseItem(null);

      setTimeout(() => {
        setShareMessage("");
      }, 4000);
    } catch (error) {
      console.error("Erreur de partage:", error);
      setShareMessage("Impossible de générer l’image pour le moment.");
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
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black ring-1 ${
                  selectedChildFilter === child.id
                    ? "bg-[#8FA173] text-white ring-[#8FA173]"
                    : "bg-white text-[#746F64] ring-[#EFE4D6]"
                }`}
              >
                {child.photo ? (
                  <img
                    src={child.photo}
                    alt={child.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : null}

                {child.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <select
              className="rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#746F64] outline-none"
              value={selectedMonthFilter}
              onChange={(event) => setSelectedMonthFilter(event.target.value)}
            >
              <option value="all">Tous les mois</option>
              <option value="01">Janvier</option>
              <option value="02">Février</option>
              <option value="03">Mars</option>
              <option value="04">Avril</option>
              <option value="05">Mai</option>
              <option value="06">Juin</option>
              <option value="07">Juillet</option>
              <option value="08">Août</option>
              <option value="09">Septembre</option>
              <option value="10">Octobre</option>
              <option value="11">Novembre</option>
              <option value="12">Décembre</option>
            </select>

            <select
              className="rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#746F64] outline-none"
              value={selectedYearFilter}
              onChange={(event) => setSelectedYearFilter(event.target.value)}
            >
              <option value="all">Toutes les années</option>

              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
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
                      <span className="flex items-center gap-2 rounded-full bg-[#F0EAF8] px-3 py-1 text-xs font-black text-[#9A7BB7]">
                        {item.childPhoto ? (
                          <img
                            src={item.childPhoto}
                            alt={item.childName}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : null}

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
                      onClick={() => setSharePhraseItem(item)}
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

      {sharePhraseItem && (
        <ShareImagePopup
          phrase={sharePhraseItem}
          onClose={() => setSharePhraseItem(null)}
          onShare={handleShareImage}
        />
      )}
    </div>
  );
}