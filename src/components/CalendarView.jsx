import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  Palette,
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

const WEEK_DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const WEEK_DAYS_LONG = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const EMOJIS = ["⚑", "🏥", "🦷", "⚽", "🎒", "🎵", "🎂", "🚗"];
const RECURRENCES = [
  "Aucune",
  "Chaque semaine",
  "Aux deux semaines",
  "Chaque mois",
  "Tous les jours",
];

const calendarColorOptions = [
  { id: "sage", label: "Sauge", hex: "#A8B193" },
  { id: "rose", label: "Rose", hex: "#E99AAA" },
  { id: "blue", label: "Bleu", hex: "#8FB8DE" },
  { id: "mauve", label: "Mauve", hex: "#AA90C8" },
  { id: "gold", label: "Doré", hex: "#D4A85F" },
  { id: "peach", label: "Pêche", hex: "#E8A07E" },
  { id: "mint", label: "Menthe", hex: "#7CBFA2" },
  { id: "lavender", label: "Lavande", hex: "#C7B3E5" },
  { id: "mustard", label: "Moutarde", hex: "#D9BF5E" },
  { id: "olive", label: "Olive", hex: "#8E9A72" },
  { id: "coral", label: "Corail", hex: "#E8786D" },
  { id: "teal", label: "Sarcelle", hex: "#5BAEAA" },
  { id: "sky", label: "Ciel", hex: "#76BFE3" },
  { id: "grape", label: "Raisin", hex: "#8F78B8" },
  { id: "sand", label: "Sable", hex: "#D8C49A" },
];

const inputClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const selectClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const textareaClass =
  "w-full min-h-[140px] rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold leading-6 text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20 resize-none";

const timeButtonClass =
  "mt-2 flex w-full items-center justify-between rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-left text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition hover:bg-white focus:border-[#A8B193] focus:ring-2 focus:ring-[#A8B193]/20";

function getCalendarColor(colorId) {
  if (!colorId) return calendarColorOptions[0];

  if (String(colorId).startsWith("#")) {
    return {
      id: colorId,
      label: "Personnalisée",
      hex: colorId,
    };
  }

  return (
    calendarColorOptions.find((color) => color.id === colorId) ||
    calendarColorOptions[0]
  );
}

function getHexColor(colorId) {
  return getCalendarColor(colorId).hex;
}

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

function getStartOfWeek(date) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() - nextDate.getDay());
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getWeekDates(date) {
  const startOfWeek = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(startOfWeek);
    nextDate.setDate(startOfWeek.getDate() + index);
    return nextDate;
  });
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
    appointmentEmoji: event.appointmentEmoji || "⚑",
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
  if (event.eventType === "custody" || event.eventType === "Garde") {
    return "Garde";
  }

  if (event.eventType === "appointment" || event.eventType === "Rendez-vous") {
    return "Rendez-vous";
  }

  if (event.eventType === "both") return "Garde et rendez-vous";

  return event.eventType || "Événement";
}

function TimeDropdown({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const hours = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];
  const [hour, minute] = value ? value.split(":") : ["", ""];

  const selectTime = (nextHour, nextMinute) => {
    if (!nextHour || !nextMinute) return;
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <div className="relative">
      <p className="label">{label}</p>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={timeButtonClass}
      >
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
                  hour === item
                    ? "bg-[#A8B193] text-white"
                    : "text-[#55534C] hover:bg-[#F8F3EA]"
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
                  minute === item
                    ? "bg-[#A8B193] text-white"
                    : "text-[#55534C] hover:bg-[#F8F3EA]"
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

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-[#55534C] px-4 py-3 text-xs font-bold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChildAvatar({ child, checked = false }) {
  const photo = getChildPhoto(child);
  const initials = getChildInitials(child);

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EEF0E7] text-sm font-bold text-[#8F9874] ring-1 ${
        checked ? "ring-[#A8B193]" : "ring-[#E5D9CA]"
      }`}
    >
      {photo ? (
        <img
          src={photo}
          alt={displayName(child)}
          className="h-full w-full object-cover"
        />
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
    <button
      type="button"
      onClick={() => onClick(event)}
      className={`w-full rounded-3xl p-4 text-left ring-1 transition hover:brightness-[0.98] ${color.soft}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[#4F4A45]">
            {isAppointmentEvent(event) ? `${event.appointmentEmoji || "⚑"} ` : ""}
            {event.title || eventTypeLabel(event)}
          </p>
          <p className="mt-1 text-xs font-bold text-[#746F64]">
            {eventTypeLabel(event)}
          </p>
        </div>

        {(event.start || event.end) && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#55534C]">
            <Clock className="h-3.5 w-3.5" />
            {event.start || "--:--"}
            {event.end ? ` - ${event.end}` : ""}
          </span>
        )}
      </div>

      {childNames.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-[#5F5A52]">
          {childNames.join(", ")}
        </p>
      )}

      {event.note && (
        <p className="mt-2 text-sm leading-5 text-[#746F64]">{event.note}</p>
      )}
    </button>
  );
}

