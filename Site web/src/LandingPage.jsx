import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CalendarDays,
  Folder,
  Lock,
  Menu,
  Sparkles,
  Users,
  CheckCircle2,
  ShieldCheck,
  Baby,
} from "lucide-react";

const brand = {
  green: "#a8b193",
  pink: "#eaa5af",
  purple: "#b5a7c8",
  yellow: "#eec988",
  blue: "#a2badf",
  cream: "#fffdfb",
  dark: "#1f2430",
};

const features = [
  {
    icon: Baby,
    title: "Profil enfant",
    text: "Infos, santé, école et moments importants réunis dans un profil simple.",
    bgColor: `${brand.purple}22`,
    iconColor: brand.purple,
  },
  {
    icon: Camera,
    title: "Photos",
    text: "Conservez les photos, vidéos et souvenirs qui comptent vraiment.",
    bgColor: `${brand.pink}22`,
    iconColor: brand.pink,
  },
  {
    icon: Folder,
    title: "Documents",
    text: "Gardez les documents importants accessibles au même endroit.",
    bgColor: `${brand.yellow}28`,
    iconColor: brand.yellow,
  },
  {
    icon: CalendarDays,
    title: "Calendrier",
    text: "Suivez les rendez-vous, activités et rappels familiaux.",
    bgColor: `${brand.blue}24`,
    iconColor: brand.blue,
  },
];

