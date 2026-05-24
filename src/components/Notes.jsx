import React, { useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Plus,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";

import { Field, Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

const NOTE_CATEGORIES = [
  "Note",
  "École",
  "Santé",
  "Routine",
  "Souvenir",
  "Communication",
  "Important",
  "Autre",
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const noteInputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]";

const noteTextareaClass =
  "mt-2 min-h-[140px] w-full resize-none rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm leading-6 text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#DED6EF]";

const GENERAL_CHILD_ID = "general";
const ALL_CHILDREN_ID = "all";

function getChildId(child) {
  return String(child?.id || child?.childId || "");
}

function getChildLabelById(childId, children = []) {
  if (childId === GENERAL_CHILD_ID) return "Général";
  const child = children.find((item) => getChildId(item) === childId);
  return displayName(child) || "Enfant";
}

function noteBelongsToChild(note, childId, children = []) {
  if (childId === ALL_CHILDREN_ID) return true;
  if (note.childId) return note.childId === childId;
  if (childId === GENERAL_CHILD_ID) return note.child === "Général";

  const child = children.find((item) => getChildId(item) === childId);
  return child ? note.child === child.name || note.child === displayName(child) : false;
}

function NoteCard({ note, children = [], onOpen, onDelete }) {
  const child = children.find((item) => getChildId(item) === note.childId);
  const childLabel = getChildLabelById(note.childId || GENERAL_CHILD_ID, children);
  const color = getColor(child?.color);

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
      <button
        type="button"
        onClick={() => onOpen(note)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-[#55534C]">
              {note.title || "Note sans titre"}
            </p>

            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#A8B193]">
              {note.category} · {note.date}
            </p>
          </div>

          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#A8B193]" />
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#746F64]">
          {note.text}
        </p>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(note.childId || GENERAL_CHILD_ID) === GENERAL_CHILD_ID ? (
            <span className="rounded-full bg-[#FFFDF8] px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
              Général
            </span>
          ) : (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${color.soft}`}
            >
              {childLabel}
            </span>
          )}

          {note.isPinned && (
            <span className="rounded-full bg-[#FFFAEF] px-3 py-1 text-xs font-bold text-[#B68E3D] ring-1 ring-[#F1DDAE]">
              Important
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(note)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBECEF] text-[#B96B77] ring-1 ring-[#F3CDD3]"
          aria-label="Supprimer la note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Notes({ children = [] }) {
  const [notes, setNotes] = useState([]);

  const [showNotePopup, setShowNotePopup] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const [query, setQuery] = useState("");
  const [filterChild, setFilterChild] = useState(ALL_CHILDREN_ID);
  const [filterCategory, setFilterCategory] = useState("Toutes");

  const [form, setForm] = useState({
    title: "",
    text: "",
    childId: GENERAL_CHILD_ID,
    category: "Note",
    date: getToday(),
    isPinned: false,
  });

  const filteredNotes = useMemo(() => {
    const search = query.trim().toLowerCase();

    return notes
      .filter((note) => {
        const matchesSearch =
          !search ||
          note.title.toLowerCase().includes(search) ||
          note.text.toLowerCase().includes(search) ||
          note.category.toLowerCase().includes(search) ||
          getChildLabelById(note.childId || GENERAL_CHILD_ID, children)
            .toLowerCase()
            .includes(search);

        const matchesChild =
          noteBelongsToChild(note, filterChild, children);

        const matchesCategory =
          filterCategory === "Toutes" || note.category === filterCategory;

        return matchesSearch && matchesChild && matchesCategory;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
  }, [notes, query, filterChild, filterCategory, children]);

  const pinnedNotes = notes.filter((note) => note.isPinned);
  const childOptions = [
    { id: GENERAL_CHILD_ID, label: "Général" },
    ...children.map((child) => ({ id: getChildId(child), label: displayName(child) })),
  ];

  const resetForm = () => {
    setForm({
      title: "",
      text: "",
      childId: GENERAL_CHILD_ID,
      category: "Note",
      date: getToday(),
      isPinned: false,
    });
  };

  const addNote = () => {
    if (!form.text.trim()) return;

    setNotes((current) => [
      {
        id: `note-${Date.now()}`,
        title: form.title.trim() || "Note",
        text: form.text.trim(),
        childId: form.childId,
        childName: getChildLabelById(form.childId, children),
        category: form.category,
        date: form.date || getToday(),
        isPinned: form.isPinned,
      },
      ...current,
    ]);

    resetForm();
    setShowNotePopup(false);
  };

  const updateNote = () => {
    if (!editingNote || !editingNote.text.trim()) return;

    setNotes((current) =>
      current.map((note) =>
        note.id === editingNote.id
          ? {
              ...editingNote,
              title: editingNote.title.trim() || "Note",
              text: editingNote.text.trim(),
              date: editingNote.date || getToday(),
            }
          : note
      )
    );

    setSelectedNote(null);
    setEditingNote(null);
  };

  const confirmDeleteNote = () => {
    if (!noteToDelete) return;

    setNotes((current) =>
      current.filter((note) => note.id !== noteToDelete.id)
    );

    setSelectedNote(null);
    setEditingNote(null);
    setNoteToDelete(null);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Zone notes"
        subtitle="Notes importantes, souvenirs, santé, école et suivis."
        icon={StickyNote}
      />

      <div className="rounded-[2rem] bg-[#F7F4FB] p-5 shadow-sm ring-1 ring-[#DED6EF]">
        <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#EFE4D6]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B5A7C8] text-white shadow-sm">
            <StickyNote className="h-6 w-6" />
          </div>

          <h3 className="mt-3 text-xl font-bold text-[#55534C]">
            Ajouter une note
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#746F64]">
            Garde une trace des informations importantes, des suivis, des
            souvenirs ou des observations du quotidien.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNotePopup(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B5A7C8] px-4 py-4 text-sm font-bold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter une note
        </button>
      </div>

      <div className="grid !grid-cols-3 gap-3">
        <div className="rounded-[2rem] bg-white p-4 text-center shadow-sm ring-1 ring-[#EFE4D6]">
          <p className="text-xl font-extrabold text-[#55534C]">
            {notes.length}
          </p>
          <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wide text-[#746F64]">
            Notes
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-4 text-center shadow-sm ring-1 ring-[#EFE4D6]">
          <p className="text-xl font-extrabold text-[#55534C]">
            {pinnedNotes.length}
          </p>
          <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wide text-[#746F64]">
            Importantes
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-4 text-center shadow-sm ring-1 ring-[#EFE4D6]">
          <p className="text-xl font-extrabold text-[#55534C]">
            {NOTE_CATEGORIES.length}
          </p>
          <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wide text-[#746F64]">
            Catégories
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#FFFDF8] px-4 py-3 ring-1 ring-[#EFE4D6]">
          <Search className="h-4 w-4 text-[#A8B193]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une note..."
            className="w-full bg-transparent text-sm font-bold text-[#55534C] outline-none placeholder:text-[#A8A096]"
          />
        </div>

        <div className="mt-4 grid !grid-cols-1 gap-4 sm:!grid-cols-2">
          <Field label="Enfant">
            <select
              className={noteInputClass}
              value={filterChild}
              onChange={(event) => setFilterChild(event.target.value)}
            >
              <option value={ALL_CHILDREN_ID}>Tous</option>
              <option value={GENERAL_CHILD_ID}>Général</option>
              {children.map((child) => {
                const childId = getChildId(child);

                return (
                  <option key={childId} value={childId}>
                    {displayName(child)}
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Catégorie">
            <select
              className={noteInputClass}
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
            >
              <option>Toutes</option>
              {NOTE_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {pinnedNotes.length > 0 && (
        <div className="rounded-[2rem] bg-[#FFFAEF] p-5 shadow-sm ring-1 ring-[#F1DDAE]">
          <h3 className="text-lg font-bold text-[#55534C]">
            Notes importantes
          </h3>

          <div className="mt-4 space-y-3">
            {pinnedNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNote(note)}
                className="w-full rounded-2xl bg-white p-4 text-left ring-1 ring-[#F1DDAE]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#55534C]">
                      {note.title}
                    </p>

                    <p className="mt-1 text-xs text-[#746F64]">
                      {getChildLabelById(note.childId || GENERAL_CHILD_ID, children)} · {note.category}
                    </p>
                  </div>

                  <FileText className="h-5 w-5 shrink-0 text-[#EEC988]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredNotes.length ? (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              children={children}
              onOpen={setSelectedNote}
              onDelete={setNoteToDelete}
            />
          ))
        ) : (
          <div className="rounded-[2rem] bg-white p-5 text-sm leading-6 text-[#746F64] shadow-sm ring-1 ring-[#EFE4D6]">
            Aucune note ne correspond à ta recherche.
          </div>
        )}
      </div>

      {showNotePopup && (
        <Popup
          title="Ajouter une note"
          kicker="Nouvelle note"
          close={() => setShowNotePopup(false)}
        >
          <div className="space-y-4">
            <Field label="Titre">
              <input
                className={noteInputClass}
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="Ex. Suivi école, santé, souvenir..."
                autoFocus
              />
            </Field>

            <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
              <Field label="Associer à">
                <select
                  className={noteInputClass}
                  value={form.childId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      childId: event.target.value,
                    })
                  }
                >
                  {childOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Catégorie">
                <select
                  className={noteInputClass}
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                >
                  {NOTE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Date">
              <input
                type="date"
                className={noteInputClass}
                value={form.date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    date: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Note">
              <textarea
                className={noteTextareaClass}
                rows={6}
                value={form.text}
                onChange={(event) =>
                  setForm({
                    ...form,
                    text: event.target.value,
                  })
                }
                placeholder="Écrire la note à conserver..."
              />
            </Field>

            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  isPinned: !form.isPinned,
                })
              }
              className={`flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left ring-1 ${
                form.isPinned
                  ? "bg-[#FFFAEF] text-[#B68E3D] ring-[#F1DDAE]"
                  : "bg-white text-[#746F64] ring-[#EFE4D6]"
              }`}
            >
              <div>
                <p className="text-sm font-bold">Marquer comme important</p>
                <p className="mt-1 text-xs opacity-75">
                  La note apparaîtra dans les notes importantes.
                </p>
              </div>

              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  form.isPinned
                    ? "bg-[#EEC988] text-white"
                    : "bg-[#F8F3EA] text-[#A8B193]"
                }`}
              >
                {form.isPinned ? "✓" : ""}
              </span>
            </button>

            <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
              <button
                type="button"
                onClick={() => setShowNotePopup(false)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={addNote}
                className="rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </Popup>
      )}

      {selectedNote && (
        <Popup
          title={selectedNote.title || "Note"}
          kicker="Détail de la note"
          close={() => setSelectedNote(null)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <p className="label">Information</p>
              <p className="mt-1 text-sm font-bold text-[#55534C]">
                {getChildLabelById(selectedNote.childId || GENERAL_CHILD_ID, children)} · {selectedNote.category} ·{" "}
                {selectedNote.date}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#746F64]">
                {selectedNote.text}
              </p>
            </div>

            <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
              <button
                type="button"
                onClick={() => setEditingNote(selectedNote)}
                className="rounded-2xl bg-[#F7F4FB] px-4 py-3 text-sm font-bold text-[#8475A5] ring-1 ring-[#DED6EF]"
              >
                Modifier
              </button>

              <button
                type="button"
                onClick={() => setNoteToDelete(selectedNote)}
                className="rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Popup>
      )}

      {editingNote && (
        <Popup
          title="Modifier la note"
          kicker="Modification"
          close={() => setEditingNote(null)}
        >
          <div className="space-y-4">
            <Field label="Titre">
              <input
                className={noteInputClass}
                value={editingNote.title}
                onChange={(event) =>
                  setEditingNote({
                    ...editingNote,
                    title: event.target.value,
                  })
                }
              />
            </Field>

            <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
              <Field label="Associer à">
                <select
                  className={noteInputClass}
                  value={editingNote.childId || GENERAL_CHILD_ID}
                  onChange={(event) =>
                    setEditingNote({
                      ...editingNote,
                      childId: event.target.value,
                      childName: getChildLabelById(event.target.value, children),
                    })
                  }
                >
                  {childOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Catégorie">
                <select
                  className={noteInputClass}
                  value={editingNote.category}
                  onChange={(event) =>
                    setEditingNote({
                      ...editingNote,
                      category: event.target.value,
                    })
                  }
                >
                  {NOTE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Date">
              <input
                type="date"
                className={noteInputClass}
                value={editingNote.date}
                onChange={(event) =>
                  setEditingNote({
                    ...editingNote,
                    date: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Note">
              <textarea
                className={noteTextareaClass}
                rows={7}
                value={editingNote.text}
                onChange={(event) =>
                  setEditingNote({
                    ...editingNote,
                    text: event.target.value,
                  })
                }
              />
            </Field>

            <button
              type="button"
              onClick={() =>
                setEditingNote({
                  ...editingNote,
                  isPinned: !editingNote.isPinned,
                })
              }
              className={`w-full rounded-2xl px-4 py-3 text-sm font-bold ring-1 ${
                editingNote.isPinned
                  ? "bg-[#FFFAEF] text-[#B68E3D] ring-[#F1DDAE]"
                  : "bg-white text-[#746F64] ring-[#EFE4D6]"
              }`}
            >
              {editingNote.isPinned
                ? "Note importante activée"
                : "Marquer comme important"}
            </button>

            <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={updateNote}
                className="rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </Popup>
      )}

      {noteToDelete && (
        <Popup
          title="Supprimer cette note?"
          kicker="Confirmation"
          close={() => setNoteToDelete(null)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#746F64]">
              Es-tu certain de vouloir supprimer « {noteToDelete.title} »?
            </p>

            <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDeleteNote}
                className="rounded-2xl bg-[#B96B77] px-4 py-3 text-sm font-bold text-white"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}