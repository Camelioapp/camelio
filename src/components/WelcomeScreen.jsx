import React from "react";
import { Baby, CalendarDays, FileText } from "lucide-react";
import { AppFontStyle } from "./shared";

export default function WelcomeScreen() {
  const highlights = [
    { icon: Baby, title: "Ajoutez vos enfants", text: "Créez leurs profils en quelques secondes.", color: "bg-[#EEF4E8] text-[#7A8B69]" },
    { icon: CalendarDays, title: "Organisez l’essentiel", text: "Garde, rendez-vous, événements et notes au même endroit.", color: "bg-[#F9E7E4] text-[#C98F87]" },
    { icon: FileText, title: "Centralisez photos et documents", text: "Tout ce qui compte, accessible facilement.", color: "bg-[#F2ECF7] text-[#9B84B9]" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F3EA] px-4 py-5 text-[#55534C] md:px-8" style={{ fontFamily: "Comfortaa, ui-rounded, system-ui, sans-serif" }}>
      <AppFontStyle />

      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.75rem] bg-[#FFFCF7] px-7 pb-7 pt-10 shadow-2xl ring-8 ring-white/60">
        <div className="flex-1">
          <div className="text-center">
            <img src="https://studiocameleon.ca/wp-content/uploads/2026/05/Camelio-et-citation.png" alt="Camelio" className="mx-auto h-auto w-[20rem] object-contain" />
          </div>

          <div className="relative mx-auto mt-9 h-[17.5rem] max-w-[330px]">
            <div className="absolute inset-x-5 top-8 h-52 rounded-[42%] bg-[#F9EEDC] opacity-75 blur-[1px]" />
            <img src="https://studiocameleon.ca/wp-content/uploads/2026/05/Logo-Camelio-2-scaled.png" alt="Logo Camelio" className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute left-2 top-24 text-4xl text-[#9B89BD] opacity-80">♥</div>
            <div className="absolute right-2 top-12 text-4xl text-[#D99B99] opacity-70">✦</div>
            <div className="absolute right-0 top-28 text-3xl text-[#F2C45B] opacity-80">✦</div>
          </div>

          <div className="mt-7 space-y-5">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-5">
                  <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl ${item.color} shadow-sm`}>
                    <Icon className="h-9 w-9 stroke-[1.7]" />
                  </div>
                  <div>
                    <p className="text-[1.18rem] font-bold leading-6 text-[#55534C]">{item.title}</p>
                    <p className="mt-1 text-[1rem] leading-7 text-[#67655F]">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/login`; }} className="mt-9 w-full rounded-3xl bg-[#8FA173] px-6 py-5 text-[1.25rem] font-bold tracking-wide text-white shadow-sm transition hover:brightness-95">
          Connexion
        </button>
      </div>
    </div>
  );
}
