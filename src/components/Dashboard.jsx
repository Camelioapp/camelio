import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  ArrowLeft,
  Grid2X2,
  List,
  UserRound,
  Settings,
  ChevronDown,
  Check,
  Crown,
  Star,
  UsersRound,
} from "lucide-react";

import SubscriptionPopup from "./SubscriptionPopup";
import FirstStep from "./FirstStep.jsx";
import ParentWelcome from "./ParentWelcome.jsx";
import Children from "./Children.jsx";
import ParentalPlan from "./ParentalPlan.jsx";
import CalendarView from "./CalendarView.jsx";
import CustodyCalculator from "./CustodyCalculator.jsx";
import Documents from "./Documents.jsx";
import Photos from "./Photos.jsx";
import Sante from "./Sante.jsx";
import Invoices from "./Invoices.jsx";
import Notes from "./Notes.jsx";
import SettingsView from "./SettingsView.jsx";
import GuestSettingsView from "./GuestSettingsView.jsx";
import MemorablePhrases from "./MemorablePhrases.jsx";
import { sections, getSectionTheme } from "./sectionsData.js";
import { motion } from "framer-motion";
import ProfileSharing from "./ProfileSharing.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.camelio.app";

const SECTION_ORDER_STORAGE_KEY = "camelio-section-order";
const SECTION_THEME_STORAGE_KEY = "camelio-section-themes";

const defaultPhotoPosition = { x: 50, y: 50 };

const guestSettingsSection = {
  id: "guest-settings",
  title: "Paramètres",
  description: "Déconnexion et gestion de votre compte invité.",
  icon: Settings,
  bg: "bg-[#FFFDF8]",
  border: "border-[#EADFCF]",
  iconBg: "bg-[#A8B193]",
};

const childColorOptions = [
  { id: "sage", label: "Sauge", dot: "#A8B193", soft: "#EEF0E7", text: "#6F785F" },
  { id: "rose", label: "Rose", dot: "#E99AAA", soft: "#FBECEF", text: "#B96B77" },
  { id: "blue", label: "Bleu doux", dot: "#8FB8DE", soft: "#EEF5FB", text: "#657F9F" },
  { id: "mauve", label: "Mauve", dot: "#AA90C8", soft: "#F4F0FA", text: "#8475A5" },
  { id: "gold", label: "Doré", dot: "#D4A85F", soft: "#FFF8EC", text: "#9A7A43" },
  { id: "peach", label: "Pêche", dot: "#E8A07E", soft: "#FFF1EA", text: "#B8755F" },
  { id: "mint", label: "Menthe", dot: "#7CBFA2", soft: "#EDF8F2", text: "#5F927A" },
  { id: "lavender", label: "Lavande", dot: "#C7B3E5", soft: "#F7F1FF", text: "#8F76B8" },
  { id: "mustard", label: "Moutarde", dot: "#D9BF5E", soft: "#FFF8D8", text: "#9C842F" },
  { id: "olive", label: "Olive", dot: "#8E9A72", soft: "#EEF0E7", text: "#6B7658" },
  { id: "coral", label: "Corail", dot: "#E8786D", soft: "#FFF0EF", text: "#B85F58" },
  { id: "teal", label: "Sarcelle", dot: "#5BAEAA", soft: "#EAF7F6", text: "#4B8A87" },
  { id: "sky", label: "Ciel", dot: "#76BFE3", soft: "#EAF7FF", text: "#5B93B0" },
  { id: "grape", label: "Raisin", dot: "#8F78B8", soft: "#F2EEF8", text: "#735F9A" },
  { id: "sand", label: "Sable", dot: "#D8C49A", soft: "#FBF4E8", text: "#9A7F50" },
];

function getChildColorTheme(colorId) {
  return (
    childColorOptions.find((color) => color.id === colorId) ||
    childColorOptions[0]
  );
}

function isStarChild(child = {}) {
  return Boolean(child.isStar || child.starChild || child.isDeceased);
}

const starClipPath =
  "polygon(50% 0%, 61% 34%, 97% 34%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 3% 34%, 39% 34%)";

function normalizePhotoPosition(position) {
  if (!position) return defaultPhotoPosition;

  if (typeof position === "string") {
    const [xRaw, yRaw] = position.split(" ");

    return {
      x: parseInt(xRaw, 10) || 50,
      y: parseInt(yRaw, 10) || 50,
    };
  }

  return {
    x: Number.isFinite(position.x) ? position.x : 50,
    y: Number.isFinite(position.y) ? position.y : 50,
  };
}

function getObjectPosition(position) {
  const clean = normalizePhotoPosition(position);
  return `${clean.x}% ${clean.y}%`;
}

function PhotoImage({ src, alt, position, zoom = 1, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`select-none object-cover ${className}`}
      style={{
        objectPosition: getObjectPosition(position),
        transform: `scale(${zoom})`,
        transformOrigin: getObjectPosition(position),
      }}
    />
  );
}

function getAgeFromBirthDate(birthDate) {
  if (!birthDate || birthDate === "À compléter") return "À compléter";

  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "À compléter";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!birthdayPassed) age -= 1;

  return `${age} ans`;
}

