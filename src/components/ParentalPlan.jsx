import React, { useState } from "react";
import {
  ChevronRight,
  Download,
  FileText,
  Plus,
  ScrollText,
  Trash2,
} from "lucide-react";

import { Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

function FormInput({ label, children }) {
  return (
    <label className="block rounded-2xl bg-white p-4 ring-1 ring-[#DED6EF]">
      <span className="block text-sm font-bold text-[#8475A5]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full bg-transparent text-sm text-[#55534C] outline-none placeholder:text-[#A9A39A]";

const textareaClass =
  "min-h-[220px] w-full resize-none bg-transparent text-sm leading-6 text-[#55534C] outline-none placeholder:text-[#A9A39A]";

export default function ParentalPlan({
  children = [],
  setActiveSection = () => {},
}) {
  const newLine = String.fromCharCode(10);

  const createInitialSections = () =>
    [
      {
        title: "Informations générales",
        text: [
          "Parents : à compléter",
          "Coordonnées : à compléter",
          "École ou garderie : à compléter",
          "Contacts d'urgence : à compléter",
        ].join(newLine),
      },
      {
        title: "Principes de coparentalité",
        text: "Les parents s'engagent à agir dans l'intérêt des enfants, à éviter les conflits devant eux et à partager les informations importantes.",
      },
      {
        title: "Autorité parentale et décisions importantes",
        text: "Les décisions importantes concernant l'école, la santé, les voyages, les passeports et les activités coûteuses doivent être discutées entre les parents.",
      },
      {
        title: "Calendrier parental régulier",
        text: [
          "Type de garde : à compléter",
          "Cycle de garde : à compléter",
          "Heure et lieu des échanges : à compléter",
        ].join(newLine),
      },
      {
        title: "Échanges et transitions",
        text: "Les échanges ont lieu à l'endroit convenu. Si un parent prévoit être en retard, il doit aviser l'autre parent dès que possible.",
      },
      {
        title: "Vacances, congés et fêtes",
        text: "Les vacances, congés, fêtes spéciales et anniversaires sont planifiés à l'avance.",
      },
      {
        title: "Communications",
        text: "Les communications importantes doivent être faites par écrit. Les enfants peuvent communiquer avec l'autre parent de façon raisonnable.",
      },
      {
        title: "École et garderie",
        text: "Les deux parents ont accès aux informations scolaires et se transmettent les communications importantes.",
      },
      {
        title: "Santé et urgences",
        text: "En cas d'urgence médicale, le parent présent peut agir immédiatement et doit informer l'autre parent dès que possible.",
      },
      {
        title: "Frais et remboursements",
        text: "Les dépenses admissibles doivent être accompagnées d'une preuve. Le remboursement est fait selon le pourcentage convenu et dans le délai prévu.",
      },
      {
        title: "Transport",
        text: "Les modalités de transport, les lieux d'échange et les responsabilités de chaque parent doivent être précisées.",
      },
      {
        title: "Révision du plan",
        text: "Le plan peut être révisé une fois par année ou lorsqu'un changement important survient.",
      },
      {
        title: "Règlement des désaccords",
        text: "En cas de désaccord, les parents tentent d'abord une discussion écrite, puis la médiation au besoin.",
      },
    ].map((section, index) => ({
      ...section,
      id: `section-${index + 1}-${Date.now()}`,
    }));

  const createPlan = (index = 1) => ({
    id: `plan-${Date.now()}-${index}`,
    name: index === 1 ? "Plan parental principal" : `Plan parental ${index}`,
    context:
      "Ce plan vise à clarifier les règles importantes, faciliter la communication et favoriser une bonne entente entre les parents.",
    childrenNames: children.map((child) => child.name),
    sections: createInitialSections(),
  });

  const [plans, setPlans] = useState(() => [createPlan(1)]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [openSectionId, setOpenSectionId] = useState("");
  const [editor, setEditor] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [previewFullScreen, setPreviewFullScreen] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState(null);

  const activePlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];

  const selectedChildren = children.filter((child) =>
    activePlan.childrenNames.includes(child.name)
  );

  const numberedSections = activePlan.sections.map((section, index) => ({
    ...section,
    number: index + 1,
  }));

  const updateActivePlan = (updater) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === activePlan.id ? updater(plan) : plan))
    );
  };

  const updateSection = (sectionId, updates) => {
    updateActivePlan((plan) => ({
      ...plan,
      sections: plan.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  };

  const toggleChild = (childName) => {
    updateActivePlan((plan) => ({
      ...plan,
      childrenNames: plan.childrenNames.includes(childName)
        ? plan.childrenNames.filter((name) => name !== childName)
        : [...plan.childrenNames, childName],
    }));
  };

  const addPlan = () => {
    const nextPlan = createPlan(plans.length + 1);
    setPlans((current) => [...current, nextPlan]);
    setSelectedPlanId(nextPlan.id);
    setOpenSectionId("");
  };

  const addSection = () => {
    const title = newSectionTitle.trim();
    if (!title) return;

    const newSection = {
      id: `section-custom-${Date.now()}`,
      title,
      text: "À compléter.",
    };

    updateActivePlan((plan) => ({
      ...plan,
      sections: [...plan.sections, newSection],
    }));

    setOpenSectionId(newSection.id);
    setNewSectionTitle("");
  };

  const confirmDeleteSection = () => {
    if (!deleteSectionId) return;

    updateActivePlan((plan) => ({
      ...plan,
      sections: plan.sections.filter(
        (section) => section.id !== deleteSectionId
      ),
    }));

    setDeleteSectionId(null);
  };

  const draftText = [
    activePlan.name.toUpperCase(),
    "",
    "Mise en contexte",
    activePlan.context || "À compléter.",
    "",
    `Enfants concernés : ${
      selectedChildren.map(displayName).join(", ") || "À compléter"
    }`,
    "",
    ...numberedSections.flatMap((section) => [
      `${section.number}. ${section.title}`,
      section.text || "À compléter.",
      "",
    ]),
  ].join(newLine);

  const downloadPlanPdf = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("La fenêtre PDF a été bloquée par le navigateur.");
      return;
    }

    const safeHtml = draftText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${activePlan.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              padding: 40px;
              line-height: 1.6;
            }
            h1 {
              font-size: 22px;
              margin-bottom: 24px;
            }
            .content {
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h1>${activePlan.name}</h1>
          <div class="content">${safeHtml}</div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Plan parental"
        subtitle="Créer, adapter et conserver plusieurs plans parentaux."
        icon={ScrollText}
      />

      <div className="rounded-[2rem] bg-[#F7F4FB] p-5 shadow-sm ring-1 ring-[#DED6EF]">
        <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#EFE4D6]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B5A7C8] text-white shadow-sm">
            <ScrollText className="h-6 w-6" />
          </div>

          <h3 className="mt-3 text-xl font-bold text-[#55534C]">
            Plan parental structuré
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#746F64]">
            Cet outil sert à bien se préparer et à établir des règles claires
            pour favoriser une bonne entente entre les parents. Ce n'est pas un
            document légal. Il est recommandé de consulter un professionnel
            agréé.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Mes plans parentaux
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Sélectionne un modèle, puis personnalise ses informations.
            </p>
          </div>

          <button
            type="button"
            onClick={addPlan}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1EEF8] text-[#8475A5] ring-1 ring-[#DED6EF]"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <FormInput label="1. Sélection du modèle de plan parental">
            <select
              className={inputClass}
              value={activePlan.id}
              onChange={(event) => setSelectedPlanId(event.target.value)}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </FormInput>

          <FormInput label="2. Information du modèle">
            <input
              className={inputClass}
              value={activePlan.name}
              onChange={(event) =>
                updateActivePlan((plan) => ({
                  ...plan,
                  name: event.target.value,
                }))
              }
              placeholder="Ex. Plan parental principal"
            />
          </FormInput>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Enfants concernés
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Choisis les enfants inclus dans ce plan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection("children")}
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#F1EEF8] px-4 py-2 text-sm font-bold text-[#8475A5] ring-1 ring-[#DED6EF]"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {children.length ? (
            children.map((child) => {
              const selected = activePlan.childrenNames.includes(child.name);
              const color = getColor(child.color);

              return (
                <button
                  key={child.name}
                  type="button"
                  onClick={() => toggleChild(child.name)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ${
                    selected
                      ? color.soft
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <img
                    src={child.photo}
                    alt={displayName(child)}
                    className="h-10 w-10 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{displayName(child)}</p>
                    <p className="text-xs">
                      {selected
                        ? "Inclus dans le plan"
                        : "Cliquer pour inclure"}
                    </p>
                  </div>

                  <span className="text-sm font-bold">
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun enfant ajouté. Clique sur Ajouter pour créer un profil enfant.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <h3 className="text-lg font-bold text-[#55534C]">
          Mise en contexte
        </h3>

        <p className="mt-1 text-sm leading-5 text-[#746F64]">
          Résume l’objectif du plan et les éléments importants à garder en tête.
        </p>

        <button
          type="button"
          onClick={() =>
            setEditor({
              type: "context",
              title: "Mise en contexte",
              value: activePlan.context,
            })
          }
          className="mt-4 w-full rounded-2xl bg-white p-4 text-left text-sm leading-6 text-[#746F64] ring-1 ring-[#DED6EF]"
        >
          <span className="block text-sm font-bold text-[#8475A5]">
            Texte de contexte
          </span>

          <span className="mt-2 block whitespace-pre-wrap">
            {activePlan.context ||
              "Cliquer pour écrire la mise en contexte du plan parental..."}
          </span>
        </button>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Sections du plan parental
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Ouvre chaque section pour la modifier.
            </p>
          </div>

          <span className="rounded-full bg-[#F1EEF8] px-3 py-1 text-xs font-bold text-[#8475A5] ring-1 ring-[#DED6EF]">
            {numberedSections.length}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {numberedSections.map((section) => {
            const isOpen = openSectionId === section.id;

            return (
              <div
                key={section.id}
                className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]"
              >
                <button
                  type="button"
                  onClick={() => setOpenSectionId(isOpen ? "" : section.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <p className="font-bold text-[#55534C]">
                    {section.number}. {section.title}
                  </p>

                  <ChevronRight
                    className={`h-5 w-5 shrink-0 text-[#A8B193] transition ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3">
                    <FormInput label="Titre de la section">
                      <input
                        className={inputClass}
                        value={section.title}
                        onChange={(event) =>
                          updateSection(section.id, {
                            title: event.target.value,
                          })
                        }
                      />
                    </FormInput>

                    <button
                      type="button"
                      onClick={() =>
                        setEditor({
                          type: "section",
                          sectionId: section.id,
                          title: `${section.number}. ${section.title}`,
                          value: section.text,
                        })
                      }
                      className="w-full rounded-2xl bg-white p-4 text-left text-sm leading-6 text-[#746F64] ring-1 ring-[#DED6EF]"
                    >
                      <span className="block text-sm font-bold text-[#8475A5]">
                        Texte de la section
                      </span>

                      <span className="mt-2 block whitespace-pre-wrap">
                        {section.text || "Cliquer pour écrire cette section..."}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteSectionId(section.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer cette section
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-[#F7F4FB] p-4 ring-1 ring-[#DED6EF]">
          <FormInput label="Ajouter une section">
            <input
              className={inputClass}
              value={newSectionTitle}
              onChange={(event) => setNewSectionTitle(event.target.value)}
              placeholder="Ex. Transport, règles de communication..."
            />
          </FormInput>

          <button
            type="button"
            onClick={addSection}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Ajouter la section
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#55534C]">
              Brouillon du plan
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#746F64]">
              Le brouillon reprend automatiquement chaque section avec sa
              numérotation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPreviewFullScreen(true)}
            className="shrink-0 rounded-full bg-[#F1EEF8] px-3 py-1 text-xs font-bold text-[#8475A5] ring-1 ring-[#DED6EF]"
          >
            Plein écran
          </button>
        </div>

        <pre className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm leading-6 text-[#746F64]">
          {draftText}
        </pre>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPreviewFullScreen(true)}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
          >
            Visualiser
          </button>

          <button
            type="button"
            onClick={downloadPlanPdf}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {editor && (
        <Popup
          title={editor.title}
          kicker="Champ texte"
          close={() => setEditor(null)}
        >
          <div className="space-y-4">
            <FormInput label="Texte">
              <textarea
                value={editor.value}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    value: event.target.value,
                  })
                }
                className={textareaClass}
                autoFocus
              />
            </FormInput>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (editor.type === "context") {
                    updateActivePlan((plan) => ({
                      ...plan,
                      context: editor.value,
                    }));
                  }

                  if (editor.type === "section") {
                    updateSection(editor.sectionId, {
                      text: editor.value,
                    });
                  }

                  setEditor(null);
                }}
                className="rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </Popup>
      )}

      {deleteSectionId && (
        <Popup
          title="Supprimer cette section?"
          kicker="Confirmation"
          close={() => setDeleteSectionId(null)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#746F64]">
              Es-tu certain de vouloir supprimer cette section du plan parental?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteSectionId(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDeleteSection}
                className="rounded-2xl bg-[#B96B77] px-4 py-3 text-sm font-bold text-white"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Popup>
      )}

      {previewFullScreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white md:h-[96vh] md:w-[96vw] md:rounded-[2rem] md:shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#EFE4D6] bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[#A8B193]">
                  Brouillon plein écran
                </p>

                <h3 className="mt-1 truncate text-xl font-bold text-[#55534C]">
                  {activePlan.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPreviewFullScreen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3EA] text-lg font-bold text-[#746F64]"
              >
                ×
              </button>
            </div>

            <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap bg-[#FFFDF8] p-5 text-sm leading-6 text-[#55534C]">
              {draftText}
            </pre>

            <div className="grid grid-cols-2 gap-3 border-t border-[#EFE4D6] bg-white p-4">
              <button
                type="button"
                onClick={() => setPreviewFullScreen(false)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={downloadPlanPdf}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white"
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}