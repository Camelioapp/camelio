import React, { useEffect, useState } from "react";
import { Baby, CalendarDays, FileText, ExternalLink, Copy, Check } from "lucide-react";
import { AppFontStyle } from "./shared";

function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";

  return /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line|TikTok|Snapchat/i.test(ua);
}

export default function WelcomeScreen() {
  const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
  }, []);

  const highlights = [
    {
      icon: Baby,
      title: "Ajoutez vos enfants",
      text: "Créez leurs profils en quelques secondes.",
      color: "bg-[#EEF4E8] text-[#7A8B69]",
    },
    {
      icon: CalendarDays,
      title: "Organisez l’essentiel",
      text: "Garde, rendez-vous, événements et notes au même endroit.",
      color: "bg-[#F9E7E4] text-[#C98F87]",
    },
    {
      icon: FileText,
      title: "Centralisez photos et documents",
      text: "Tout ce qui compte, accessible facilement.",
      color: "bg-[#F2ECF7] text-[#9B84B9]",
    },
  ];

  const handleSignup = () => {
    window.location.href = `${API_URL}/signup`;
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/login`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://camelio.app");
      setLinkCopied(true);

      setTimeout(() => {
        setLinkCopied(false);
      }, 2500);
    } catch (error) {
      setLinkCopied(false);
      window.prompt("Copiez ce lien dans votre navigateur :", "https://camelio.app");
    }
  };

  const handleOpenMainBrowser = () => {
    window.location.href = "https://camelio.app";
  };

  return (
    <div
      className="h-[100svh] overflow-hidden bg-[#F8F3EA] px-3 py-3 text-[#55534C] sm:px-4 sm:py-4 md:px-8"
      style={{
        fontFamily: "Comfortaa, ui-rounded, system-ui, sans-serif",
      }}
    >
      <AppFontStyle />

      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] bg-[#FFFCF7] px-5 py-5 shadow-2xl ring-4 ring-white/60 sm:rounded-[2.5rem] sm:px-6 sm:py-6">
        <div className="shrink-0 text-center">
          <img
            src="https://studiocameleon.ca/wp-content/uploads/2026/05/Camelio-et-citation.png"
            alt="Camelio"
            className="mx-auto h-auto w-[13rem] object-contain sm:w-[15rem]"
          />
        </div>

        {inAppBrowser && (
          <div className="mt-3 shrink-0 rounded-[1.5rem] border border-[#EEC988] bg-[#FFF8EA] p-3 text-left shadow-sm">
            <p className="text-sm font-bold text-[#7A5A24]">
              Connexion à partir de Messenger
            </p>

            <p className="mt-1 text-xs leading-relaxed text-[#7A5A24]">
              Vous ouvrez Camelio dans un navigateur intégré. La connexion peut
              être bloquée par Messenger, Facebook ou Instagram.
            </p>

            <p className="mt-1 text-xs leading-relaxed text-[#7A5A24]">
              Pour vous connecter, ouvrez Camelio dans votre navigateur
              principal, comme Safari, Chrome ou Edge.
            </p>

            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={handleOpenMainBrowser}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8FA173] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#7F9166]"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir camelio.app
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-[#7A5A24] ring-1 ring-[#EEC988] transition hover:bg-[#FFF4DD]"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Lien copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier le lien
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="relative mx-auto mt-3 h-[9.5rem] w-full max-w-[260px] shrink-0 sm:mt-4 sm:h-[11rem] sm:max-w-[290px]">
          <div className="absolute inset-x-6 top-7 h-28 rounded-[42%] bg-[#F9EEDC] opacity-75 blur-[1px]" />

          <img
            src="https://studiocameleon.ca/wp-content/uploads/2026/05/Logo-Camelio-2-scaled.png"
            alt="Logo Camelio"
            className="absolute inset-0 h-full w-full object-contain"
          />

          <div className="absolute left-2 top-20 text-2xl text-[#9B89BD] opacity-80">
            ♥
          </div>
          <div className="absolute right-4 top-8 text-2xl text-[#D99B99] opacity-70">
            ✦
          </div>
          <div className="absolute right-1 top-20 text-xl text-[#F2C45B] opacity-80">
            ✦
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col justify-center gap-3 overflow-hidden sm:mt-5 sm:gap-4">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-16 sm:w-16 ${item.color}`}
                >
                  <Icon className="h-6 w-6 stroke-[1.8] sm:h-7 sm:w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-[0.95rem] font-bold leading-5 text-[#55534C] sm:text-[1.05rem]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[0.8rem] leading-5 text-[#67655F] sm:text-[0.92rem] sm:leading-6">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-3 sm:mt-5">
          <button
            type="button"
            onClick={handleSignup}
            className="w-full rounded-2xl bg-[#8FA173] px-5 py-3.5 text-[1rem] font-bold tracking-wide text-white shadow-sm transition hover:brightness-95 sm:rounded-3xl sm:py-4 sm:text-[1.12rem]"
          >
            Inscription
          </button>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-2xl border border-[#8FA173]/40 bg-white px-5 py-3.5 text-[1rem] font-bold tracking-wide text-[#7A8B69] shadow-sm transition hover:bg-[#F4F7EF] sm:rounded-3xl sm:py-4 sm:text-[1.12rem]"
          >
            Connexion
          </button>
        </div>
      </div>
    </div>
  );
}