function formatChildFromServer(child) {
  const firstName = child.firstName || "";
  const nickname = child.nickname || firstName || "Enfant";
  const photo = child.avatar || child.photo || child.image || "";

  return {
    ...child,
    id: child.id,
    name: nickname,
    firstName,
    lastName: child.lastName || "",
    nickname,
    birthDate: child.birthDate || "",
    sex: child.gender || child.sex || "",
    gender: child.gender || child.sex || "",
    color: child.color || "sage",
    age: getAgeFromBirthDate(child.birthDate),
    photo,
    image: photo,
    avatar: photo,
    photoPosition: normalizePhotoPosition(child.photoPosition),
    photoZoom: child.photoZoom || 1,
    profileNote: child.notes || child.profileNote || "",
    isStar: isStarChild(child),
    deceasedDate: child.deceasedDate || child.deathDate || "",
  };
}

function formatSharedChild(child = {}, index = 0) {
  const name =
    child.name ||
    child.nickname ||
    child.firstName ||
    `Enfant ${index + 1}`;

  return {
    ...child,
    id: child.id || `shared-child-${index}`,
    name,
    firstName: child.firstName || name,
    lastName: child.lastName || "",
    nickname: child.nickname || name,
    birthDate: child.birthDate || "",
    sex: child.gender || child.sex || "",
    gender: child.gender || child.sex || "",
    color: child.color || "sage",
    age: child.birthDate ? getAgeFromBirthDate(child.birthDate) : "Accès partagé",
    photo: child.avatar || child.photo || child.image || "",
    image: child.image || child.photo || child.avatar || "",
    avatar: child.avatar || child.photo || child.image || "",
    photoPosition: normalizePhotoPosition(child.photoPosition),
    photoZoom: child.photoZoom || 1,
    profileNote: child.notes || child.profileNote || "",
    isStar: isStarChild(child),
    deceasedDate: child.deceasedDate || child.deathDate || "",
  };
}

function getSharedChildrenFromShares(shares = []) {
  const childMap = new Map();

  shares.forEach((share) => {
    (share.children || []).forEach((child, index) => {
      const formattedChild = formatSharedChild(child, index);
      childMap.set(formattedChild.id || formattedChild.name, formattedChild);
    });
  });

  return Array.from(childMap.values());
}

function getInitials(child) {
  const first =
    child?.firstName?.trim()?.[0] || child?.name?.trim()?.[0] || "";
  const last = child?.lastName?.trim()?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();

  return initials || "";
}

