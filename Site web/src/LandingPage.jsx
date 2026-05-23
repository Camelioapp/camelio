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

const features = [
  {
    icon: Camera,
    title: "Souvenirs précieux",
    text: "Photos, vidéos et petites histoires réunies dans un espace doux et facile à consulter.",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100 text-rose-500",
  },
  {
    icon: Folder,
    title: "Documents importants",
    text: "Carnet de santé, documents scolaires, papiers essentiels et fichiers familiaux au même endroit.",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-500",
  },
  {
    icon: CalendarDays,
    title: "Calendrier familial",
    text: "Rendez-vous, activités, rappels et journées importantes organisés simplement.",
    bg: "bg-violet-50",
    iconBg: "bg-violet-100 text-violet-500",
  },
  {
    icon: Lock,
    title: "Espace sécurisé",
    text: "Vos souvenirs et documents restent privés, protégés et accessibles seulement aux bonnes personnes.",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
];

const miniCards = [
  { icon: Camera, label: "Souvenirs", text: "Photos, vidéos" },
  { icon: Folder, label: "Documents", text: "École, santé" },
  { icon: CalendarDays, label: "Calendrier", text: "Rappels, activités" },
  { icon: Heart, label: "Notes", text: "Moments précieux" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fffdfb] text-slate-950">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-violet-100 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-rose-100 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-orange-100 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="relative h-7 w-7">
              <span className="absolute left-2 top-0 h-3 w-3 rounded-full bg-violet-500" />
              <span className="absolute right-0 top-2 h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="absolute bottom-0 left-0 h-5 w-2.5 rotate-[-30deg] rounded-full bg-emerald-500" />
              <span className="absolute bottom-0 right-1 h-5 w-2.5 rotate-[30deg] rounded-full bg-sky-400" />
            </div>
          </div>

          <div className="text-3xl font-black tracking-tight">
            <span className="text-emerald-700">C</span>
            <span className="text-rose-500">a</span>
            <span className="text-violet-500">m</span>
            <span className="text-orange-400">e</span>
            <span className="text-emerald-600">l</span>
            <span className="text-rose-400">i</span>
            <span className="text-violet-500">o</span>
          </div>
        </div>

        <a
          href="#commencer"
          className="hidden rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 sm:inline-flex"
        >
          Créer mon carnet
        </a>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-100">
              <Sparkles className="h-4 w-4" />
              Carnet numérique familial
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
              Le carnet numérique qui{" "}
              <span className="text-violet-500">grandit</span> avec{" "}
              <span className="text-rose-500">votre enfant</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Gardez les souvenirs, les documents et les moments importants dans
              un espace simple, sécuritaire et pensé pour les familles.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                id="commencer"
                href="https://camelio.app"
                className="inline-flex items-center justify-center rounded-3xl bg-violet-600 px-7 py-4 text-base font-black text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Créer mon carnet gratuitement
              </a>

              <a
                href="#fonctionnalites"
                className="inline-flex items-center justify-center rounded-3xl border border-violet-100 bg-white px-7 py-4 text-base font-black text-violet-700 shadow-sm transition hover:-translate-y-0.5"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                [Camera, "Souvenirs", "Photos, vidéos"],
                [Lock, "Sécuritaire", "Données privées"],
                [Users, "Famille", "Partage contrôlé"],
              ].map(([Icon, title, text]) => (
                <div
                  key={title}
                  className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur"
                >
                  <Icon className="mb-3 h-6 w-6 text-violet-500" />
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
            <div className="absolute -right-8 top-12 hidden rounded-3xl bg-white/80 p-4 shadow-xl ring-1 ring-violet-100 backdrop-blur sm:block">
              <div className="flex items-center gap-3 text-sm font-bold text-violet-700">
                <Lock className="h-5 w-5" />
                Données sécurisées
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Privé pour votre famille
              </p>
            </div>

            <div className="relative mx-auto w-[310px] rounded-[3rem] border-[10px] border-[#f7f1ec] bg-white p-5 shadow-2xl shadow-slate-200 sm:w-[380px]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-slate-900">
                    Camelio
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    Bienvenue
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-2xl">
                  👧
                </div>
              </div>

              <div className="rounded-[2rem] bg-gradient-to-br from-rose-50 to-violet-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black">Ma famille</div>
                    <div className="text-xs text-slate-500">
                      Glissez pour voir plus
                    </div>
                  </div>
                  <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-black text-emerald-600 shadow-sm">
                    +
                  </button>
                </div>

                <div className="flex gap-3 overflow-hidden">
                  {["Léa", "Noah", "Emma"].map((name, index) => (
                    <div key={name} className="min-w-[72px] text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                        {index === 1 ? "👦" : "👧"}
                      </div>
                      <div
                        className={`mx-auto -mt-2 w-fit rounded-full px-3 py-1 text-xs font-black text-white ${
                          index === 0
                            ? "bg-violet-500"
                            : index === 1
                            ? "bg-orange-400"
                            : "bg-rose-500"
                        }`}
                      >
                        {name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {miniCards.map(({ icon: Icon, label, text }, index) => (
                  <div
                    key={label}
                    className={`rounded-3xl p-4 ${
                      index === 0
                        ? "bg-rose-50"
                        : index === 1
                        ? "bg-orange-50"
                        : index === 2
                        ? "bg-violet-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    <Icon
                      className={`mb-4 h-6 w-6 ${
                        index === 0
                          ? "text-rose-500"
                          : index === 1
                          ? "text-orange-500"
                          : index === 2
                          ? "text-violet-500"
                          : "text-emerald-600"
                      }`}
                    />
                    <div className="text-sm font-black">{label}</div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-500">
                      {text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-around rounded-3xl bg-white py-3 text-slate-400 shadow-inner">
                <Heart className="h-5 w-5 text-violet-500" />
                <Search className="h-5 w-5" />
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-2xl text-white shadow-lg shadow-violet-200">
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
            <div className="mb-4 inline-flex rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
              Fonctionnalités
            </div>
            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Tout pour organiser la vie familiale
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Camelio rassemble les souvenirs, les documents, les rappels et les
              informations importantes de votre enfant dans une expérience
              claire et agréable.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, bg, iconBg }) => (
              <motion.article
                whileHover={{ y: -6 }}
                key={title}
                className={`${bg} rounded-[2rem] p-6 shadow-sm ring-1 ring-white/80`}
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
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
              {["🎂", "🏖️", "🎒"].map((emoji) => (
                <div
                  key={emoji}
                  className="flex h-32 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-50 to-violet-50 text-5xl"
                >
                  {emoji}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              {[
                "Anniversaire de Léa",
                "Premier jour d’école",
                "Carnet de santé",
              ].map((item, i) => (
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
                    className={`h-5 w-5 ${
                      i === 0
                        ? "text-rose-500"
                        : i === 1
                        ? "text-violet-500"
                        : "text-emerald-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
              Organisation familiale
            </div>
            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Retrouvez rapidement ce que vous cherchez
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Fini les photos perdues dans le téléphone, les documents dispersés
              et les notes oubliées. Camelio vous aide à garder une trace claire
              des moments importants.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Photos et souvenirs classés",
                "Documents familiaux accessibles",
                "Calendrier et rappels importants",
                "Profils pour chaque enfant",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-3xl bg-white p-4 font-bold shadow-sm ring-1 ring-slate-100"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="rounded-[3rem] bg-gradient-to-br from-violet-100 via-rose-50 to-orange-50 p-8 text-center shadow-xl shadow-slate-100 sm:p-14">
            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Commencez votre carnet familial aujourd’hui
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Créez un espace simple et rassurant pour conserver les souvenirs,
              les documents et les moments importants de votre enfant.
            </p>
            <a
              href="https://camelio.app"
              className="mt-8 inline-flex items-center justify-center rounded-3xl bg-violet-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              Créer mon carnet gratuitement
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