export default function CalendarView({ children = [] }) {
  const today = new Date();
  const startYear = today.getFullYear();
  const maxYear = 2030;

  const [viewMode, setViewMode] = useState("today");
  const [year, setYear] = useState(startYear);
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedChildId, setSelectedChildId] = useState("all");

  const [events, setEvents] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [openCalendarColors, setOpenCalendarColors] = useState(false);
  const [appointmentColor, setAppointmentColor] = useState("sage");
  const [appointmentEmoji, setAppointmentEmoji] = useState("⚑");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDate = useMemo(
    () => new Date(year, month, selectedDay),
    [year, month, selectedDay]
  );
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
    appointmentEmoji: "⚑",
    recurrence: "Aucune",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedChildId === "all") return events;
    return events.filter((event) => event.childIds.includes(selectedChildId));
  }, [events, selectedChildId]);

  const selectedDateEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.date === selectedDateKey)
      .sort((a, b) => String(a.start || "99:99").localeCompare(String(b.start || "99:99")));
  }, [filteredEvents, selectedDateKey]);

  const todayEvents = useMemo(() => {
    return events
      .filter((event) => event.date === todayKey)
      .sort((a, b) => String(a.start || "99:99").localeCompare(String(b.start || "99:99")));
  }, [events, todayKey]);

  const weekDays = useMemo(() => {
    return getWeekDates(selectedDate).map((date) => {
      const dateKey = dateToKey(date);
      const dayEvents = filteredEvents.filter((event) => event.date === dateKey);

      return {
        date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateKey,
        events: dayEvents,
      };
    });
  }, [selectedDate, filteredEvents]);

  const days = useMemo(() => {
    const totalDays = getDaysInMonth(year, month);

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const dateKey = toDateKey(year, month, day);
      const dayEvents = filteredEvents.filter((event) => event.date === dateKey);

      return {
        day,
        dateKey,
        events: dayEvents,
      };
    });
  }, [year, month, filteredEvents]);

  const monthStartOffset = new Date(year, month, 1).getDay();

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.date >= todayKey)
      .sort((a, b) => {
        const dateCompare = String(a.date).localeCompare(String(b.date));
        if (dateCompare !== 0) return dateCompare;
        return String(a.start || "99:99").localeCompare(String(b.start || "99:99"));
      })
      .slice(0, 8);
  }, [filteredEvents, todayKey]);

  const weekStart = weekDays[0]?.date || selectedDate;
  const weekEnd = weekDays[6]?.date || selectedDate;

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

  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setViewMode("today");
  }

  function previousPeriod() {
    const currentDate = new Date(year, month, selectedDay);

    if (viewMode === "month") {
      if (year === startYear && month === today.getMonth()) return;
      currentDate.setMonth(currentDate.getMonth() - 1);
      currentDate.setDate(1);
    } else {
      currentDate.setDate(currentDate.getDate() - 7);
    }

    if (currentDate.getFullYear() < startYear) return;

    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(currentDate.getDate());
  }

  function nextPeriod() {
    const currentDate = new Date(year, month, selectedDay);

    if (viewMode === "month") {
      if (year === maxYear && month === 11) return;
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    } else {
      currentDate.setDate(currentDate.getDate() + 7);
    }

    if (currentDate.getFullYear() > maxYear) return;

    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(currentDate.getDate());
  }

  function selectDate(nextYear, nextMonth, nextDay, nextView = null) {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDay(nextDay);
    if (nextView) setViewMode(nextView);
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

  function getCustodyLines(dayEvents) {
    const childIds = [];

    dayEvents.forEach((event) => {
      if (!isCustodyEvent(event)) return;

      event.childIds.forEach((childId) => {
        if (!childIds.includes(childId)) childIds.push(childId);
      });
    });

    return childIds.slice(0, 4).map((childId) => {
      const child = children.find((item) => item.id === childId);

      return {
        childId,
        name: child ? displayName(child) : "Enfant",
        color: getHexColor(child?.color || "sage"),
      };
    });
  }

  function getChildTodaySummary(child) {
    const childEvents = todayEvents.filter((event) => event.childIds.includes(child.id));
    const custody = childEvents.find(isCustodyEvent);
    const appointment = childEvents.find(isAppointmentEvent);

    return {
      custodyText: custody?.title || custody?.note || "Aucune garde prévue",
      appointmentText: appointment
        ? `${appointment.start ? `${appointment.start} · ` : ""}${appointment.title || "Rendez-vous"}`
        : "Aucun rendez-vous",
      hasCustody: Boolean(custody),
      hasAppointment: Boolean(appointment),
    };
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
        eventType:
          hasCustody && hasAppointment
            ? "appointment"
            : hasCustody
              ? "appointment"
              : hasAppointment
                ? "both"
                : "custody",
      });
    }

    if (type === "appointment") {
      updateDraft({
        eventType:
          hasAppointment && hasCustody
            ? "custody"
            : hasAppointment
              ? "custody"
              : hasCustody
                ? "both"
                : "appointment",
      });
    }
  }

  function toggleChild(childId) {
    setDraft((current) => {
      const exists = current.childIds.includes(childId);

      return {
        ...current,
        childIds: exists
          ? current.childIds.filter((id) => id !== childId)
          : [...current.childIds, childId],
      };
    });
  }

  function buildEventPayload(dateOverride = null) {
    const childNames = getChildNamesFromIds(draft.childIds);
    const selectedColor =
      draft.eventType === "appointment" ? appointmentColor : getPrimaryColor(draft.childIds);

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
    const url = existingId
      ? `${API_BASE_URL}/api/events/${existingId}`
      : `${API_BASE_URL}/api/events`;

    const method = existingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 401) {
      throw new Error("Tu dois être connecté pour enregistrer un événement.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Impossible d’enregistrer l’événement.");
    }

    return formatEventFromServer(data.event);
  }

  async function saveEvent() {
    try {
      setIsSaving(true);
      const payload = buildEventPayload();
      const savedEvent = await saveSingleEvent(payload, selectedEventId);

      setEvents((current) => {
        if (selectedEventId) {
          return current.map((event) => (event.id === selectedEventId ? savedEvent : event));
        }

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

  const selectedAppointmentColor = getCalendarColor(appointmentColor);

  return (
    <div className="space-y-7">
      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <SectionTitle
            title="Calendrier familial"
            subtitle="Suivez les gardes, les rendez-vous, les activités et les rappels importants de chaque enfant."
            icon={CalendarDays}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-full bg-[#FFFDF8] px-4 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              Aujourd’hui
            </button>

            <button
              type="button"
              onClick={() => setOpenCalendarColors(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFFDF8] px-4 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              <Palette className="h-4 w-4" />
              Paramètres
            </button>

            <button
              type="button"
              onClick={() => openNewEvent()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label">Aujourd’hui</p>
            <h3 className="text-2xl font-bold text-[#55534C]">{formatLongDate(today)}</h3>
            <p className="mt-1 text-sm text-[#746F64]">
              Un aperçu rapide de la journée familiale.
            </p>
          </div>

          <div className="grid grid-cols-3 rounded-full bg-[#F8F3EA] p-1 ring-1 ring-[#EFE4D6]">
            {[
              ["today", "Aujourd’hui"],
              ["week", "Semaine"],
              ["month", "Mois"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  viewMode === mode
                    ? "bg-white text-[#7A8564] shadow-sm"
                    : "text-[#A99D91]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {children.length === 0 ? (
            <div className="rounded-3xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun enfant disponible. Ajoute d’abord un profil enfant.
            </div>
          ) : (
            children.map((child) => {
              const summary = getChildTodaySummary(child);
              const color = getColor(child.color);

              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    setSelectedChildId(child.id);
                    setViewMode("today");
                  }}
                  className={`flex items-center gap-4 rounded-3xl p-4 text-left ring-1 transition hover:brightness-[0.98] ${
                    selectedChildId === child.id ? `${color.soft} ring-2` : "bg-[#FFFDF8] ring-[#EFE4D6]"
                  }`}
                >
                  <ChildAvatar child={child} checked={selectedChildId === child.id} />

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#55534C]">{displayName(child)}</p>
                    <p className="mt-1 text-sm font-semibold text-[#746F64]">
                      {summary.custodyText}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8A8175]">
                      {summary.appointmentText}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label">Filtres</p>
            <h3 className="text-xl font-bold text-[#55534C]">Enfant affiché</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedChildId("all")}
              className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${
                selectedChildId === "all"
                  ? "bg-[#A8B193] text-white ring-[#A8B193]"
                  : "bg-[#FFFDF8] text-[#746F64] ring-[#EFE4D6]"
              }`}
            >
              Tous
            </button>

            {children.map((child) => {
              const selected = selectedChildId === child.id;

              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ring-1 ${
                    selected
                      ? "bg-[#A8B193] text-white ring-[#A8B193]"
                      : "bg-[#FFFDF8] text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getHexColor(child.color) }}
                  />
                  {displayName(child)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={previousPeriod}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-[210px] text-center">
              <p className="label">
                {viewMode === "month" ? "Mois affiché" : "Semaine affichée"}
              </p>
              <h3 className="text-xl font-bold text-[#55534C]">
                {viewMode === "month"
                  ? `${MONTHS[month]} ${year}`
                  : `${weekStart.getDate()} ${MONTHS[
                      weekStart.getMonth()
                    ].toLowerCase()} au ${weekEnd.getDate()} ${MONTHS[
                      weekEnd.getMonth()
                    ].toLowerCase()}`}
              </h3>
            </div>

            <button
              type="button"
              onClick={nextPeriod}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openNewEvent()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Ajouter une journée
          </button>
        </div>

        {isLoading && (
          <div className="mt-5 rounded-2xl bg-[#FFFDF8] p-4 text-center text-sm font-semibold text-[#746F64] ring-1 ring-[#EFE4D6]">
            Chargement du calendrier...
          </div>
        )}

        {(viewMode === "today" || viewMode === "week") && (
          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {weekDays.map((date) => {
              const isSelected = date.dateKey === selectedDateKey;
              const isToday = date.dateKey === todayKey;
              const custodyLines = getCustodyLines(date.events);
              const appointments = date.events.filter(isAppointmentEvent);

              return (
                <button
                  key={date.dateKey}
                  type="button"
                  onClick={() => selectDate(date.year, date.month, date.day, "week")}
                  className={`min-h-[170px] rounded-[1.5rem] p-4 text-left ring-1 transition hover:bg-[#FFFDF8] ${
                    isSelected
                      ? "bg-white ring-2 ring-[#A8B193] shadow-sm"
                      : isToday
                        ? "bg-[#F0F3EA] ring-[#DDE4D2]"
                        : "bg-white ring-[#EFE4D6]"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#A8B193]">
                        {WEEK_DAYS_LONG[date.date.getDay()]}
                      </p>
                      <p className="text-2xl font-bold text-[#55534C]">{date.day}</p>
                      <p className="text-xs font-semibold text-[#A99D91]">
                        {MONTHS[date.month].slice(0, 3)}
                      </p>
                    </div>

                    {appointments.length > 0 && (
                      <span className="rounded-full bg-[#FFF5F5] px-2 py-1 text-xs font-bold text-red-500 ring-1 ring-[#F6D1D1]">
                        {appointments.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {custodyLines.length > 0 ? (
                      custodyLines.map((line) => (
                        <div
                          key={line.childId}
                          className="flex items-center gap-2 rounded-full bg-[#FFFDF8] px-3 py-2 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: line.color }}
                          />
                          {line.name}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-full bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#A99D91] ring-1 ring-[#EFE4D6]">
                        Aucune garde
                      </p>
                    )}

                    {appointments.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-2xl bg-[#FFF5F5] px-3 py-2 text-xs ring-1 ring-[#F6D1D1]"
                      >
                        <p className="font-bold text-red-500">
                          {event.appointmentEmoji || appointmentEmoji} {event.start || "RDV"}
                        </p>
                        <p className="mt-1 line-clamp-2 font-semibold text-[#746F64]">
                          {event.title || "Rendez-vous"}
                        </p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {viewMode === "month" && (
          <div className="mt-5 grid !grid-cols-7 gap-2 text-center">
            {WEEK_DAYS.map((dayName, index) => (
              <div key={`${dayName}-${index}`} className="text-xs font-bold text-[#A8B193]">
                {dayName}
              </div>
            ))}

            {Array.from({ length: monthStartOffset }).map((_, index) => (
              <div key={`empty-${year}-${month}-${index}`} className="min-h-[64px] rounded-2xl" />
            ))}

            {days.map((date) => {
              const isSelected = selectedDay === date.day;
              const isToday = date.dateKey === todayKey;
              const hasAppointment = date.events.some(isAppointmentEvent);
              const custodyLines = getCustodyLines(date.events);

              return (
                <button
                  key={date.dateKey}
                  type="button"
                  onClick={() => selectDate(year, month, date.day)}
                  className={`relative min-h-[84px] rounded-2xl p-2 text-center ring-1 transition hover:bg-[#FFFDF8] ${
                    isSelected
                      ? "bg-white text-[#55534C] ring-2 ring-[#A8B193] shadow-sm"
                      : isToday
                        ? "bg-[#F0F3EA] text-[#55534C] ring-[#DDE4D2]"
                        : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <span
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday ? "bg-[#A8B193] text-white" : "text-[#746F64]"
                    }`}
                  >
                    {date.day}
                  </span>

                  <div className="mt-2 flex flex-col items-center gap-[3px]">
                    {custodyLines.map((line) => (
                      <span
                        key={line.childId}
                        className="h-[3px] w-8 rounded-full"
                        style={{ backgroundColor: line.color }}
                        title={line.name}
                      />
                    ))}
                  </div>

                  {hasAppointment && (
                    <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#EFE4D6] pt-5">
          {children.map((child) => (
            <div key={child.id} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getHexColor(child.color) }}
              />
              <span className="text-sm font-semibold text-[#746F64]">
                {displayName(child)}
              </span>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-[#746F64]">
              Rendez-vous / événement
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label">Journée sélectionnée</p>
            <h3 className="text-xl font-bold text-[#55534C]">{formatLongDate(selectedDate)}</h3>
          </div>

          <button
            type="button"
            onClick={() => openNewEvent(selectedDateKey)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Ajouter sur cette date
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDateEvents.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun événement pour cette journée.
            </div>
          ) : (
            selectedDateEvents.map((event) => (
              <EventCard key={event.id} event={event} childrenList={children} onClick={editEvent} />
            ))
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">À venir</p>
            <h3 className="text-xl font-bold text-[#55534C]">Prochains événements</h3>
            <p className="mt-1 text-sm text-[#746F64]">
              Les prochains rendez-vous, gardes et rappels importants.
            </p>
          </div>
          <ListChecks className="h-5 w-5 text-[#A8B193]" />
        </div>

        <div className="mt-4 space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun événement à venir.
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="grid gap-2 md:grid-cols-[140px_1fr]">
                <div className="rounded-2xl bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
                  {event.date}
                </div>
                <EventCard event={event} childrenList={children} onClick={editEvent} />
              </div>
            ))
          )}
        </div>
      </div>

      {openCalendarColors && (
        <Popup
          title="Couleurs du calendrier"
          kicker="Paramètres"
          close={() => setOpenCalendarColors(false)}
        >
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#EFE4D6]">
              <p className="text-sm font-bold text-[#55534C]">Rendez-vous</p>
              <p className="mt-1 text-xs text-[#746F64]">
                Couleur et icône utilisées pour les rendez-vous.
              </p>

              <div className="mt-4">
                <p className="text-xs font-bold text-[#746F64]">Couleur du rendez-vous</p>
                <div className="mt-3 grid !grid-cols-5 gap-3">
                  {calendarColorOptions.map((color) => {
                    const selected = appointmentColor === color.id;

                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setAppointmentColor(color.id)}
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition hover:scale-105 ${
                          selected
                            ? "border-[#4F4A45] bg-[#FFF8EC] shadow-sm"
                            : "border-[#EFE4D6] bg-white"
                        }`}
                        title={color.label}
                        aria-label={color.label}
                      >
                        <span className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs font-bold text-[#746F64]">
                  Couleur sélectionnée : {selectedAppointmentColor.label}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold text-[#746F64]">Icône du rendez-vous</p>
                <select
                  value={appointmentEmoji}
                  onChange={(event) => setAppointmentEmoji(event.target.value)}
                  className={`${selectClass} mt-2`}
                >
                  {EMOJIS.map((emoji) => (
                    <option key={emoji} value={emoji}>
                      {emoji}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {children.length === 0 ? (
                <div className="rounded-2xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                  Aucun enfant disponible.
                </div>
              ) : (
                children.map((child) => {
                  const childColor = getColor(child.color);

                  return (
                    <div key={child.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-[#EFE4D6]">
                      <ChildAvatar child={child} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#55534C]">{displayName(child)}</p>
                        <p className="text-xs text-[#746F64]">Couleur de garde</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${childColor.soft}`}>
                        {childColor.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Popup>
      )}

      {showEditor && (
        <Popup
          title={`${selectedDay} ${MONTHS[month].toLowerCase()} ${year}`}
          kicker={selectedEventId ? "Modifier un événement" : "Nouvel événement"}
          close={() => setShowEditor(false)}
        >
          <div className="space-y-5">
            <div>
              <p className="label">Type</p>
              <div className="mt-3 grid !grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleType("custody")}
                  className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 ${
                    hasType("custody")
                      ? "bg-[#F0F3EA] text-[#7A8564] ring-2 ring-[#DDE4D2]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  Journée de garde
                </button>

                <button
                  type="button"
                  onClick={() => toggleType("appointment")}
                  className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 ${
                    hasType("appointment")
                      ? "bg-[#FFFAEF] text-[#B68E3D] ring-2 ring-[#F1DDAE]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  Rendez-vous
                </button>
              </div>
            </div>

            <Field label="Titre">
              <input
                className={inputClass}
                value={draft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                placeholder="Ex. Rendez-vous dentiste, garde chez papa..."
              />
            </Field>

            <div className="grid !grid-cols-2 gap-3">
              <TimeDropdown label="Début" value={draft.start || ""} onChange={(value) => updateDraft({ start: value })} />
              <TimeDropdown label="Fin" value={draft.end || ""} onChange={(value) => updateDraft({ end: value })} />
            </div>

            <Field label="Fréquence">
              <select
                className={selectClass}
                value={draft.recurrence || "Aucune"}
                onChange={(event) => updateDraft({ recurrence: event.target.value })}
                disabled={Boolean(selectedEventId)}
              >
                {RECURRENCES.map((frequency) => (
                  <option key={frequency}>{frequency}</option>
                ))}
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
                        onClick={() => updateDraft({ appointmentEmoji: emoji })}
                        className={`rounded-2xl px-3 py-3 text-lg font-bold ring-1 transition ${
                          selectedEmoji
                            ? "bg-[#FFFAEF] text-[#B68E3D] ring-2 ring-[#F1DDAE]"
                            : "bg-white text-[#746F64] ring-[#EFE4D6]"
                        }`}
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
                  <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                    Aucun enfant n’est disponible. Ajoute d’abord un profil enfant.
                  </div>
                ) : (
                  children.map((child) => {
                    const checked = draft.childIds.includes(child.id);
                    const color = getColor(child.color);

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChild(child.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ${
                          checked ? `${color.soft} ring-2` : "bg-white text-[#746F64] ring-[#EFE4D6]"
                        }`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold">
                          {checked ? "✓" : ""}
                        </span>
                        <ChildAvatar child={child} checked={checked} />
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
              <textarea
                value={draft.note}
                onChange={(event) => updateDraft({ note: event.target.value })}
                rows={5}
                className={textareaClass}
                placeholder="Ex. Échange à l'école, rendez-vous, activité spéciale..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {selectedEventId ? (
                <button
                  type="button"
                  onClick={deleteEvent}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  Annuler
                </button>
              )}

              <button
                type="button"
                onClick={saveDayAndApplyFrequency}
                disabled={isSaving}
                className="w-full rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}
