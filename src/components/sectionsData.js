import {
  Baby,
  Image,
  Quote,
  CalendarDays,
  HeartPulse,
  FolderOpen,
  Receipt,
  Calculator,
  FileText,
  StickyNote,
  Settings,
  Share2,
  BookOpen,
} from "lucide-react";

export const sectionThemes = {
  rose: {
    label: "Rose",
    bgColor: "#fff3f6",
    borderColor: "#f4c9d5",
    iconColor: "#e99aaa",
  },
  peach: {
    label: "Pêche",
    bgColor: "#fff4f0",
    borderColor: "#efcabc",
    iconColor: "#df9f8a",
  },
  mauve: {
    label: "Mauve",
    bgColor: "#fff7fb",
    borderColor: "#f0cfe0",
    iconColor: "#d99ab9",
  },
  green: {
    label: "Vert",
    bgColor: "#f7fbf3",
    borderColor: "#d8e6ca",
    iconColor: "#a8b58f",
  },
  mint: {
    label: "Menthe",
    bgColor: "#f4fbf8",
    borderColor: "#c8e4d8",
    iconColor: "#8fbfa8",
  },
  sand: {
    label: "Sable",
    bgColor: "#fff9ef",
    borderColor: "#ead7b8",
    iconColor: "#d8b77f",
  },
  purple: {
    label: "Violet",
    bgColor: "#f8f5ff",
    borderColor: "#d8cef1",
    iconColor: "#aa99cf",
  },
  blue: {
    label: "Bleu",
    bgColor: "#f1f7ff",
    borderColor: "#c6daf4",
    iconColor: "#9ebbe1",
  },
  yellow: {
    label: "Jaune",
    bgColor: "#fffdf3",
    borderColor: "#eadfac",
    iconColor: "#d7c37f",
  },
  gray: {
    label: "Gris",
    bgColor: "#f5f5f2",
    borderColor: "#d8d8cd",
    iconColor: "#a9aa91",
  },
};

export const colorOptions = [
  { value: "sage", label: "Sauge", bg: "bg-[#eef0e7]", text: "text-[#8f9874]" },
  { value: "rose", label: "Rose", bg: "bg-[#fff3f6]", text: "text-[#e99aaa]" },
  { value: "blue", label: "Bleu", bg: "bg-[#f1f7ff]", text: "text-[#9ebbe1]" },
  { value: "mauve", label: "Mauve", bg: "bg-[#f7f3ff]", text: "text-[#ad9bcf]" },
  { value: "gold", label: "Doré", bg: "bg-[#fff9ef]", text: "text-[#d8b77f]" },
];

export function getColor(value = "sage") {
  return colorOptions.find((color) => color.value === value) || colorOptions[0];
}

export function displayName(child) {
  if (!child) return "Enfant";
  return child.nickname || child.name || child.firstName || "Enfant";
}

export const sections = [
  {
    id: "children",
    title: "Profil enfant",
    description: "Photos, école, rappels, santé.",
    icon: Baby,
    defaultTheme: "rose",
  },
  {
    id: "photos",
    title: "Photos",
    description: "Souvenirs et albums.",
    icon: Image,
    defaultTheme: "peach",
  },
  {
    id: "memorable-phrases",
    title: "Phrases mémorables",
    description: "Citations et mots d’enfants.",
    icon: Quote,
    defaultTheme: "mauve",
  },
  {
    id: "carnet-souvenirs",
    title: "Carnet souvenir",
    description: "Échographies, premiers moments, croissance et souvenirs précieux.",
    icon: BookOpen,
    defaultTheme: "sand",
  },
  {
    id: "calendar",
    title: "Calendrier",
    description: "Gardes, activités, rendez-vous.",
    icon: CalendarDays,
    defaultTheme: "green",
  },
  {
    id: "sante",
    title: "Médical",
    description: "Santé et médicaments.",
    icon: HeartPulse,
    defaultTheme: "mint",
  },
  {
    id: "documents",
    title: "Zone documents",
    description: "Ententes et formulaires.",
    icon: FolderOpen,
    defaultTheme: "sand",
  },
  {
    id: "invoices",
    title: "Factures / reçus",
    description: "Dépenses et paiements.",
    icon: Receipt,
    defaultTheme: "purple",
  },
  {
    id: "calculator",
    title: "Calculateur de journées",
    description: "Répartition annuelle.",
    icon: Calculator,
    defaultTheme: "blue",
  },
  {
    id: "parental-plan",
    title: "Plan parental",
    description: "Horaire, décisions, ententes.",
    icon: FileText,
    defaultTheme: "gray",
  },
  {
    id: "notes",
    title: "Zone notes",
    description: "Rappels et suivis.",
    icon: StickyNote,
    defaultTheme: "yellow",
  },
    {
    id: "profile-sharing",
    title: "Partage de profil",
    description: "Accès famille et permissions.",
    icon: Share2,
    defaultTheme: "mint",
  },

  {
    id: "settings",
    title: "Paramètres",
    description: "Préférences et configuration.",
    icon: Settings,
    defaultTheme: "sand",
  },
];

export function getSectionTheme(section, themeOverrides = {}) {
  const themeKey = themeOverrides[section.id] || section.defaultTheme || "gray";
  return sectionThemes[themeKey] || sectionThemes.gray;
}