import React, { useEffect, useState } from "react";
import { Baby, CalendarDays, FileText, Check } from "lucide-react";
import { AppFontStyle } from "./shared";

const APP_URL = "https://camelio.app";

function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";

  return /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line|TikTok|Snapchat/i.test(ua);
}

function isAndroidDevice() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  return /Android/i.test(ua);
}

function isAppleDevice() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  return /iPhone|iPad|iPod/i.test(ua);
}

export default function WelcomeScreen() {
  const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [browserNotice, setBrowserNotice] = useState("");

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

  const copyAppLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setBrowserNotice(
        "Lien copié. Ouvrez Safari, Chrome ou Edge, puis collez camelio.app."
      );
    } catch (error) {
      setBrowserNotice(
        "Ouvrez Safari, Chrome ou Edge, puis allez sur camelio.app."
      );
    }

    setTimeout(() => {
      setBrowserNotice("");
    }, 4500);
  };

  const openDefaultBrowser = async () => {
    if (!inAppBrowser) {
      window.location.href = APP_URL;
      return;
    }

    if (isAndroidDevice()) {
      window.location.href =
        "intent://camelio.app#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fcamelio.app;end";
      return;
    }

    if (isAppleDevice()) {
      await copyAppLink();
      return;
    }

    window.open(APP_URL, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      setBrowserNotice(
        "Si la page reste dans Messenger, ouvrez le menu ⋯ puis choisissez Ouvrir dans le navigateur."
      );
    }, 800);
  };

  const handleSignup = () => {
    if (inAppBrowser) {
      openDefaultBrowser();
      return;
    }

    window.location.href = `${API_URL}/signup`;
  };

  const handleLogin = () => {
    if (inAppBrowser) {
      openDefaultBrowser();
      return;
    }

    window.location.href = `${API_URL}/login`;
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

        {browserNotice && (
          <div className="mb-3 rounded-2xl border border-[#D8E6CA] bg-[#F7FBF3] px-4 py-3 text-center text-xs font-bold leading-relaxed text-[#6F785F]">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>{browserNotice}</span>
            </div>
          </div>
        )}

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