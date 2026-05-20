import {
  Baby,
  CalendarDays,
  FileText,
  Camera,
  ReceiptText,
  Stethoscope,
  ScrollText,
  Settings,
  Calculator,
  StickyNote,
} from "lucide-react";

export const palette = {
  sage: "#A8B193",
  rose: "#EAA5AF",
  lavender: "#B5A7C8",
  sand: "#EEC988",
  blue: "#A2BADF",
  cream: "#FFFCF7",
  beige: "#F8F3EA",
  text: "#55534C",
  muted: "#746F64",
  border: "#EFE4D6",
};

export const sections = [
  {
    id: "children",
    title: "Profil enfant",
    subtitle: "Photos, école, rappels, santé et routines.",
    icon: Baby,
    color: "bg-[#EAA5AF]",
    card: "bg-[#FFF8F9] ring-[#F3CDD3]",
  },
  {
    id: "parentalPlan",
    title: "Plan parental",
    subtitle: "Horaire, décisions, communication et ententes.",
    icon: ScrollText,
    color: "bg-[#B5A7C8]",
    card: "bg-[#F7F4FB] ring-[#DED6EF]",
  },
  {
    id: "calendar",
    title: "Calendrier",
    subtitle: "Garde, école, activités, rendez-vous et vacances.",
    icon: CalendarDays,
    color: "bg-[#A8B193]",
    card: "bg-[#F7F9F2] ring-[#DDE4D2]",
  },
  {
    id: "calculator",
    title: "Calculateur de journées",
    subtitle: "Voir la répartition annuelle en jours et en pourcentage.",
    icon: Calculator,
    color: "bg-[#A2BADF]",
    card: "bg-[#F4F8FD] ring-[#D3DFF1]",
  },
  {
    id: "documents",
    title: "Zone documents",
    subtitle: "Documents généraux et documents par enfant.",
    icon: FileText,
    color: "bg-[#EEC988]",
    card: "bg-[#FFFAEF] ring-[#F1DDAE]",
  },
  {
    id: "photos",
    title: "Photos",
    subtitle: "Albums, souvenirs et enfants présents sur la photo.",
    icon: Camera,
    color: "bg-[#EAA5AF]",
    card: "bg-[#FFF8F9] ring-[#F3CDD3]",
  },
  {
    id: "medical",
    title: "Médical",
    subtitle: "Notes, allergies, médicaments, taille et poids.",
    icon: Stethoscope,
    color: "bg-[#A2BADF]",
    card: "bg-[#F4F8FD] ring-[#D3DFF1]",
  },
  {
    id: "receipts",
    title: "Factures / reçus",
    subtitle: "Impôts, remboursements et preuves de paiement.",
    icon: ReceiptText,
    color: "bg-[#EEC988]",
    card: "bg-[#FFFAEF] ring-[#F1DDAE]",
  },
  {
    id: "notes",
    title: "Zone notes",
    subtitle: "Notes rapides, souvenirs et observations.",
    icon: StickyNote,
    color: "bg-[#B5A7C8]",
    card: "bg-[#F7F4FB] ring-[#DED6EF]",
  },
  {
    id: "settings",
    title: "Paramètres",
    subtitle: "Profil parent, sections, abonnement et à propos.",
    icon: Settings,
    color: "bg-[#55534C]",
    card: "bg-[#FFFCF7] ring-[#EFE4D6]",
  },
];

export const initialChildren = [
  {
    name: "Léo",
    firstName: "Léo",
    lastName: "Tremblay",
    nickname: "Léo",
    age: "7 ans",
    birthDate: "2019-05-14",
    sex: "Garçon",
    color: "blue",
    photo: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Mia",
    firstName: "Mia",
    lastName: "Tremblay",
    nickname: "Mia",
    age: "4 ans",
    birthDate: "2022-03-18",
    sex: "Fille",
    color: "rose",
    photo: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=300&q=80",
  },
];

export const colorOptions = [
  { id: "sage", label: "Sauge", dot: "bg-[#A8B193]", soft: "bg-[#F0F3EA] text-[#7A8564] ring-[#DDE4D2]" },
  { id: "rose", label: "Rose", dot: "bg-[#EAA5AF]", soft: "bg-[#FBECEF] text-[#B96B77] ring-[#F3CDD3]" },
  { id: "lavender", label: "Lavande", dot: "bg-[#B5A7C8]", soft: "bg-[#F1EEF8] text-[#8475A5] ring-[#DED6EF]" },
  { id: "sand", label: "Sable", dot: "bg-[#EEC988]", soft: "bg-[#FBF3E2] text-[#B68E3D] ring-[#F1DDAE]" },
  { id: "blue", label: "Bleu doux", dot: "bg-[#A2BADF]", soft: "bg-[#ECF2FA] text-[#6A85AF] ring-[#D3DFF1]" },
];

export function getColor(id) {
  return colorOptions.find((item) => item.id === id) || colorOptions[0];
}

export function displayName(child) {
  return child?.nickname || child?.firstName || child?.name || "Enfant";
}
