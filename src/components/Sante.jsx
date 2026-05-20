import React, { useState } from "react";
import {
  Camera,
  ChevronRight,
  Download,
  FileText,
  HeartPulse,
  Plus,
} from "lucide-react";

import { Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

function FormInput({ label, children }) {
  return (
    <label className="block rounded-2xl bg-white p-4 ring-1 ring-[#D3DFF1]">
      <span className="block text-sm font-bold text-[#6A85AF]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full bg-transparent text-sm text-[#55534C] outline-none placeholder:text-[#A9A39A]";

const textareaClass =
  "min-h-[110px] w-full resize-none bg-transparent text-sm leading-6 text-[#55534C] outline-none placeholder:text-[#A9A39A]";

function DocumentViewer({ doc, close }) {
  const fileName = doc.fileName || "Aucun fichier téléversé";
  const lowerName = fileName.toLowerCase();
  const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/.test(lowerName);
  const isPdf = lowerName.endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white md:h-[96vh] md:w-[96vw] md:rounded-[2rem] md:shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#EFE4D6] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#A8B193]">
              Aperçu document
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-[#55534C]">
              {doc.title}
            </h3>
            <p className="mt-1 truncate text-xs text-[#746F64]">{fileName}</p>
          </div>

          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3EA] text-lg font-bold text-[#746F64]"
          >
            ×
          </button>
        </div>

        <div className="flex min-h-0 flex-1 bg-slate-950 p-2 md:p-4">
          {doc.fileUrl && isImage && (
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={doc.fileUrl}
                alt={doc.title}
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
            </div>
          )}

          {doc.fileUrl && isPdf && (
            <iframe
              src={doc.fileUrl}
              title={doc.title}
              className="h-full w-full rounded-2xl bg-white"
            />
          )}

          {doc.fileUrl && !isImage && !isPdf && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center">
              <div>
                <FileText className="mx-auto h-12 w-12 text-[#A8B193]" />
                <p className="mt-3 text-lg font-bold text-[#55534C]">
                  Aperçu non disponible
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#746F64]">
                  Ce type de fichier peut être conservé, mais l’aperçu intégré
                  est limité aux PDF et aux images.
                </p>
              </div>
            </div>
          )}

          {!doc.fileUrl && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center">
              <div>
                <FileText className="mx-auto h-12 w-12 text-[#A8B193]" />
                <p className="mt-3 text-lg font-bold text-[#55534C]">
                  Aucun fichier téléversé
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sante({
  children = [],
  docs = [],
  setDocs = () => {},
}) {
  const [items, setItems] = useState([]);
  const [growth, setGrowth] = useState({});
  const [vaccines, setVaccines] = useState({});

  const [openChildSante, setOpenChildSante] = useState({});
  const [openHistory, setOpenHistory] = useState({});
  const [openSections, setOpenSections] = useState({});

  const [showGrowthPopup, setShowGrowthPopup] = useState(null);
  const [showVaccinePopup, setShowVaccinePopup] = useState(null);
  const [notePopup, setNotePopup] = useState(null);
  const [selectedSanteDocument, setSelectedSanteDocument] = useState(null);
  const [showSanteDocPopup, setShowSanteDocPopup] = useState(null);

  const [growthForm, setGrowthForm] = useState({
    height: "",
    weight: "",
    note: "",
  });

  const [vaccineForm, setVaccineForm] = useState({
    name: "",
    date: "",
    nextDose: "",
    note: "",
  });

  const [noteForm, setNoteForm] = useState("");

  const [santeDocForm, setSanteDocForm] = useState({
    title: "",
    note: "",
    fileName: "",
    fileUrl: "",
  });

  const santeTypes = [
    "Allergies",
    "Médicaments",
    "Rendez-vous",
    "Spécialistes",
    "Contacts santé",
    "Vaccins",
    "Note",
  ];

  const getSanteDocs = (childName) =>
    docs.filter((doc) => doc.child === childName && doc.type === "Santé");

  const addGrowth = () => {
    if (!showGrowthPopup) return;

    setGrowth((current) => ({
      ...current,
      [showGrowthPopup]: [
        {
          date: new Date().toISOString().slice(0, 10),
          height: growthForm.height ? `${growthForm.height} po` : "À compléter",
          weight: growthForm.weight ? `${growthForm.weight} lb` : "À compléter",
          note: growthForm.note,
        },
        ...(current[showGrowthPopup] || []),
      ],
    }));

    setGrowthForm({ height: "", weight: "", note: "" });
    setShowGrowthPopup(null);
  };

  const addVaccine = () => {
    if (!showVaccinePopup || !vaccineForm.name.trim()) return;

    setVaccines((current) => ({
      ...current,
      [showVaccinePopup]: [
        {
          id: `vaccine-${Date.now()}`,
          name: vaccineForm.name.trim(),
          date: vaccineForm.date || "À compléter",
          nextDose: vaccineForm.nextDose || "Aucune",
          note: vaccineForm.note.trim(),
        },
        ...(current[showVaccinePopup] || []),
      ],
    }));

    setOpenSections((current) => ({
      ...current,
      [`${showVaccinePopup}-Vaccins`]: true,
    }));

    setVaccineForm({ name: "", date: "", nextDose: "", note: "" });
    setShowVaccinePopup(null);
  };

  const addSanteNote = () => {
    if (!notePopup || !noteForm.trim()) return;

    setItems((current) => [
      {
        id: `sante-${Date.now()}`,
        child: notePopup.child,
        type: notePopup.type,
        text: noteForm.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);

    setOpenSections((current) => ({
      ...current,
      [`${notePopup.child}-${notePopup.type}`]: true,
    }));

    setNoteForm("");
    setNotePopup(null);
  };

  const addSanteDocument = () => {
    if (!showSanteDocPopup || !santeDocForm.title.trim()) return;

    setDocs((current) => [
      {
        id: `sante-doc-${Date.now()}`,
        title: santeDocForm.title.trim(),
        child: showSanteDocPopup,
        type: "Santé",
        note: santeDocForm.note.trim(),
        fileName: santeDocForm.fileName,
        fileUrl: santeDocForm.fileUrl,
      },
      ...current,
    ]);

    setSanteDocForm({ title: "", note: "", fileName: "", fileUrl: "" });
    setShowSanteDocPopup(null);
  };

  const handleSanteFile = (file) => {
    if (!file) return;

    setSanteDocForm((current) => ({
      ...current,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    }));
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Santé"
        subtitle="Regrouper les informations de santé importantes pour chaque enfant."
        icon={HeartPulse}
      />

      {children.length === 0 && (
        <div className="rounded-[2rem] bg-white p-5 text-sm leading-6 text-[#746F64] shadow-sm ring-1 ring-[#EFE4D6]">
          Aucun enfant ajouté. Ajoute d’abord un enfant dans la section Profil
          enfant.
        </div>
      )}

      {children.map((child) => {
        const entries = items.filter((item) => item.child === child.name);
        const history = growth[child.name] || [];
        const childVaccines = vaccines[child.name] || [];
        const latest = history[0];

        const childOpen =
          children.length === 1 ? true : Boolean(openChildSante[child.name]);

        const color = getColor(child.color);

        return (
          <div
            key={child.name}
            className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]"
          >
            <button
              type="button"
              onClick={() => {
                if (children.length === 1) return;
                setOpenChildSante((current) => ({
                  ...current,
                  [child.name]: !current[child.name],
                }));
              }}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={child.photo}
                  alt={displayName(child)}
                  className="h-14 w-14 rounded-2xl object-cover"
                />

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-[#55534C]">
                    Dossier de {displayName(child)}
                  </h3>

                  <p className="text-sm text-[#746F64]">
                    {child.sex || "À compléter"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${color.soft}`}
                >
                  {entries.length} note{entries.length > 1 ? "s" : ""}
                </span>

                {children.length > 1 && (
                  <ChevronRight
                    className={`h-5 w-5 text-[#A8B193] transition ${
                      childOpen ? "rotate-90" : ""
                    }`}
                  />
                )}
              </div>
            </button>

            {childOpen && (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-[#F4F8FD] p-4 ring-1 ring-[#D3DFF1]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="label text-[#6A85AF]">Mensurations</p>
                      <p className="mt-1 text-sm leading-5 text-[#746F64]">
                        Ajoute la grandeur, le poids et une note pour garder
                        l’historique.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowGrowthPopup(child.name)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A2BADF] text-white shadow-sm"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#D3DFF1]">
                      <p className="label text-[#6A85AF]">
                        Grandeur, en pouces
                      </p>
                      <p className="mt-1 font-bold text-[#55534C]">
                        {latest?.height || "À compléter"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#D3DFF1]">
                      <p className="label text-[#6A85AF]">Poids, en livres</p>
                      <p className="mt-1 font-bold text-[#55534C]">
                        {latest?.weight || "À compléter"}
                      </p>
                    </div>
                  </div>

                  {latest?.note && (
                    <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-[#D3DFF1]">
                      <p className="label text-[#6A85AF]">Note</p>
                      <p className="mt-1 text-sm text-[#746F64]">
                        {latest.note}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setOpenHistory((current) => ({
                        ...current,
                        [child.name]: !current[child.name],
                      }))
                    }
                    className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-[#D3DFF1]"
                  >
                    <span className="label text-[#6A85AF]">
                      Historique des mensurations
                    </span>

                    <ChevronRight
                      className={`h-4 w-4 transition ${
                        openHistory[child.name] ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {openHistory[child.name] && (
                    <div className="mt-3 space-y-2">
                      {history.length ? (
                        history.map((entry, index) => (
                          <div
                            key={`${entry.date}-${index}`}
                            className="rounded-2xl bg-white p-3 ring-1 ring-[#D3DFF1]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-[#55534C]">
                                  {entry.date}
                                </p>

                                <p className="text-xs text-[#746F64]">
                                  Grandeur : {entry.height} · Poids :{" "}
                                  {entry.weight}
                                </p>

                                {entry.note && (
                                  <p className="mt-1 text-xs text-[#746F64]">
                                    {entry.note}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setGrowth((current) => ({
                                    ...current,
                                    [child.name]: (
                                      current[child.name] || []
                                    ).filter((_, i) => i !== index),
                                  }))
                                }
                                className="shrink-0 rounded-full bg-[#FBECEF] px-2.5 py-1 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#D3DFF1]">
                          Aucune mensuration ajoutée.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {(() => {
                    const santeDocs = getSanteDocs(child.name);
                    const docsOpenKey = `${child.name}-Documents`;
                    const isDocsOpen = Boolean(openSections[docsOpenKey]);

                    return (
                      <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSections((current) => ({
                                ...current,
                                [docsOpenKey]: !current[docsOpenKey],
                              }))
                            }
                            className="flex flex-1 items-center justify-between text-left"
                          >
                            <p className="font-bold text-[#55534C]">
                              Documents médicaux
                            </p>

                            <ChevronRight
                              className={`h-4 w-4 text-[#A8B193] transition ${
                                isDocsOpen ? "rotate-90" : ""
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowSanteDocPopup(child.name)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#6A85AF] ring-1 ring-[#D3DFF1]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {isDocsOpen && (
                          <div className="mt-3 space-y-2">
                            {santeDocs.length ? (
                              santeDocs.map((doc, index) => (
                                <button
                                  key={`${doc.title}-${index}`}
                                  type="button"
                                  onClick={() => setSelectedSanteDocument(doc)}
                                  className="w-full rounded-xl bg-white p-3 text-left text-sm text-[#746F64] ring-1 ring-[#EFE4D6]"
                                >
                                  <p className="font-bold text-[#55534C]">
                                    {doc.title}
                                  </p>

                                  <p className="mt-1 text-xs text-[#746F64]">
                                    {doc.fileName ||
                                      "Aucun fichier téléversé"}
                                  </p>

                                  {doc.note && (
                                    <p className="mt-1 text-xs text-[#746F64]">
                                      {doc.note}
                                    </p>
                                  )}
                                </button>
                              ))
                            ) : (
                              <p className="rounded-xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                                Aucun document médical ajouté.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {santeTypes.map((type) => {
                    const key = `${child.name}-${type}`;
                    const sectionEntries = entries.filter(
                      (entry) => entry.type === type
                    );
                    const isOpen = Boolean(openSections[key]);
                    const isVaccines = type === "Vaccins";

                    return (
                      <div
                        key={type}
                        className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSections((current) => ({
                                ...current,
                                [key]: !current[key],
                              }))
                            }
                            className="flex flex-1 items-center justify-between text-left"
                          >
                            <p className="font-bold text-[#55534C]">{type}</p>

                            <ChevronRight
                              className={`h-4 w-4 text-[#A8B193] transition ${
                                isOpen ? "rotate-90" : ""
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              isVaccines
                                ? setShowVaccinePopup(child.name)
                                : setNotePopup({ child: child.name, type })
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#6A85AF] ring-1 ring-[#D3DFF1]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {isOpen && (
                          <div className="mt-3 space-y-2">
                            {isVaccines ? (
                              childVaccines.length ? (
                                childVaccines.map((vaccine) => (
                                  <div
                                    key={vaccine.id}
                                    className="rounded-xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-bold text-[#55534C]">
                                          {vaccine.name}
                                        </p>
                                        <p className="mt-1 text-xs text-[#746F64]">
                                          Date : {vaccine.date}
                                        </p>
                                        <p className="text-xs text-[#746F64]">
                                          Prochaine dose : {vaccine.nextDose}
                                        </p>
                                        {vaccine.note && (
                                          <p className="mt-1 text-xs text-[#746F64]">
                                            {vaccine.note}
                                          </p>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setVaccines((current) => ({
                                            ...current,
                                            [child.name]: (
                                              current[child.name] || []
                                            ).filter(
                                              (item) =>
                                                item.id !== vaccine.id
                                            ),
                                          }))
                                        }
                                        className="shrink-0 rounded-full bg-[#FBECEF] px-2.5 py-1 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="rounded-xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                                  Aucun vaccin ajouté.
                                </p>
                              )
                            ) : sectionEntries.length ? (
                              sectionEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="rounded-xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p>{entry.text}</p>
                                      <p className="mt-1 text-xs text-[#A8B193]">
                                        {entry.date}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setItems((current) =>
                                          current.filter(
                                            (item) => item.id !== entry.id
                                          )
                                        )
                                      }
                                      className="shrink-0 rounded-full bg-[#FBECEF] px-2.5 py-1 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-xl bg-white p-3 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                                Aucune information ajoutée.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showGrowthPopup && (
        <Popup
          title="Ajouter une mensuration"
          kicker={showGrowthPopup}
          close={() => setShowGrowthPopup(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormInput label="Grandeur, en pouces">
                <input
                  className={inputClass}
                  value={growthForm.height}
                  onChange={(event) =>
                    setGrowthForm({ ...growthForm, height: event.target.value })
                  }
                  placeholder="Ex. 52"
                  autoFocus
                />
              </FormInput>

              <FormInput label="Poids, en livres">
                <input
                  className={inputClass}
                  value={growthForm.weight}
                  onChange={(event) =>
                    setGrowthForm({ ...growthForm, weight: event.target.value })
                  }
                  placeholder="Ex. 72"
                />
              </FormInput>
            </div>

            <FormInput label="Note, optionnelle">
              <textarea
                className={textareaClass}
                value={growthForm.note}
                onChange={(event) =>
                  setGrowthForm({ ...growthForm, note: event.target.value })
                }
                placeholder="Ex. Mesure maison, rendez-vous médical..."
              />
            </FormInput>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowGrowthPopup(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={addGrowth}
                className="rounded-2xl bg-[#A2BADF] px-4 py-3 text-sm font-bold text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </Popup>
      )}

      {showVaccinePopup && (
        <Popup
          title="Ajouter un vaccin"
          kicker={showVaccinePopup}
          close={() => setShowVaccinePopup(null)}
        >
          <div className="space-y-4">
            <FormInput label="Nom du vaccin">
              <input
                className={inputClass}
                value={vaccineForm.name}
                onChange={(event) =>
                  setVaccineForm({ ...vaccineForm, name: event.target.value })
                }
                placeholder="Ex. ROR, varicelle, hépatite B..."
                autoFocus
              />
            </FormInput>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormInput label="Date">
                <input
                  type="date"
                  className={inputClass}
                  value={vaccineForm.date}
                  onChange={(event) =>
                    setVaccineForm({ ...vaccineForm, date: event.target.value })
                  }
                />
              </FormInput>

              <FormInput label="Prochaine dose">
                <input
                  className={inputClass}
                  value={vaccineForm.nextDose}
                  onChange={(event) =>
                    setVaccineForm({
                      ...vaccineForm,
                      nextDose: event.target.value,
                    })
                  }
                  placeholder="Ex. Aucune, 2027-05-12..."
                />
              </FormInput>
            </div>

            <FormInput label="Note, optionnelle">
              <textarea
                className={textareaClass}
                value={vaccineForm.note}
                onChange={(event) =>
                  setVaccineForm({ ...vaccineForm, note: event.target.value })
                }
                placeholder="Information utile sur le vaccin..."
              />
            </FormInput>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowVaccinePopup(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={addVaccine}
                className="rounded-2xl bg-[#A2BADF] px-4 py-3 text-sm font-bold text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </Popup>
      )}

      {showSanteDocPopup && (
        <Popup
          title="Ajouter un document médical"
          kicker={showSanteDocPopup}
          close={() => setShowSanteDocPopup(null)}
        >
          <div className="space-y-4">
            <FormInput label="Titre">
              <input
                className={inputClass}
                value={santeDocForm.title}
                onChange={(event) =>
                  setSanteDocForm({
                    ...santeDocForm,
                    title: event.target.value,
                  })
                }
                placeholder="Ex. Rapport médical, prescription..."
                autoFocus
              />
            </FormInput>

            <div className="rounded-2xl bg-[#F4F8FD] p-4 ring-1 ring-[#D3DFF1]">
              <p className="label text-[#6A85AF]">Fichier médical</p>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white px-4 py-5 text-center text-xs font-bold text-[#746F64] ring-1 ring-[#D3DFF1]">
                  <Download className="h-5 w-5" />
                  Choisir un document
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.txt,.xls,.xlsx"
                    onChange={(event) =>
                      handleSanteFile(event.target.files?.[0])
                    }
                  />
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white px-4 py-5 text-center text-xs font-bold text-[#746F64] ring-1 ring-[#D3DFF1]">
                  <Camera className="h-5 w-5" />
                  Prendre une photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      handleSanteFile(event.target.files?.[0])
                    }
                  />
                </label>
              </div>

              {santeDocForm.fileName && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-[#D3DFF1]">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#55534C]">
                      {santeDocForm.fileName}
                    </p>
                    <p className="text-xs text-[#746F64]">
                      Document médical sélectionné
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSanteDocForm({
                        ...santeDocForm,
                        fileName: "",
                        fileUrl: "",
                      })
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBECEF] text-lg font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <FormInput label="Note, optionnelle">
              <textarea
                className={textareaClass}
                value={santeDocForm.note}
                onChange={(event) =>
                  setSanteDocForm({
                    ...santeDocForm,
                    note: event.target.value,
                  })
                }
                placeholder="Information utile sur ce document..."
              />
            </FormInput>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowSanteDocPopup(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={addSanteDocument}
                className="rounded-2xl bg-[#A2BADF] px-4 py-3 text-sm font-bold text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </Popup>
      )}

      {notePopup && (
        <Popup
          title={`Ajouter ${notePopup.type.toLowerCase()}`}
          kicker={notePopup.child}
          close={() => setNotePopup(null)}
        >
          <div className="space-y-4">
            <FormInput label="Note">
              <textarea
                className={textareaClass}
                value={noteForm}
                onChange={(event) => setNoteForm(event.target.value)}
                placeholder="Écrire l'information à conserver..."
                autoFocus
              />
            </FormInput>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setNotePopup(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={addSanteNote}
                className="rounded-2xl bg-[#A2BADF] px-4 py-3 text-sm font-bold text-white"
              >
                Ajouter
              </button>
            </div>
          </div>
        </Popup>
      )}

      {selectedSanteDocument && (
        <DocumentViewer
          doc={selectedSanteDocument}
          close={() => setSelectedSanteDocument(null)}
        />
      )}
    </div>
  );
}