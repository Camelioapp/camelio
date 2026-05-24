import React, { useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeft, Grid2X2, List, UserRound } from "lucide-react";

import SubscriptionPopup from "./SubscriptionPopup";
import Children from "./Children.jsx";
import ParentalPlan from "./ParentalPlan.jsx";
import CalendarView from "./CalendarView.jsx";
import CustodyCalculator from "./CustodyCalculator.jsx";
import Documents from "./Documents.jsx";
import Photos from "./Photos.jsx";
import Sante from "./Sante.jsx";
import Invoices from "./Invoices.jsx";
import Notes from "./Notes.jsx";
import SettingsView from "./SettingsView.jsx";
import MemorablePhrases from "./MemorablePhrases.jsx";
import { sections, getSectionTheme } from "./sectionsData.js";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const SECTION_ORDER_STORAGE_KEY = "camelio-section-order";
const SECTION_THEME_STORAGE_KEY = "camelio-section-themes";

const defaultPhotoPosition = { x: 50, y: 50 };

const childColorOptions = [
  { id: "sage", label: "Sauge", dot: "#A8B193", soft: "#EEF0E7", text: "#6F785F" },
  { id: "rose", label: "Rose", dot: "#E99AAA", soft: "#FBECEF", text: "#B96B77" },
  { id: "blue", label: "Bleu doux", dot: "#8FB8DE", soft: "#EEF5FB", text: "#657F9F" },
  { id: "mauve", label: "Mauve", dot: "#AA90C8", soft: "#F4F0FA", text: "#8475A5" },
  { id: "gold", label: "Doré", dot: "#D4A85F", soft: "#FFF8EC", text: "#9A7A43" },
  { id: "peach", label: "Pêche", dot: "#E8A07E", soft: "#FFF1EA", text: "#B8755F" },
  { id: "mint", label: "Menthe", dot: "#7CBFA2", soft: "#EDF8F2", text: "#5F927A" },
  { id: "lavender", label: "Lavande", dot: "#C7B3E5", soft: "#F7F1FF", text: "#8F76B8" },
  { id: "mustard", label: "Moutarde", dot: "#D9BF5E", soft: "#FFF8D8", text: "#9C842F" },
  { id: "olive", label: "Olive", dot: "#8E9A72", soft: "#EEF0E7", text: "#6B7658" },
  { id: "coral", label: "Corail", dot: "#E8786D", soft: "#FFF0EF", text: "#B85F58" },
  { id: "teal", label: "Sarcelle", dot: "#5BAEAA", soft: "#EAF7F6", text: "#4B8A87" },
  { id: "sky", label: "Ciel", dot: "#76BFE3", soft: "#EAF7FF", text: "#5B93B0" },
  { id: "grape", label: "Raisin", dot: "#8F78B8", soft: "#F2EEF8", text: "#735F9A" },
  { id: "sand", label: "Sable", dot: "#D8C49A", soft: "#FBF4E8", text: "#9A7F50" },
];

function getChildColorTheme(colorId) {
  return (
    childColorOptions.find((color) => color.id === colorId) ||
    childColorOptions[0]
  );
}

function normalizePhotoPosition(position) {
  if (!position) return defaultPhotoPosition;

  if (typeof position === "string") {
    const [xRaw, yRaw] = position.split(" ");

    return {
      x: parseInt(xRaw, 10) || 50,
      y: parseInt(yRaw, 10) || 50,
    };
  }

  return {
    x: Number.isFinite(position.x) ? position.x : 50,
    y: Number.isFinite(position.y) ? position.y : 50,
  };
}

function getObjectPosition(position) {
  const clean = normalizePhotoPosition(position);
  return `${clean.x}% ${clean.y}%`;
}

function PhotoImage({ src, alt, position, zoom = 1, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`select-none object-cover ${className}`}
      style={{
        objectPosition: getObjectPosition(position),
        transform: `scale(${zoom})`,
        transformOrigin: getObjectPosition(position),
      }}
    />
  );
}

function getAgeFromBirthDate(birthDate) {
  if (!birthDate || birthDate === "À compléter") return "À compléter";

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "À compléter";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!birthdayPassed) age -= 1;

  return `${age} ans`;
}

function formatChildFromServer(child) {
  const firstName = child.firstName || "";
  const nickname = child.nickname || firstName || "Enfant";
  const photo = child.avatar || child.photo || child.image || "";

  return {
    ...child,
    id: child.id,
    name: nickname,
    firstName,
    lastName: child.lastName || "",
    nickname,
    birthDate: child.birthDate || "",
    sex: child.gender || child.sex || "",
    gender: child.gender || child.sex || "",
    color: child.color || "sage",
    age: getAgeFromBirthDate(child.birthDate),
    photo,
    image: photo,
    avatar: photo,
    photoPosition: normalizePhotoPosition(child.photoPosition),
    photoZoom: child.photoZoom || 1,
    profileNote: child.notes || child.profileNote || "",
  };
}

