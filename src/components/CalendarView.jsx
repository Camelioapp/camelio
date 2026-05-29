import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Field, Popup } from "./shared.jsx";
import { displayName } from "./sectionsData.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEK_DAYS_LONG = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const EMOJIS = ["♡", "🏥", "🦷", "⚽", "🎒", "🎵", "🎂", "🚗"];
const RECURRENCES = ["Aucune", "Chaque semaine", "Aux deux semaines", "Chaque mois", "Tous les jours"];

const CAMELIO_COLORS = ["#A8B193", "#B5A7C8", "#EAA5AF", "#EEC988", "#A2BADF"];
const APPOINTMENT_COLOR = "#EEC988";
const RECURRENCE_MONTH_LIMIT = 12;
const FAMILY_PREFERENCES_STORAGE_KEY = "camelio_family_preferences";

function readFamilyPreferences() {
  if (typeof window === "undefined") {
    return { sharedCustodyEnabled: true };
  }

  try {
    const saved = window.localStorage.getItem(FAMILY_PREFERENCES_STORAGE_KEY);
    if (!saved) return { sharedCustodyEnabled: true };
    const parsed = JSON.parse(saved);
    return {
      sharedCustodyEnabled: parsed.sharedCustodyEnabled !== false,
    };
  } catch (error) {
    console.error("Erreur lecture préférences familiales:", error);
    return { sharedCustodyEnabled: true };
  }
}


const childColorHex = {
  sage: "#A8B193",
  green: "#A8B193",
  rose: "#EAA5AF",
  pink: "#EAA5AF",
  blue: "#A2BADF",
  mauve: "#B5A7C8",
  purple: "#B5A7C8",
  gold: "#EEC988",
  yellow: "#EEC988",
};

const inputClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const selectClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const textareaClass =
  "w-full min-h-[120px] rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold leading-6 text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20 resize-none";

