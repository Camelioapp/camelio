import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { Field, Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

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
const RECURRENCES = [
  "Aucune",
  "Chaque semaine",
  "Aux deux semaines",
  "Chaque mois",
  "Tous les jours",
];

const childColorHex = {
  sage: "#A8B193",
  green: "#A8B193",
  rose: "#EAA5AF",
  blue: "#A2BADF",
  mauve: "#B5A7C8",
  purple: "#B5A7C8",
  gold: "#EEC988",
  yellow: "#EEC988",
};

const appointmentColorHex = "#F5333F";

const inputClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const selectClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const textareaClass =
  "w-full min-h-[140px] rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold leading-6 text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20 resize-none";

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

function formatLongDate(date) {
  return `${WEEK_DAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS[
    date.getMonth()
  ].toLowerCase()} ${date.getFullYear()}`;
}

function getChildPhoto(child) {
  return child?.photo || child?.image || child?.avatar || "";
}

function getChildInitials(child) {
  const first = child?.firstName?.trim()?.[0] || child?.name?.trim()?.[0] || "";
  const last = child?.lastName?.trim()?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "";
}

function getChildAccent(child, fallbackIndex = 0) {
  const fallback = ["#A8B193", "#B5A7C8", "#EAA5AF", "#EEC988", "#A2BADF"];
  return childColorHex[child?.color] || child?.colorHex || child?.accentColor || fallback[fallbackIndex % fallback.length];
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
    appointmentEmoji: event.appointmentEmoji || "♡",
    recurrence: event.recurrence || "Aucune",
    createdAt: event.createdAt || "",
    updatedAt: event.updatedAt || "",
  };
}

