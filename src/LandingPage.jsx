import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CalendarDays,
  Folder,
  Lock,
  Menu,
  X,
  Sparkles,
  Users,
  ShieldCheck,
  Baby,
  Quote,
  HeartPulse,
  ClipboardList,
  ReceiptText,
  CheckCircle2,
  HelpCircle,
  Search,
  Layers,
  Smartphone,
  HeartHandshake,
  ChevronDown,
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
    icon: Quote,
    title: "Phrases mémorables",
    text: "Notez les petites phrases, les mots drôles et les souvenirs précieux.",
    bgColor: `${brand.green}22`,
    iconColor: brand.green,
  },
  {
    icon: HeartPulse,
    title: "Santé",
    text: "Gardez les informations médicales, allergies, rendez-vous et suivis importants.",
    bgColor: `${brand.pink}18`,
    iconColor: brand.pink,
  },
  {
    icon: ClipboardList,
    title: "Plan parental",
    text: "Centralisez les informations importantes liées à l’organisation parentale.",
    bgColor: `${brand.purple}20`,
    iconColor: brand.purple,
  },
  {
    icon: CalendarDays,
    title: "Calendrier parental",
    text: "Visualisez les gardes, rendez-vous, activités et rappels familiaux.",
    bgColor: `${brand.blue}24`,
    iconColor: brand.blue,
  },
  {
    icon: ReceiptText,
    title: "Factures et impôts",
    text: "Gardez vos factures, reçus et documents utiles pour le suivi familial et les impôts.",
    bgColor: `${brand.green}18`,
    iconColor: brand.green,
  },
];

const featureTabs = [
  {
    id: "profil-enfant",
    title: "Profil enfant",
    intro:
      "Le profil enfant centralise les informations importantes de chaque enfant dans un espace clair et facile à consulter.",
    details:
      "Camelio permet de regrouper les renseignements essentiels comme les informations personnelles, l’école, les contacts importants, les habitudes, les notes et les éléments à retenir. C’est une base simple pour garder une vue complète de ce qui compte pour votre enfant.",
  },
  {
    id: "photos",
    title: "Photos",
    intro:
      "La section Photos permet de conserver les souvenirs importants dans un carnet numérique familial.",
    details:
      "Ajoutez les photos, vidéos, albums et moments marquants de votre enfant. Camelio aide les familles à garder une trace des souvenirs précieux sans les perdre dans le téléphone, les conversations ou les dossiers dispersés.",
  },
  {
    id: "documents",
    title: "Documents",
    intro:
      "La section Documents permet de regrouper les fichiers importants au même endroit.",
    details:
      "Conservez les documents scolaires, médicaux, administratifs ou familiaux dans un espace organisé. Cette section aide à retrouver rapidement un papier important lorsqu’un parent, une école, un professionnel ou un organisme en a besoin.",
  },
  {
    id: "phrases-memorables",
    title: "Phrases mémorables",
    intro:
      "La section Phrases mémorables sert à noter les mots drôles, touchants ou importants de votre enfant.",
    details:
      "Les enfants disent parfois des phrases qu’on veut garder pour toujours. Camelio permet de les noter avec une date, un contexte et un souvenir associé afin de créer une trace vivante des moments marquants de l’enfance.",
  },
  {
    id: "sante",
    title: "Santé",
    intro:
      "La section Santé permet de suivre les informations médicales importantes de l’enfant.",
    details:
      "Gardez les rendez-vous médicaux, allergies, médicaments, suivis, professionnels de santé, notes et informations utiles au même endroit. Cette section est pensée pour aider les parents à mieux organiser le suivi de santé de leur enfant.",
  },
  {
    id: "plan-parental",
    title: "Plan parental",
    intro:
      "La section Plan parental aide à centraliser les informations importantes liées à l’organisation familiale.",
    details:
      "Camelio peut aider les parents à garder une trace des informations liées à la garde, aux décisions importantes, aux responsabilités, aux ententes et aux éléments pratiques du quotidien. C’est un espace utile pour mieux organiser la coparentalité.",
  },
  {
    id: "calendrier-parental",
    title: "Calendrier parental",
    intro:
      "Le calendrier parental permet de visualiser les gardes, rendez-vous, activités et rappels familiaux.",
    details:
      "Suivez les journées de garde, les événements scolaires, les activités, les rendez-vous médicaux et les rappels importants. Le calendrier Camelio est conçu pour donner une vue claire de l’organisation familiale.",
  },
  {
    id: "factures-impots",
    title: "Factures et impôts",
    intro:
      "La section Factures et impôts permet de conserver les reçus, factures et documents utiles au suivi familial.",
    details:
      "Ajoutez les factures, reçus, paiements, frais liés aux enfants et documents pouvant être utiles pour les impôts ou le suivi administratif. Camelio aide les parents à garder une trace claire des dépenses et documents importants.",
  },
];