const timeButtonClass =
  "mt-2 flex w-full items-center justify-between rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-left text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition hover:bg-white focus:border-[#A8B193] focus:ring-2 focus:ring-[#A8B193]/20";

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function toDateKey(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function dateToKey(date) {
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function getWeekStartMonday(date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getMonthWeeks(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex, getDaysInMonth(year, monthIndex));
  const cursor = getWeekStartMonday(firstDay);
  const weeks = [];

  while (cursor <= lastDay || weeks.length < 5) {
    const week = [];

    for (let index = 0; index < 7; index += 1) {
      const date = new Date(cursor);
      week.push({
        date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateKey: dateToKey(date),
        isCurrentMonth: date.getMonth() === monthIndex,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
    if (weeks.length >= 6) break;
  }

  return weeks;
}

function getWeekDays(date) {
  const cursor = getWeekStartMonday(date);
  return Array.from({ length: 7 }, () => {
    const currentDate = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    return {
      date: currentDate,
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      dateKey: dateToKey(currentDate),
      isCurrentMonth: true,
    };
  });
}

function formatLongDate(date) {
  return `${WEEK_DAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
}

function getChildPhoto(child) {
  return child?.photo || child?.image || child?.avatar || "";
}

function getChildInitials(child) {
  const first = child?.firstName?.trim()?.[0] || child?.name?.trim()?.[0] || "";
  const last = child?.lastName?.trim()?.[0] || "";
  return `${first}${last}`.toUpperCase() || "";
}

function getChildAccent(child, fallbackIndex = 0) {
  return childColorHex[child?.color] || child?.colorHex || child?.accentColor || CAMELIO_COLORS[fallbackIndex % CAMELIO_COLORS.length];
}

function formatEventFromServer(event) {
  return {
    id: event.id,
    title: event.title || "",
    eventType: event.eventType || event.type || "custody",
    childIds: Array.isArray(event.childIds) ? event.childIds : [],
    childNames: Array.isArray(event.childNames) ? event.childNames : [],
    date: event.date || "",
    start: event.start || "",
    end: event.end || "",
    note: event.note || "",
    color: event.color || "sage",
    appointmentEmoji: getAppointmentIcon(event),
    recurrence: event.recurrence || "Aucune",
    recurrenceGroupId: event.recurrenceGroupId || "",
    createdAt: event.createdAt || "",
    updatedAt: event.updatedAt || "",
  };
}

function isCustodyEvent(event) {
  return event.eventType === "custody" || event.eventType === "both" || event.eventType === "Garde";
}

function isAppointmentEvent(event) {
  return (
    event.eventType === "appointment" ||
    event.eventType === "both" ||
    event.eventType === "Rendez-vous" ||
    event.eventType === "Médical"
  );
}

function eventTypeLabel(event) {
  if (event.eventType === "custody" || event.eventType === "Garde") return "Garde";
  if (event.eventType === "appointment" || event.eventType === "Rendez-vous") return "Rendez-vous";
  if (event.eventType === "both") return "Garde et rendez-vous";
  return event.eventType || "Événement";
}

function getAppointmentIcon(event) {
  const possibleIcons = [
    event?.appointmentEmoji,
    event?.appointmentIcon,
    event?.eventIcon,
    event?.icon,
    event?.emoji,
  ].filter(Boolean);

  return possibleIcons.find((icon) => icon !== "♡") || possibleIcons[0] || "♡";
}

function getDayAppointmentIcon(dayEvents = []) {
  const appointmentEvents = dayEvents.filter(isAppointmentEvent);
  const customIconEvent = appointmentEvents.find((event) => getAppointmentIcon(event) && getAppointmentIcon(event) !== "♡");
  return getAppointmentIcon(customIconEvent || appointmentEvents[0]);
}

function recurrenceText(event) {
  return event?.recurrence && event.recurrence !== "Aucune" ? event.recurrence : "Aucune";
}

function TimeDropdown({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];
  const [hour, minute] = value ? value.split(":") : ["", ""];

  const selectTime = (nextHour, nextMinute) => {
    if (!nextHour || !nextMinute) return;
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <div className="relative">
      <p className="label">{label}</p>
      <button type="button" onClick={() => setOpen((current) => !current)} className={timeButtonClass}>
        <span>{value || "Choisir"}</span>
        <Clock className="h-4 w-4 text-[#A8B193]" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 grid max-h-64 grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-[#EFE4D6]">
          <div className="max-h-64 overflow-y-auto border-r border-[#EFE4D6]">
            {hours.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectTime(item, minute || "00")}
                className={`block w-full px-4 py-2 text-center text-sm font-bold ${
                  hour === item ? "bg-[#A8B193] text-white" : "text-[#55534C] hover:bg-[#F8F3EA]"
                }`}
              >
                {item}h
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {minutes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  selectTime(hour || "08", item);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-center text-sm font-bold ${
                  minute === item ? "bg-[#A8B193] text-white" : "text-[#55534C] hover:bg-[#F8F3EA]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="col-span-2 grid grid-cols-2 border-t border-[#EFE4D6]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="px-4 py-3 text-xs font-bold text-[#746F64]"
            >
              Effacer
            </button>

            <button type="button" onClick={() => setOpen(false)} className="bg-[#55534C] px-4 py-3 text-xs font-bold text-white">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CamelioLogo() {
  const letters = [
    ["C", "#A8B193"],
    ["a", "#EAA5AF"],
    ["m", "#B5A7C8"],
    ["e", "#EEC988"],
    ["l", "#A8B193"],
    ["i", "#A2BADF"],
    ["o", "#EAA5AF"],
  ];

  return (
    <div className="flex items-center justify-center gap-0.5 text-4xl font-semibold tracking-wide md:text-5xl">
      {letters.map(([letter, color], index) => (
        <span key={`${letter}-${index}`} style={{ color }}>
          {letter}
        </span>
      ))}
    </div>
  );
}

function ChildFilterPill({ child, active, index, onClick }) {
  const photo = getChildPhoto(child);
  const initials = getChildInitials(child);
  const accent = getChildAccent(child, index);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-w-[92px] flex-col items-center rounded-[1.8rem] bg-white px-3 py-3 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "ring-2" : "opacity-55 ring-[#EFE4D6]"
      }`}
      style={{ borderColor: active ? accent : undefined, boxShadow: active ? `0 14px 30px ${accent}22` : undefined }}
      aria-pressed={active}
    >
      <span
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-[#8F9874] shadow-sm ring-4"
        style={{ borderColor: accent, boxShadow: active ? `0 0 0 4px ${accent}22` : undefined }}
      >
        {photo ? (
          <img src={photo} alt={displayName(child)} className="h-full w-full object-cover" />
        ) : initials ? (
          initials
        ) : (
          <UserRound className="h-6 w-6" />
        )}
      </span>

      <span className="mt-3 max-w-[76px] truncate text-sm font-bold text-[#3F474D]">{displayName(child)}</span>
      <span className="mt-2 h-2 w-14 rounded-full" style={{ backgroundColor: accent }} />
    </button>
  );
}


function WeekDayCard({ date, dayEvents, childrenList, selected, today, onClick, showCustody = true }) {
  const custodyEvents = showCustody ? dayEvents.filter(isCustodyEvent) : [];
  const appointmentEvents = dayEvents.filter(isAppointmentEvent);

  const childSegments = childrenList
    .map((child, index) => {
      const hasCustody = custodyEvents.some((event) => event.childIds.includes(child.id));
      if (!hasCustody) return null;
      return {
        id: child.id,
        name: displayName(child),
        color: getChildAccent(child, index),
      };
    })
    .filter(Boolean);

  const custodyNames = childSegments.map((child) => child.name).join(', ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.75rem] bg-white p-4 text-left shadow-[0_8px_22px_rgba(74,68,58,0.05)] ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
        today ? "bg-[#F0F3EA] ring-2 ring-[#A8B193]" : selected ? "ring-2 ring-[#A8B193]" : "ring-[#F1E4D7]"
      }`}
      aria-label={formatLongDate(date.date)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FFF8EC] ring-1 ring-[#EFE4D6]">
          <span className="text-xs font-bold text-[#8F9874]">{WEEK_DAYS[date.date.getDay() === 0 ? 6 : date.date.getDay() - 1]}</span>
          <span className="font-['Comfortaa'] text-xl font-bold text-[#1F2B33]">{date.day}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[#4F4A45]">{formatLongDate(date.date)}</p>
              <p className="mt-1 text-xs font-semibold text-[#8B8176]">
                {dayEvents.length === 0 ? "Aucune information" : `${dayEvents.length} information${dayEvents.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {appointmentEvents.length > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFFAEF] px-2.5 py-1 text-xs font-bold text-[#B68E3D] ring-1 ring-[#F1DDAE]">
                {getDayAppointmentIcon(appointmentEvents)}
                {appointmentEvents.length}
              </span>
            )}
          </div>

          {childSegments.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#A8B193]">Garde</p>
                  <p className="mt-1 text-sm font-bold text-[#4F4A45]">{custodyNames}</p>
                </div>
                <div className="flex h-2 w-24 overflow-hidden rounded-full bg-[#F8F3EA]">
                  {childSegments.map((child, index) => (
                    <span
                      key={child.id}
                      className={`h-2 flex-1 ${index === 0 ? "rounded-l-full" : ""} ${index === childSegments.length - 1 ? "rounded-r-full" : ""}`}
                      style={{ backgroundColor: child.color, marginLeft: index === 0 ? 0 : 2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {appointmentEvents.length > 0 && (
            <div className="mt-3 space-y-2">
              {appointmentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#4F4A45]">
                        <span className="mr-1 text-[#B68E3D]">{getAppointmentIcon(event)}</span>
                        {event.title || "Rendez-vous"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#746F64]">{eventTypeLabel(event)}</p>
                    </div>
                    {(event.start || event.end) && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#55534C] ring-1 ring-[#EFE4D6]">
                        <Clock className="h-3.5 w-3.5" />
                        {event.start || "--:--"}{event.end ? ` - ${event.end}` : ""}
                      </span>
                    )}
                  </div>
                  {event.recurrence && event.recurrence !== "Aucune" && (
                    <p className="mt-2 inline-flex rounded-full bg-[#F0F3EA] px-2.5 py-1 text-[11px] font-bold text-[#6A754F] ring-1 ring-[#DDE4D2]">
                      Récurrence : {event.recurrence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function EventCard({ event, childrenList, onClick, onDelete }) {
  const childNames =
    event.childNames?.length > 0
      ? event.childNames
      : event.childIds
          .map((childId) => {
            const child = childrenList.find((item) => item.id === childId);
            return child ? displayName(child) : "";
          })
          .filter(Boolean);

  return (
    <button type="button" onClick={() => onClick(event)} className="w-full rounded-3xl bg-[#FFFDF8] p-4 text-left ring-1 ring-[#EFE4D6] transition hover:bg-white hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[#4F4A45]">
            {isAppointmentEvent(event) ? `${getAppointmentIcon(event)} ` : ""}
            {event.title || eventTypeLabel(event)}
          </p>
          <p className="mt-1 text-xs font-bold text-[#746F64]">{eventTypeLabel(event)}</p>
          {event.recurrence && event.recurrence !== "Aucune" && (
            <p className="mt-2 inline-flex rounded-full bg-[#F0F3EA] px-2.5 py-1 text-[11px] font-bold text-[#6A754F] ring-1 ring-[#DDE4D2]">
              Récurrence active : {event.recurrence}
            </p>
          )}
        </div>

        {(event.start || event.end) && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#55534C] ring-1 ring-[#EFE4D6]">
            <Clock className="h-3.5 w-3.5" />
            {event.start || "--:--"}
            {event.end ? ` - ${event.end}` : ""}
          </span>
        )}
      </div>

      {childNames.length > 0 && <p className="mt-3 text-sm font-semibold text-[#5F5A52]">{childNames.join(", ")}</p>}
      {event.note && <p className="mt-2 text-sm leading-5 text-[#746F64]">{event.note}</p>}

      <div className="mt-4 flex justify-end">
        <span
          role="button"
          tabIndex={0}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onDelete(event);
          }}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === "Enter" || keyEvent.key === " ") {
              keyEvent.preventDefault();
              keyEvent.stopPropagation();
              onDelete(event);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#FBECEF] px-3 py-2 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer
        </span>
      </div>
    </button>
  );
}

export default function CalendarView({ children = [] }) {
  const today = new Date();
  const startYear = today.getFullYear();
  const maxYear = 2030;

  const [year, setYear] = useState(startYear);
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [activeChildIds, setActiveChildIds] = useState([]);
  const [viewMode, setViewMode] = useState("month");
  const [familyPreferences, setFamilyPreferences] = useState(() => readFamilyPreferences());

  const [events, setEvents] = useState([]);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [appointmentEmoji, setAppointmentEmoji] = useState("♡");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [calendarFeeds, setCalendarFeeds] = useState([]);
  const [exportChildId, setExportChildId] = useState("all");
  const [exportMessage, setExportMessage] = useState("");

  const selectedDate = useMemo(() => new Date(year, month, selectedDay), [year, month, selectedDay]);
  const selectedDateKey = dateToKey(selectedDate);
  const todayKey = dateToKey(today);
  const sharedCustodyEnabled = familyPreferences.sharedCustodyEnabled !== false;

  const [draft, setDraft] = useState({
    title: "",
    eventType: "custody",
    childIds: [],
    date: selectedDateKey,
    start: "",
    end: "",
    note: "",
    color: "sage",
    appointmentEmoji: "♡",
    recurrence: "Aucune",
    recurrenceGroupId: "",
  });

  useEffect(() => {
    loadEvents();
    loadCalendarFeeds();
  }, []);

  useEffect(() => {
    const syncFamilyPreferences = (event) => {
      if (event?.detail) {
        setFamilyPreferences({
          sharedCustodyEnabled: event.detail.sharedCustodyEnabled !== false,
        });
        return;
      }

      setFamilyPreferences(readFamilyPreferences());
    };

    window.addEventListener("storage", syncFamilyPreferences);
    window.addEventListener("focus", syncFamilyPreferences);
    window.addEventListener("camelio-family-preferences-updated", syncFamilyPreferences);

    return () => {
      window.removeEventListener("storage", syncFamilyPreferences);
      window.removeEventListener("focus", syncFamilyPreferences);
      window.removeEventListener("camelio-family-preferences-updated", syncFamilyPreferences);
    };
  }, []);

  useEffect(() => {
    setActiveChildIds((current) => {
      const availableIds = children.map((child) => child.id);
      if (availableIds.length === 0) return [];
      const stillAvailable = current.filter((id) => availableIds.includes(id));
      return stillAvailable.length > 0 ? stillAvailable : availableIds;
    });
  }, [children]);

  const monthWeeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const selectedWeekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const visibleCalendarDays = useMemo(() => (viewMode === "week" ? selectedWeekDays : monthWeeks.flat()), [viewMode, selectedWeekDays, monthWeeks]);
  const activeSet = useMemo(() => new Set(activeChildIds), [activeChildIds]);

  const filteredEvents = useMemo(() => {
    const eventsAllowedByCustodySetting = sharedCustodyEnabled
      ? events
      : events.filter((event) => !isCustodyEvent(event) || isAppointmentEvent(event));

    if (activeChildIds.length === 0) return eventsAllowedByCustodySetting;

    return eventsAllowedByCustodySetting.filter(
      (event) => event.childIds.length === 0 || event.childIds.some((childId) => activeSet.has(childId))
    );
  }, [events, activeChildIds, activeSet, sharedCustodyEnabled]);

  const selectedDateEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.date === selectedDateKey)
      .sort((a, b) => String(a.start || "99:99").localeCompare(String(b.start || "99:99")));
  }, [filteredEvents, selectedDateKey]);

  async function loadEvents() {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        console.warn("Utilisateur non connecté. Calendrier non chargé.");
        setEvents([]);
        return;
      }

      if (!response.ok) {
        console.error("Erreur chargement calendrier:", data);
        setEvents([]);
        return;
      }

      setEvents((data.events || []).map(formatEventFromServer));
    } catch (error) {
      console.error("Erreur chargement calendrier:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCalendarFeeds() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendar-feed`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) return;
      setCalendarFeeds(data.feeds || []);
    } catch (error) {
      console.error("Erreur chargement export calendrier:", error);
    }
  }

  function getExportChildName(childId) {
    if (!childId || childId === "all") return "Tous les enfants";
    const child = children.find((item) => item.id === childId);
    return child ? displayName(child) : "Enfant";
  }

  async function createCalendarFeed() {
    try {
      setIsSaving(true);
      setExportMessage("");

      const childName = getExportChildName(exportChildId);
      const response = await fetch(`${API_BASE_URL}/api/calendar-feed`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: exportChildId,
          childName,
          feedName: exportChildId === "all" ? "Camelio - Tous les enfants" : `Camelio - ${childName}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Impossible de créer le lien d’abonnement.");

      setCalendarFeeds((current) => [data.feed, ...current]);
      setExportMessage("Lien d’abonnement créé. Vous pouvez le copier dans Google Agenda ou Outlook.");
    } catch (error) {
      console.error("Erreur export calendrier:", error);
      setExportMessage(error.message || "Impossible de créer le lien d’abonnement.");
    } finally {
      setIsSaving(false);
    }
  }

  async function disableCalendarFeed(token) {
    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/calendar-feed/${token}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Impossible de désactiver le lien.");

      setCalendarFeeds((current) => current.map((feed) => feed.token === token ? { ...feed, status: "revoked" } : feed));
    } catch (error) {
      console.error("Erreur désactivation export calendrier:", error);
      setExportMessage(error.message || "Impossible de désactiver le lien.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyCalendarFeed(url) {
    try {
      await navigator.clipboard.writeText(url);
      setExportMessage("Lien copié.");
    } catch (error) {
      setExportMessage("Copie impossible. Sélectionnez le lien manuellement.");
    }
  }

  function previousPeriod() {
    if (viewMode === "week") {
      const currentDate = new Date(selectedDate);
      currentDate.setDate(currentDate.getDate() - 7);
      if (currentDate.getFullYear() < startYear) return;
      setYear(currentDate.getFullYear());
      setMonth(currentDate.getMonth());
      setSelectedDay(currentDate.getDate());
      return;
    }

    const currentDate = new Date(year, month, 1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    if (currentDate.getFullYear() < startYear) return;
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(1);
  }

  function nextPeriod() {
    if (viewMode === "week") {
      const currentDate = new Date(selectedDate);
      currentDate.setDate(currentDate.getDate() + 7);
      if (currentDate.getFullYear() > maxYear) return;
      setYear(currentDate.getFullYear());
      setMonth(currentDate.getMonth());
      setSelectedDay(currentDate.getDate());
      return;
    }

    const currentDate = new Date(year, month, 1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (currentDate.getFullYear() > maxYear) return;
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(1);
  }

  function toggleChildFilter(childId) {
    setActiveChildIds((current) => {
      if (current.includes(childId)) {
        const next = current.filter((id) => id !== childId);
        return next.length > 0 ? next : children.map((child) => child.id);
      }
      return [...current, childId];
    });
  }

  function getChildNamesFromIds(childIds) {
    return childIds
      .map((childId) => {
        const child = children.find((item) => item.id === childId);
        return child ? displayName(child) : "";
      })
      .filter(Boolean);
  }

  function getPrimaryColorKey(childIds = []) {
    const firstChildId = childIds[0];
    const firstChild = children.find((child) => child.id === firstChildId);
    return firstChild?.color || "sage";
  }

  function getEventsForDate(dateKey) {
    return filteredEvents.filter((event) => event.date === dateKey);
  }

  function getChildSegments(dayEvents) {
    if (!sharedCustodyEnabled) return [];

    return children
      .map((child, index) => {
        if (!activeSet.has(child.id)) return null;
        const hasChildCustody = dayEvents.some((event) => isCustodyEvent(event) && event.childIds.includes(child.id));
        if (!hasChildCustody) return null;
        return {
          id: child.id,
          color: getChildAccent(child, index),
        };
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  function selectDate(nextDate) {
    setYear(nextDate.getFullYear());
    setMonth(nextDate.getMonth());
    setSelectedDay(nextDate.getDate());
    setShowDayDetails(true);
  }

  function openNewEvent(dateKey = selectedDateKey) {
    setSelectedEventId(null);
    const canCreateCustody = sharedCustodyEnabled && children.length > 0;

    setDraft({
      title: "",
      eventType: canCreateCustody ? "custody" : "appointment",
      childIds: canCreateCustody && activeChildIds.length === 1 ? [activeChildIds[0]] : [],
      date: dateKey,
      start: "",
      end: "",
      note: "",
      color: "sage",
      appointmentEmoji,
      recurrence: "Aucune",
      recurrenceGroupId: "",
    });

    const parts = dateKey.split("-");
    if (parts.length === 3) {
      setYear(Number(parts[0]));
      setMonth(Number(parts[1]) - 1);
      setSelectedDay(Number(parts[2]));
    }

    setShowDayDetails(false);
    setShowEditor(true);
  }

  function editEvent(event, shouldOpen = true) {
    const dateParts = String(event.date || selectedDateKey).split("-");
    const nextYear = Number(dateParts[0]);
    const nextMonth = Number(dateParts[1]) - 1;
    const nextDay = Number(dateParts[2]);

    if (!Number.isNaN(nextYear) && !Number.isNaN(nextMonth) && !Number.isNaN(nextDay)) {
      setYear(nextYear);
      setMonth(nextMonth);
      setSelectedDay(nextDay);
    }

    setSelectedEventId(event.id);
    setDraft({
      title: event.title || "",
      eventType: event.eventType || "custody",
      childIds: event.childIds || [],
      date: event.date || selectedDateKey,
      start: event.start || "",
      end: event.end || "",
      note: event.note || "",
      color: event.color || "sage",
      appointmentEmoji: event.appointmentEmoji || event.icon || appointmentEmoji,
      recurrence: event.recurrence || "Aucune",
      recurrenceGroupId: event.recurrenceGroupId || "",
    });

    setShowDayDetails(false);
    if (shouldOpen) setShowEditor(true);
  }

  function updateDraft(updates) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function hasType(type) {
    return draft.eventType === type;
  }

  function isCustodyDraftInvalid() {
    return draft.eventType === "custody" && (!sharedCustodyEnabled || children.length === 0 || draft.childIds.length === 0);
  }

  function selectType(type) {
    if (type === "custody" && !sharedCustodyEnabled) {
      alert("Active la garde partagée dans les paramètres pour créer une journée de garde.");
      return;
    }

    if (type === "custody" && children.length === 0) {
      alert("Ajoute d’abord un profil enfant avant de créer une journée de garde.");
      return;
    }

    updateDraft({ eventType: type });
  }

  function toggleChild(childId) {
    setDraft((current) => {
      const exists = current.childIds.includes(childId);
      return {
        ...current,
        childIds: exists ? current.childIds.filter((id) => id !== childId) : [...current.childIds, childId],
      };
    });
  }

  function buildEventPayload(dateOverride = null, overrides = {}) {
    const childNames = getChildNamesFromIds(draft.childIds);
    const selectedColor = getPrimaryColorKey(draft.childIds);

    return {
      title:
        draft.title ||
        (draft.eventType === "appointment"
          ? "Rendez-vous"
          : draft.eventType === "both"
            ? "Garde et rendez-vous"
            : "Journée de garde"),
      eventType: draft.eventType,
      childIds: draft.childIds,
      childNames,
      date: dateOverride || draft.date || selectedDateKey,
      start: draft.start || "",
      end: draft.end || "",
      note: draft.note || "",
      color: selectedColor,
      appointmentEmoji: draft.appointmentEmoji || appointmentEmoji,
      icon: draft.appointmentEmoji || appointmentEmoji,
      recurrence: draft.recurrence || "Aucune",
      recurrenceGroupId: draft.recurrenceGroupId || "",
      ...overrides,
    };
  }

  async function saveSingleEvent(payload, existingId = null) {
    const url = existingId ? `${API_BASE_URL}/api/events/${existingId}` : `${API_BASE_URL}/api/events`;
    const method = existingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 401) throw new Error("Tu dois être connecté pour enregistrer un événement.");
    if (!response.ok) throw new Error(data.message || "Impossible d’enregistrer l’événement.");

    return formatEventFromServer(data.event);
  }

  async function saveEvent() {
    const payload = buildEventPayload();
    const savedEvent = await saveSingleEvent(payload, selectedEventId);

    setEvents((current) => {
      if (selectedEventId) return current.map((event) => (event.id === selectedEventId ? savedEvent : event));
      return [...current, savedEvent];
    });

    setSelectedEventId(savedEvent.id);
    setShowEditor(false);
  }

  async function saveDayAndApplyFrequency() {
    try {
      setIsSaving(true);

      if (isCustodyDraftInvalid()) {
        alert(
          !sharedCustodyEnabled
            ? "Active la garde partagée dans les paramètres pour créer une journée de garde."
            : "Sélectionne au moins un enfant avant d’ajouter une journée de garde."
        );
        return;
      }

      const frequency = draft.recurrence || "Aucune";

      if (frequency === "Aucune" || selectedEventId) {
        await saveEvent();
        return;
      }

      const recurrenceGroupId = `series_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const startDate = new Date(year, month, selectedDay);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + RECURRENCE_MONTH_LIMIT);
      const savedEvents = [];

      const addOccurrence = async (date) => {
        const dateKey = toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const payload = buildEventPayload(dateKey, { recurrenceGroupId });
        const savedEvent = await saveSingleEvent(payload);
        savedEvents.push(savedEvent);
      };

      if (frequency === "Tous les jours") {
        const date = new Date(startDate);
        while (date <= endDate) {
          await addOccurrence(date);
          date.setDate(date.getDate() + 1);
        }
      }

      if (frequency === "Chaque semaine" || frequency === "Aux deux semaines") {
        const interval = frequency === "Chaque semaine" ? 7 : 14;
        const date = new Date(startDate);
        while (date <= endDate) {
          await addOccurrence(date);
          date.setDate(date.getDate() + interval);
        }
      }

      if (frequency === "Chaque mois") {
        const date = new Date(startDate);
        while (date <= endDate) {
          await addOccurrence(date);
          date.setMonth(date.getMonth() + 1);
        }
      }

      setEvents((current) => [...current, ...savedEvents]);
      setShowEditor(false);
    } catch (error) {
      console.error("Erreur fréquence calendrier:", error);
      alert(error.message || "Impossible d’enregistrer la fréquence.");
    } finally {
      setIsSaving(false);
    }
  }

  function getSelectedEvent() {
    return events.find((event) => event.id === selectedEventId) || null;
  }

  function sameChildIds(first = [], second = []) {
    const a = [...first].sort().join("|");
    const b = [...second].sort().join("|");
    return a === b;
  }

  function getSeriesEvents(baseEvent) {
    if (!baseEvent || !baseEvent.recurrence || baseEvent.recurrence === "Aucune") return baseEvent ? [baseEvent] : [];

    if (baseEvent.recurrenceGroupId) {
      return events.filter((event) => event.recurrenceGroupId === baseEvent.recurrenceGroupId);
    }

    return events.filter((event) => {
      return (
        event.recurrence === baseEvent.recurrence &&
        event.eventType === baseEvent.eventType &&
        event.title === baseEvent.title &&
        event.start === baseEvent.start &&
        event.end === baseEvent.end &&
        sameChildIds(event.childIds, baseEvent.childIds)
      );
    });
  }

  async function deleteEventsByIds(ids = []) {
    const uniqueIds = [...new Set(ids)].filter(Boolean);
    if (uniqueIds.length === 0) return;

    try {
      setIsSaving(true);

      for (const eventId of uniqueIds) {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await response.json();

        if (response.status === 401) throw new Error("Tu dois être connecté pour supprimer un événement.");
        if (!response.ok) throw new Error(data.message || "Impossible de supprimer l’événement.");
      }

      setEvents((current) => current.filter((event) => !uniqueIds.includes(event.id)));
      setSelectedEventId(null);
      setShowDeleteOptions(false);
      setShowEditor(false);
    } catch (error) {
      console.error("Erreur suppression calendrier:", error);
      alert(error.message || "Erreur de connexion avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  }

  function requestDeleteEvent(event) {
    if (!event) return;

    setSelectedEventId(event.id);
    setShowDeleteOptions(true);
  }

  function deleteEvent() {
    requestDeleteEvent(getSelectedEvent());
  }

  function deleteOnlyThisDay() {
    const selectedEvent = getSelectedEvent();
    if (!selectedEvent) return;
    deleteEventsByIds([selectedEvent.id]);
  }

  function deleteFutureFrequency() {
    const selectedEvent = getSelectedEvent();
    if (!selectedEvent) return;

    const selectedDateKey = selectedEvent.date || "";
    const idsToDelete = getSeriesEvents(selectedEvent)
      .filter((event) => !event.date || !selectedDateKey || event.date >= selectedDateKey)
      .map((event) => event.id);

    deleteEventsByIds(idsToDelete);
  }


  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[#EFE4D6] bg-[#FFFCF7] p-4 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#EAA5AF]/25 blur-xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-[#B5A7C8]/25 blur-xl" />
        <div className="pointer-events-none absolute left-10 bottom-10 h-40 w-40 rounded-full bg-[#A8B193]/15 blur-xl" />

        <div className="relative z-10 rounded-[2rem] bg-white/80 p-4 shadow-[0_18px_45px_rgba(74,68,58,0.08)] ring-1 ring-white/70 md:p-7">
          <div className="flex items-center justify-center">
            <CamelioLogo />
          </div>

          <div className="mt-7 flex gap-4 overflow-x-auto px-1 pb-2 md:justify-center">
            {children.length === 0 ? (
              <div className="rounded-3xl bg-[#FFF8EC] px-5 py-4 text-sm font-semibold text-[#746F64] ring-1 ring-[#EFE4D6]">
                Ajoutez un profil enfant pour utiliser les filtres du calendrier.
              </div>
            ) : (
              children.map((child, index) => (
                <ChildFilterPill
                  key={child.id}
                  child={child}
                  index={index}
                  active={activeChildIds.includes(child.id)}
                  onClick={() => toggleChildFilter(child.id)}
                />
              ))
            )}
          </div>

          <div className="mt-7 flex items-center justify-between border-y border-[#EFE4D6] py-4">
            <button
              type="button"
              onClick={previousPeriod}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6A754F] shadow-sm ring-1 ring-[#EFE4D6] transition hover:bg-[#F8F3EA]"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-extrabold text-[#52713E] md:text-3xl">
                {viewMode === "week" ? "Vue semaine" : `${MONTHS[month]} ${year}`}
              </h3>
              {viewMode === "week" && (
                <p className="mt-1 text-xs font-bold text-[#746F64]">
                  Du {selectedWeekDays[0]?.day} {MONTHS[selectedWeekDays[0]?.month]?.toLowerCase()} au {selectedWeekDays[6]?.day} {MONTHS[selectedWeekDays[6]?.month]?.toLowerCase()} {selectedWeekDays[6]?.year}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={nextPeriod}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6A754F] shadow-sm ring-1 ring-[#EFE4D6] transition hover:bg-[#F8F3EA]"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-full bg-[#F8F3EA] p-1 ring-1 ring-[#EFE4D6]">
            {[
              ["month", "Mois"],
              ["week", "Semaine"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setViewMode(value)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  viewMode === value ? "bg-white text-[#52713E] shadow-sm" : "text-[#746F64] hover:bg-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowExportPopup(true)}
            className="mt-4 w-full rounded-2xl bg-[#F0F3EA] px-4 py-3 text-sm font-bold text-[#52713E] ring-1 ring-[#DDE4D2] transition hover:bg-[#E8EEDF]"
          >
            Exporter vers Google ou Outlook
          </button>

          {!sharedCustodyEnabled && (
            <div className="mt-4 rounded-2xl bg-[#FFF8EC] px-4 py-3 text-center text-xs font-semibold leading-5 text-[#746F64] ring-1 ring-[#EFE4D6]">
              Garde partagée désactivée : le calendrier affiche seulement les rendez-vous et activités.
            </div>
          )}

          {viewMode === "month" && (
            <div className="mt-5 grid !grid-cols-7 gap-2 px-1 text-center text-xs font-bold text-[#6F7466] md:gap-3 md:text-sm">
              {WEEK_DAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="mt-5 rounded-2xl bg-[#FFFDF8] p-4 text-center text-sm font-semibold text-[#746F64] ring-1 ring-[#EFE4D6]">
              Chargement du calendrier...
            </div>
          )}

          {viewMode === "week" ? (
            <div className="mt-5 space-y-3">
              {selectedWeekDays.map((date) => {
                const dayEvents = getEventsForDate(date.dateKey);
                return (
                  <WeekDayCard
                    key={date.dateKey}
                    date={date}
                    dayEvents={dayEvents}
                    childrenList={children}
                    selected={date.dateKey === selectedDateKey}
                    today={date.dateKey === todayKey}
                    showCustody={sharedCustodyEnabled}
                    onClick={() => selectDate(date.date)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-3 grid !grid-cols-7 gap-2 md:gap-3">
              {visibleCalendarDays.map((date) => {
                const dayEvents = getEventsForDate(date.dateKey);
                const hasAppointment = dayEvents.some(isAppointmentEvent);
                const appointmentIcon = getDayAppointmentIcon(dayEvents);
                const segments = getChildSegments(dayEvents);
                const isSelected = date.dateKey === selectedDateKey;
                const isToday = date.dateKey === todayKey;

                return (
                  <button
                    key={date.dateKey}
                    type="button"
                    onClick={() => selectDate(date.date)}
                    className={`relative flex min-h-[76px] flex-col items-center justify-between rounded-[1.35rem] px-1.5 py-3 text-center shadow-[0_8px_22px_rgba(74,68,58,0.05)] ring-1 transition hover:-translate-y-0.5 hover:shadow-md md:min-h-[112px] md:rounded-[1.6rem] md:px-2 md:py-4 ${
                      isToday
                        ? "bg-[#F0F3EA] ring-2 ring-[#A8B193]"
                        : isSelected
                          ? "bg-white ring-2 ring-[#A8B193]"
                          : "bg-white ring-[#F1E4D7]"
                    } ${!date.isCurrentMonth ? "opacity-40" : ""}`}
                    aria-label={formatLongDate(date.date)}
                  >
                    <span className="font-['Comfortaa'] text-base font-bold leading-none text-[#1F2B33] md:text-2xl">{date.day}</span>

                    <span className="flex h-6 items-center justify-center text-lg leading-none md:h-7 md:text-xl">
                      {hasAppointment ? <span style={{ color: APPOINTMENT_COLOR }}>{appointmentIcon}</span> : <span aria-hidden="true">&nbsp;</span>}
                    </span>

                    <span className="flex h-2.5 w-full max-w-[54px] overflow-hidden rounded-full bg-transparent md:max-w-[72px]">
                      {segments.length === 0 ? (
                        <span className="h-1.5 w-full" />
                      ) : segments.length === 1 ? (
                        <span className="h-1.5 w-full rounded-full" style={{ backgroundColor: segments[0].color }} />
                      ) : (
                        segments.map((segment, index) => (
                          <span
                            key={segment.id}
                            className={`h-1.5 flex-1 ${index === 0 ? "rounded-l-full" : ""} ${index === segments.length - 1 ? "rounded-r-full" : ""}`}
                            style={{ backgroundColor: segment.color, marginLeft: index === 0 ? 0 : 2 }}
                          />
                        ))
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {showDayDetails && (
        <Popup title={formatLongDate(selectedDate)} kicker="Calendrier" close={() => setShowDayDetails(false)}>
          <div className="space-y-4">
            {selectedDateEvents.length === 0 ? (
              <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                Aucun événement pour cette journée.
              </div>
            ) : (
              selectedDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  childrenList={children}
                  onClick={editEvent}
                  onDelete={requestDeleteEvent}
                />
              ))
            )}

            <button
              type="button"
              onClick={() => openNewEvent(selectedDateKey)}
              className="w-full rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white shadow-sm"
            >
              Ajouter une information à cette journée
            </button>
          </div>
        </Popup>
      )}

      {showEditor && (
        <Popup title={`${selectedDay} ${MONTHS[month].toLowerCase()} ${year}`} kicker={selectedEventId ? "Modifier un événement" : "Nouvel événement"} close={() => setShowEditor(false)}>
          <div className="space-y-5">
            <div>
              <p className="label">Type</p>
              <div className="mt-3 grid !grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectType("custody")}
                  disabled={!sharedCustodyEnabled || children.length === 0}
                  className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 transition ${hasType("custody") ? "bg-[#F0F3EA] text-[#7A8564] ring-2 ring-[#DDE4D2]" : "bg-white text-[#746F64] ring-[#EFE4D6]"} ${!sharedCustodyEnabled || children.length === 0 ? "cursor-not-allowed opacity-45" : ""}`}
                  title={!sharedCustodyEnabled ? "Active la garde partagée dans les paramètres pour créer une journée de garde." : children.length === 0 ? "Ajoute d’abord un profil enfant pour créer une journée de garde." : undefined}
                >
                  Journée de garde
                </button>
                <button type="button" onClick={() => selectType("appointment")} className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 ${hasType("appointment") ? "bg-[#FFFAEF] text-[#B68E3D] ring-2 ring-[#F1DDAE]" : "bg-white text-[#746F64] ring-[#EFE4D6]"}`}>
                  Rendez-vous
                </button>
              </div>
              {!sharedCustodyEnabled ? (
                <p className="mt-3 rounded-2xl bg-[#FFF8EC] px-4 py-3 text-xs font-semibold leading-5 text-[#746F64] ring-1 ring-[#EFE4D6]">
                  La garde partagée est désactivée dans les paramètres. Les journées de garde sont masquées et seuls les rendez-vous peuvent être ajoutés.
                </p>
              ) : children.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-[#FFF8EC] px-4 py-3 text-xs font-semibold leading-5 text-[#746F64] ring-1 ring-[#EFE4D6]">
                  Pour créer une journée de garde, ajoute d’abord un profil enfant. Les rendez-vous restent disponibles.
                </p>
              ) : null}
            </div>

            <Field label="Titre">
              <input className={inputClass} value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="Ex. Semaine parent A, rendez-vous dentiste..." />
            </Field>

            <div className="grid !grid-cols-2 gap-3">
              <TimeDropdown label="Début" value={draft.start || ""} onChange={(value) => updateDraft({ start: value })} />
              <TimeDropdown label="Fin" value={draft.end || ""} onChange={(value) => updateDraft({ end: value })} />
            </div>

            <Field label="Fréquence">
              <select className={selectClass} value={draft.recurrence || "Aucune"} onChange={(event) => updateDraft({ recurrence: event.target.value })} disabled={Boolean(selectedEventId)}>
                {RECURRENCES.map((frequency) => <option key={frequency}>{frequency}</option>)}
              </select>
            </Field>

            {hasType("appointment") && (
              <div>
                <p className="label">Icône du rendez-vous</p>
                <div className="mt-3 grid !grid-cols-4 gap-2">
                  {EMOJIS.map((emoji) => {
                    const selectedEmoji = (draft.appointmentEmoji || appointmentEmoji) === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setAppointmentEmoji(emoji);
                          updateDraft({ appointmentEmoji: emoji, icon: emoji });
                        }}
                        className={`rounded-2xl px-3 py-3 text-lg font-bold ring-1 transition ${selectedEmoji ? "bg-[#FFFAEF] text-[#B68E3D] ring-2 ring-[#F1DDAE]" : "bg-white text-[#746F64] ring-[#EFE4D6]"}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="label">Enfants concernés</p>
              <div className="mt-3 space-y-2">
                {children.length === 0 ? (
                  <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun enfant n’est disponible. Ajoute d’abord un profil enfant pour utiliser les journées de garde.</div>
                ) : (
                  children.map((child, index) => {
                    const checked = draft.childIds.includes(child.id);
                    const accent = getChildAccent(child, index);
                    return (
                      <button key={child.id} type="button" onClick={() => toggleChild(child.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ${checked ? "bg-[#F8F3EA] ring-2" : "bg-white text-[#746F64] ring-[#EFE4D6]"}`} style={{ borderColor: checked ? accent : undefined }}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold">{checked ? "✓" : ""}</span>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-bold shadow-sm ring-2" style={{ borderColor: accent }}>
                          {getChildPhoto(child) ? <img src={getChildPhoto(child)} alt={displayName(child)} className="h-full w-full object-cover" /> : getChildInitials(child) || <UserRound className="h-4 w-4" />}
                        </span>
                        <div>
                          <p className="font-bold text-[#4F4A45]">{displayName(child)}</p>
                          <p className="text-xs text-[#746F64]">Profil enfant</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {isCustodyDraftInvalid() && (
              <p className="rounded-2xl bg-[#FFF8EC] px-4 py-3 text-xs font-semibold leading-5 text-[#746F64] ring-1 ring-[#EFE4D6]">
                {!sharedCustodyEnabled
                  ? "La garde partagée est désactivée dans les paramètres."
                  : "Sélectionne au moins un enfant pour enregistrer une journée de garde."}
              </p>
            )}

            <Field label="Notes">
              <textarea value={draft.note} onChange={(event) => updateDraft({ note: event.target.value })} rows={5} className={textareaClass} placeholder="Ex. Échange à l'école, rendez-vous, activité spéciale..." />
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {selectedEventId ? (
                <button type="button" onClick={deleteEvent} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              ) : (
                <button type="button" onClick={() => setShowEditor(false)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
                  Annuler
                </button>
              )}

              <button type="button" onClick={saveDayAndApplyFrequency} disabled={isSaving || isCustodyDraftInvalid()} className="w-full rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </Popup>
      )}

      {showExportPopup && (
        <Popup title="Exporter le calendrier" kicker="Calendrier" close={() => setShowExportPopup(false)}>
          <div className="space-y-5">
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm leading-6 text-[#746F64] ring-1 ring-[#EFE4D6]">
              Créez un lien d’abonnement calendrier. Ce lien peut être ajouté dans Google Agenda, Outlook ou Apple Calendrier et se mettra à jour automatiquement.
            </div>

            <Field label="Calendrier à exporter">
              <select className={selectClass} value={exportChildId} onChange={(event) => setExportChildId(event.target.value)}>
                <option value="all">Tous les enfants</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{displayName(child)}</option>
                ))}
              </select>
            </Field>

            <button
              type="button"
              onClick={createCalendarFeed}
              disabled={isSaving}
              className="w-full rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60"
            >
              {isSaving ? "Création..." : "Créer un lien d’abonnement"}
            </button>

            {exportMessage && (
              <div className="rounded-2xl bg-[#F0F3EA] px-4 py-3 text-sm font-semibold text-[#52713E] ring-1 ring-[#DDE4D2]">
                {exportMessage}
              </div>
            )}

            <div className="space-y-3">
              <p className="label">Liens actifs</p>
              {calendarFeeds.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                  Aucun lien d’abonnement créé pour le moment.
                </div>
              ) : (
                calendarFeeds.map((feed) => {
                  const isActive = feed.status !== "revoked";
                  return (
                    <div key={feed.token || feed.id} className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#4F4A45]">{feed.feedName || "Calendrier Camelio"}</p>
                          <p className="text-xs font-semibold text-[#746F64]">{isActive ? "Actif" : "Désactivé"}</p>
                        </div>
                        {isActive && (
                          <button type="button" onClick={() => disableCalendarFeed(feed.token)} disabled={isSaving} className="rounded-full bg-[#FBECEF] px-3 py-2 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">
                            Désactiver
                          </button>
                        )}
                      </div>

                      <div className="mt-3 rounded-xl bg-[#FFF8EC] px-3 py-2 text-[11px] font-semibold text-[#746F64] ring-1 ring-[#EFE4D6] break-all">
                        {feed.feedUrl}
                      </div>

                      {isActive && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => copyCalendarFeed(feed.feedUrl)} className="rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
                            Copier le lien
                          </button>
                          <a href={feed.feedUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-[#52713E] ring-1 ring-[#DDE4D2]">
                            Ouvrir le .ics
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="rounded-2xl bg-[#FFF8EC] p-4 text-xs font-semibold leading-5 text-[#746F64] ring-1 ring-[#EFE4D6]">
              Dans Google Agenda ou Outlook, utilisez l’option “Ajouter un calendrier par URL” ou “S’abonner à partir du Web”, puis collez ce lien.
            </div>
          </div>
        </Popup>
      )}

      {showDeleteOptions && (
        <Popup title="Supprimer cet élément" kicker="Calendrier" close={() => setShowDeleteOptions(false)}>
          {(() => {
            const eventToDelete = getSelectedEvent();
            const hasRecurrence = Boolean(eventToDelete?.recurrence && eventToDelete.recurrence !== "Aucune");

            return (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm leading-6 text-[#746F64] ring-1 ring-[#EFE4D6]">
                  <p className="font-bold text-[#4F4A45]">
                    {eventToDelete?.title || eventTypeLabel(eventToDelete || {})}
                  </p>
                  {hasRecurrence ? (
                    <p className="mt-2">
                      Cet élément est récurrent : <strong>{eventToDelete.recurrence}</strong>. Veux-tu supprimer seulement cette journée ou cette journée et les prochaines occurrences?
                    </p>
                  ) : (
                    <p className="mt-2">
                      Cet élément n’a pas de récurrence. Tu peux supprimer seulement cette journée.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={deleteOnlyThisDay}
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-60"
                >
                  Supprimer seulement cette journée
                </button>

                {hasRecurrence && (
                  <button
                    type="button"
                    onClick={deleteFutureFrequency}
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60"
                  >
                    Supprimer cette journée et les prochaines
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteOptions(false)}
                  disabled={isSaving}
                  className="w-full rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            );
          })()}
        </Popup>
      )}

    </div>
  );
}
