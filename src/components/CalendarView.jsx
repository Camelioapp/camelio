import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { Field, Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.camelio.app";

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

const inputClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const selectClass =
  "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

const textareaClass =
  "w-full min-h-[150px] rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold leading-6 text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20 resize-none";

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

function getStartOfWeek(date) {
  const nextDate = new Date(date);
  const dayIndex = nextDate.getDay();

  nextDate.setDate(nextDate.getDate() - dayIndex);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function getWeekDates(year, month, day) {
  const selectedDate = new Date(year, month, day);
  const startOfWeek = getStartOfWeek(selectedDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date;
  });
}

function getChildPhoto(child) {
  return child?.photo || child?.image || child?.avatar || "";
}

function getChildInitials(child) {
  const first =
    child?.firstName?.trim()?.[0] || child?.name?.trim()?.[0] || "";
  const last = child?.lastName?.trim()?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();

  return initials || "";
}

function formatEventFromServer(event) {
  return {
    id: event.id,
    title: event.title || "",
    eventType: event.eventType || event.type || "Garde",
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

function QuickList({ title, items, childrenList, type, onEdit }) {
  return (
    <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-[#55534C]">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => {
            const childNames =
              item.childNames?.length > 0
                ? item.childNames.join(", ")
                : item.childIds
                    .map((childId) => {
                      const child = childrenList.find(
                        (currentChild) => currentChild.id === childId
                      );
                      return child ? displayName(child) : "";
                    })
                    .filter(Boolean)
                    .join(", ");

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onEdit(item)}
                className="w-full rounded-2xl bg-[#FFFDF8] p-4 text-left ring-1 ring-[#EFE4D6] transition hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#55534C]">
                      {item.title || item.eventType}
                    </p>

                    <p className="mt-1 text-sm text-[#746F64]">
                      {item.note || item.date}
                    </p>

                    {(item.start || item.end) && (
                      <p className="mt-1 text-xs font-bold text-[#6A85AF]">
                        Heure : {item.start || "--:--"}
                        {item.end ? ` à ${item.end}` : ""}
                      </p>
                    )}

                    {childNames && (
                      <p className="mt-1 text-xs font-bold text-[#8A8175]">
                        Enfant : {childNames}
                      </p>
                    )}

                    {item.recurrence && item.recurrence !== "Aucune" && (
                      <p className="mt-1 text-xs font-bold text-[#8475A5]">
                        Fréquence : {item.recurrence}
                      </p>
                    )}
                  </div>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                      type === "appointment"
                        ? "bg-[#FFFAEF] text-[#B68E3D] ring-1 ring-[#F1DDAE]"
                        : "bg-[#F0F3EA] text-[#7A8564] ring-1 ring-[#DDE4D2]"
                    }`}
                  >
                    {type === "appointment"
                      ? item.appointmentEmoji || "⚑"
                      : "✓"}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
            Aucun élément à venir ce mois-ci.
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarView({ children = [] }) {
  const today = new Date();
  const startYear = today.getFullYear();
  const maxYear = 2030;

  const [viewMode, setViewMode] = useState("month");

  const [year, setYear] = useState(startYear);
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [events, setEvents] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [openCalendarColors, setOpenCalendarColors] = useState(false);
  const [appointmentColor, setAppointmentColor] = useState("sage");
  const [appointmentEmoji, setAppointmentEmoji] = useState("⚑");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDateKey = toDateKey(year, month, selectedDay);
  const monthStartOffset = new Date(year, month, 1).getDay();

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

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => event.date === selectedDateKey);
  }, [events, selectedDateKey]);

  const days = useMemo(() => {
    const totalDays = getDaysInMonth(year, month);

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const dateKey = toDateKey(year, month, day);
      const dayEvents = events.filter((event) => event.date === dateKey);

      return {
        day,
        dateKey,
        events: dayEvents,
      };
    });
  }, [year, month, events]);

  const weekDays = useMemo(() => {
    return getWeekDates(year, month, selectedDay).map((date) => {
      const dateKey = dateToKey(date);
      const dayEvents = events.filter((event) => event.date === dateKey);

      return {
        date,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dateKey,
        events: dayEvents,
      };
    });
  }, [year, month, selectedDay, events]);

  const upcomingAppointments = useMemo(() => {
    return events
      .filter((event) => event.date >= selectedDateKey && isAppointmentEvent(event))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);
  }, [events, selectedDateKey]);

  const upcomingCustody = useMemo(() => {
    return events
      .filter(
        (event) =>
          event.date >= selectedDateKey &&
          isCustodyEvent(event) &&
          event.childIds.length > 0
      )
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);
  }, [events, selectedDateKey]);

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
    if (year === startYear && month === today.getMonth()) return;

    if (month === 0) {
      setYear((current) => Math.max(startYear, current - 1));
      setMonth(11);
      setSelectedDay(1);
      return;
    }

    setMonth((current) => current - 1);
    setSelectedDay(1);
  }

  function nextMonth() {
    if (year === maxYear && month === 11) return;

    if (month === 11) {
      setYear((current) => Math.min(maxYear, current + 1));
      setMonth(0);
      setSelectedDay(1);
      return;
    }

    setMonth((current) => current + 1);
    setSelectedDay(1);
  }

  function previousWeek() {
    const currentDate = new Date(year, month, selectedDay);
    currentDate.setDate(currentDate.getDate() - 7);

    if (currentDate.getFullYear() < startYear) return;

    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(currentDate.getDate());
  }

  function nextWeek() {
    const currentDate = new Date(year, month, selectedDay);
    currentDate.setDate(currentDate.getDate() + 7);

    if (currentDate.getFullYear() > maxYear) return;

    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
    setSelectedDay(currentDate.getDate());
  }

  function handlePreviousPeriod() {
    if (viewMode === "week") {
      previousWeek();
      return;
    }

    previousMonth();
  }

  function handleNextPeriod() {
    if (viewMode === "week") {
      nextWeek();
      return;
    }

    nextMonth();
  }

  function selectDate(nextYear, nextMonth, nextDay) {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDay(nextDay);
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
        if (!childIds.includes(childId)) {
          childIds.push(childId);
        }
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

  function openNewEvent() {
    setSelectedEventId(null);
    setDraft({
      title: "",
      eventType: "custody",
      childIds: [],
      date: selectedDateKey,
      start: "",
      end: "",
      note: "",
      color: "sage",
      appointmentEmoji,
      recurrence: "Aucune",
    });

    setShowEditor(true);
  }

  function editEvent(event, shouldOpen = true) {
    const dateParts = String(event.date || selectedDateKey).split("-");
    const nextYear = Number(dateParts[0]);
    const nextMonth = Number(dateParts[1]) - 1;
    const nextDay = Number(dateParts[2]);

    if (
      !Number.isNaN(nextYear) &&
      !Number.isNaN(nextMonth) &&
      !Number.isNaN(nextDay)
    ) {
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
    setDraft((current) => ({
      ...current,
      ...updates,
    }));
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
      draft.eventType === "appointment"
        ? appointmentColor
        : getPrimaryColor(draft.childIds);

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
      headers: {
        "Content-Type": "application/json",
      },
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
          return current.map((event) =>
            event.id === selectedEventId ? savedEvent : event
          );
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
        const dateKey = toDateKey(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );

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

      const response = await fetch(
        `${API_BASE_URL}/api/events/${selectedEventId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

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

      setEvents((current) =>
        current.filter((event) => event.id !== selectedEventId)
      );

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
  const appointmentColorOption = getColor(appointmentColor);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  return (
    <div className="space-y-7">
      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm md:p-6">
        <SectionTitle
          title="Calendrier familial"
          subtitle="Voir les journées de garde, les rendez-vous et les notes."
          icon={CalendarDays}
        />
      </div>

      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm">
        <div className="mb-5 rounded-3xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
          <button
            type="button"
            onClick={() => setOpenCalendarColors((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="label">Couleurs du calendrier</p>
              <p className="mt-1 text-sm leading-5 text-[#746F64]">
                Couleurs des enfants et des rendez-vous.
              </p>
            </div>

            <ChevronRight
              className={`h-5 w-5 shrink-0 text-[#A8B193] transition ${
                openCalendarColors ? "rotate-90" : ""
              }`}
            />
          </button>

          {openCalendarColors && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white p-3 ring-1 ring-[#EFE4D6]">
                <p className="text-sm font-bold text-[#55534C]">
                  Rendez-vous
                </p>

                <p className="mt-1 text-xs text-[#746F64]">
                  Couleur et icône des rendez-vous.
                </p>

                <div className="mt-4">
                  <p className="text-xs font-bold text-[#746F64]">
                    Couleur du rendez-vous
                  </p>

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
                          <span
                            className="h-8 w-8 rounded-full shadow-inner"
                            style={{ backgroundColor: color.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs font-bold text-[#746F64]">
                    Couleur sélectionnée : {selectedAppointmentColor.label}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold text-[#746F64]">
                    Icône du rendez-vous
                  </p>

                  <select
                    value={appointmentEmoji}
                    onChange={(event) =>
                      setAppointmentEmoji(event.target.value)
                    }
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
                    const photo = getChildPhoto(child);
                    const initials = getChildInitials(child);

                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-[#EFE4D6]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EEF0E7] text-sm font-bold text-[#8F9874]">
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
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#55534C]">
                            {displayName(child)}
                          </p>
                          <p className="text-xs text-[#746F64]">
                            Couleur de garde
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${childColor.soft}`}
                        >
                          {childColor.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePreviousPeriod}
              disabled={
                viewMode === "month" &&
                year === startYear &&
                month === today.getMonth()
              }
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-[190px] text-center">
              <p className="label">
                {viewMode === "month" ? "Mois affiché" : "Semaine affichée"}
              </p>

              <h3 className="text-xl font-bold text-[#55534C]">
                {viewMode === "month"
                  ? `${MONTHS[month]} ${year}`
                  : `${weekStart.day} ${MONTHS[
                      weekStart.month
                    ].toLowerCase()} au ${weekEnd.day} ${MONTHS[
                      weekEnd.month
                    ].toLowerCase()}`}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleNextPeriod}
              disabled={viewMode === "month" && year === maxYear && month === 11}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 rounded-full bg-[#F8F3EA] p-1 ring-1 ring-[#EFE4D6]">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                viewMode === "month"
                  ? "bg-white text-[#7A8564] shadow-sm"
                  : "text-[#A99D91]"
              }`}
            >
              Mois
            </button>

            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                viewMode === "week"
                  ? "bg-white text-[#7A8564] shadow-sm"
                  : "text-[#A99D91]"
              }`}
            >
              Semaine
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-5 rounded-2xl bg-[#FFFDF8] p-4 text-center text-sm font-semibold text-[#746F64] ring-1 ring-[#EFE4D6]">
            Chargement du calendrier...
          </div>
        )}

        {viewMode === "month" ? (
          <div className="mt-5 grid !grid-cols-7 gap-2 text-center">
            {WEEK_DAYS.map((dayName, index) => (
              <div
                key={`${dayName}-${index}`}
                className="text-xs font-bold text-[#A8B193]"
              >
                {dayName}
              </div>
            ))}

            {Array.from({ length: monthStartOffset }).map((_, index) => (
              <div
                key={`empty-${year}-${month}-${index}`}
                className="min-h-[64px] rounded-2xl"
              />
            ))}

            {days.map((date) => {
              const isSelected = selectedDay === date.day;
              const hasAppointment = date.events.some(isAppointmentEvent);
              const custodyLines = getCustodyLines(date.events);

              const isToday =
                year === today.getFullYear() &&
                month === today.getMonth() &&
                date.day === today.getDate();

              return (
                <button
                  key={date.dateKey}
                  type="button"
                  onClick={() => selectDate(year, month, date.day)}
                  className={`relative min-h-[76px] rounded-2xl p-2 text-center ring-1 transition hover:bg-[#FFFDF8] ${
                    isSelected
                      ? "bg-white text-[#55534C] ring-2 ring-[#A8B193] shadow-sm"
                      : isToday
                        ? "bg-[#F8F3EA] text-[#55534C] ring-[#EFE4D6]"
                        : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <span
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-[#A8B193] text-white"
                        : isSelected
                          ? "text-[#55534C]"
                          : "text-[#746F64]"
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
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {weekDays.map((date) => {
              const isSelected =
                date.year === year &&
                date.month === month &&
                date.day === selectedDay;

              const hasAppointment = date.events.some(isAppointmentEvent);
              const custodyLines = getCustodyLines(date.events);
              const appointments = date.events.filter(isAppointmentEvent);

              return (
                <button
                  key={date.dateKey}
                  type="button"
                  onClick={() => selectDate(date.year, date.month, date.day)}
                  className={`min-h-[185px] rounded-[1.5rem] p-4 text-left ring-1 transition hover:bg-[#FFFDF8] ${
                    isSelected
                      ? "bg-white ring-2 ring-[#A8B193] shadow-sm"
                      : "bg-white ring-[#EFE4D6]"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#A8B193]">
                        {WEEK_DAYS[date.date.getDay()]}
                      </p>
                      <p className="text-2xl font-bold text-[#55534C]">
                        {date.day}
                      </p>
                      <p className="text-xs font-semibold text-[#A99D91]">
                        {MONTHS[date.month].slice(0, 3)}
                      </p>
                    </div>

                    {hasAppointment && (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
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
                          {event.appointmentEmoji || appointmentEmoji}{" "}
                          {event.start || "Rendez-vous"}
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
            <h3 className="text-xl font-bold text-[#55534C]">
              {selectedDay} {MONTHS[month].toLowerCase()} {year}
            </h3>
          </div>

          <button
            type="button"
            onClick={openNewEvent}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDateEvents.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun événement pour cette journée.
            </div>
          ) : (
            selectedDateEvents.map((event) => {
              const color = getColor(event.color);

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => editEvent(event)}
                  className={`w-full rounded-2xl p-4 text-left ring-1 ${color.soft}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold">
                        {event.title || event.eventType}
                      </p>

                      <p className="mt-1 text-xs font-semibold">
                        {event.eventType === "custody"
                          ? "Journée de garde"
                          : event.eventType === "appointment"
                            ? "Rendez-vous"
                            : event.eventType === "both"
                              ? "Garde et rendez-vous"
                              : event.eventType}
                      </p>
                    </div>

                    {(event.start || event.end) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        {event.start || "--:--"} - {event.end || "--:--"}
                      </span>
                    )}
                  </div>

                  {event.childNames?.length > 0 && (
                    <p className="mt-3 text-sm">
                      {event.childNames.join(", ")}
                    </p>
                  )}

                  {event.note && (
                    <p className="mt-2 text-sm opacity-80">{event.note}</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <QuickList
        title="Prochains rendez-vous"
        items={upcomingAppointments}
        childrenList={children}
        type="appointment"
        onEdit={editEvent}
      />

      <QuickList
        title="Prochaines dates avec les enfants"
        items={upcomingCustody}
        childrenList={children}
        type="custody"
        onEdit={editEvent}
      />

      {showEditor && (
        <Popup
          title={`${selectedDay} ${MONTHS[month].toLowerCase()} ${year}`}
          kicker={
            selectedEventId ? "Modifier un événement" : "Nouvel événement"
          }
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
                onChange={(event) =>
                  updateDraft({ title: event.target.value })
                }
                placeholder="Ex. Rendez-vous dentiste"
              />
            </Field>

            <div className="grid !grid-cols-2 gap-3">
              <TimeDropdown
                label="Début"
                value={draft.start || ""}
                onChange={(value) => updateDraft({ start: value })}
              />

              <TimeDropdown
                label="Fin"
                value={draft.end || ""}
                onChange={(value) => updateDraft({ end: value })}
              />
            </div>

            <Field label="Fréquence">
              <select
                className={selectClass}
                value={draft.recurrence || "Aucune"}
                onChange={(event) =>
                  updateDraft({ recurrence: event.target.value })
                }
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
                    const selectedEmoji =
                      (draft.appointmentEmoji || appointmentEmoji) === emoji;

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
                    Aucun enfant n’est disponible. Ajoute d’abord un profil
                    enfant.
                  </div>
                ) : (
                  children.map((child) => {
                    const checked = draft.childIds.includes(child.id);
                    const color = getColor(child.color);
                    const photo = getChildPhoto(child);
                    const initials = getChildInitials(child);

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChild(child.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ${
                          checked
                            ? `${color.soft} ring-2`
                            : "bg-white text-[#746F64] ring-[#EFE4D6]"
                        }`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-bold">
                          {checked ? "✓" : ""}
                        </span>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EEF0E7] text-sm font-bold text-[#8F9874]">
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
                        </div>

                        <div>
                          <p className="font-bold">{displayName(child)}</p>
                          <p className="text-xs">{child.sex || child.gender}</p>
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
                {isSaving ? "Enregistrement..." : "Enregistrer la journée"}
              </button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}