import React, { useState } from "react";
import {
  Plus,
  Settings,
  Home,
  BookHeart,
  CalendarDays,
  FolderOpen,
  Camera,
  PencilLine,
  Quote,
  X,
} from "lucide-react";

export default function MobileFooter({
  activeSection,
  sharedAccess,
  openSection,
  goHome,
}) {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const settingsSectionId = sharedAccess.hasSharedAccess ? "guest-settings" : "settings";

  const navItems = [
    {
      id: "home",
      label: "Accueil",
      icon: Home,
      isActive: activeSection === "home",
      onClick: goHome,
      color: "#b5a7c8",
    },
    {
      id: "carnet-souvenirs",
      label: "Carnet",
      icon: BookHeart,
      isActive: activeSection === "carnet-souvenirs",
      onClick: () => openSection("carnet-souvenirs"),
      color: "#eaa5af",
    },
    {
      id: "calendar",
      label: "Calendrier",
      icon: CalendarDays,
      isActive: activeSection === "calendar",
      onClick: () => openSection("calendar"),
      color: "#a2badf",
    },
    {
      id: settingsSectionId,
      label: "Paramètres",
      icon: Settings,
      isActive: activeSection === settingsSectionId,
      onClick: () => openSection(settingsSectionId),
      color: "#a8b193",
    },
  ];

  const quickActions = [
    {
      label: "Ajouter une phrase mémorable",
      icon: Quote,
      color: "#b5a7c8",
      sectionId: "memorable-phrases",
    },
    {
      label: "Ajouter un document",
      icon: FolderOpen,
      color: "#eec988",
      sectionId: "documents",
    },
    {
      label: "Ajouter une photo",
      icon: Camera,
      color: "#eaa5af",
      sectionId: "photos",
    },
    {
      label: "Ajouter une note",
      icon: PencilLine,
      color: "#a8b193",
      sectionId: "notes",
    },
  ];

  function handleQuickAction(sectionId) {
    setIsQuickMenuOpen(false);
    window.setTimeout(() => openSection(sectionId), 120);
  }

  function handleNavClick(item) {
    setIsQuickMenuOpen(false);
    item.onClick();
  }

  return (
    <>
      {isQuickMenuOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu rapide"
          onClick={() => setIsQuickMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#4f4a45]/18 backdrop-blur-[2px] md:hidden"
        />
      ) : null}

      {isQuickMenuOpen ? (
        <div className="fixed bottom-[102px] left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 md:hidden">
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAction(action.sectionId)}
                  className="flex w-full items-center gap-3 rounded-[24px] border border-[#eadfcf] bg-white/95 px-4 py-3 text-left shadow-[0_18px_42px_rgba(79,74,69,0.18)] backdrop-blur transition active:scale-[0.98]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] text-white shadow-sm"
                    style={{ backgroundColor: action.color }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>

                  <span className="text-sm font-bold leading-snug text-[#4f4a45]">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 md:hidden" aria-label="Navigation mobile Camelio">
        <div className="relative mx-auto max-w-[430px] rounded-t-[34px] rounded-b-[28px] border border-[#eadfcf] bg-[#fffdf8]/92 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(79,74,69,0.14)] backdrop-blur-xl">
          <div className="grid grid-cols-5 items-end gap-1">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className="flex min-w-0 flex-col items-center gap-1 rounded-[20px] px-1 py-2 text-[10px] font-bold transition active:scale-95"
                  style={{
                    color: item.isActive ? item.color : "#8b8278",
                    backgroundColor: item.isActive ? `${item.color}22` : "transparent",
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsQuickMenuOpen((current) => !current)}
              className="mx-auto -mt-8 flex h-[66px] w-[66px] items-center justify-center rounded-full border-[5px] border-[#fffdf8] bg-[#b5a7c8] text-white shadow-[0_14px_26px_rgba(181,167,200,0.42)] transition active:scale-95"
              aria-label={isQuickMenuOpen ? "Fermer le menu rapide" : "Ouvrir le menu rapide"}
              aria-expanded={isQuickMenuOpen}
            >
              {isQuickMenuOpen ? (
                <X className="h-8 w-8" strokeWidth={2.2} />
              ) : (
                <Plus className="h-9 w-9" strokeWidth={2.2} />
              )}
            </button>

            {navItems.slice(2).map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className="flex min-w-0 flex-col items-center gap-1 rounded-[20px] px-1 py-2 text-[10px] font-bold transition active:scale-95"
                  style={{
                    color: item.isActive ? item.color : "#8b8278",
                    backgroundColor: item.isActive ? `${item.color}22` : "transparent",
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