function FamilyFloatingBubbles() {
  const bubbles = [
    { top: "10%", left: "13%", size: 24, color: "#eec988", delay: 0.1 },
    { top: "30%", left: "24%", size: 14, color: "#eaa5af", delay: 0.8 },
    { top: "62%", left: "12%", size: 30, color: "#b5a7c8", delay: 1.3 },
    { top: "78%", left: "29%", size: 18, color: "#a2badf", delay: 1.7 },
    { top: "20%", right: "16%", size: 18, color: "#a8b193", delay: 0.5 },
    { top: "56%", right: "11%", size: 26, color: "#eec988", delay: 1.1 },
    { bottom: "12%", right: "27%", size: 16, color: "#eaa5af", delay: 1.9 },
    { bottom: "24%", left: "48%", size: 15, color: "#a8b193", delay: 2.2 },
  ];

  const softCircles = [
    {
      className:
        "absolute -left-20 bottom-[-78px] h-48 w-48 sm:h-60 sm:w-60 lg:h-72 lg:w-72",
      color: "rgba(168, 177, 147, 0.24)",
      duration: 12,
    },
    {
      className:
        "absolute -right-16 -top-16 h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56",
      color: "rgba(234, 165, 175, 0.30)",
      duration: 14,
    },
    {
      className:
        "absolute left-[47%] top-[38%] h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32",
      color: "rgba(181, 167, 200, 0.16)",
      duration: 10,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {softCircles.map((circle, index) => (
        <motion.div
          key={`family-soft-circle-${index}`}
          className={`${circle.className} rounded-full blur-sm`}
          style={{ backgroundColor: circle.color }}
          animate={{
            x: [0, 18, -14, 0],
            y: [0, -14, 16, 0],
            scale: [1, 1.06, 0.97, 1],
          }}
          transition={{
            duration: circle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {bubbles.map((bubble, index) => (
        <motion.span
          key={`family-bubble-${index}`}
          className="absolute rounded-full"
          style={{
            top: bubble.top,
            left: bubble.left,
            right: bubble.right,
            bottom: bubble.bottom,
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            opacity: 0.9,
            boxShadow: `0 0 10px ${bubble.color}88`,
          }}
          animate={{
            x: [0, 12 + index * 2, -10, 0],
            y: [0, -13, 11, 0],
            scale: [1, 1.25, 0.92, 1],
            opacity: [0.45, 0.82, 0.5, 0.45],
          }}
          transition={{
            duration: 7 + index,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="absolute right-[18%] top-[18%] hidden h-8 w-8 rotate-12 border-r-4 border-t-4 border-[#ffd27a] md:block"
        animate={{
          y: [0, -8, 6, 0],
          rotate: [12, 18, 8, 12],
          opacity: [0.45, 0.9, 0.6, 0.45],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute right-[16%] top-[29%] hidden h-7 w-7 rotate-[-8deg] border-r-4 border-t-4 border-[#ffd27a] md:block"
        animate={{
          y: [0, 7, -6, 0],
          rotate: [-8, -14, -4, -8],
          opacity: [0.45, 0.85, 0.55, 0.45],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}



function AccountSwitcher({ accounts, activeAccountId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeAccount =
    accounts.find((account) => account.accountId === activeAccountId) ||
    accounts[0] ||
    null;

  if (!activeAccount || accounts.length <= 1) {
    return activeAccount ? (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#eadfcf] bg-white/90 px-4 py-2 text-xs font-bold text-[#6f665e] shadow-sm">
        {activeAccount.type === "guest" ? (
          <UsersRound className="h-4 w-4 text-[#b58bbd]" />
        ) : (
          <Crown className="h-4 w-4 text-[#8f9874]" />
        )}
        <span>{activeAccount.type === "guest" ? "Invité" : "Compte principal"}</span>
      </div>
    ) : null;
  }

  return (
    <div className="relative z-30">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b6] bg-white/95 px-4 py-2 text-xs font-bold text-[#5f564e] shadow-sm transition hover:bg-[#fffdf8]"
        aria-label="Sélectionner le compte Camelio"
      >
        {activeAccount.type === "guest" ? (
          <UsersRound className="h-4 w-4 text-[#b58bbd]" />
        ) : (
          <Crown className="h-4 w-4 text-[#8f9874]" />
        )}
        <span className="max-w-[150px] truncate sm:max-w-[190px]">
          {activeAccount.type === "guest" ? "Invité" : "Compte principal"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#8b8278] transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-3 w-[290px] overflow-hidden rounded-[24px] border border-[#eadfcf] bg-white p-2 shadow-[0_18px_42px_rgba(79,74,69,0.16)]">
          {accounts.map((account) => {
            const isActive = account.accountId === activeAccountId;
            const Icon = account.type === "guest" ? UsersRound : Crown;

            return (
              <button
                key={account.accountId}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelect(account.accountId);
                }}
                className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition ${
                  isActive ? "bg-[#fff7fb]" : "hover:bg-[#fffdf8]"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    account.type === "guest"
                      ? "bg-[#f4e8f4] text-[#b58bbd]"
                      : "bg-[#eef0e7] text-[#8f9874]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#4f4a45]">
                    {account.type === "guest" ? "Invité (partagé)" : "Compte principal"}
                  </span>
                  <span className="block truncate text-xs font-medium text-[#8b8278]">
                    {account.description || account.label}
                  </span>
                </span>

                {isActive ? <Check className="h-5 w-5 shrink-0 text-[#8f9874]" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function Dashboard({
  parentProfile: parentProfileFromApp = {
    name: "",
    email: "",
    phone: "",
    userId: "",
  },
  setParentProfile: setParentProfileFromApp = () => {},
}) {
  const [activeSection, setActiveSection] = useState("home");
  const [viewMode, setViewMode] = useState("grid");
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [showFirstStep, setShowFirstStep] = useState(false);
  const [accountAccess, setAccountAccess] = useState({
    isLoading: true,
    accounts: [],
    activeAccountId: "",
  });
  const [welcomeProfile, setWelcomeProfile] = useState(null);
  const [showUserWelcome, setShowUserWelcome] = useState(false);

  const [sharedAccess, setSharedAccess] = useState({
    isLoading: true,
    hasSharedAccess: false,
    shares: [],
  });

  const parentProfile = parentProfileFromApp;

  const activeAccount = useMemo(() => {
    return (
      accountAccess.accounts.find(
        (account) => account.accountId === accountAccess.activeAccountId
      ) || accountAccess.accounts[0] || null
    );
  }, [accountAccess.accounts, accountAccess.activeAccountId]);

  const activeAccountIsGuest = activeAccount?.type === "guest";

  const setParentProfile = (updatedProfile) => {
    if (typeof updatedProfile === "function") {
      setParentProfileFromApp((current) => {
        const nextProfile = updatedProfile(current);

        return {
          ...current,
          ...nextProfile,
          userId: current.userId || nextProfile.userId || "",
        };
      });

      return;
    }

    setParentProfileFromApp((current) => ({
      ...current,
      ...updatedProfile,
      userId: current.userId || updatedProfile.userId || "",
    }));
  };

  const loadAccountsAndAccess = useCallback(async () => {
      try {
        const accountsResponse = await fetch(`${API_BASE_URL}/api/accounts`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const accountsData = await accountsResponse.json().catch(() => ({}));

        if (!accountsResponse.ok) {
          throw new Error(
            accountsData?.message || "Impossible de charger les comptes."
          );
        }

        const accounts = Array.isArray(accountsData.accounts)
          ? accountsData.accounts
          : [];

        const selectedAccount =
          accounts.find(
            (account) => account.accountId === accountsData.activeAccountId
          ) || accounts[0] || null;

        setAccountAccess({
          isLoading: false,
          accounts,
          activeAccountId: selectedAccount?.accountId || "",
        });

        const welcomeProfileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const welcomeProfileData = await welcomeProfileResponse.json().catch(() => ({}));
        const nextWelcomeProfile = welcomeProfileData?.profile || null;

        if (welcomeProfileResponse.ok && nextWelcomeProfile) {
          setWelcomeProfile(nextWelcomeProfile);
          setParentProfile((current) => ({
            ...current,
            name: nextWelcomeProfile.displayName || nextWelcomeProfile.name || current.name,
            email: nextWelcomeProfile.email || current.email,
            userId: nextWelcomeProfile.userId || current.userId || "",
          }));

          const welcomeIsCompleted = nextWelcomeProfile.welcomeCompleted === true;
          setShowUserWelcome(!welcomeIsCompleted);

          if (!welcomeIsCompleted) {
            setSharedAccess({
              isLoading: false,
              hasSharedAccess: false,
              shares: [],
            });
            setShowSubscriptionPopup(false);
            setShowFirstStep(false);
            return;
          }
        }

        if (selectedAccount?.type === "guest") {
          setSharedAccess({
            isLoading: false,
            hasSharedAccess: true,
            shares: selectedAccount.share ? [selectedAccount.share] : [],
          });
          setShowSubscriptionPopup(false);
          setShowFirstStep(false);
          return;
        }

        setSharedAccess({
          isLoading: false,
          hasSharedAccess: false,
          shares: [],
        });

        const response = await fetch(`${API_BASE_URL}/api/subscription`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error("Erreur vérification abonnement:", data);
          setShowSubscriptionPopup(true);
          return;
        }

        setShowSubscriptionPopup(!data.hasAccess);

        if (!data.hasAccess) {
          setShowFirstStep(false);
          return;
        }

        const profileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const profileData = await profileResponse.json().catch(() => ({}));

        if (!profileResponse.ok) {
          console.error("Erreur vérification profil:", profileData);
          return;
        }

        const onboardingCompleted =
          profileData?.profile?.onboardingCompleted === true;

        setShowFirstStep(!onboardingCompleted);
      } catch (error) {
        console.error("Erreur vérification accès ou abonnement:", error);
        setAccountAccess((current) => ({
          ...current,
          isLoading: false,
        }));
        setSharedAccess((current) => ({
          ...current,
          isLoading: false,
        }));
        setShowSubscriptionPopup(true);
      }
  }, []);

  useEffect(() => {
    loadAccountsAndAccess();
  }, [loadAccountsAndAccess]);

  async function selectAccount(accountId) {
    const selectedAccount = accountAccess.accounts.find(
      (account) => account.accountId === accountId
    );

    if (!selectedAccount) return;

    setAccountAccess((current) => ({
      ...current,
      activeAccountId: accountId,
    }));

    setActiveSection("home");
    setChildren([]);
    setIsLoadingChildren(true);

    try {
      await fetch(`${API_BASE_URL}/api/accounts/active`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      });
    } catch (error) {
      console.error("Erreur sauvegarde compte actif:", error);
    }

    if (selectedAccount.type === "guest") {
      setSharedAccess({
        isLoading: false,
        hasSharedAccess: true,
        shares: selectedAccount.share ? [selectedAccount.share] : [],
      });
      setShowSubscriptionPopup(false);
      setShowFirstStep(false);
      return;
    }

    setSharedAccess({
      isLoading: false,
      hasSharedAccess: false,
      shares: [],
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));
      const hasAccess = response.ok && data.hasAccess;

      setShowSubscriptionPopup(!hasAccess);

      if (!hasAccess) {
        setShowFirstStep(false);
        return;
      }

      const profileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const profileData = await profileResponse.json().catch(() => ({}));
      setShowFirstStep(profileData?.profile?.onboardingCompleted !== true);
    } catch (error) {
      console.error("Erreur vérification compte principal:", error);
      setShowSubscriptionPopup(true);
    }
  }

  const defaultSectionOrder = useMemo(() => {
    return sections
      .filter((section) => section.id !== "settings")
      .map((section) => section.id);
  }, []);

  const [sectionOrderIds, setSectionOrderIds] = useState(() => {
    try {
      const savedOrder = localStorage.getItem(SECTION_ORDER_STORAGE_KEY);

      if (!savedOrder) {
        return sections
          .filter((section) => section.id !== "settings")
          .map((section) => section.id);
      }

      const parsedOrder = JSON.parse(savedOrder);

      if (!Array.isArray(parsedOrder)) {
        return sections
          .filter((section) => section.id !== "settings")
          .map((section) => section.id);
      }

      const availableIds = sections
        .filter((section) => section.id !== "settings")
        .map((section) => section.id);

      return parsedOrder.filter((id) => availableIds.includes(id));
    } catch {
      return sections
        .filter((section) => section.id !== "settings")
        .map((section) => section.id);
    }
  });

  const [sectionThemeOverrides, setSectionThemeOverrides] = useState(() => {
    try {
      const savedThemes = localStorage.getItem(SECTION_THEME_STORAGE_KEY);
      return savedThemes ? JSON.parse(savedThemes) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      SECTION_ORDER_STORAGE_KEY,
      JSON.stringify(sectionOrderIds)
    );
  }, [sectionOrderIds]);

  useEffect(() => {
    localStorage.setItem(
      SECTION_THEME_STORAGE_KEY,
      JSON.stringify(sectionThemeOverrides)
    );
  }, [sectionThemeOverrides]);

  const orderedSections = useMemo(() => {
    return sectionOrderIds
      .map((id) => sections.find((section) => section.id === id))
      .filter(Boolean);
  }, [sectionOrderIds]);

  const sharedSectionIds = useMemo(() => {
    if (!sharedAccess.hasSharedAccess) return null;

    return new Set(
      sharedAccess.shares.flatMap((share) =>
        Array.isArray(share.sectionIds) ? share.sectionIds : []
      )
    );
  }, [sharedAccess.hasSharedAccess, sharedAccess.shares]);

  const visibleSections = useMemo(() => {
    if (!sharedAccess.hasSharedAccess || !sharedSectionIds) {
      return orderedSections;
    }

    const sharedSections = orderedSections.filter((section) =>
      sharedSectionIds.has(section.id)
    );

    return [...sharedSections, guestSettingsSection];
  }, [orderedSections, sharedAccess.hasSharedAccess, sharedSectionIds]);

  const [children, setChildren] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);

  const [calendarEntries, setCalendarEntries] = useState({});
  const [docs, setDocs] = useState([
    {
      id: "doc-1",
      title: "Jugement / entente parentale",
      child: "Général",
      type: "Jugement",
      note: "Document général à conserver.",
      fileName: "",
      fileUrl: "",
    },
    {
      id: "doc-2",
      title: "Carte assurance maladie",
      child: "Léo",
      type: "Médical",
      note: "Document lié au dossier médical de Léo.",
      fileName: "",
      fileUrl: "",
    },
  ]);

  useEffect(() => {
    const loadChildren = async () => {
      if (accountAccess.isLoading || !activeAccount) return;

      try {
        setIsLoadingChildren(true);

        if (activeAccount.type === "guest") {
          const shares = activeAccount.share ? [activeAccount.share] : [];

          setSharedAccess({
            isLoading: false,
            hasSharedAccess: true,
            shares,
          });

          setChildren(getSharedChildrenFromShares(shares));
          return;
        }

        setSharedAccess({
          isLoading: false,
          hasSharedAccess: false,
          shares: [],
        });

        const response = await fetch(`${API_BASE_URL}/api/children`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error("Erreur chargement enfants:", data);
          return;
        }

        const formattedChildren = (data.children || []).map(
          formatChildFromServer
        );

        setChildren(formattedChildren);
      } catch (error) {
        console.error("Erreur chargement enfants:", error);
      } finally {
        setIsLoadingChildren(false);
      }
    };

    loadChildren();
  }, [accountAccess.isLoading, activeAccount?.accountId]);

  const activeSectionData = useMemo(() => {
    if (activeSection === "guest-settings") {
      return guestSettingsSection;
    }

    return sections.find((section) => section.id === activeSection);
  }, [activeSection]);

  function openSection(sectionId) {
    if (sharedAccess.hasSharedAccess) {
      const allowedGuestSections = new Set(["guest-settings"]);

      if (
        sharedSectionIds &&
        !sharedSectionIds.has(sectionId) &&
        !allowedGuestSections.has(sectionId)
      ) {
        return;
      }
    }

    setActiveSection(sectionId);
  }

  function goHome() {
    setActiveSection("home");
  }

  function renderActiveSection() {
    switch (activeSection) {
      case "children":
        return (
          <Children
            children={children}
            setChildren={setChildren}
            onOpen={openSection}
          />
        );

      case "parental-plan":
        return <ParentalPlan children={children} onBack={goHome} />;

      case "calendar":
        return (
          <CalendarView
            children={children}
            calendarEntries={calendarEntries}
            setCalendarEntries={setCalendarEntries}
            onBack={goHome}
          />
        );

      case "calculator":
        return (
          <CustodyCalculator
            children={children}
            calendarEntries={calendarEntries}
            onBack={goHome}
          />
        );

      case "documents":
        return (
          <Documents
            children={children}
            docs={docs}
            setDocs={setDocs}
            onBack={goHome}
          />
        );

      case "photos":
        return <Photos children={children} onBack={goHome} />;

      case "sante":
        return (
          <Sante
            children={children}
            docs={docs}
            setDocs={setDocs}
            onBack={goHome}
          />
        );

      case "invoices":
        return <Invoices children={children} onBack={goHome} />;

      case "notes":
        return <Notes children={children} onBack={goHome} />;

      case "memorable-phrases":
        return <MemorablePhrases children={children} onBack={goHome} />;

      case "profile-sharing":
        if (sharedAccess.hasSharedAccess) return null;
        return <ProfileSharing children={children} onBack={goHome} />;

      case "guest-settings":
        if (!sharedAccess.hasSharedAccess) return null;

        return (
          <GuestSettingsView
            userEmail={parentProfile.email}
            sharedProfile={sharedAccess.shares?.[0] || null}
            onBack={goHome}
          />
        );

      case "settings":
        if (sharedAccess.hasSharedAccess) return null;

        return (
          <SettingsView
            parentProfile={parentProfile}
            setParentProfile={setParentProfile}
            sectionOrderIds={sectionOrderIds}
            setSectionOrderIds={setSectionOrderIds}
            sectionThemeOverrides={sectionThemeOverrides}
            setSectionThemeOverrides={setSectionThemeOverrides}
            defaultSectionOrder={defaultSectionOrder}
            onBack={goHome}
          />
        );

      default:
        return null;
    }
  }

  function normalizeSetupSectionId(sectionId) {
    const map = {
      medical: "sante",
      parentalPlan: "parental-plan",
      custodyCalculator: "calculator",
      memorablePhrases: "memorable-phrases",
    };

    return map[sectionId] || sectionId;
  }

  function getSectionOrderFromSetup(setupData) {
    const availableIds = sections
      .filter((section) => section.id !== "settings")
      .map((section) => section.id);

    const selectedIds = (setupData?.selectedSections || [])
      .map(normalizeSetupSectionId)
      .filter((id) => availableIds.includes(id));

    const uniqueSelectedIds = Array.from(new Set(["children", ...selectedIds]))
      .filter((id) => availableIds.includes(id));

    if (uniqueSelectedIds.length === 0) {
      return defaultSectionOrder;
    }

    return uniqueSelectedIds;
  }

  function buildChildPayloadFromSetup(child, index) {
    const firstName = String(child?.firstName || "").trim();
    const lastName = String(child?.lastName || "").trim();
    const nickname = String(child?.nickname || "").trim();
    const birthDate = child?.birthDate || "";

    const hasUsefulInfo = firstName || lastName || nickname || birthDate;

    if (!hasUsefulInfo) {
      return null;
    }

    const childId =
      child?.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `child-${Date.now()}-${index}`);

    const photo = child?.avatar || child?.photo || child?.image || "";

    return {
      id: childId,
      firstName,
      lastName,
      nickname,
      birthDate,
      gender: child?.gender || child?.sex || "",
      sex: child?.gender || child?.sex || "",
      color: child?.color || "sage",
      avatar: photo,
      photo,
      image: photo,
      avatarS3Key: "",
      photoPosition: child?.photoPosition || defaultPhotoPosition,
      photoZoom: Number(child?.photoZoom) || 1,
      notes: child?.notes || child?.profileNote || "",
      isStar: isStarChild(child),
      deceasedDate: isStarChild(child) ? child?.deceasedDate || child?.deathDate || "" : "",
    };
  }

  function isSameSetupChild(existingChild, setupChild) {
    const existingKey = [
      existingChild?.firstName || "",
      existingChild?.lastName || "",
      existingChild?.birthDate || "",
    ]
      .join("|")
      .toLowerCase();

    const setupKey = [
      setupChild?.firstName || "",
      setupChild?.lastName || "",
      setupChild?.birthDate || "",
    ]
      .join("|")
      .toLowerCase();

    return existingKey === setupKey;
  }

  async function createChildrenFromSetup(setupData) {
    const setupChildren = Array.isArray(setupData?.children)
      ? setupData.children
      : [];

    const payloads = setupChildren
      .map((child, index) => buildChildPayloadFromSetup(child, index))
      .filter(Boolean)
      .filter((setupChild) => {
        return !children.some((existingChild) =>
          isSameSetupChild(existingChild, setupChild)
        );
      });

    if (payloads.length === 0) {
      return [];
    }

    const createdChildren = [];

    for (const payload of payloads) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/children`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Erreur création enfant depuis onboarding:", data);
          continue;
        }

        if (data.child) {
          createdChildren.push(formatChildFromServer(data.child));
        }
      } catch (error) {
        console.error("Erreur création enfant depuis onboarding:", error);
      }
    }

    if (createdChildren.length > 0) {
      setChildren((current) => {
        const currentIds = new Set(current.map((child) => child.id));

        return [
          ...current,
          ...createdChildren.filter((child) => !currentIds.has(child.id)),
        ];
      });
    }

    return createdChildren;
  }

  async function applyInitialSetup(setupData = {}) {
    const normalizedSectionOrder = getSectionOrderFromSetup(setupData);

    setSectionOrderIds(normalizedSectionOrder);
    localStorage.setItem(
      SECTION_ORDER_STORAGE_KEY,
      JSON.stringify(normalizedSectionOrder)
    );

    const hiddenSections = sections
      .filter(
        (section) =>
          section.id !== "settings" && !normalizedSectionOrder.includes(section.id)
      )
      .map((section) => section.id);

    const normalizedSetupData = {
      ...setupData,
      selectedSections: normalizedSectionOrder,
      hiddenSections,
    };

    localStorage.setItem("camelio_first_step_completed", "true");
    localStorage.setItem(
      "camelio_initial_setup",
      JSON.stringify(normalizedSetupData)
    );

    await createChildrenFromSetup(normalizedSetupData);

    await fetch(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        onboardingCompleted: true,
        onboardingSkipped: Boolean(normalizedSetupData?.skipped),
        onboardingCompletedAt: new Date().toISOString(),
        onboarding: normalizedSetupData,
      }),
    });

    setShowFirstStep(false);
  }

  const subscriptionPopup =
    showSubscriptionPopup &&
    !showUserWelcome &&
    !sharedAccess.isLoading &&
    !sharedAccess.hasSharedAccess ? (
      <SubscriptionPopup
        onClose={() => {
          setShowSubscriptionPopup(false);
          loadAccountsAndAccess();
        }}
      />
    ) : null;

  const firstStepPopup =
    showFirstStep &&
    !showUserWelcome &&
    !showSubscriptionPopup &&
    !sharedAccess.isLoading &&
    !sharedAccess.hasSharedAccess ? (
      <FirstStep
        onComplete={async (setupData) => {
          try {
            await applyInitialSetup(setupData);
          } catch (error) {
            console.error("Erreur application onboarding:", error);
            setShowFirstStep(false);
          }
        }}
        onSkip={async (setupData) => {
          try {
            await applyInitialSetup(
              setupData || {
                skipped: true,
                completedAt: new Date().toISOString(),
                children: [],
                selectedSections: defaultSectionOrder,
                hiddenSections: [],
              }
            );
          } catch (error) {
            console.error("Erreur skip onboarding:", error);
            setShowFirstStep(false);
          }
        }}
      />
    ) : null;

  const parentWelcomePopup =
    showUserWelcome && !accountAccess.isLoading ? (
      <ParentWelcome
        profile={welcomeProfile || parentProfile}
        onCompleted={(updatedProfile) => {
          const nextProfile = updatedProfile || {};

          setWelcomeProfile(nextProfile);
          setShowUserWelcome(false);
          setParentProfile((current) => ({
            ...current,
            name:
              nextProfile.displayName ||
              nextProfile.name ||
              current.name ||
              "",
            email: nextProfile.email || current.email || "",
            userId: nextProfile.userId || current.userId || "",
          }));
          loadAccountsAndAccess();
        }}
      />
    ) : null;

  if (activeSection !== "home") {
    return (
      <>
        {parentWelcomePopup}
        {subscriptionPopup}
        {firstStepPopup}
        <div className="min-h-screen bg-[#fbf7ef] text-[#4f4a45]">
          <div className="mx-auto max-w-6xl p-3 md:p-6">
            <div className="overflow-hidden rounded-[28px] border border-[#eadfcf] bg-[#fffdf8] shadow-sm md:rounded-[36px]">
              <header className="flex items-center justify-between border-b border-[#eadfcf] px-5 py-5 md:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8f9874]">
                    Camelio
                  </p>

                  <h1 className="text-2xl font-semibold text-[#4f4a45]">
                    {activeSectionData?.title || "Section"}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={goHome}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#eadfcf] bg-white text-[#8f9874] shadow-sm transition hover:bg-[#f7f1e8]"
                  aria-label="Retour à l'accueil"
                >
                  <ArrowLeft size={22} />
                </button>
              </header>

              <main className="p-4 md:p-8">{renderActiveSection()}</main>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {parentWelcomePopup}
      {subscriptionPopup}
      {firstStepPopup}
      <div className="min-h-screen bg-[#fbf7ef] text-[#4f4a45]">
        <div className="mx-auto max-w-6xl p-3 md:p-6">
          <div className="overflow-hidden rounded-[28px] border border-[#eadfcf] bg-[#fffdf8] shadow-sm md:rounded-[36px]">
            <div className="flex justify-center pt-4">
              <div className="h-1.5 w-16 rounded-full bg-[#e5d2c1]" />
            </div>

            <header className="relative flex min-h-[96px] items-center justify-between border-b border-[#eadfcf] px-5 py-5 md:min-h-[110px] md:px-8">
              <div className="flex items-center">
                <img
                  src="https://studiocameleon.ca/wp-content/uploads/2026/05/Logo-horizontal-couleur-scaled-e1779141504554.png"
                  alt="Camelio"
                  className="h-10 w-auto object-contain sm:h-16 md:h-18"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  openSection(
                    sharedAccess.hasSharedAccess ? "guest-settings" : "settings"
                  )
                }
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[#eadfcf] bg-white shadow-sm transition hover:scale-105 hover:bg-[#faf4ec] sm:h-16 sm:w-16"
                aria-label="Paramètres"
              >
                {sharedAccess.hasSharedAccess ? (
                  <Settings className="h-6 w-6 text-[#8f9874]" />
                ) : (
                  <img
                    src="https://studiocameleon.ca/wp-content/uploads/2026/05/pere_2_enfants_filles.png"
                    alt="Profil"
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            </header>

            <main className="p-4 md:p-8">
              <section className="relative overflow-hidden rounded-[30px] border border-[#eadfcf] bg-white shadow-sm">
                <FamilyFloatingBubbles />

                <div className="relative z-10 px-5 py-6 md:px-8 md:py-8">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a8aa91] md:text-sm">
                        Bienvenue
                      </p>

                      <h2 className="mt-1 text-2xl font-semibold text-[#4f4a45] md:text-3xl">
                        Ma famille
                      </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <AccountSwitcher
                        accounts={accountAccess.accounts}
                        activeAccountId={accountAccess.activeAccountId}
                        onSelect={selectAccount}
                      />

                    </div>
                  </div>

                  {isLoadingChildren ? (
                    <div className="flex min-h-[180px] w-full items-center justify-center rounded-[26px] border border-dashed border-[#d8c8b6] bg-[#fffdf8]/85 text-center">
                      <p className="text-sm font-semibold text-[#8b8278]">
                        Chargement de votre famille...
                      </p>
                    </div>
                  ) : children.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openSection("children")}
                      className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-[26px] border border-dashed border-[#d8c8b6] bg-[#fffdf8]/85 text-center transition hover:bg-[#faf4ec] hover:shadow-sm"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d8c8b6] bg-[#eef0e7] text-[#8f9874] shadow-sm">
                        <Plus size={32} strokeWidth={1.7} />
                      </div>

                      <p className="mt-4 text-lg font-semibold text-[#4f4a45]">
                        {sharedAccess.hasSharedAccess
                          ? "Aucun profil partagé"
                          : "Ajouter votre enfant"}
                      </p>

                      <p className="mt-1 text-sm text-[#8b8278]">
                        {sharedAccess.hasSharedAccess
                          ? "Le partage ne contient pas encore de profil enfant."
                          : "Créez un premier profil pour commencer."}
                      </p>
                    </button>
                  ) : (
                    <div className="relative -mx-2 overflow-hidden">
                      <div className="overflow-x-auto pb-3 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex min-h-[165px] items-end justify-center px-2 sm:min-h-[205px] md:min-h-[220px] md:px-8">
                          <div className="flex items-end justify-center pl-7 sm:pl-8 md:pl-9">
                            {children.map((child, index) => {
                              const photo = child.image || child.photo || "";
                              const initials = getInitials(child);
                              const childTheme = getChildColorTheme(child.color);
                              const starProfile = isStarChild(child);
                              const floatDelay = index * 0.45;
                              const floatDuration = 4.8 + (index % 3) * 0.7;
                              const floatAmplitude = index % 2 === 0 ? -7 : 7;

                              return (
                                <motion.button
                                  key={child.id || child.name}
                                  type="button"
                                  onClick={() => openSection("children")}
                                  className={`group relative isolate flex w-[118px] shrink-0 items-center justify-center pb-4 sm:w-[138px] md:w-[156px] ${
                                    index === 0 ? "" : "-ml-7 sm:-ml-9 md:-ml-11"
                                  }`}
                                  style={{ zIndex: children.length + index }}
                                  animate={{
                                    y: [0, floatAmplitude, 0, -floatAmplitude * 0.45, 0],
                                    rotate: [0, index % 2 === 0 ? -1.2 : 1.2, 0, index % 2 === 0 ? 0.8 : -0.8, 0],
                                  }}
                                  transition={{
                                    duration: floatDuration,
                                    delay: floatDelay,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  whileHover={{ y: -8, scale: 1.035 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div
                                    className={`relative flex h-[112px] w-[112px] items-center justify-center overflow-visible border-[7px] border-white text-2xl font-bold shadow-[0_14px_28px_rgba(79,74,69,0.14)] transition duration-300 sm:h-[132px] sm:w-[132px] sm:border-[9px] md:h-[150px] md:w-[150px] md:border-[10px] ${
                                      starProfile ? "rounded-none" : "rounded-full"
                                    }`}
                                    style={{
                                      backgroundColor: childTheme.soft,
                                      color: childTheme.text,
                                    }}
                                  >
                                    <div
                                      className={`absolute inset-0 overflow-hidden ${
                                        starProfile ? "rounded-none" : "rounded-full"
                                      }`}
                                      style={{
                                        clipPath: starProfile ? starClipPath : undefined,
                                      }}
                                    >
                                      {photo ? (
                                        <PhotoImage
                                          src={photo}
                                          alt={child.name}
                                          position={child.photoPosition}
                                          zoom={child.photoZoom || 1}
                                          className="h-full w-full"
                                        />
                                      ) : initials ? (
                                        <div className="flex h-full w-full items-center justify-center">
                                          {initials}
                                        </div>
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <UserRound className="h-10 w-10" />
                                        </div>
                                      )}
                                    </div>

                                    {starProfile ? (
                                      <div className="absolute right-1 top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#AA90C8] shadow-sm">
                                        <Star className="h-4 w-4 fill-[#AA90C8]" />
                                      </div>
                                    ) : null}

                                    <div
                                      className="absolute left-1/2 bottom-[-15px] z-20 w-[104px] -translate-x-1/2 rounded-[14px] px-3 py-2 text-center text-base font-bold leading-none text-white shadow-[0_8px_16px_rgba(79,74,69,0.14)] transition group-hover:brightness-95 sm:bottom-[-17px] sm:w-[118px] sm:rounded-[16px] sm:text-lg md:bottom-[-18px] md:w-[128px] md:text-xl"
                                      style={{
                                        backgroundColor: childTheme.dot,
                                      }}
                                    >
                                      <span className="block truncate">
                                        {child.name}
                                      </span>
                                    </div>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {children.length > 2 && (
                        <p className="mt-1 text-center text-xs font-semibold text-[#9A8D7C] md:hidden">
                          Glisse pour voir tous les profils.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-7">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#4f4a45]">
                      Sections
                    </h2>

                    <p className="text-sm text-[#8b8278]">
                      {visibleSections.length} sections disponibles
                    </p>
                  </div>

                  <div className="flex shrink-0 rounded-full border border-[#eadfcf] bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition md:gap-2 md:px-4 ${
                        viewMode === "grid"
                          ? "bg-[#a8aa91] text-white"
                          : "text-[#8b8278] hover:bg-[#f7f1e8]"
                      }`}
                    >
                      <Grid2X2 size={14} />

                      <span className="hidden min-[430px]:inline">
                        2 colonnes
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition md:gap-2 md:px-4 ${
                        viewMode === "list"
                          ? "bg-[#a8aa91] text-white"
                          : "text-[#8b8278] hover:bg-[#f7f1e8]"
                      }`}
                    >
                      <List size={14} />

                      <span className="hidden min-[430px]:inline">Liste</span>
                    </button>
                  </div>
                </div>

                <div
                  className={
                    viewMode === "list"
                      ? "grid grid-cols-1 gap-4"
                      : "grid grid-cols-2 gap-3 md:gap-4"
                  }
                >
                  {visibleSections.map((section) => {
                    const Icon = section.icon;
                    const theme = getSectionTheme(
                      section,
                      sectionThemeOverrides
                    );

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => openSection(section.id)}
                        className="min-h-[148px] rounded-[24px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:min-h-[138px] md:rounded-[26px] md:p-5"
                        style={{
                          backgroundColor: theme.bgColor,
                          borderColor: theme.borderColor,
                        }}
                      >
                        <div
                          className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white md:h-12 md:w-12"
                          style={{ backgroundColor: theme.iconColor }}
                        >
                          <Icon size={22} />
                        </div>

                        <h3 className="text-base font-semibold leading-5 text-[#4f4a45] md:text-xl">
                          {section.title}
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-[#7d756e] md:text-sm">
                          {section.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}