import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Edit3,
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
  "/Logo/Camelio et citation.png",
  "/Logo/Camelio%20et%20citation.png",
  "/Logo/Logo Camelio 2.png",
  "/Logo/Logo%20Camelio%202.png",
  "/Logo/Camelio.png",
  "/Logo/Logo Camelio Hor.png",
  "/Logo/Logo Camelio.png",
  "/Logo/Camelio Hor.png",
];

const iconLogoPaths = [
  "/Logo/Logo Camelio 2.png",
  "/Logo/Logo%20Camelio%202.png",
];

const brandColors = [
  { id: "rose", label: "Rose", value: "#FCEEF3" },
  { id: "sauge", label: "Sauge", value: "#EEF4E8" },
  { id: "mauve", label: "Mauve", value: "#F2EAFB" },
  { id: "bleu", label: "Bleu", value: "#EDF5FF" },
  { id: "dore", label: "Doré", value: "#FFF5DF" },
  { id: "peche", label: "Pêche", value: "#FFF0E8" },
  { id: "menthe", label: "Menthe", value: "#EAF8F1" },
  { id: "lavande", label: "Lavande", value: "#F4EEFF" },
  { id: "ciel", label: "Ciel", value: "#EAF4FF" },
  { id: "creme", label: "Crème", value: "#FFF9EA" },
  { id: "corail", label: "Corail", value: "#FFE9E4" },
  { id: "perle", label: "Perle", value: "#F4F1EA" },
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

const fallbackColor = {
  main: "#8FA173",
  soft: "#F0F5EA",
  border: "#D7DFC9",
  text: "#748060",
};

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

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== "string") return `rgba(143, 161, 115, ${alpha})`;

  const clean = hex.replace("#", "");

  if (clean.length !== 6) return `rgba(143, 161, 115, ${alpha})`;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getChildTheme(child) {
  const color =
    child?.calendarColor ||
    child?.color ||
    child?.themeColor ||
    child?.accentColor ||
    child?.profileColor ||
    "";

  if (typeof color === "string" && color.startsWith("#")) {
    return {
      main: color,
      soft: hexToRgba(color, 0.14),
      border: hexToRgba(color, 0.38),
      text: color,
    };
  }

  const colorName = String(color || "").toLowerCase();

  const map = {
    rose: {
      main: "#EAA5AF",
      soft: "#FFF1F4",
      border: "#F3CDD3",
      text: "#B96B77",
    },
    pink: {
      main: "#EAA5AF",
      soft: "#FFF1F4",
      border: "#F3CDD3",
      text: "#B96B77",
    },
    mauve: {
      main: "#B5A7C8",
      soft: "#F3EAFB",
      border: "#DED2EA",
      text: "#8C76A8",
    },
    violet: {
      main: "#B5A7C8",
      soft: "#F3EAFB",
      border: "#DED2EA",
      text: "#8C76A8",
    },
    bleu: {
      main: "#A2BADF",
      soft: "#EEF5FF",
      border: "#CBDDF4",
      text: "#6D88B2",
    },
    blue: {
      main: "#A2BADF",
      soft: "#EEF5FF",
      border: "#CBDDF4",
      text: "#6D88B2",
    },
    vert: {
      main: "#A8B193",
      soft: "#F0F5EA",
      border: "#D7DFC9",
      text: "#748060",
    },
    green: {
      main: "#A8B193",
      soft: "#F0F5EA",
      border: "#D7DFC9",
      text: "#748060",
    },
    sage: {
      main: "#A8B193",
      soft: "#F0F5EA",
      border: "#D7DFC9",
      text: "#748060",
    },
    jaune: {
      main: "#EEC988",
      soft: "#FFF6E3",
      border: "#F0D7A8",
      text: "#B58B42",
    },
    dore: {
      main: "#EEC988",
      soft: "#FFF6E3",
      border: "#F0D7A8",
      text: "#B58B42",
    },
    orange: {
      main: "#EEC988",
      soft: "#FFF6E3",
      border: "#F0D7A8",
      text: "#B58B42",
    },
  };

  return map[colorName] || fallbackColor;
}