function getInitials(child) {
  const first =
    child?.firstName?.trim()?.[0] || child?.name?.trim()?.[0] || "";
  const last = child?.lastName?.trim()?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();

  return initials || "";
}

function FamilyFloatingBubbles() {
  const bubbles = [
  {
    top: "10%",
    left: "13%",
    size: 24,
    color: "#eec988",
    delay: 0.1,
  },
  {
    top: "30%",
    left: "24%",
    size: 14,
    color: "#eaa5af",
    delay: 0.8,
  },
  {
    top: "62%",
    left: "12%",
    size: 30,
    color: "#b5a7c8",
    delay: 1.3,
  },
  {
    top: "78%",
    left: "29%",
    size: 18,
    color: "#a2badf",
    delay: 1.7,
  },
  {
    top: "20%",
    right: "16%",
    size: 18,
    color: "#a8b193",
    delay: 0.5,
  },
  {
    top: "56%",
    right: "11%",
    size: 26,
    color: "#eec988",
    delay: 1.1,
  },
  {
    bottom: "12%",
    right: "27%",
    size: 16,
    color: "#eaa5af",
    delay: 1.9,
  },
  {
    bottom: "24%",
    left: "48%",
    size: 15,
    color: "#a8b193",
    delay: 2.2,
  },
];

  const softCircles = [
    {
      className:
        "absolute -left-20 bottom-[-78px] h-48 w-48 sm:h-60 sm:w-60 lg:h-72 lg:w-72",
      color: "rgba(168, 177, 147, 0.24)",
      duration: 12,
    },
    {
      className:
        "absolute -right-16 -top-16 h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56",
      color: "rgba(234, 165, 175, 0.30)",
      duration: 14,
    },
    {
      className:
        "absolute left-[47%] top-[38%] h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32",
      color: "rgba(181, 167, 200, 0.16)",
      duration: 10,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {softCircles.map((circle, index) => (
        <motion.div
          key={`family-soft-circle-${index}`}
          className={`${circle.className} rounded-full blur-sm`}
          style={{ backgroundColor: circle.color }}
          animate={{
            x: [0, 18, -14, 0],
            y: [0, -14, 16, 0],
            scale: [1, 1.06, 0.97, 1],
          }}
          transition={{
            duration: circle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {bubbles.map((bubble, index) => (
        <motion.span
          key={`family-bubble-${index}`}
          className="absolute rounded-full"
          style={{
            top: bubble.top,
            left: bubble.left,
            right: bubble.right,
            bottom: bubble.bottom,
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            opacity: 0.90,
            boxShadow: `0 0 20px ${bubble.color}88`,
          }}
          animate={{
            x: [0, 12 + index * 2, -10, 0],
            y: [0, -13, 11, 0],
            scale: [1, 1.25, 0.92, 1],
            opacity: [0.45, 0.82, 0.5, 0.45],
          }}
          transition={{
            duration: 7 + index,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="absolute right-[18%] top-[18%] hidden h-8 w-8 rotate-12 border-r-4 border-t-4 border-[#ffd27a] md:block"
        animate={{
          y: [0, -8, 6, 0],
          rotate: [12, 18, 8, 12],
          opacity: [0.45, 0.9, 0.6, 0.45],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute right-[16%] top-[29%] hidden h-7 w-7 rotate-[-8deg] border-r-4 border-t-4 border-[#ffd27a] md:block"
        animate={{
          y: [0, 7, -6, 0],
          rotate: [-8, -14, -4, -8],
          opacity: [0.45, 0.85, 0.55, 0.45],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default function Dashboard({
  parentProfile: parentProfileFromApp = {
    name: "",
    email: "",
    phone: "",
    userId: "",
  },
  setParentProfile: setParentProfileFromApp = () => {},
}) {
  const [activeSection, setActiveSection] = useState("home");
  const [viewMode, setViewMode] = useState("grid");
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

  const parentProfile = parentProfileFromApp;

  const setParentProfile = (updatedProfile) => {
    if (typeof updatedProfile === "function") {
      setParentProfileFromApp((current) => {
        const nextProfile = updatedProfile(current);

        return {
          ...current,
          ...nextProfile,
          userId: current.userId || nextProfile.userId || "",
        };
      });

      return;
    }

    setParentProfileFromApp((current) => ({
      ...current,
      ...updatedProfile,
      userId: current.userId || updatedProfile.userId || "",
    }));
  };

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/subscription`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Erreur vérification abonnement:", data);
          setShowSubscriptionPopup(true);
          return;
        }

        setShowSubscriptionPopup(!data.hasAccess);
      } catch (error) {
        console.error("Erreur vérification abonnement:", error);
        setShowSubscriptionPopup(true);
      }
    };

    checkSubscription();
  }, []);

  const defaultSectionOrder = useMemo(() => {
    return sections
      .filter((section) => section.id !== "settings")
      .map((section) => section.id);
  }, []);

  const [sectionOrderIds, setSectionOrderIds] = useState(() => {
    try {
      const savedOrder = localStorage.getItem(SECTION_ORDER_STORAGE_KEY);

      if (!savedOrder) {
        return sections
          .filter((section) => section.id !== "settings")
          .map((section) => section.id);
      }

      const parsedOrder = JSON.parse(savedOrder);

      if (!Array.isArray(parsedOrder)) {
        return sections
          .filter((section) => section.id !== "settings")
          .map((section) => section.id);
      }

      const availableIds = sections
        .filter((section) => section.id !== "settings")
        .map((section) => section.id);

      return parsedOrder.filter((id) => availableIds.includes(id));
    } catch {
      return sections
        .filter((section) => section.id !== "settings")
        .map((section) => section.id);
    }
  });

  const [sectionThemeOverrides, setSectionThemeOverrides] = useState(() => {
    try {
      const savedThemes = localStorage.getItem(SECTION_THEME_STORAGE_KEY);
      return savedThemes ? JSON.parse(savedThemes) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      SECTION_ORDER_STORAGE_KEY,
      JSON.stringify(sectionOrderIds)
    );
  }, [sectionOrderIds]);

  useEffect(() => {
    localStorage.setItem(
      SECTION_THEME_STORAGE_KEY,
      JSON.stringify(sectionThemeOverrides)
    );
  }, [sectionThemeOverrides]);

  const orderedSections = useMemo(() => {
    return sectionOrderIds
      .map((id) => sections.find((section) => section.id === id))
      .filter(Boolean);
  }, [sectionOrderIds]);

  const [children, setChildren] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);

  const [calendarEntries, setCalendarEntries] = useState({});
  const [docs, setDocs] = useState([
    {
      id: "doc-1",
      title: "Jugement / entente parentale",
      child: "Général",
      type: "Jugement",
      note: "Document général à conserver.",
      fileName: "",
      fileUrl: "",
    },
    {
      id: "doc-2",
      title: "Carte assurance maladie",
      child: "Léo",
      type: "Médical",
      note: "Document lié au dossier médical de Léo.",
      fileName: "",
      fileUrl: "",
    },
  ]);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setIsLoadingChildren(true);

        const response = await fetch(`${API_BASE_URL}/api/children`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Erreur chargement enfants:", data);
          return;
        }

        const formattedChildren = (data.children || []).map(
          formatChildFromServer
        );

        setChildren(formattedChildren);
      } catch (error) {
        console.error("Erreur chargement enfants:", error);
      } finally {
        setIsLoadingChildren(false);
      }
    };

    loadChildren();
  }, []);

  const activeSectionData = useMemo(() => {
    return sections.find((section) => section.id === activeSection);
  }, [activeSection]);

  function openSection(sectionId) {
    setActiveSection(sectionId);
  }

  function goHome() {
    setActiveSection("home");
  }

  function renderActiveSection() {
    switch (activeSection) {
      case "children":
        return (
          <Children
            children={children}
            setChildren={setChildren}
            onOpen={openSection}
          />
        );

      case "parental-plan":
        return <ParentalPlan children={children} onBack={goHome} />;

      case "calendar":
        return (
          <CalendarView
            children={children}
            calendarEntries={calendarEntries}
            setCalendarEntries={setCalendarEntries}
            onBack={goHome}
          />
        );

      case "calculator":
        return (
          <CustodyCalculator
            children={children}
            calendarEntries={calendarEntries}
            onBack={goHome}
          />
        );

      case "documents":
        return (
          <Documents
            children={children}
            docs={docs}
            setDocs={setDocs}
            onBack={goHome}
          />
        );

      case "photos":
        return <Photos children={children} onBack={goHome} />;

      case "sante":
        return (
          <Sante
            children={children}
            docs={docs}
            setDocs={setDocs}
            onBack={goHome}
          />
        );

      case "invoices":
        return <Invoices children={children} onBack={goHome} />;

      case "notes":
        return <Notes children={children} onBack={goHome} />;

      case "memorable-phrases":
        return <MemorablePhrases children={children} onBack={goHome} />;

      case "settings":
        return (
          <SettingsView
            parentProfile={parentProfile}
            setParentProfile={setParentProfile}
            sectionOrderIds={sectionOrderIds}
            setSectionOrderIds={setSectionOrderIds}
            sectionThemeOverrides={sectionThemeOverrides}
            setSectionThemeOverrides={setSectionThemeOverrides}
            defaultSectionOrder={defaultSectionOrder}
            onBack={goHome}
          />
        );

      default:
        return null;
    }
  }

  const subscriptionPopup = showSubscriptionPopup ? (
    <SubscriptionPopup onClose={() => setShowSubscriptionPopup(false)} />
  ) : null;

  if (activeSection !== "home") {
    return (
      <>
        {subscriptionPopup}

        <div className="min-h-screen bg-[#fbf7ef] text-[#4f4a45]">
          <div className="mx-auto max-w-6xl p-3 md:p-6">
            <div className="overflow-hidden rounded-[28px] border border-[#eadfcf] bg-[#fffdf8] shadow-sm md:rounded-[36px]">
              <header className="flex items-center justify-between border-b border-[#eadfcf] px-5 py-5 md:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8f9874]">
                    Camelio
                  </p>

                  <h1 className="text-2xl font-semibold text-[#4f4a45]">
                    {activeSectionData?.title || "Section"}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={goHome}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#eadfcf] bg-white text-[#8f9874] shadow-sm transition hover:bg-[#f7f1e8]"
                  aria-label="Retour à l'accueil"
                >
                  <ArrowLeft size={22} />
                </button>
              </header>

              <main className="p-4 md:p-8">{renderActiveSection()}</main>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {subscriptionPopup}

      <div className="min-h-screen bg-[#fbf7ef] text-[#4f4a45]">
        <div className="mx-auto max-w-6xl p-3 md:p-6">
          <div className="overflow-hidden rounded-[28px] border border-[#eadfcf] bg-[#fffdf8] shadow-sm md:rounded-[36px]">
            <div className="flex justify-center pt-4">
              <div className="h-1.5 w-16 rounded-full bg-[#e5d2c1]" />
            </div>

            <header className="relative flex min-h-[96px] items-center justify-between border-b border-[#eadfcf] px-5 py-5 md:min-h-[110px] md:px-8">
              <div className="flex items-center">
                <img
                  src="https://studiocameleon.ca/wp-content/uploads/2026/05/Logo-horizontal-couleur-scaled-e1779141504554.png"
                  alt="Camelio"
                  className="h-10 w-auto object-contain sm:h-16 md:h-18"
                />
              </div>

              <button
                type="button"
                onClick={() => openSection("settings")}
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#eadfcf] bg-white shadow-sm transition hover:scale-105 hover:bg-[#faf4ec] sm:h-16 sm:w-16"
                aria-label="Paramètres"
              >
                <img
                  src="https://studiocameleon.ca/wp-content/uploads/2026/05/pere_2_enfants_filles.png"
                  alt="Profil"
                  className="h-full w-full object-cover"
                />
              </button>
            </header>

            <main className="p-4 md:p-8">
              <section className="relative overflow-hidden rounded-[30px] border border-[#eadfcf] bg-white shadow-sm">
                <FamilyFloatingBubbles />

                <div className="relative z-10 px-5 py-6 md:px-8 md:py-8">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a8aa91] md:text-sm">
                        Bienvenue
                      </p>

                      <h2 className="mt-1 text-2xl font-semibold text-[#4f4a45] md:text-3xl">
                        Ma famille
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSection("children")}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#eadfcf] bg-[#fffdf8] text-[#8f9874] shadow-sm transition hover:scale-105 hover:bg-[#faf4ec]"
                      aria-label="Ajouter un enfant"
                    >
                      <Plus size={22} strokeWidth={1.8} />
                    </button>
                  </div>

                  {isLoadingChildren ? (
                    <div className="flex min-h-[180px] w-full items-center justify-center rounded-[26px] border border-dashed border-[#d8c8b6] bg-[#fffdf8]/85 text-center">
                      <p className="text-sm font-semibold text-[#8b8278]">
                        Chargement de votre famille...
                      </p>
                    </div>
                  ) : children.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openSection("children")}
                      className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-[26px] border border-dashed border-[#d8c8b6] bg-[#fffdf8]/85 text-center transition hover:bg-[#faf4ec] hover:shadow-sm"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d8c8b6] bg-[#eef0e7] text-[#8f9874] shadow-sm">
                        <Plus size={32} strokeWidth={1.7} />
                      </div>

                      <p className="mt-4 text-lg font-semibold text-[#4f4a45]">
                        Ajouter votre enfant
                      </p>

                      <p className="mt-1 text-sm text-[#8b8278]">
                        Créez un premier profil pour commencer.
                      </p>
                    </button>
                  ) : (
                    <div className="relative -mx-2 overflow-hidden">
  <div className="overflow-x-auto pb-3 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="flex min-h-[165px] items-end justify-center px-2 sm:min-h-[205px] md:min-h-[220px] md:px-8">
      <div className="flex items-end justify-center pl-7 sm:pl-8 md:pl-9">
        {children.map((child, index) => {
          const photo = child.image || child.photo || "";
          const initials = getInitials(child);
          const childTheme = getChildColorTheme(child.color);

          return (
            <button
              key={child.id || child.name}
              type="button"
              onClick={() => openSection("children")}
              className={`group relative isolate flex w-[118px] shrink-0 flex-col items-center ${
                index === 0 ? "" : "-ml-7 sm:-ml-8 md:-ml-9"
              }`}
              style={{ zIndex: children.length + index }}
            >
              <div
                className="relative z-10 flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border-[7px] border-white text-2xl font-bold shadow-[0_14px_28px_rgba(79,74,69,0.14)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] sm:h-[132px] sm:w-[132px] sm:border-[9px] md:h-[150px] md:w-[150px] md:border-[10px]"
                style={{
                  backgroundColor: childTheme.soft,
                  color: childTheme.text,
                }}
              >
                {photo ? (
                  <PhotoImage
                    src={photo}
                    alt={child.name}
                    position={child.photoPosition}
                    zoom={child.photoZoom || 1}
                    className="h-full w-full"
                  />
                ) : initials ? (
                  initials
                ) : (
                  <UserRound className="h-10 w-10" />
                )}
              </div>

              <div
                className="relative z-30 -mt-3 min-w-[104px] max-w-[112px] rounded-[14px] px-4 py-2 text-center text-base font-bold leading-none text-white shadow-[0_8px_16px_rgba(79,74,69,0.14)] transition group-hover:brightness-95 sm:-mt-4 sm:min-w-[118px] sm:max-w-[132px] sm:rounded-[16px] sm:text-lg md:-mt-5 md:min-w-[126px] md:text-xl"
                style={{
                  backgroundColor: childTheme.dot,
                }}
              >
                <span className="relative z-40 block truncate">
                  {child.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>

  {children.length > 2 && (
    <p className="mt-1 text-center text-xs font-semibold text-[#9A8D7C] md:hidden">
      Glisse pour voir tous les profils.
    </p>
  )}
</div>
                  )}
                </div>
              </section>

              <section className="mt-7">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#4f4a45]">
                      Sections
                    </h2>

                    <p className="text-sm text-[#8b8278]">
                      {orderedSections.length} sections disponibles
                    </p>
                  </div>

                  <div className="flex shrink-0 rounded-full border border-[#eadfcf] bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition md:gap-2 md:px-4 ${
                        viewMode === "grid"
                          ? "bg-[#a8aa91] text-white"
                          : "text-[#8b8278] hover:bg-[#f7f1e8]"
                      }`}
                    >
                      <Grid2X2 size={14} />

                      <span className="hidden min-[430px]:inline">
                        2 colonnes
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition md:gap-2 md:px-4 ${
                        viewMode === "list"
                          ? "bg-[#a8aa91] text-white"
                          : "text-[#8b8278] hover:bg-[#f7f1e8]"
                      }`}
                    >
                      <List size={14} />

                      <span className="hidden min-[430px]:inline">Liste</span>
                    </button>
                  </div>
                </div>

                <div
                  className={
                    viewMode === "list"
                      ? "grid grid-cols-1 gap-4"
                      : "grid grid-cols-2 gap-3 md:gap-4"
                  }
                >
                  {orderedSections.map((section) => {
                    const Icon = section.icon;
                    const theme = getSectionTheme(
                      section,
                      sectionThemeOverrides
                    );

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => openSection(section.id)}
                        className="min-h-[148px] rounded-[24px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:min-h-[138px] md:rounded-[26px] md:p-5"
                        style={{
                          backgroundColor: theme.bgColor,
                          borderColor: theme.borderColor,
                        }}
                      >
                        <div
                          className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white md:h-12 md:w-12"
                          style={{ backgroundColor: theme.iconColor }}
                        >
                          <Icon size={22} />
                        </div>

                        <h3 className="text-base font-semibold leading-5 text-[#4f4a45] md:text-xl">
                          {section.title}
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-[#7d756e] md:text-sm">
                          {section.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