const faqs = [
  {
    question: "Qu’est-ce que Camelio ?",
    answer:
      "Camelio est un carnet numérique familial conçu pour aider les parents à conserver les souvenirs, documents, informations de santé, rendez-vous, factures et moments importants de leur enfant au même endroit.",
  },
  {
    question: "À qui s’adresse Camelio ?",
    answer:
      "Camelio s’adresse aux parents, aux familles qui veulent mieux s’organiser, aux parents séparés ou coparents, ainsi qu’aux familles qui souhaitent garder une trace claire de ce qui compte pour leur enfant.",
  },
  {
    question: "Que peut-on conserver dans Camelio ?",
    answer:
      "Vous pouvez conserver des photos, documents importants, informations médicales, phrases mémorables, éléments du plan parental, dates importantes, factures, reçus et autres informations utiles au suivi familial.",
  },
  {
    question: "Est-ce que Camelio peut aider les parents séparés ?",
    answer:
      "Oui. Camelio peut aider à centraliser les informations importantes liées à l’organisation parentale, au calendrier parental, aux documents, aux dépenses et aux suivis importants de l’enfant.",
  },
  {
    question: "Combien coûte Camelio ?",
    answer:
      "Camelio offre un premier mois gratuit. Ensuite, l’abonnement mensuel est de 6,95 $ par mois. Une formule annuelle sera disponible bientôt.",
  },
  {
    question: "Est-ce que Camelio est accessible partout ?",
    answer:
      "Oui. Camelio est conçu pour être accessible en ligne afin de retrouver les informations importantes de votre enfant lorsque vous en avez besoin.",
  },
];