function getPhraseTheme(phrase) {
  const firstChild = phrase.children?.[0];
  return getChildTheme(firstChild);
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

function drawImageCover(ctx, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
}

function drawBackgroundEffects(ctx, type) {
  ctx.save();

  if (type === "soft-circles" || type === "mixed") {
    ctx.globalAlpha = 0.5;

    const circles = [
      [130, 145, 72],
      [925, 165, 100],
      [165, 845, 90],
      [900, 830, 82],
      [540, 950, 48],
      [820, 360, 34],
      [255, 385, 28],
    ];

    circles.forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    });
  }

  if (type === "playful-lines" || type === "mixed") {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";

    const lines = [
      [80, 210, 260, 110, 430, 210],
      [700, 165, 850, 75, 1020, 160],
      [85, 850, 270, 950, 440, 850],
      [660, 930, 820, 820, 990, 930],
      [130, 500, 260, 420, 390, 500],
      [690, 520, 820, 440, 950, 520],
    ];

    lines.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(x2, y2, x3, y3);
      ctx.stroke();
    });
  }

  if (type === "dots" || type === "mixed") {
    ctx.globalAlpha = 0.58;
    ctx.fillStyle = "#FFFFFF";

    const dots = [
      [140, 220],
      [210, 300],
      [890, 160],
      [960, 280],
      [130, 900],
      [230, 980],
      [820, 900],
      [940, 970],
      [520, 130],
      [600, 980],
      [455, 270],
      [705, 290],
      [330, 760],
      [760, 735],
    ];

    dots.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
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
  canvas.height = 1080;

  const ctx = canvas.getContext("2d");
  const background = options.backgroundColor || "#FCEEF3";
  const theme = getPhraseTheme(phrase);

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBackgroundEffects(ctx, options.illustration || "mixed");

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  roundedRect(ctx, 70, 70, 940, 940, 46);
  ctx.fill();

  const firstChild = phrase.children?.[0] || null;

  const iconLogo = await loadFirstAvailableImage(iconLogoPaths);

  if (iconLogo) {
    const iconSize = 105;
    ctx.drawImage(iconLogo, 820, 115, iconSize, iconSize);
  }

  let topY = 135;
  let hasChildPhotoInShareImage = false;

  if (options.includeChildPhoto && firstChild?.photo) {
    const childImage = await loadImage(firstChild.photo);

    if (childImage) {
      hasChildPhotoInShareImage = true;

      const photoSize = 185;
      const photoRadius = photoSize / 2;
      const photoX = 540 - photoRadius;
      const photoY = topY - 10;

      ctx.save();
      ctx.beginPath();
      ctx.arc(540, photoY + photoRadius, photoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      drawImageCover(ctx, childImage, photoX, photoY, photoSize, photoSize);
      ctx.restore();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(540, photoY + photoRadius, photoRadius + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = theme.text;
      ctx.font = "bold 27px Arial";
      ctx.textAlign = "center";
      ctx.fillText(firstChild.name, 540, topY + photoSize + 28);
      ctx.textAlign = "left";

      topY += 235;
    }
  }

  if (!hasChildPhotoInShareImage) {
    topY = 245;
  }

  ctx.fillStyle = theme.main;
  ctx.font = "bold 78px Georgia";
  ctx.textAlign = "left";
  ctx.fillText("“", 130, topY + 12);

  ctx.fillStyle = "#3F3D38";
  ctx.font = "bold italic 58px Georgia";
  ctx.textAlign = "center";

  const phraseLines = wrapText(ctx, phrase.phrase, 800);
  let quoteY = topY + 95;

  phraseLines.slice(0, 5).forEach((line) => {
    ctx.fillText(line, 540, quoteY);
    quoteY += 76;
  });

  const infoY = quoteY + 55;

  ctx.fillStyle = "#746F64";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";

  const childNameForAge =
    firstChild?.name ||
    firstChild?.nickname ||
    firstChild?.firstName ||
    "l’enfant";

  const ageText = phrase.childAgeAtSituation
    ? `Âge de ${childNameForAge} au moment de cette phrase : ${phrase.childAgeAtSituation}`
    : "";

  const dateText = formatDate(phrase.date);

  ctx.fillText(
    ageText ? `${ageText} · ${dateText}` : dateText,
    540,
    infoY + 42
  );

  let detailY = infoY + 92;

  if (phrase.context) {
    ctx.fillStyle = "#746F64";
    ctx.font = "26px Arial";
    ctx.textAlign = "center";

    const contextLines = wrapText(ctx, phrase.context, 760);

    contextLines.slice(0, 2).forEach((line) => {
      ctx.fillText(line, 540, detailY);
      detailY += 38;
    });
  }

  ctx.textAlign = "left";

  const logo = await loadFirstAvailableImage(logoPaths);

  if (logo) {
    const maxLogoWidth = 470;
    const maxLogoHeight = 145;
    const ratio = Math.min(
      maxLogoWidth / logo.width,
      maxLogoHeight / logo.height
    );

    const logoWidth = logo.width * ratio;
    const logoHeight = logo.height * ratio;

    ctx.drawImage(
      logo,
      540 - logoWidth / 2,
      900 - logoHeight / 2,
      logoWidth,
      logoHeight
    );
  } else {
    ctx.fillStyle = "#8FA173";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Propulsé par Camelio", 540, 870);

    ctx.fillStyle = "#746F64";
    ctx.font = "24px Arial";
    ctx.fillText("Carnet numérique de vos enfants", 540, 912);
    ctx.fillText("camelio.app", 540, 950);
    ctx.textAlign = "left";
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

function PhrasePopup({
  mode,
  childrenOptions,
  formData,
  setFormData,
  onClose,
  onSave,
  onDelete,
}) {
  const isEdit = mode === "edit";

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleChild = (childId) => {
    setFormData((current) => {
      const exists = current.childIds.includes(childId);

      return {
        ...current,
        childIds: exists
          ? current.childIds.filter((id) => id !== childId)
          : [...current.childIds, childId],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#3F3D38]">
              {isEdit ? "Modifier la phrase" : "Phrase mémorable"}
            </h3>

            <p className="mt-1 text-sm text-[#746F64]">
              {isEdit
                ? "Modifie la phrase, la date ou les enfants associés."
                : "Ajoute une phrase, une date et un ou plusieurs enfants associés."}
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
              Enfant(s)
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {childrenOptions.map((child) => {
                const selected = formData.childIds.includes(child.id);
                const theme = getChildTheme(child);

                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleChild(child.id)}
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ring-1 transition"
                    style={{
                      backgroundColor: selected ? theme.main : "#FFFFFF",
                      color: selected ? "#FFFFFF" : "#746F64",
                      boxShadow: `0 0 0 1px ${
                        selected ? theme.main : "#EFE4D6"
                      }`,
                    }}
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
                );
              })}
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
              disabled={!formData.phrase.trim() || formData.childIds.length === 0}
              className="rounded-2xl bg-[#8FA173] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#7F9166] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>

          {isEdit ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFF1F1] px-4 py-3 text-sm font-black text-[#B96B77] ring-1 ring-[#F3CDD3]"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer cette phrase
            </button>
          ) : null}
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

  const firstChild = phrase.children?.[0];
  const theme = getPhraseTheme(phrase);

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
          className="relative aspect-square overflow-hidden rounded-[2rem] p-5 ring-1 ring-[#EFE4D6]"
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
                  <div className="absolute left-24 top-28 h-10 w-10 rounded-full bg-white/35" />
                </>
              )}

              {(options.illustration === "mixed" ||
                options.illustration === "playful-lines") && (
                <>
                  <div className="absolute left-8 top-12 h-24 w-40 rounded-[50%] border-t-4 border-white/60" />
                  <div className="absolute bottom-16 right-8 h-24 w-40 rounded-[50%] border-b-4 border-white/60" />
                  <div className="absolute right-16 top-40 h-20 w-32 rounded-[50%] border-t-4 border-white/50" />
                </>
              )}

              {(options.illustration === "mixed" ||
                options.illustration === "dots") && (
                <>
                  <div className="absolute left-10 bottom-36 h-3 w-3 rounded-full bg-white/80" />
                  <div className="absolute left-20 bottom-28 h-2 w-2 rounded-full bg-white/70" />
                  <div className="absolute right-24 top-24 h-3 w-3 rounded-full bg-white/80" />
                  <div className="absolute right-14 top-36 h-2 w-2 rounded-full bg-white/70" />
                  <div className="absolute left-1/2 top-20 h-2 w-2 rounded-full bg-white/70" />
                </>
              )}
            </>
          )}

          <div className="relative flex h-full flex-col rounded-[1.5rem] bg-white/75 p-5">
            <img
              src="/Logo/Logo Camelio 2.png"
              alt="Camelio"
              className="absolute right-5 top-5 h-14 w-14 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="flex items-center justify-between gap-3">
              <Quote className="h-7 w-7" style={{ color: theme.main }} />

              <span className="pr-16 text-xs font-black uppercase tracking-[0.16em] text-[#B8819C]">
                Effet : {selectedEffectLabel}
              </span>
            </div>

            {options.includeChildPhoto && firstChild?.photo ? (
              <div className="mt-6 flex flex-col items-center">
                <img
                  src={firstChild.photo}
                  alt={firstChild.name}
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-white"
                />

                <p
                  className="mt-2 text-xs font-black"
                  style={{ color: theme.text }}
                >
                  {firstChild.name}
                </p>
              </div>
            ) : null}

            <div className="flex flex-1 items-center justify-center">
              <p className="mx-auto max-w-[90%] text-center text-xl font-black italic leading-9 text-[#3F3D38]">
                “{phrase.phrase}”
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs font-bold text-[#746F64]">
                {phrase.childAgeAtSituation
                  ? `Âge de ${
                      firstChild?.name ||
                      firstChild?.nickname ||
                      firstChild?.firstName ||
                      "l’enfant"
                    } au moment de cette phrase : ${
                      phrase.childAgeAtSituation
                    } · ${formatDate(phrase.date)}`
                  : formatDate(phrase.date)}
              </p>
            </div>

            <div className="mt-5 border-t border-white/70 pt-4">
              <div className="flex justify-center">
                <img
                  src="/Logo/Camelio et citation.png"
                  alt="Propulsé par Camelio, carnet numérique de vos enfants"
                  className="h-12 w-auto object-contain"
                  onError={(event) => {
                    event.currentTarget.src = "/Logo/Camelio.png";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm font-black text-[#55534C]">
              Photo de l’enfant
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setOptions((current) => ({
                    ...current,
                    includeChildPhoto: true,
                  }))
                }
                className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
                  options.includeChildPhoto
                    ? "bg-[#8FA173] text-white ring-[#8FA173]"
                    : "bg-white text-[#746F64] ring-[#EFE4D6]"
                }`}
              >
                Oui
              </button>

              <button
                type="button"
                onClick={() =>
                  setOptions((current) => ({
                    ...current,
                    includeChildPhoto: false,
                  }))
                }
                className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
                  !options.includeChildPhoto
                    ? "bg-[#8FA173] text-white ring-[#8FA173]"
                    : "bg-white text-[#746F64] ring-[#EFE4D6]"
                }`}
              >
                Non
              </button>
            </div>
          </div>

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
    return children
      .filter((child) => child.id)
      .map((child) => ({
        id: String(child.id),
        name: displayChildName(child),
        photo: child.photo || child.image || child.avatar || "",
        birthDate: child.birthDate || "",
        color:
          child.calendarColor ||
          child.color ||
          child.themeColor ||
          child.accentColor ||
          child.profileColor ||
          "",
      }));
  }, [children]);

  const [phrases, setPhrases] = useState(() => {
    const firstChild = childOptions?.[0] || null;
    const secondChild = childOptions?.[1] || null;

    return [
      {
        id: "phrase-1",
        phrase: "Papa, les nuages c’est du coton pour les anges!",
        childIds: firstChild ? [firstChild.id] : [],
        children: firstChild ? [firstChild] : [],
        date: "2025-12-04",
        context: "",
        favorite: false,
        childAgeAtSituation: firstChild
          ? calculateAgeAtDate(firstChild.birthDate, "2025-12-04")
          : "",
      },
      {
        id: "phrase-2",
        phrase: "Maman, pourquoi le soleil se couche mais pas nous?",
        childIds: secondChild ? [secondChild.id] : [],
        children: secondChild ? [secondChild] : [],
        date: "2025-08-03",
        context: "",
        favorite: false,
        childAgeAtSituation: secondChild
          ? calculateAgeAtDate(secondChild.birthDate, "2025-08-03")
          : "",
      },
    ];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChildFilter, setSelectedChildFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState(null);
  const [sharePhraseItem, setSharePhraseItem] = useState(null);
  const [shareMessage, setShareMessage] = useState("");

  const emptyForm = {
    phrase: "",
    childIds: [],
    date: getTodayDate(),
    context: "",
  };

  const [formData, setFormData] = useState(emptyForm);

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
      const childNames = item.children
        .map((child) => child.name)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        item.phrase.toLowerCase().includes(normalizedSearch) ||
        item.context.toLowerCase().includes(normalizedSearch) ||
        childNames.includes(normalizedSearch);

      const matchesChild =
        selectedChildFilter === "all" ||
        item.childIds.includes(selectedChildFilter);

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
      childIds: [],
      date: getTodayDate(),
      context: "",
    });
  };

  const buildPhraseFromForm = (id = `phrase-${Date.now()}`) => {
    const assignedChildren = childOptions.filter((child) =>
      formData.childIds.includes(child.id)
    );

    const situationDate = formData.date || getTodayDate();
    const firstChild = assignedChildren[0];

    return {
      id,
      phrase: formData.phrase.trim(),
      childIds: assignedChildren.map((child) => child.id),
      children: assignedChildren,
      date: situationDate,
      context: formData.context.trim(),
      favorite: false,
      childAgeAtSituation: firstChild
        ? calculateAgeAtDate(firstChild.birthDate, situationDate)
        : "",
    };
  };

  const handleAddPhrase = () => {
    if (!formData.phrase.trim() || formData.childIds.length === 0) return;

    const newPhrase = buildPhraseFromForm();

    setPhrases((current) => [newPhrase, ...current]);
    resetForm();
    setShowAddPopup(false);
  };

  const openEditPopup = (phrase) => {
    setEditingPhrase(phrase);

    setFormData({
      phrase: phrase.phrase || "",
      childIds: phrase.childIds || [],
      date: phrase.date || getTodayDate(),
      context: phrase.context || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingPhrase) return;
    if (!formData.phrase.trim() || formData.childIds.length === 0) return;

    const updatedPhrase = {
      ...buildPhraseFromForm(editingPhrase.id),
      favorite: editingPhrase.favorite || false,
    };

    setPhrases((current) =>
      current.map((item) =>
        item.id === editingPhrase.id ? updatedPhrase : item
      )
    );

    setEditingPhrase(null);
    resetForm();
  };

  const handleDeleteEditedPhrase = () => {
    if (!editingPhrase) return;

    setPhrases((current) =>
      current.filter((item) => item.id !== editingPhrase.id)
    );

    setEditingPhrase(null);
    resetForm();
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
          onClick={() => {
            resetForm();
            setShowAddPopup(true);
          }}
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

            {childOptions.map((child) => {
              const theme = getChildTheme(child);

              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildFilter(child.id)}
                  className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black ring-1"
                  style={{
                    backgroundColor:
                      selectedChildFilter === child.id ? theme.main : "#FFFFFF",
                    color:
                      selectedChildFilter === child.id ? "#FFFFFF" : "#746F64",
                    boxShadow: `0 0 0 1px ${
                      selectedChildFilter === child.id ? theme.main : "#EFE4D6"
                    }`,
                  }}
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
              );
            })}
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
            filteredPhrases.map((item) => {
              const theme = getPhraseTheme(item);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.5rem] p-4 shadow-sm"
                  style={{
                    backgroundColor: theme.soft,
                    boxShadow: `0 0 0 1px ${theme.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Quote
                      className="mt-1 h-5 w-5 shrink-0"
                      style={{ color: theme.main }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold italic leading-7 text-[#55534C]">
                        "{item.phrase}"
                      </p>

                      {item.context ? (
                        <p className="mt-2 text-sm leading-6 text-[#746F64]">
                          {item.context}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {item.children.map((child) => {
                            const childTheme = getChildTheme(child);

                            return (
                              <span
                                key={child.id}
                                className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black"
                                style={{
                                  backgroundColor: childTheme.soft,
                                  color: childTheme.text,
                                }}
                              >
                                {child.photo ? (
                                  <img
                                    src={child.photo}
                                    alt={child.name}
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                ) : null}

                                {child.name}
                              </span>
                            );
                          })}
                        </div>

                        <span className="flex items-center gap-1 text-xs font-bold text-[#8A8378]">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(item.date)}
                        </span>
                      </div>

                      {item.childAgeAtSituation ? (
                        <p className="mt-3 text-xs font-bold text-[#8A8378]">
                          Âge de {item.children?.[0]?.name || "l’enfant"} au
                          moment de cette phrase : {item.childAgeAtSituation}
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
                        onClick={() => openEditPopup(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-[#EFE4D6]"
                        style={{ color: theme.main }}
                        aria-label="Modifier"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {showAddPopup && (
        <PhrasePopup
          mode="add"
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

      {editingPhrase && (
        <PhrasePopup
          mode="edit"
          childrenOptions={childOptions}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setEditingPhrase(null);
            resetForm();
          }}
          onSave={handleSaveEdit}
          onDelete={handleDeleteEditedPhrase}
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