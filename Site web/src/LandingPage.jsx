import React from "react";
import { motion } from "framer-motion";
import {
  Camera,
  CalendarDays,
  Folder,
  Lock,
  Heart,
  Sparkles,
  Users,
  Search,
  Bell,
  CheckCircle2,
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
    icon: Camera,
    title: "Souvenirs précieux",
    text: "Conservez les photos, vidéos et petites histoires de votre enfant dans un espace doux, clair et facile à consulter.",
    bgColor: `${brand.pink}24`,
    iconColor: brand.pink,
  },
  {
    icon: Folder,
    title: "Documents importants",
    text: "Gardez les documents scolaires, médicaux et familiaux au même endroit, accessibles quand vous en avez besoin.",
    bgColor: `${brand.yellow}26`,
    iconColor: brand.yellow,
  },
  {
    icon: CalendarDays,
    title: "Calendrier familial",
    text: "Organisez les rendez-vous, activités, rappels et moments importants de la vie familiale.",
    bgColor: `${brand.purple}24`,
    iconColor: brand.purple,
  },
  {
    icon: Lock,
    title: "Espace privé et sécurisé",
    text: "Vos souvenirs, documents et informations familiales restent protégés dans un espace conçu pour votre famille.",
    bgColor: `${brand.green}26`,
    iconColor: brand.green,
  },
];

