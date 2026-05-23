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
  Trash2,
  X,
} from "lucide-react";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]";

const textareaClass =
  "mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#D99AB9] focus:ring-2 focus:ring-[#F3D8E6]";

const logoPaths = [
  "/Logo/Camelio.png",
  "/Logo/Logo Camelio Hor.png",
  "/Logo/Logo Camelio.png",
  "/Logo/Camelio Hor.png",
  "/Logo/Camelio-flaticon.ico",
];

const brandColors = [
  { id: "rose", label: "Rose", value: "#FCEEF3" },
  { id: "sauge", label: "Sauge", value: "#EEF4E8" },
  { id: "mauve", label: "Mauve", value: "#F2EAFB" },
  { id: "bleu", label: "Bleu", value: "#EDF5FF" },
  { id: "dore", label: "Doré", value: "#FFF5DF" },
];

const illustrationChoices = [
  { id: "mixed", label: "Bulles et lignes" },
  { id: "soft-circles", label: "Ronds doux" },
  { id: "playful-lines", label: "Lignes courbes" },
  { id: "dots", label: "Petits points" },
  { id: "none", label: "Aucun effet" },
];

const monthOptions = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
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

function calculateAgeAtDate(birthDate, situationDate) {
  if (!birthDate || !situationDate) return "";

  const birth = new Date(`${birthDate}T00:00:00`);
  const situation = new Date(`${situationDate}T00:00:00`);

  if (
    Number.isNaN(birth.getTime()) ||
    Number.isNaN(situation.getTime()) ||
    situation < birth
  ) {
    return "";
  }

  let years = situation.getFullYear() - birth.getFullYear();
  let months = situation.getMonth() - birth.getMonth();

  if (situation.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    return `${months} mois`;
  }

  if (months <= 0) {
    return `${years} an${years > 1 ? "s" : ""}`;
  }

  return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(" ");
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

function drawBackgroundEffects(ctx, type) {
  ctx.save();

  if (type === "soft-circles") {
    ctx.globalAlpha = 0.45;

    const circles = [
      [120, 160, 70],
      [930, 210, 95],
      [180, 1060, 90],
      [870, 1030, 65],
      [540, 1160, 45],
    ];

    circles.forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    });
  }

  if (type === "playful-lines") {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";

    const lines = [
      [80, 220, 260, 120, 430, 220],
      [700, 180, 850, 90, 1020, 170],
      [90, 1030, 270, 1150, 440, 1040],
      [660, 1120, 820, 1000, 990, 1110],
    ];

    lines.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(x2, y2, x3, y3);
      ctx.stroke();
    });
  }

  if (type === "dots") {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#FFFFFF";

    const dots = [
      [140, 230],
      [210, 310],
      [890, 170],
      [960, 290],
      [130, 1130],
      [230, 1210],
      [820, 1120],
      [940, 1190],
      [520, 130],
      [600, 1220],
    ];

    dots.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (type === "mixed") {
    ctx.globalAlpha = 0.45;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(80, 240);
    ctx.quadraticCurveTo(230, 120, 400, 230);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(700, 1120);
    ctx.quadraticCurveTo(850, 1000, 1010, 1120);
    ctx.stroke();

    const circles = [
      [930, 220, 85],
      [150, 1080, 75],
      [520, 1180, 42],
    ];

    circles.forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    });

    ctx.fillStyle = "#FFFFFF";

    [
      [160, 180],
      [220, 280],
      [860, 1020],
      [950, 1200],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve) => {
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

async function loadFirstAvailableImage(paths = []) {
  for (const path of paths) {
    const image = await loadImage(path);

    if (image) {
      return image;
    }
  }

  return null;
}

async function createShareImageBlob({ phrase, options }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");
  const background = options.backgroundColor || "#FCEEF3";

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBackgroundEffects(ctx, options.illustration || "mixed");

  ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
  roundedRect(ctx, 70, 80, 940, 1190, 46);
  ctx.fill();

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

  let y = options.includeChildPhoto && phrase.childPhoto ? 430 : 330;

  ctx.fillStyle = "#D99AB9";
  ctx.font = "bold 82px Georgia";
  ctx.fillText("“", 120, y - 50);

  ctx.fillStyle = "#3F3D38";
  ctx.font = "bold italic 48px Georgia";

  const phraseLines = wrapText(ctx, phrase.phrase, 760);

  phraseLines.slice(0, 7).forEach((line) => {
    ctx.fillText(line, 150, y);
    y += 70;
  });

  y += 35;

  ctx.fillStyle = "#8FA173";
  roundedRect(ctx, 150, y, 290, 62, 31);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px Arial";
  ctx.fillText(phrase.childName || "Non précisé", 185, y + 40);

  ctx.fillStyle = "#746F64";
  ctx.font = "bold 28px Arial";
  ctx.fillText(formatDate(phrase.date), 690, y + 40);

  y += 95;

  if (phrase.childAgeAtSituation) {
    ctx.fillStyle = "#746F64";
    ctx.font = "bold 28px Arial";
    ctx.fillText(`Âge au moment : ${phrase.childAgeAtSituation}`, 150, y);
    y += 50;
  }

  if (phrase.context) {
    ctx.fillStyle = "#746F64";
    ctx.font = "28px Arial";
    const contextLines = wrapText(ctx, phrase.context, 760);

    contextLines.slice(0, 3).forEach((line) => {
      ctx.fillText(line, 150, y);
      y += 44;
    });
  }

  ctx.fillStyle = "#A8B193";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Propulsé par Camelio", 150, 1155);

  ctx.fillStyle = "#746F64";
  ctx.font = "26px Arial";
  ctx.fillText("Carnet numérique de vos enfants", 150, 1197);

  ctx.fillStyle = "#746F64";
  ctx.font = "24px Arial";
  ctx.fillText("camelio.app", 150, 1237);

  const logo = await loadFirstAvailableImage(logoPaths);

  if (logo) {
    const maxLogoWidth = 180;
    const maxLogoHeight = 90;
    const ratio = Math.min(maxLogoWidth / logo.width, maxLogoHeight / logo.height);
    const logoWidth = logo.width * ratio;
    const logoHeight = logo.height * ratio;

    ctx.drawImage(
      logo,
      850 - logoWidth / 2,
      1175 - logoHeight / 2,
      logoWidth,
      logoHeight
    );
  } else {
    ctx.fillStyle = "#8FA173";
    ctx.font = "bold 36px Arial";
    ctx.fillText("Camelio", 760, 1195);
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
    illustration: "mixed",
    includeChildPhoto: true,
  });

  const selectedEffectLabel =
    illustrationChoices.find((item) => item.id === options.illustration)
      ?.label || "Bulles et lignes";

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
          className="relative overflow-hidden rounded-[2rem] p-5 ring-1 ring-[#EFE4D6]"
          style={{ backgroundColor: options.backgroundColor }}
        >
          {options.illustration !== "none" && (
            <>
              {(options.illustration === "mixed" ||
                options.illustration === "soft-circles") && (
                <>
                  <div className="absolute -right-8 top-8 h-28 w-28 rounded-full bg-white/50" />
                  <div className="absolute -left-6 bottom-10 h-24 w-24 rounded-full bg-white/45" />
                  <div className="absolute bottom-20 right-16 h-12 w-12 rounded-full bg-white/40" />
                </>
              )}

              {(options.illustration === "mixed" ||
                options.illustration === "playful-lines") && (
                <>
                  <div className="absolute left-8 top-12 h-24 w-40 rounded-[50%] border-t-4 border-white/60" />
                  <div className="absolute bottom-16 right-8 h-24 w-40 rounded-[50%] border-b-4 border-white/60" />
                </>
              )}

              {(options.illustration === "mixed" ||
                options.illustration === "dots") && (
                <>
                  <div className="absolute left-10 bottom-36 h-3 w-3 rounded-full bg-white/80" />
                  <div className="absolute left-20 bottom-28 h-2 w-2 rounded-full bg-white/70" />
                  <div className="absolute right-24 top-24 h-3 w-3 rounded-full bg-white/80" />
                  <div className="absolute right-14 top-36 h-2 w-2 rounded-full bg-white/70" />
                </>
              )}
            </>
          )}

          <div className="relative rounded-[1.5rem] bg-white/75 p-5">
            <div className="flex items-center justify-between gap-3">
              <Quote className="h-7 w-7 text-[#D99AB9]" />

              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#B8819C]">
                Effet : {selectedEffectLabel}
              </span>
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

            {phrase.childAgeAtSituation ? (
              <p className="mt-3 text-center text-xs font-bold text-[#746F64]">
                Âge au moment : {phrase.childAgeAtSituation}
              </p>
            ) : null}

            <div className="mt-6 border-t border-white/70 pt-4">
              <div className="flex items-center gap-3">
                <img
                  src="/Logo/Camelio.png"
                  alt="Camelio"
                  className="h-9 w-auto object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <p className="text-xs font-black text-[#8FA173]">
                    Propulsé par Camelio
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-[#746F64]">
                    Carnet numérique de vos enfants
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-[#746F64]">
                    camelio.app
                  </p>
                </div>
              </div>
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
            <p className="text-sm font-black text-[#55534C]">
              Effets arrière-plan
            </p>

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
                  {illustration.label}
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
      birthDate: child.birthDate || "",
    }));
  }, [children]);

  const [phrases, setPhrases] = useState(() => [
    {
      id: "phrase-1",
      phrase: "Papa, les nuages c’est du coton pour les anges!",
      childId: childOptions?.[0]?.id || "loan",
      childName: childOptions?.[0]?.name || "Loan",
      childPhoto: childOptions?.[0]?.photo || "",
      childBirthDate: childOptions?.[0]?.birthDate || "",
      childAgeAtSituation: calculateAgeAtDate(
        childOptions?.[0]?.birthDate,
        "2025-12-04"
      ),
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
      childBirthDate: childOptions?.[1]?.birthDate || "",
      childAgeAtSituation: calculateAgeAtDate(
        childOptions?.[1]?.birthDate,
        "2025-08-03"
      ),
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

    const situationDate = formData.date || getTodayDate();

    const newPhrase = {
      id: `phrase-${Date.now()}`,
      phrase: cleanedPhrase,
      childId: formData.childId,
      childName: selectedChild?.name || "Non précisé",
      childPhoto: selectedChild?.photo || "",
      childBirthDate: selectedChild?.birthDate || "",
      childAgeAtSituation: calculateAgeAtDate(
        selectedChild?.birthDate,
        situationDate
      ),
      date: situationDate,
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

      const text =
        "Phrase mémorable créée avec Camelio. Carnet numérique de vos enfants · camelio.app";

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

              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
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

                    {item.childAgeAtSituation ? (
                      <p className="mt-3 text-xs font-bold text-[#8A8378]">
                        Âge au moment : {item.childAgeAtSituation}
                      </p>
                    ) : null}
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