const phoneImages = [
  "/cellulaire_camelio.png",
  "/cellulaire_camelio2.png",
  "/cellulaire_camelio3.png",
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-hidden text-slate-950"
      style={{
        backgroundColor: brand.cream,
        backgroundImage: "url('/fond.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center">
          <img
            src="/Logo/Logo Camelio Hor.png"
            alt="Camelio"
            className="h-20 w-auto object-contain sm:h-20"
          />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-bold text-[#071126] md:flex">
          <a href="#fonctionnalites" className="transition hover:text-slate-600">
            Fonctionnalités
          </a>
          <a href="#securite" className="transition hover:text-slate-600">
            Sécurité
          </a>
          <a href="#commencer" className="transition hover:text-slate-600">
            Commencer
          </a>
        </nav>

        <a
  href="https://camelio.app/"
  target="_blank"
  rel="noopener noreferrer"
  className="hidden items-center gap-3 rounded-full px-6 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 md:inline-flex"
  style={{
    backgroundColor: brand.green,
    boxShadow: "0 14px 26px rgba(168, 177, 147, 0.35)",
  }}
>
  Créer mon carnet
  <span className="text-xl leading-none">→</span>
</a>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-slate-100 md:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>
      </header>

      <main className="relative z-10">
        <section className="relative mx-auto grid max-w-6xl items-center gap-5 px-5 pb-14 pt-1 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-14">
  <AnimatedMobileCircles />
  <AnimatedDesktopBullets />

  <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative z-10 mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
          >
            <div
              className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black lg:mx-0"
              style={{
                backgroundColor: `${brand.purple}21`,
                color: brand.purple,
                border: `1px solid ${brand.purple}21`,
              }}
            >
              <Sparkles className="h-8.5 w-8.5" />
              Le carnet numérique familial
            </div>

            <h1 className="mx-auto max-w-[430px] text-[3rem] font-black leading-[0.98] tracking-[-0.06em] text-[#071126] sm:max-w-2xl sm:text-6xl lg:mx-0 lg:max-w-3xl lg:text-[5.3rem]">
              Essayez
              <br />
              gratuitement
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${brand.purple}, ${brand.pink})`,
                }}
              >
                Camelio
              </span>
              <br />
              dès aujourd’hui.
            </h1>

            <p className="mx-auto mt-6 max-w-[450px] text-[1.05rem] font-semibold leading-8 text-[#243852] sm:text-lg lg:mx-0">
              Le carnet numérique familial qui permet de conserver
              <br className="hidden sm:block" />
              ce qui compte pour votre enfant{" "}
              <span className="font-black text-[#071126]">au même endroit.</span>
            </p>

            <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-3 lg:max-w-[760px]">
              {[
                [Camera, "Souvenirs", "Simples et accessibles.", brand.pink],
                [Lock, "Privé", "Simples et sécurisés.", brand.green],
                [Users, "Famille", "Simple et accessible.", brand.purple],
              ].map(([Icon, label, description, color]) => (
                <div
                  key={label}
                  className="rounded-[1.6rem] bg-white/85 p-5 text-left shadow-xl shadow-slate-200/50 ring-1 ring-white/80 backdrop-blur"
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${color}22`,
                      color,
                      boxShadow: `0 10px 22px ${color}33`,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="text-base font-black text-[#071126]">
                    {label}
                  </div>

                  <div className="mt-2 text-sm font-medium leading-5 text-slate-500">
                    {description}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative z-10 mx-auto mt-3 flex w-full justify-center sm:mt-6 lg:mt-0"
          >
            <div className="relative flex w-full flex-col items-center justify-center">
              <PhoneMockup />

              <div className="relative z-30 mt-8 flex w-full justify-center px-4 sm:mt-10 lg:mt-12 lg:-ml-10">
                <a
                  id="commencer"
                  href="https://camelio.app"
                  className="flex w-full max-w-[330px] items-center justify-center rounded-full px-7 py-4 text-center text-sm font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:shadow-xl sm:max-w-[390px] sm:text-base"
                  style={{
                    backgroundColor: brand.green,
                    boxShadow: "0 18px 38px rgba(168, 177, 147, 0.45)",
                  }}
                >
                  ✨ Essayez Camelio gratuitement →
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="fonctionnalites"
          className="mx-auto max-w-6xl px-5 pb-14 pt-6 sm:px-8 lg:px-10 lg:pb-20 lg:pt-10"
        >
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <div
              className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: `${brand.pink}22`,
                color: brand.pink,
                border: `1px solid ${brand.pink}33`,
              }}
            >
              Fonctionnalités
            </div>

            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Une page simple pour toute la famille
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Camelio rassemble les souvenirs, les documents, les rappels et les
              informations importantes de votre enfant dans une expérience douce
              et facile à utiliser.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, bgColor, iconColor }) => (
              <motion.article
                whileHover={{ y: -6 }}
                key={title}
                className="rounded-[2rem] p-6 shadow-sm ring-1 ring-white/80"
                style={{ backgroundColor: bgColor }}
              >
                <div
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70"
                  style={{ color: iconColor }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-xl font-black leading-tight text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section
          id="securite"
          className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-20"
        >
          <div className="rounded-[2.5rem] bg-white p-5 shadow-xl shadow-slate-100 ring-1 ring-slate-100 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${brand.purple}22`,
                  color: brand.purple,
                }}
              >
                <Camera />
              </div>

              <div>
                <div className="text-xl font-black">Souvenirs récents</div>
                <div className="text-sm text-slate-500">
                  Vos moments importants
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ["🎂", `${brand.pink}24`],
                ["🏖️", `${brand.yellow}28`],
                ["🎒", `${brand.blue}24`],
              ].map(([emoji, bg]) => (
                <div
                  key={emoji}
                  className="flex h-28 items-center justify-center rounded-3xl text-4xl sm:h-32 sm:text-5xl"
                  style={{ backgroundColor: bg }}
                >
                  {emoji}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Anniversaire de Léa", brand.pink],
                ["Premier jour d’école", brand.purple],
                ["Carnet de santé", brand.green],
              ].map(([item, color]) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <div className="font-black">{item}</div>
                    <div className="text-sm text-slate-500">
                      Ajouté dans Camelio
                    </div>
                  </div>

                  <CheckCircle2 className="h-5 w-5" style={{ color }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: `${brand.green}22`,
                color: brand.green,
                border: `1px solid ${brand.green}33`,
              }}
            >
              Sécurité et organisation
            </div>

            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Retrouvez rapidement ce que vous cherchez
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Fini les photos perdues dans le téléphone, les documents dispersés
              et les notes oubliées. Camelio vous aide à garder une trace claire
              des moments importants de votre enfant.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Photos et souvenirs classés", brand.pink],
                ["Documents familiaux accessibles", brand.yellow],
                ["Calendrier et rappels importants", brand.blue],
                ["Profils personnalisés par enfant", brand.green],
              ].map(([text, color]) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-3xl bg-white p-4 font-bold shadow-sm ring-1 ring-slate-100"
                >
                  <CheckCircle2 className="h-5 w-5" style={{ color }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
          <div
            className="rounded-[3rem] p-8 text-center shadow-xl shadow-slate-100 sm:p-14"
            style={{
              background: `linear-gradient(135deg, ${brand.green}28, ${brand.pink}24, ${brand.yellow}26)`,
            }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.75)",
                color: brand.green,
              }}
            >
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Commencez votre carnet familial aujourd’hui
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Créez un espace simple et rassurant pour conserver les souvenirs,
              les documents et les moments importants de votre enfant.
            </p>

            <a
              href="https://camelio.app"
              className="mt-8 inline-flex items-center justify-center rounded-3xl px-8 py-4 text-base font-black text-white shadow-xl transition hover:-translate-y-0.5"
              style={{
                backgroundColor: brand.green,
                boxShadow: "0 18px 35px rgba(168, 177, 147, 0.35)",
              }}
            >
              ✨ Essayez Camelio gratuitement →
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function PhoneMockup() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((currentIndex) =>
        currentIndex === phoneImages.length - 1 ? 0 : currentIndex + 1
      );
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const goToImage = (index) => {
    if (index === activeIndex) return;

    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  return (
    <div className="relative z-10 mx-auto w-[430px] bg-transparent p-0 sm:w-[530px] lg:w-[520px]">
      <div className="relative min-h-[430px] overflow-hidden sm:min-h-[530px] lg:min-h-[620px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={phoneImages[activeIndex]}
            src={phoneImages[activeIndex]}
            alt={`Aperçu ${activeIndex + 1} de l'application Camelio`}
            custom={direction}
            initial={{
              opacity: 0,
              x: direction > 0 ? 34 : -34,
              scale: 0.97,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              x: direction > 0 ? -34 : 34,
              scale: 0.97,
              filter: "blur(6px)",
            }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0 h-auto w-full object-contain"
          />
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {phoneImages.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => goToImage(index)}
            aria-label={`Afficher l'image ${index + 1}`}
            className="h-2.5 rounded-full transition-all duration-300"
            style={{
              width: activeIndex === index ? "30px" : "10px",
              backgroundColor:
                activeIndex === index
                  ? brand.green
                  : "rgba(168, 177, 147, 0.35)",
              opacity: activeIndex === index ? 1 : 0.75,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AnimatedDesktopBullets() {
  const bubbles = [
    // Gauche de l'écran
    { top: "12vh", left: "3vw", size: 18, color: brand.yellow, delay: 0.2 },
    { top: "22vh", left: "10vw", size: 10, color: brand.pink, delay: 1.1 },
    { top: "35vh", left: "5vw", size: 26, color: brand.blue, delay: 0.7 },
    { top: "49vh", left: "14vw", size: 14, color: brand.purple, delay: 1.6 },
    { top: "63vh", left: "7vw", size: 20, color: brand.green, delay: 2.2 },
    { top: "78vh", left: "16vw", size: 12, color: brand.pink, delay: 1.4 },
    { top: "88vh", left: "4vw", size: 24, color: brand.purple, delay: 2.7 },

    // Centre
    { top: "11vh", left: "41vw", size: 12, color: brand.purple, delay: 0 },
    { top: "17vh", left: "53vw", size: 18, color: brand.pink, delay: 0.5 },
    { top: "27vh", left: "47vw", size: 8, color: brand.blue, delay: 1.1 },
    { top: "39vh", left: "57vw", size: 14, color: brand.green, delay: 0.8 },
    { top: "53vh", left: "45vw", size: 20, color: brand.yellow, delay: 1.4 },
    { top: "68vh", left: "55vw", size: 11, color: brand.pink, delay: 2.1 },
    { top: "82vh", left: "46vw", size: 22, color: brand.green, delay: 1.2 },

    // Droite
    { top: "8vh", right: "18vw", size: 14, color: brand.blue, delay: 0.6 },
    { top: "16vh", right: "6vw", size: 24, color: brand.purple, delay: 1.3 },
    { top: "28vh", right: "20vw", size: 10, color: brand.pink, delay: 0.9 },
    { top: "39vh", right: "4vw", size: 18, color: brand.yellow, delay: 1.8 },
    { top: "54vh", right: "13vw", size: 12, color: brand.green, delay: 0.4 },
    { top: "68vh", right: "5vw", size: 26, color: brand.pink, delay: 2.2 },
    { top: "82vh", right: "18vw", size: 9, color: brand.blue, delay: 1.5 },
  ];

  const rings = [
    { top: "18vh", left: "18vw", size: 38, color: brand.purple, delay: 0.2 },
    { top: "42vh", left: "9vw", size: 44, color: brand.blue, delay: 1.1 },
    { top: "72vh", left: "21vw", size: 34, color: brand.green, delay: 1.6 },
    { top: "31vh", right: "15vw", size: 42, color: brand.pink, delay: 0.7 },
    { top: "73vh", right: "20vw", size: 38, color: brand.green, delay: 2.1 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] hidden overflow-hidden lg:block">
      {bubbles.map((bubble, index) => (
        <motion.span
          key={`bubble-${index}`}
          className="absolute rounded-full"
          style={{
            top: bubble.top,
            left: bubble.left,
            right: bubble.right,
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            opacity: 0.68,
            boxShadow: `0 0 24px ${bubble.color}99`,
          }}
          animate={{
            x: [0, 22 + (index % 4) * 4, -14, 0],
            y: [0, -18 - (index % 3) * 4, 16, 0],
            scale: [1, 1.28, 0.92, 1],
            opacity: [0.42, 0.8, 0.5, 0.42],
          }}
          transition={{
            duration: 9 + (index % 7),
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {rings.map((ring, index) => (
        <motion.span
          key={`ring-${index}`}
          className="absolute rounded-full border-4"
          style={{
            top: ring.top,
            left: ring.left,
            right: ring.right,
            width: ring.size,
            height: ring.size,
            borderColor: ring.color,
            opacity: 0.52,
            boxShadow: `0 0 22px ${ring.color}77`,
          }}
          animate={{
            x: [0, -18, 14, 0],
            y: [0, 16, -12, 0],
            scale: [1, 1.18, 0.95, 1],
            opacity: [0.3, 0.68, 0.38, 0.3],
          }}
          transition={{
            duration: 11 + index,
            delay: ring.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function AnimatedMobileCircles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden lg:hidden">
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [20, -18, 25, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-12 top-24 h-32 w-32 rounded-full blur-sm"
        style={{ backgroundColor: `${brand.green}55` }}
      />

      <motion.div
        animate={{
          x: [0, -18, 16, 0],
          y: [0, 22, -12, 0],
          scale: [1, 0.95, 1.08, 1],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -right-14 top-56 h-36 w-36 rounded-full blur-sm"
        style={{ backgroundColor: `${brand.pink}50` }}
      />

      <motion.div
        animate={{
          x: [0, 14, -16, 0],
          y: [0, -14, 18, 0],
          scale: [1, 1.12, 0.98, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-8 top-[470px] h-24 w-24 rounded-full blur-sm"
        style={{ backgroundColor: `${brand.purple}45` }}
      />

      <motion.div
        animate={{
          x: [0, -12, 18, 0],
          y: [0, 16, -10, 0],
          scale: [1, 0.94, 1.06, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-8 top-[640px] h-20 w-20 rounded-full blur-sm"
        style={{ backgroundColor: `${brand.blue}45` }}
      />
    </div>
  );
}