const miniCards = [
  {
    icon: Camera,
    label: "Souvenirs",
    text: "Photos, vidéos",
    bgColor: `${brand.pink}24`,
    iconColor: brand.pink,
  },
  {
    icon: Folder,
    label: "Documents",
    text: "École, santé",
    bgColor: `${brand.yellow}26`,
    iconColor: brand.yellow,
  },
  {
    icon: CalendarDays,
    label: "Calendrier",
    text: "Rappels, activités",
    bgColor: `${brand.purple}24`,
    iconColor: brand.purple,
  },
  {
    icon: Heart,
    label: "Notes",
    text: "Moments précieux",
    bgColor: `${brand.green}24`,
    iconColor: brand.green,
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-hidden text-slate-950"
      style={{ backgroundColor: brand.cream }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div
          className="absolute -left-24 top-12 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: `${brand.purple}55` }}
        />
        <div
          className="absolute right-0 top-24 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: `${brand.pink}55` }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${brand.yellow}55` }}
        />
        <div
          className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: `${brand.blue}40` }}
        />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex items-center">
          <img
            src="/Logo/Logo Camelio Hor.png"
            alt="Camelio"
            className="h-16 w-auto object-contain sm:h-20"
          />
        </div>

        <a
          href="#commencer"
          className="hidden rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 sm:inline-flex"
          style={{
            backgroundColor: brand.purple,
            boxShadow: "0 16px 30px rgba(181, 167, 200, 0.35)",
          }}
        >
          Créer mon carnet
        </a>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: `${brand.purple}22`,
                color: brand.purple,
                border: `1px solid ${brand.purple}33`,
              }}
            >
              <Sparkles className="h-4 w-4" />
              Carnet numérique familial
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Le carnet numérique qui{" "}
              <span style={{ color: brand.purple }}>grandit</span> avec{" "}
              <span style={{ color: brand.pink }}>votre enfant</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Gardez les souvenirs, les documents, les photos et les moments
              importants de votre enfant dans un espace simple, privé et pensé
              pour les familles.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                id="commencer"
                href="https://camelio.app"
                className="inline-flex items-center justify-center rounded-3xl px-7 py-4 text-base font-black text-white shadow-xl transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: brand.purple,
                  boxShadow: "0 18px 35px rgba(181, 167, 200, 0.35)",
                }}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Créer mon carnet gratuitement
              </a>

              <a
                href="#fonctionnalites"
                className="inline-flex items-center justify-center rounded-3xl border bg-white px-7 py-4 text-base font-black shadow-sm transition hover:-translate-y-0.5"
                style={{
                  borderColor: `${brand.purple}33`,
                  color: brand.purple,
                }}
              >
                Voir les fonctionnalités
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                [Camera, "Souvenirs", "Photos, vidéos et anecdotes", brand.pink],
                [Lock, "Sécuritaire", "Espace privé pour la famille", brand.green],
                [Users, "Familial", "Pensé pour le quotidien", brand.blue],
              ].map(([Icon, title, text, color]) => (
                <div
                  key={title}
                  className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur"
                >
                  <Icon
                    className="mb-3 h-6 w-6"
                    style={{ color }}
                  />
                  <div className="font-black">{title}</div>
                  <div className="text-sm text-slate-500">{text}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="absolute -right-8 top-12 hidden rounded-3xl bg-white/80 p-4 shadow-xl ring-1 ring-slate-100 backdrop-blur sm:block">
              <div
                className="flex items-center gap-3 text-sm font-bold"
                style={{ color: brand.purple }}
              >
                <Lock className="h-5 w-5" />
                Données sécurisées
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Un espace privé pour votre famille
              </p>
            </div>

            <div className="relative mx-auto w-[310px] rounded-[3rem] border-[10px] border-[#f7f1ec] bg-white p-5 shadow-2xl shadow-slate-200 sm:w-[380px]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-slate-900">
                    Camelio
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    Bienvenue dans votre espace
                  </div>
                </div>

                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: `${brand.pink}24` }}
                >
                  👧
                </div>
              </div>

              <div
                className="rounded-[2rem] p-5"
                style={{
                  background: `linear-gradient(135deg, ${brand.pink}24, ${brand.purple}24)`,
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black">Ma famille</div>
                    <div className="text-xs text-slate-500">
                      Un profil pour chaque enfant
                    </div>
                  </div>

                  <button
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-black shadow-sm"
                    style={{ color: brand.green }}
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-3 overflow-hidden">
                  {["Léa", "Noah", "Emma"].map((name, index) => {
                    const colors = [brand.purple, brand.yellow, brand.pink];

                    return (
                      <div key={name} className="min-w-[72px] text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                          {index === 1 ? "👦" : "👧"}
                        </div>

                        <div
                          className="mx-auto -mt-2 w-fit rounded-full px-3 py-1 text-xs font-black text-white"
                          style={{ backgroundColor: colors[index] }}
                        >
                          {name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {miniCards.map(({ icon: Icon, label, text, bgColor, iconColor }) => (
                  <div
                    key={label}
                    className="rounded-3xl p-4"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Icon
                      className="mb-4 h-6 w-6"
                      style={{ color: iconColor }}
                    />

                    <div className="text-sm font-black">{label}</div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-500">
                      {text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-around rounded-3xl bg-white py-3 text-slate-400 shadow-inner">
                <Heart
                  className="h-5 w-5"
                  style={{ color: brand.purple }}
                />
                <Search className="h-5 w-5" />
                <button
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white shadow-lg"
                  style={{
                    backgroundColor: brand.purple,
                    boxShadow: "0 12px 25px rgba(181, 167, 200, 0.35)",
                  }}
                >
                  +
                </button>
                <Bell className="h-5 w-5" />
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="absolute -bottom-6 left-0 hidden rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-slate-100 sm:block">
              <div className="text-7xl leading-none">👧</div>
              <p className="mt-2 max-w-44 text-sm font-bold text-slate-600">
                Un espace doux pour conserver ce qui compte vraiment.
              </p>
            </div>
          </motion.div>
        </section>

        <section
          id="fonctionnalites"
          className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"
        >
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div
              className="mb-4 inline-flex rounded-full px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: `${brand.pink}22`,
                color: brand.pink,
                border: `1px solid ${brand.pink}33`,
              }}
            >
              Fonctionnalités
            </div>

            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Tout pour organiser la vie familiale
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Camelio rassemble les souvenirs, les documents, les rappels et les
              informations importantes de votre enfant dans une expérience
              claire, agréable et facile à utiliser.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, bgColor, iconColor }) => (
              <motion.article
                whileHover={{ y: -6 }}
                key={title}
                className="rounded-[2rem] p-6 shadow-sm ring-1 ring-white/80"
                style={{ backgroundColor: bgColor }}
              >
                <div
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${iconColor}22`,
                    color: iconColor,
                  }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-xl font-black leading-tight">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-100 ring-1 ring-slate-100">
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
              {["🎂", "🏖️", "🎒"].map((emoji, index) => {
                const gradients = [
                  `linear-gradient(135deg, ${brand.pink}22, ${brand.purple}22)`,
                  `linear-gradient(135deg, ${brand.yellow}24, ${brand.green}22)`,
                  `linear-gradient(135deg, ${brand.blue}24, ${brand.purple}22)`,
                ];

                return (
                  <div
                    key={emoji}
                    className="flex h-32 items-center justify-center rounded-3xl text-5xl"
                    style={{ background: gradients[index] }}
                  >
                    {emoji}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3">
              {[
                "Anniversaire de Léa",
                "Premier jour d’école",
                "Carnet de santé",
              ].map((item, i) => {
                const colors = [brand.pink, brand.purple, brand.green];

                return (
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

                    <CheckCircle2
                      className="h-5 w-5"
                      style={{ color: colors[i] }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div
              className="mb-4 inline-flex rounded-full px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: `${brand.green}22`,
                color: brand.green,
                border: `1px solid ${brand.green}33`,
              }}
            >
              Organisation familiale
            </div>

            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Retrouvez rapidement ce que vous cherchez
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Fini les photos perdues dans le téléphone, les documents dispersés
              et les notes oubliées. Camelio vous aide à garder une trace claire
              des moments importants de votre enfant.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Photos et souvenirs classés",
                "Documents familiaux accessibles",
                "Calendrier et rappels importants",
                "Profils personnalisés pour chaque enfant",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-3xl bg-white p-4 font-bold shadow-sm ring-1 ring-slate-100"
                >
                  <CheckCircle2
                    className="h-5 w-5"
                    style={{ color: brand.green }}
                  />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-10">
          <div
            className="rounded-[3rem] p-8 text-center shadow-xl shadow-slate-100 sm:p-14"
            style={{
              background: `linear-gradient(135deg, ${brand.purple}28, ${brand.pink}24, ${brand.yellow}26)`,
            }}
          >
            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Commencez votre carnet familial aujourd’hui
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Créez un espace simple et rassurant pour conserver les souvenirs,
              les documents et les moments importants de votre enfant.
            </p>

            <a
              href="https://camelio.app"
              className="mt-8 inline-flex items-center justify-center rounded-3xl px-8 py-4 text-base font-black text-white shadow-xl transition hover:-translate-y-0.5"
              style={{
                backgroundColor: brand.purple,
                boxShadow: "0 18px 35px rgba(181, 167, 200, 0.35)",
              }}
            >
              Créer mon carnet gratuitement
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}