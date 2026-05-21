import React, { useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeft, Grid2X2, List, UserRound } from "lucide-react";

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

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const SECTION_ORDER_STORAGE_KEY = "camelio-section-order";
const SECTION_THEME_STORAGE_KEY = "camelio-section-themes";

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

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("home");
  const [viewMode, setViewMode] = useState("grid");

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

  const [parentProfile, setParentProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

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

  if (activeSection !== "home") {
    return (
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
    );
  }

  return (
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
              <FamilySoftCircles />

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
                  <div className="relative flex min-h-[210px] items-center justify-center overflow-x-auto px-2 pb-4 pt-2">
                    <div className="flex items-end justify-center pl-7 pr-7">
                      {children.map((child, index) => {
                        const photo = child.image || child.photo || "";
                        const initials = getInitials(child);

                        return (
                          <button
                            key={child.id || child.name}
                            type="button"
                            onClick={() => openSection("children")}
                            className={`group relative flex shrink-0 flex-col items-center ${
                              index === 0 ? "" : "-ml-5 md:-ml-7"
                            }`}
                            style={{ zIndex: children.length + index }}
                          >
                            <div className="flex h-[132px] w-[132px] items-center justify-center overflow-hidden rounded-full border-[10px] border-white bg-[#eef0e7] text-3xl font-bold text-[#8f9874] shadow-[0_14px_28px_rgba(79,74,69,0.14)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] md:h-[150px] md:w-[150px]">
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={child.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : initials ? (
                                initials
                              ) : (
                                <UserRound className="h-10 w-10" />
                              )}
                            </div>

                            <div className="-mt-5 min-w-[104px] rotate-[-2deg] rounded-[18px] bg-[#a8aa91] px-5 py-2 text-center text-lg font-semibold text-white shadow-sm transition group-hover:bg-[#929b7b] md:min-w-[120px] md:text-xl">
                              {child.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
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
                  const theme = getSectionTheme(section, sectionThemeOverrides);

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
  );
}

function FamilySoftCircles() {
  return (
    <>
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-64 rounded-tr-[120px] bg-[#dfe7d7]/65 md:h-52 md:w-80" />

      <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-bl-[80px] bg-[#f7dfe0]/85 md:h-44 md:w-44" />

      <div className="pointer-events-none absolute left-[22%] top-[58%] h-5 w-5 rounded-full bg-[#c78cb7]/70 md:h-6 md:w-6" />

      <div className="pointer-events-none absolute right-[18%] bottom-[20%] h-5 w-5 rounded-full bg-[#ffd27a]/90 md:h-6 md:w-6" />

      <div className="pointer-events-none absolute right-[21%] top-[18%] hidden h-8 w-8 rotate-12 border-r-4 border-t-4 border-[#ffd27a] md:block" />

      <div className="pointer-events-none absolute right-[19%] top-[27%] hidden h-7 w-7 rotate-[-8deg] border-r-4 border-t-4 border-[#ffd27a] md:block" />
    </>
  );
}