import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ArrowLeft,
  Grid2X2,
  List,
  UserRound,
} from "lucide-react";

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
import { sections } from "./sectionsData.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

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

  const DEFAULT_SECTION_ORDER = sections.map((section) => section.id);
  const [sectionOrderIds, setSectionOrderIds] = useState(DEFAULT_SECTION_ORDER);

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
            <section className="relative overflow-hidden rounded-[28px] border border-[#eadfcf] bg-[#fffdf8] shadow-sm md:rounded-[30px]">
              <FamilySoftCircles />

              <div className="relative z-10 grid grid-cols-[1fr_auto] items-start gap-4 p-5 md:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a8aa91] md:text-sm">
                    Bienvenue
                  </p>

                  <h2 className="mt-1 text-3xl font-semibold text-[#4f4a45]">
                    Ma famille
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-6 text-[#7d756e]">
                    Un carnet simple pour garder l’essentiel au même endroit.
                  </p>
                </div>

                <div className="flex items-start justify-end">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#eadfcf] bg-white shadow-sm md:h-24 md:w-24 md:rounded-[28px]">
                    <img
                      src="https://studiocameleon.ca/wp-content/uploads/2026/05/Logo-Camelio-2-scaled.png"
                      alt="Camelio"
                      className="h-12 w-12 object-contain md:h-20 md:w-20"
                    />
                  </div>
                </div>
              </div>

              <div className="relative z-10 px-5 pb-5 md:px-8 md:pb-8">
                {isLoadingChildren ? (
                  <div className="flex min-h-[165px] w-full items-center justify-center rounded-[26px] border border-dashed border-[#d8c8b6] bg-white text-center md:min-h-[170px]">
                    <p className="text-sm font-semibold text-[#8b8278]">
                      Chargement de votre famille...
                    </p>
                  </div>
                ) : children.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openSection("children")}
                    className="flex min-h-[165px] w-full flex-col items-center justify-center rounded-[26px] border border-dashed border-[#d8c8b6] bg-white text-center transition hover:bg-[#faf4ec] hover:shadow-sm md:min-h-[170px]"
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
                  <div className="flex flex-wrap items-center justify-center gap-4 rounded-[26px] border border-[#eadfcf] bg-white p-6">
                    {children.map((child) => {
                      const photo = child.image || child.photo || "";
                      const initials = getInitials(child);

                      return (
                        <button
                          key={child.id || child.name}
                          type="button"
                          onClick={() => openSection("children")}
                          className="group relative focus:outline-none"
                        >
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#eef0e7] text-2xl font-bold text-[#8f9874] shadow-md transition-transform duration-300 group-hover:scale-105 md:h-28 md:w-28">
                            {photo ? (
                              <img
                                src={photo}
                                alt={child.name}
                                className="h-full w-full object-cover"
                              />
                            ) : initials ? (
                              initials
                            ) : (
                              <UserRound className="h-8 w-8" />
                            )}
                          </div>

                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-xl bg-[#a8aa91] px-4 py-1 text-sm font-semibold text-white shadow-sm">
                            {child.name}
                          </span>
                        </button>
                      );
                    })}
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

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => openSection(section.id)}
                      className={`min-h-[148px] rounded-[24px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:min-h-[138px] md:rounded-[26px] md:p-5 ${section.bg} ${section.border}`}
                    >
                      <div
                        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white md:h-12 md:w-12 ${section.iconBg}`}
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
      <div className="pointer-events-none absolute -left-12 bottom-0 hidden h-28 w-28 rounded-tr-[44px] bg-[#dfe7d7]/75 md:block" />

      <div className="pointer-events-none absolute right-0 top-0 hidden h-28 w-28 rounded-bl-[44px] bg-[#f7dfe0]/85 md:block" />

      <div className="pointer-events-none absolute right-[94px] top-[42px] hidden h-6 w-6 rounded-full bg-[#b59ed4]/70 md:block" />
      <div className="pointer-events-none absolute right-[70px] top-[66px] hidden h-3.5 w-3.5 rounded-full bg-[#e99aaa]/70 md:block" />
      <div className="pointer-events-none absolute right-[110px] top-[88px] hidden h-4 w-4 rounded-full bg-[#a8b58f]/45 md:block" />

      <div className="pointer-events-none absolute left-12 bottom-16 hidden h-3 w-3 rounded-full bg-[#b59ed4]/40 md:block" />
      <div className="pointer-events-none absolute left-20 bottom-24 hidden h-2.5 w-2.5 rounded-full bg-[#e99aaa]/40 md:block" />
    </>
  );
}