export default function LandingPage() {
  const [activeFeatureTab, setActiveFeatureTab] = useState(featureTabs[0].id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [cookieChoice, setCookieChoice] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("camelio_cookie_choice");
  });

  const handleCookieChoice = (choice) => {
    localStorage.setItem("camelio_cookie_choice", choice);
    setCookieChoice(choice);
  };

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
      <SeoStructuredData />

      <header className="relative z-30 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="/" className="flex items-center">
          <img
            src="/Logo/Logo Camelio Hor.png"
            alt="Camelio"
            className="h-16 w-auto object-contain sm:h-20"
          />
        </a>

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
          Connexion
          <span className="text-xl leading-none">→</span>
        </a>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-sm ring-1 ring-white/80 backdrop-blur md:hidden"
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-[#071126]" />
          ) : (
            <Menu className="h-5 w-5 text-[#071126]" />
          )}
        </button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute left-5 right-5 top-[92px] z-40 rounded-[1.6rem] bg-white/95 p-4 shadow-2xl shadow-slate-200/60 ring-1 ring-white/90 backdrop-blur md:hidden"
            >
              <div className="grid gap-3">
                <a
                  href="https://camelio.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-black text-white shadow-lg"
                  style={{
                    backgroundColor: brand.green,
                    boxShadow: "0 14px 26px rgba(168, 177, 147, 0.35)",
                  }}
                >
                  Connexion
                  <span className="text-xl leading-none">→</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setIsPrivacyOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-full bg-slate-100 px-6 py-4 text-sm font-black text-[#071126] transition hover:bg-slate-200"
                >
                  Confidentialité
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

            <p className="mx-auto mt-4 max-w-[480px] text-sm font-semibold leading-7 text-slate-500 sm:text-base lg:mx-0">
              Une application familiale pour organiser les souvenirs, documents,
              informations de santé, rappels, factures et grandes étapes de
              votre enfant.
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
                  Connexion à Camelio →
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        <PricingSection />
        <AudienceSection />
        <BenefitsSection />

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
              Camelio rassemble les souvenirs, les documents, les informations
              de santé, le plan parental, les phrases mémorables, les factures et
              le calendrier familial dans une expérience douce et facile à utiliser.
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

          <FeatureSeoTabs
            tabs={featureTabs}
            activeTab={activeFeatureTab}
            onChange={setActiveFeatureTab}
          />
        </section>

        <FaqSection />

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
              Connexion à Camelio →
            </a>
          </div>
        </section>

        <footer className="relative z-10 mx-auto max-w-6xl px-5 pb-8 pt-2 sm:px-8 lg:px-10">
          <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-white/75 px-5 py-6 text-center shadow-sm ring-1 ring-white/80 backdrop-blur sm:flex-row sm:justify-between sm:text-left">
            <div className="text-sm font-bold text-[#243852]">
              © {new Date().getFullYear()} Camelio. Tous droits réservés.
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-[#243852]">
              <span>Fait à Sherbrooke, Québec</span>

              <span
                className="inline-flex h-5 w-7 items-center justify-center overflow-hidden rounded-sm shadow-sm ring-1 ring-slate-200"
                aria-label="Drapeau du Québec"
                title="Québec"
              >
                <svg viewBox="0 0 28 20" className="h-full w-full" aria-hidden="true">
                  <rect width="28" height="20" fill="#ffffff" />
                  <rect x="0" y="0" width="11" height="8" fill="#003DA5" />
                  <rect x="17" y="0" width="11" height="8" fill="#003DA5" />
                  <rect x="0" y="12" width="11" height="8" fill="#003DA5" />
                  <rect x="17" y="12" width="11" height="8" fill="#003DA5" />
                  <text x="5.5" y="6.2" textAnchor="middle" fontSize="5" fill="#ffffff">
                    ⚜
                  </text>
                  <text x="22.5" y="6.2" textAnchor="middle" fontSize="5" fill="#ffffff">
                    ⚜
                  </text>
                  <text x="5.5" y="18.2" textAnchor="middle" fontSize="5" fill="#ffffff">
                    ⚜
                  </text>
                  <text x="22.5" y="18.2" textAnchor="middle" fontSize="5" fill="#ffffff">
                    ⚜
                  </text>
                </svg>
              </span>
            </div>
          </div>
        </footer>
      </main>

      {!cookieChoice && <CookieBanner onChoice={handleCookieChoice} />}

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onChoice={handleCookieChoice}
      />
    </div>
  );
}

function SeoStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Camelio",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description:
          "Camelio est un carnet numérique familial pour conserver les souvenirs, documents, informations de santé, calendrier parental, factures et moments importants de votre enfant au même endroit.",
        offers: {
          "@type": "Offer",
          price: "6.95",
          priceCurrency: "CAD",
          description: "1er mois gratuit, puis 6,95 $ par mois.",
        },
        areaServed: {
          "@type": "Place",
          name: "Québec, Canada",
        },
        creator: {
          "@type": "Organization",
          name: "Camelio",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

function PhoneMockup() {
  return (
    <div className="relative z-10 mx-auto w-[430px] bg-transparent p-0 sm:w-[530px] lg:w-[520px]">
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden sm:min-h-[530px] lg:min-h-[620px]">
        <motion.img
          src="/cellulaire_camelio.png"
          alt="Aperçu de l'application Camelio sur téléphone"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="h-auto w-full object-contain"
        />
      </div>
    </div>
  );
}

function PricingSection() {
  const pricingCards = [
    {
      label: "Essai gratuit",
      title: "1er mois gratuit",
      description:
        "Essayez Camelio sans engagement et découvrez un espace simple pour centraliser ce qui compte pour votre enfant.",
      icon: Sparkles,
      color: brand.green,
      items: [
        "5 Go de stockage disponible",
        "Toutes les sections disponibles",
        "Accessible partout",
        "Plateforme simple",
      ],
    },
    {
      label: "Abonnement mensuel",
      title: "6,95 $ / mois",
      description:
        "Un abonnement mensuel simple pour garder votre carnet familial accessible au quotidien.",
      icon: ShieldCheck,
      color: brand.purple,
      highlight: true,
      items: [
        "5 Go de stockage disponible",
        "Toutes les sections disponibles",
        "Accessible partout",
        "Plateforme simple",
      ],
    },
    {
      label: "Abonnement annuel",
      title: "Bientôt disponible",
      description:
        "Une formule annuelle sera offerte prochainement pour les familles qui souhaitent simplifier leur abonnement.",
      icon: CalendarDays,
      color: brand.pink,
      items: [
        "Nombre de Go en évaluation",
        "Toutes les sections disponibles",
        "Accessible partout",
        "Plateforme simple",
      ],
    },
  ];

  return (
    <section
      id="tarifs"
      className="mx-auto max-w-6xl px-5 pb-10 pt-4 sm:px-8 lg:px-10 lg:pb-16"
    >
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <div
          className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
          style={{
            backgroundColor: `${brand.green}22`,
            color: brand.green,
            border: `1px solid ${brand.green}33`,
          }}
        >
          Offre de lancement
        </div>

        <h2 className="text-3xl font-black tracking-[-0.04em] text-[#071126] sm:text-5xl">
          Un carnet familial simple, complet et accessible
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Commencez gratuitement, puis choisissez la formule qui convient le
          mieux à votre famille.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {pricingCards.map(
          ({ label, title, description, icon: Icon, color, items, highlight }) => (
            <motion.article
              key={label}
              whileHover={{ y: -6 }}
              className={`relative overflow-hidden rounded-[2rem] p-6 shadow-xl ring-1 backdrop-blur ${
                highlight
                  ? "text-white ring-white/30"
                  : "bg-white/88 text-[#071126] shadow-slate-200/50 ring-white/80"
              }`}
              style={
                highlight
                  ? {
                      background: `linear-gradient(135deg, ${brand.green}, ${brand.purple})`,
                      boxShadow: "0 22px 45px rgba(168, 177, 147, 0.38)",
                    }
                  : {}
              }
            >
              {highlight && (
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20" />
              )}

              <div className="relative">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    highlight ? "bg-white/20" : ""
                  }`}
                  style={
                    highlight
                      ? {}
                      : {
                          backgroundColor: `${color}22`,
                          color,
                        }
                  }
                >
                  <Icon className="h-7 w-7" />
                </div>

                <div
                  className={`text-sm font-black uppercase tracking-[0.12em] ${
                    highlight ? "text-white/80" : ""
                  }`}
                  style={highlight ? {} : { color }}
                >
                  {label}
                </div>

                <h3
                  className={`mt-3 text-3xl font-black leading-tight ${
                    highlight ? "text-white" : "text-[#071126]"
                  }`}
                >
                  {title}
                </h3>

                <p
                  className={`mt-4 text-base leading-7 ${
                    highlight ? "font-semibold text-white/90" : "text-slate-600"
                  }`}
                >
                  {description}
                </p>

                <ul
                  className={`mt-6 space-y-3 text-sm font-semibold leading-6 ${
                    highlight ? "text-white" : "text-slate-600"
                  }`}
                >
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0"
                        style={{
                          color: highlight ? "#ffffff" : brand.green,
                        }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          )
        )}
      </div>
    </section>
  );
}

function AudienceSection() {
  const audiences = [
    {
      icon: Baby,
      title: "Pour les parents",
      text: "Gardez les souvenirs, documents, rappels et informations importantes de votre enfant dans un espace simple.",
      color: brand.pink,
    },
    {
      icon: HeartHandshake,
      title: "Pour les familles séparées",
      text: "Centralisez les informations utiles à l’organisation parentale, au calendrier familial et au suivi de l’enfant.",
      color: brand.purple,
    },
    {
      icon: Layers,
      title: "Pour les familles organisées",
      text: "Retrouvez rapidement les documents, factures, suivis de santé et moments importants.",
      color: brand.green,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 pt-4 sm:px-8 lg:px-10 lg:pb-20">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <div
          className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
          style={{
            backgroundColor: `${brand.purple}22`,
            color: brand.purple,
            border: `1px solid ${brand.purple}33`,
          }}
        >
          Pour qui ?
        </div>

        <h2 className="text-3xl font-black tracking-[-0.04em] text-[#071126] sm:text-5xl">
          Pensé pour les familles qui veulent mieux s’organiser
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Camelio aide à regrouper les informations de l’enfant dans un espace
          clair, utile et accessible.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {audiences.map(({ icon: Icon, title, text, color }) => (
          <motion.article
            key={title}
            whileHover={{ y: -6 }}
            className="rounded-[2rem] bg-white/85 p-6 shadow-xl shadow-slate-200/40 ring-1 ring-white/80 backdrop-blur"
          >
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <Icon className="h-7 w-7" />
            </div>

            <h3 className="text-2xl font-black tracking-[-0.03em] text-[#071126]">
              {title}
            </h3>

            <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: Search,
      title: "Moins de documents perdus",
      text: "Retrouvez plus facilement les documents importants de votre enfant.",
      color: brand.blue,
    },
    {
      icon: Camera,
      title: "Moins de souvenirs dispersés",
      text: "Conservez les photos, phrases et moments précieux dans un espace dédié.",
      color: brand.pink,
    },
    {
      icon: CalendarDays,
      title: "Une meilleure organisation familiale",
      text: "Gardez une vue plus claire sur les rappels, rendez-vous et éléments importants.",
      color: brand.green,
    },
    {
      icon: Smartphone,
      title: "Un accès simple partout",
      text: "Accédez à vos informations importantes lorsque vous en avez besoin.",
      color: brand.purple,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 pt-4 sm:px-8 lg:px-10 lg:pb-20">
      <div
        className="rounded-[3rem] p-7 shadow-xl shadow-slate-200/40 ring-1 ring-white/80 backdrop-blur sm:p-10"
        style={{
          background: `linear-gradient(135deg, ${brand.green}18, ${brand.pink}18, ${brand.blue}18)`,
        }}
      >
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div
            className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
            style={{
              backgroundColor: `${brand.blue}22`,
              color: brand.blue,
              border: `1px solid ${brand.blue}33`,
            }}
          >
            Pourquoi Camelio ?
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#071126] sm:text-5xl">
            Tout ce qui compte, mieux organisé
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Une page familiale conçue pour réduire la dispersion des informations
            importantes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text, color }) => (
            <motion.article
              key={title}
              whileHover={{ y: -5 }}
              className="rounded-[2rem] bg-white/85 p-5 shadow-sm ring-1 ring-white/80"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${color}22`, color }}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-black leading-tight text-[#071126]">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSeoTabs({ tabs, activeTab, onChange }) {
  const activeContent = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="mt-12 rounded-[2.5rem] bg-white/80 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-white/80 backdrop-blur sm:p-7 lg:p-8">
      <div className="mx-auto mb-7 max-w-3xl text-center">
        <div
          className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
          style={{
            backgroundColor: `${brand.green}22`,
            color: brand.green,
            border: `1px solid ${brand.green}33`,
          }}
        >
          Tout comprendre
        </div>

        <h3 className="text-2xl font-black tracking-[-0.04em] text-[#071126] sm:text-4xl">
          Des sections pensées pour le quotidien des familles
        </h3>

        <p className="mt-4 text-base leading-7 text-slate-600">
          Chaque section de Camelio aide à centraliser une partie importante de
          la vie familiale, souvenirs, documents, santé, organisation parentale
          et suivi administratif.
        </p>
      </div>

      <div className="mb-6 lg:hidden">
        <label
          htmlFor="feature-tab-select"
          className="mb-2 block text-sm font-black text-[#071126]"
        >
          Choisir une section
        </label>

        <select
          id="feature-tab-select"
          value={activeTab}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-white/80 bg-white px-4 py-4 text-base font-black text-[#071126] shadow-lg outline-none transition focus:ring-4"
          style={{
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
            "--tw-ring-color": `${brand.green}33`,
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden gap-2 lg:grid">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className="rounded-2xl px-4 py-3 text-left text-sm font-black transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: isActive
                    ? brand.green
                    : "rgba(255,255,255,0.75)",
                  color: isActive ? "#ffffff" : "#071126",
                  boxShadow: isActive
                    ? "0 14px 28px rgba(168, 177, 147, 0.35)"
                    : "0 8px 18px rgba(15, 23, 42, 0.05)",
                  border: isActive
                    ? `1px solid ${brand.green}`
                    : "1px solid rgba(255,255,255,0.9)",
                }}
              >
                {tab.title}
              </button>
            );
          })}
        </div>

        <motion.article
          key={activeContent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[2rem] bg-white/90 p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
        >
          <h4 className="text-2xl font-black tracking-[-0.03em] text-[#071126] sm:text-3xl">
            {activeContent.title}
          </h4>

          <p className="mt-4 text-base font-bold leading-7 text-slate-700">
            {activeContent.intro}
          </p>

          <p className="mt-4 text-base leading-8 text-slate-600">
            {activeContent.details}
          </p>
        </motion.article>
      </div>

      <div className="sr-only">
        {tabs.map((tab) => (
          <section key={`seo-${tab.id}`}>
            <h3>{tab.title}</h3>
            <p>{tab.intro}</p>
            <p>{tab.details}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 pt-6 sm:px-8 lg:px-10 lg:pb-20">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <div
          className="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black"
          style={{
            backgroundColor: `${brand.yellow}28`,
            color: "#b28b3f",
            border: `1px solid ${brand.yellow}44`,
          }}
        >
          FAQ
        </div>

        <h2 className="text-3xl font-black tracking-[-0.04em] text-[#071126] sm:text-5xl">
          Questions fréquentes sur Camelio
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Des réponses simples pour mieux comprendre le carnet numérique familial
          Camelio.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.article
              key={faq.question}
              className="overflow-hidden rounded-[1.5rem] bg-white/85 shadow-sm ring-1 ring-white/80 backdrop-blur"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              >
                <span className="flex items-center gap-3 text-base font-black text-[#071126] sm:text-lg">
                  <HelpCircle
                    className="h-5 w-5 shrink-0"
                    style={{ color: brand.purple }}
                  />
                  {faq.question}
                </span>

                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-5 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function PrivacyModal({ isOpen, onClose, onChoice }) {
  if (!isOpen) return null;

  const acceptCookies = () => {
    onChoice("accepted");
    onClose();
  };

  const refuseCookies = () => {
    onChoice("refused");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#071126]/45 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-white/80 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="mb-3 inline-flex rounded-full px-4 py-2 text-xs font-black"
              style={{
                backgroundColor: `${brand.green}22`,
                color: brand.green,
                border: `1px solid ${brand.green}33`,
              }}
            >
              Confidentialité
            </div>

            <h2 className="text-2xl font-black tracking-[-0.04em] text-[#071126] sm:text-4xl">
              Cookies et politique d’utilisation
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#071126] transition hover:bg-slate-200"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-5 text-[#243852]">
          <section className="rounded-[1.5rem] bg-slate-50 p-5">
            <h3 className="text-lg font-black text-[#071126]">
              Pourquoi Camelio utilise des cookies
            </h3>

            <p className="mt-3 text-sm font-medium leading-7">
              Camelio utilise certains cookies et technologies similaires pour
              assurer le bon fonctionnement de l’application. Certains cookies
              sont nécessaires pour reconnaître votre session, maintenir votre
              connexion et associer votre navigation au bon profil utilisateur.
            </p>

            <p className="mt-3 text-sm font-medium leading-7">
              Lorsque vous vous connectez à Camelio, l’application doit pouvoir
              reconnaître votre profil afin d’afficher les bonnes informations
              familiales, les bons enfants, les bons documents et les bons
              paramètres.
            </p>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-100">
            <h3 className="text-lg font-black text-[#071126]">
              Types de cookies utilisés
            </h3>

            <div className="mt-4 grid gap-4">
              <div>
                <h4 className="font-black text-[#071126]">Cookies essentiels</h4>
                <p className="mt-2 text-sm font-medium leading-7">
                  Ces cookies sont nécessaires pour faire fonctionner le site et
                  l’application. Ils peuvent servir à maintenir une session,
                  protéger l’accès au compte, reconnaître le profil connecté et
                  conserver certains choix techniques.
                </p>
              </div>

              <div>
                <h4 className="font-black text-[#071126]">
                  Cookies de préférences
                </h4>
                <p className="mt-2 text-sm font-medium leading-7">
                  Ces cookies peuvent aider à conserver certains choix, comme la
                  langue, l’affichage ou les préférences de navigation.
                </p>
              </div>

              <div>
                <h4 className="font-black text-[#071126]">
                  Cookies de mesure et d’amélioration
                </h4>
                <p className="mt-2 text-sm font-medium leading-7">
                  Ces cookies peuvent aider Camelio à comprendre l’utilisation du
                  site, à améliorer l’expérience et à détecter les pages ou
                  fonctionnalités qui doivent être améliorées.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-slate-50 p-5">
            <h3 className="text-lg font-black text-[#071126]">
              Politique d’utilisation et de confidentialité
            </h3>

            <p className="mt-3 text-sm font-medium leading-7">
              En utilisant Camelio, vous acceptez que la plateforme puisse
              traiter certaines informations nécessaires au fonctionnement du
              service, notamment les informations liées à votre compte, vos
              préférences, votre session et les profils familiaux que vous
              choisissez de créer dans l’application.
            </p>

            <p className="mt-3 text-sm font-medium leading-7">
              Camelio vise à limiter la collecte aux informations nécessaires
              pour offrir le service, sécuriser l’accès, reconnaître le bon
              profil utilisateur et permettre l’organisation des informations
              familiales.
            </p>

            <p className="mt-3 text-sm font-medium leading-7">
              Vous pouvez accepter ou refuser les cookies non essentiels. Les
              cookies essentiels peuvent demeurer nécessaires pour permettre la
              connexion, la sécurité et le fonctionnement de l’application.
            </p>
          </section>

          <section className="rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-100">
            <h3 className="text-lg font-black text-[#071126]">Vos choix</h3>

            <p className="mt-3 text-sm font-medium leading-7">
              Vous pouvez accepter les cookies non essentiels ou les refuser. Si
              vous refusez, Camelio utilisera seulement les cookies nécessaires
              au bon fonctionnement du site et de l’application.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={refuseCookies}
                className="rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-[#071126] transition hover:bg-slate-200"
              >
                Refuser les cookies non essentiels
              </button>

              <button
                type="button"
                onClick={acceptCookies}
                className="rounded-full px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: brand.green,
                  boxShadow: "0 14px 26px rgba(168, 177, 147, 0.35)",
                }}
              >
                Accepter les cookies
              </button>
            </div>
          </section>

          <p className="text-xs font-medium leading-6 text-slate-500">
            Ce texte est une base informative et ne remplace pas un avis
            juridique. Il est recommandé de faire valider la politique par une
            personne qualifiée, surtout si Camelio utilise des outils d’analyse,
            de marketing, de paiement ou des services externes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function CookieBanner({ onChoice }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[1.8rem] bg-white/95 p-5 shadow-2xl shadow-slate-300/50 ring-1 ring-white/90 backdrop-blur sm:bottom-6 sm:p-6"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="text-base font-black text-[#071126]">
            Gestion des cookies
          </div>

          <p className="mt-2 text-sm font-medium leading-6 text-[#243852]">
            Camelio utilise des cookies essentiels pour faire fonctionner le site,
            maintenir la connexion et reconnaître le bon profil utilisateur dans
            l’application. Des cookies non essentiels peuvent aussi être utilisés
            pour améliorer l’expérience et mesurer l’utilisation du site.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <button
            type="button"
            onClick={() => onChoice("refused")}
            className="rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-[#071126] transition hover:-translate-y-0.5 hover:bg-slate-200"
          >
            Refuser
          </button>

          <button
            type="button"
            onClick={() => onChoice("accepted")}
            className="rounded-full px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
            style={{
              backgroundColor: brand.green,
              boxShadow: "0 14px 26px rgba(168, 177, 147, 0.35)",
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedDesktopBullets() {
  const bubbles = [
    { top: "12vh", left: "3vw", size: 18, color: brand.yellow, delay: 0.2 },
    { top: "22vh", left: "10vw", size: 10, color: brand.pink, delay: 1.1 },
    { top: "35vh", left: "5vw", size: 26, color: brand.blue, delay: 0.7 },
    { top: "49vh", left: "14vw", size: 14, color: brand.purple, delay: 1.6 },
    { top: "63vh", left: "7vw", size: 20, color: brand.green, delay: 2.2 },
    { top: "78vh", left: "16vw", size: 12, color: brand.pink, delay: 1.4 },
    { top: "88vh", left: "4vw", size: 24, color: brand.purple, delay: 2.7 },
    { top: "11vh", left: "41vw", size: 12, color: brand.purple, delay: 0 },
    { top: "17vh", left: "53vw", size: 18, color: brand.pink, delay: 0.5 },
    { top: "27vh", left: "47vw", size: 8, color: brand.blue, delay: 1.1 },
    { top: "39vh", left: "57vw", size: 14, color: brand.green, delay: 0.8 },
    { top: "53vh", left: "45vw", size: 20, color: brand.yellow, delay: 1.4 },
    { top: "68vh", left: "55vw", size: 11, color: brand.pink, delay: 2.1 },
    { top: "82vh", left: "46vw", size: 22, color: brand.green, delay: 1.2 },
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
  const mobileDots = [
    { top: "12vh", left: "8vw", size: 10, color: brand.yellow, delay: 0.2 },
    { top: "18vh", right: "12vw", size: 8, color: brand.purple, delay: 1.1 },
    { top: "26vh", left: "18vw", size: 7, color: brand.pink, delay: 0.7 },
    { top: "34vh", right: "18vw", size: 11, color: brand.blue, delay: 1.6 },
    { top: "43vh", left: "10vw", size: 9, color: brand.green, delay: 2.2 },
    { top: "52vh", right: "8vw", size: 7, color: brand.pink, delay: 1.4 },
    { top: "61vh", left: "22vw", size: 12, color: brand.purple, delay: 2.7 },
    { top: "72vh", right: "22vw", size: 9, color: brand.yellow, delay: 0.9 },
    { top: "84vh", left: "12vw", size: 8, color: brand.blue, delay: 1.8 },
    { top: "92vh", right: "14vw", size: 11, color: brand.green, delay: 0.5 },
  ];

  const mobileRings = [
    { top: "20vh", left: "4vw", size: 34, color: brand.purple, delay: 0.3 },
    { top: "38vh", right: "5vw", size: 30, color: brand.pink, delay: 1.2 },
    { top: "68vh", left: "7vw", size: 28, color: brand.blue, delay: 0.8 },
  ];

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
        style={{ backgroundColor: `${brand.green}45` }}
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
        style={{ backgroundColor: `${brand.pink}42` }}
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
        style={{ backgroundColor: `${brand.purple}38` }}
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
        style={{ backgroundColor: `${brand.blue}38` }}
      />

      {mobileDots.map((dot, index) => (
        <motion.span
          key={`mobile-dot-${index}`}
          className="absolute rounded-full"
          style={{
            top: dot.top,
            left: dot.left,
            right: dot.right,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
            opacity: 0.62,
            boxShadow: `0 0 18px ${dot.color}88`,
          }}
          animate={{
            x: [0, 14 + (index % 3) * 3, -10, 0],
            y: [0, -14 - (index % 2) * 4, 10, 0],
            scale: [1, 1.25, 0.9, 1],
            opacity: [0.35, 0.75, 0.45, 0.35],
          }}
          transition={{
            duration: 7 + (index % 5),
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {mobileRings.map((ring, index) => (
        <motion.span
          key={`mobile-ring-${index}`}
          className="absolute rounded-full border-4"
          style={{
            top: ring.top,
            left: ring.left,
            right: ring.right,
            width: ring.size,
            height: ring.size,
            borderColor: ring.color,
            opacity: 0.42,
            boxShadow: `0 0 18px ${ring.color}66`,
          }}
          animate={{
            x: [0, -12, 10, 0],
            y: [0, 12, -10, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.22, 0.55, 0.32, 0.22],
          }}
          transition={{
            duration: 9 + index,
            delay: ring.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}