function isCustodyEvent(event) {
  return (
    event.eventType === "custody" ||
    event.eventType === "both" ||
    event.eventType === "Garde"
  );
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

function ChildAvatar({ child, checked = false, size = "md", index = 0 }) {
  const photo = getChildPhoto(child);
  const initials = getChildInitials(child);
  const accent = getChildAccent(child, index);
  const sizeClass = size === "lg" ? "h-20 w-20" : "h-11 w-11";

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-[#8F9874] shadow-sm ring-2`}
      style={{ borderColor: accent, boxShadow: checked ? `0 0 0 4px ${accent}22` : undefined }}
    >
      {photo ? (
        <img src={photo} alt={displayName(child)} className="h-full w-full object-cover" />
      ) : initials ? (
        initials
      ) : (
        <UserRound className="h-5 w-5" />
      )}
    </span>
  );
}

function EventCard({ event, childrenList, onClick }) {
  const color = getColor(event.color);
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
    <button type="button" onClick={() => onClick(event)} className={`w-full rounded-3xl p-4 text-left ring-1 transition hover:brightness-[0.98] ${color.bg} ${color.text}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[#4F4A45]">
            {isAppointmentEvent(event) ? `${event.appointmentEmoji || "♡"} ` : ""}
            {event.title || eventTypeLabel(event)}
          </p>
          <p className="mt-1 text-xs font-bold text-[#746F64]">{eventTypeLabel(event)}</p>
        </div>

        {(event.start || event.end) && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#55534C]">
            <Clock className="h-3.5 w-3.5" />
            {event.start || "--:--"}
            {event.end ? ` - ${event.end}` : ""}
          </span>
        )}
      </div>

      {childNames.length > 0 && <p className="mt-3 text-sm font-semibold text-[#5F5A52]">{childNames.join(", ")}</p>}
      {event.note && <p className="mt-2 text-sm leading-5 text-[#746F64]">{event.note}</p>}
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
  const [selectedChildId, setSelectedChildId] = useState("all");

  const [events, setEvents] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [appointmentColor, setAppointmentColor] = useState("sage");
  const [appointmentEmoji, setAppointmentEmoji] = useState("♡");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDate = useMemo(() => new Date(year, month, selectedDay), [year, month, selectedDay]);
  const selectedDateKey = dateToKey(selectedDate);
  const todayKey = dateToKey(today);

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
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const visibleChildren = useMemo(() => children.slice(0, 3), [children]);

  const filteredEvents = useMemo(() => {
    if (selectedChildId === "all") return events;
    return events.filter((event) => event.childIds.includes(selectedChildId));
  }, [events, selectedChildId]);

  const selectedDateEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.date === selectedDateKey)
      .sort((a, b) => String(a.start || "99:99").localeCompare(String(b.start || "99:99")));
  }, [filteredEvents, selectedDateKey]);

  const monthWeeks = useMemo(() => getMonthWeeks(year, month), [year, month]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.date >= todayKey)
      .sort((a, b) => {
        const dateCompare = String(a.date).localeCompare(String(b.date));
        if (dateCompare !== 0) return dateCompare;
        return String(a.start || "99:99").localeCompare(String(b.start || "99:99"));
      })
      .slice(0, 5);
  }, [filteredEvents, todayKey]);

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

  function previousMonth() {
    const currentDate = new Date(year, month, 1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    if (currentDate.getFullYear() < startYear) return;
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(1);
  }

  function nextMonth() {
    const currentDate = new Date(year, month, 1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (currentDate.getFullYear() > maxYear) return;
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(1);
  }

  function selectDate(nextDate) {
    setYear(nextDate.getFullYear());
    setMonth(nextDate.getMonth());
    setSelectedDay(nextDate.getDate());
  }

  function getChildNamesFromIds(childIds) {
    return childIds
      .map((childId) => {
        const child = children.find((item) => item.id === childId);
        return child ? displayName(child) : "";
      })
      .filter(Boolean);
  }

  function getPrimaryColor(childIds = []) {
    const firstChildId = childIds[0];
    const firstChild = children.find((child) => child.id === firstChildId);
    return firstChild?.color || appointmentColor || "sage";
  }

  function getEventsForDate(dateKey) {
    return filteredEvents.filter((event) => event.date === dateKey);
  }

  function getChildBars(dayEvents) {
    return children
      .map((child, index) => {
        const hasChildEvent = dayEvents.some((event) => event.childIds.includes(child.id));
        if (!hasChildEvent) return null;
        return {
          id: child.id,
          color: getChildAccent(child, index),
        };
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  function openNewEvent(dateKey = selectedDateKey) {
    setSelectedEventId(null);
    setDraft({
      title: "",
      eventType: "custody",
      childIds: selectedChildId === "all" ? [] : [selectedChildId],
      date: dateKey,
      start: "",
      end: "",
      note: "",
      color: "sage",
      appointmentEmoji,
      recurrence: "Aucune",
    });

    const parts = dateKey.split("-");
    if (parts.length === 3) {
      setYear(Number(parts[0]));
      setMonth(Number(parts[1]) - 1);
      setSelectedDay(Number(parts[2]));
    }

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
      appointmentEmoji: event.appointmentEmoji || appointmentEmoji,
      recurrence: event.recurrence || "Aucune",
    });

    if (shouldOpen) setShowEditor(true);
  }

  function updateDraft(updates) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function hasType(type) {
    return draft.eventType === type || draft.eventType === "both";
  }

  function toggleType(type) {
    const hasCustody = hasType("custody");
    const hasAppointment = hasType("appointment");

    if (type === "custody") {
      updateDraft({
        eventType: hasCustody && hasAppointment ? "appointment" : hasCustody ? "appointment" : hasAppointment ? "both" : "custody",
      });
    }

    if (type === "appointment") {
      updateDraft({
        eventType: hasAppointment && hasCustody ? "custody" : hasAppointment ? "custody" : hasCustody ? "both" : "appointment",
      });
    }
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

  function buildEventPayload(dateOverride = null) {
    const childNames = getChildNamesFromIds(draft.childIds);
    const selectedColor = draft.eventType === "appointment" ? appointmentColor : getPrimaryColor(draft.childIds);

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
      recurrence: draft.recurrence || "Aucune",
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
    try {
      setIsSaving(true);
      const payload = buildEventPayload();
      const savedEvent = await saveSingleEvent(payload, selectedEventId);

      setEvents((current) => {
        if (selectedEventId) return current.map((event) => (event.id === selectedEventId ? savedEvent : event));
        return [...current, savedEvent];
      });

      setSelectedEventId(savedEvent.id);
      setShowEditor(false);
    } catch (error) {
      console.error("Erreur sauvegarde calendrier:", error);
      alert(error.message || "Erreur de connexion avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDayAndApplyFrequency() {
    try {
      setIsSaving(true);
      const frequency = draft.recurrence || "Aucune";

      if (frequency === "Aucune" || selectedEventId) {
        await saveEvent();
        return;
      }

      const startDate = new Date(year, month, selectedDay);
      const endDate = new Date(maxYear, 11, 31);
      const savedEvents = [];

      const addOccurrence = async (date) => {
        const dateKey = toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const payload = buildEventPayload(dateKey);
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

  async function deleteEvent() {
    if (!selectedEventId) return;

    try {
      setIsSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/events/${selectedEventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        alert("Tu dois être connecté pour supprimer un événement.");
        return;
      }

      if (!response.ok) {
        console.error("Erreur suppression calendrier:", data);
        alert(data.message || "Impossible de supprimer l’événement.");
        return;
      }

      setEvents((current) => current.filter((event) => event.id !== selectedEventId));
      setSelectedEventId(null);
      setShowEditor(false);
    } catch (error) {
      console.error("Erreur suppression calendrier:", error);
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm md:p-6">
        <SectionTitle
          title="Calendrier familial"
          subtitle="Gardes, rendez-vous et repères importants de chaque enfant, dans une vue claire et visuelle."
          icon={CalendarDays}
        />
      </div>

      <div className="relative overflow-hidden rounded-[2.25rem] border border-[#EFE4D6] bg-[#FFFDF9] shadow-sm">
        <div className="absolute -left-16 -top-20 h-40 w-40 rounded-full bg-[#EAA5AF]/40 blur-sm" />
        <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-[#B5A7C8]/35 blur-sm" />

        <div className="relative z-10 border-b border-[#EFE4D6] px-5 pb-5 pt-6 md:px-7">
          {children.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {visibleChildren.map((child, index) => {
                const selected = selectedChildId === child.id;
                const accent = getChildAccent(child, index);
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChildId(selected ? "all" : child.id)}
                    className={`rounded-[1.75rem] bg-white/80 px-3 py-4 text-center shadow-sm ring-1 transition ${
                      selected ? "ring-2" : "ring-[#F3E8DA] hover:ring-[#D8C8B6]"
                    }`}
                    style={{ borderColor: selected ? accent : undefined, boxShadow: selected ? `0 10px 22px ${accent}22` : undefined }}
                  >
                    <div className="flex justify-center">
                      <ChildAvatar child={child} checked={selected} size="lg" index={index} />
                    </div>
                    <p className="mt-3 truncate text-sm font-bold text-[#3F474D]">{displayName(child)}</p>
                    <span className="mx-auto mt-2 block h-2 w-16 rounded-full" style={{ backgroundColor: accent }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative z-10 flex items-center justify-between border-b border-[#EFE4D6] bg-white/65 px-5 py-4 md:px-7">
          <button type="button" onClick={previousMonth} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6A754F] shadow-sm ring-1 ring-[#EFE4D6] transition hover:bg-[#F8F3EA]">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8B193]">Mois affiché</p>
            <h3 className="text-2xl font-extrabold text-[#52713E]">{MONTHS[month]} {year}</h3>
          </div>

          <button type="button" onClick={nextMonth} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6A754F] shadow-sm ring-1 ring-[#EFE4D6] transition hover:bg-[#F8F3EA]">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-10 bg-white/55 px-4 py-5 md:px-6">
          <div className="grid !grid-cols-7 gap-2 px-1 text-center text-xs font-bold text-[#2F3B42] md:gap-3">
            {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          {isLoading && (
            <div className="mt-5 rounded-2xl bg-white p-4 text-center text-sm font-semibold text-[#746F64] ring-1 ring-[#EFE4D6]">
              Chargement du calendrier...
            </div>
          )}

          <div className="mt-3 grid !grid-cols-7 gap-2 md:gap-3">
            {monthWeeks.flat().map((date) => {
              const dayEvents = getEventsForDate(date.dateKey);
              const isSelected = date.dateKey === selectedDateKey;
              const isToday = date.dateKey === todayKey;
              const hasAppointment = dayEvents.some(isAppointmentEvent);
              const bars = getChildBars(dayEvents);

              return (
                <button
                  key={date.dateKey}
                  type="button"
                  onClick={() => selectDate(date.date)}
                  className={`relative flex min-h-[78px] flex-col items-center justify-between rounded-[1.35rem] bg-white px-1.5 py-3 text-center shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md md:min-h-[96px] md:rounded-[1.6rem] ${
                    isSelected ? "ring-2 ring-[#A8B193]" : "ring-[#F1E4D7]"
                  } ${!date.isCurrentMonth ? "opacity-45" : ""}`}
                >
                  <span className="text-lg font-bold text-[#1F2B33] md:text-2xl">{date.day}</span>

                  <span className="flex h-5 items-center justify-center">
                    {hasAppointment && (
                      <Heart className="h-4 w-4 fill-white stroke-[2.5]" style={{ color: appointmentColorHex }} />
                    )}
                  </span>

                  <span className="flex w-full flex-col gap-1">
                    {bars.length === 0 ? (
                      <span className="h-1.5" />
                    ) : (
                      bars.map((bar) => (
                        <span key={bar.id} className="mx-auto h-1.5 w-10 rounded-full md:w-14" style={{ backgroundColor: bar.color }} />
                      ))
                    )}
                  </span>

                  {isToday && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#A8B193]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#EFE4D6] pt-4">
            {children.map((child, index) => (
              <span key={child.id} className="flex items-center gap-2 text-xs font-bold text-[#5F5A52]">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getChildAccent(child, index) }} />
                {displayName(child)}
              </span>
            ))}
            <span className="flex items-center gap-2 text-xs font-bold text-[#5F5A52]"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: appointmentColorHex }} /> Rendez-vous</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openNewEvent(selectedDateKey)}
          className="absolute bottom-6 right-6 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-[#A8B193] text-white shadow-xl ring-4 ring-white/80 transition hover:scale-105 hover:brightness-95"
          aria-label="Ajouter un événement"
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div>
          <p className="label">Journée sélectionnée</p>
          <h3 className="text-xl font-bold text-[#55534C]">{formatLongDate(selectedDate)}</h3>
          <p className="mt-1 text-sm text-[#746F64]">Cliquez sur une journée dans le calendrier pour voir ou ajouter des informations.</p>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDateEvents.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun événement pour cette journée.</div>
          ) : (
            selectedDateEvents.map((event) => <EventCard key={event.id} event={event} childrenList={children} onClick={editEvent} />)
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">À venir</p>
            <h3 className="text-xl font-bold text-[#55534C]">Prochains événements</h3>
            <p className="mt-1 text-sm text-[#746F64]">Les prochains rendez-vous, gardes et rappels importants.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-[#A8B193]" />
        </div>

        <div className="mt-4 space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun événement à venir.</div>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="grid gap-2 md:grid-cols-[140px_1fr]">
                <div className="rounded-2xl bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">{event.date}</div>
                <EventCard event={event} childrenList={children} onClick={editEvent} />
              </div>
            ))
          )}
        </div>
      </div>

      {showEditor && (
        <Popup title={`${selectedDay} ${MONTHS[month].toLowerCase()} ${year}`} kicker={selectedEventId ? "Modifier un événement" : "Nouvel événement"} close={() => setShowEditor(false)}>
          <div className="space-y-5">
            <div>
              <p className="label">Type</p>
              <div className="mt-3 grid !grid-cols-2 gap-2">
                <button type="button" onClick={() => toggleType("custody")} className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 ${hasType("custody") ? "bg-[#F0F3EA] text-[#7A8564] ring-2 ring-[#DDE4D2]" : "bg-white text-[#746F64] ring-[#EFE4D6]"}`}>
                  Journée de garde
                </button>
                <button type="button" onClick={() => toggleType("appointment")} className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 ${hasType("appointment") ? "bg-[#FFFAEF] text-[#B68E3D] ring-2 ring-[#F1DDAE]" : "bg-white text-[#746F64] ring-[#EFE4D6]"}`}>
                  Rendez-vous
                </button>
              </div>
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
                      <button key={emoji} type="button" onClick={() => updateDraft({ appointmentEmoji: emoji })} className={`rounded-2xl px-3 py-3 text-lg font-bold ring-1 transition ${selectedEmoji ? "bg-[#FFFAEF] text-[#B68E3D] ring-2 ring-[#F1DDAE]" : "bg-white text-[#746F64] ring-[#EFE4D6]"}`}>
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
                  <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun enfant n’est disponible. Ajoute d’abord un profil enfant.</div>
                ) : (
                  children.map((child, index) => {
                    const checked = draft.childIds.includes(child.id);
                    const color = getColor(child.color);
                    return (
                      <button key={child.id} type="button" onClick={() => toggleChild(child.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ${checked ? `${color.bg} ring-2` : "bg-white text-[#746F64] ring-[#EFE4D6]"}`}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold">{checked ? "✓" : ""}</span>
                        <ChildAvatar child={child} checked={checked} index={index} />
                        <div>
                          <p className="font-bold">{displayName(child)}</p>
                          <p className="text-xs">{child.sex || child.gender || "Profil enfant"}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

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

              <button type="button" onClick={saveDayAndApplyFrequency} disabled={isSaving} className="w-full rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}
