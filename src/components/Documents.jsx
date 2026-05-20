import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

const API_BASE = import.meta.env.VITE_API_URL || "import.meta.env.VITE_API_URL";

const documentTypes = [
  "Document",
  "Médical",
  "Santé",
  "École",
  "Jugement",
  "Entente parentale",
  "Assurance",
  "Passeport",
  "Autre",
];

const allowedAccept =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#8A8175]">
        {label}
      </span>
      {children}
    </label>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-2xl border border-[#DED6C9] bg-[#F7F3EA] px-4 py-3 text-sm font-semibold text-[#55534C] outline-none transition placeholder:text-[#A9A094] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/25 ${extra}`;
}

function getChildId(child) {
  return child?.id || child?.childId || child?.name || displayName(child);
}

function getChildName(child) {
  return displayName(child) || child?.firstName || child?.name || "Enfant";
}

function getChildPhoto(child) {
  return child?.avatar || child?.photo || child?.image || "";
}

function formatFileSize(size) {
  if (!size) return "";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function getDocumentTitle(doc) {
  return doc.title || doc.fileName || "Document";
}

function getDocumentCategory(doc) {
  return doc.category || doc.type || "Document";
}

function isImageDocument(doc) {
  const fileName = String(doc.fileName || "").toLowerCase();
  const fileType = String(doc.fileType || "").toLowerCase();

  return (
    fileType.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/.test(fileName)
  );
}

function isPdfDocument(doc) {
  const fileName = String(doc.fileName || "").toLowerCase();
  const fileType = String(doc.fileType || "").toLowerCase();

  return fileType === "application/pdf" || fileName.endsWith(".pdf");
}

function DocumentRow({ doc, onView, onMenu }) {
  return (
    <div className="relative rounded-2xl bg-white ring-1 ring-[#EFE4D6] transition hover:bg-[#FFFDF8]">
      <button
        type="button"
        onClick={() => onView(doc)}
        className="w-full p-4 pr-14 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <p className="font-bold text-[#55534C]">{getDocumentTitle(doc)}</p>

            <span className="shrink-0 rounded-full bg-[#FFFAEF] px-3 py-1 text-xs font-bold text-[#B68E3D] ring-1 ring-[#F1DDAE]">
              {getDocumentCategory(doc)}
            </span>
          </div>

          <p className="mt-1 text-sm text-[#746F64]">
            {doc.childName || "Enfant"} · {getDocumentCategory(doc)}
          </p>

          {doc.fileName && (
            <p className="mt-2 inline-flex max-w-full rounded-full bg-[#F4F8FD] px-3 py-1 text-xs font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
              <span className="truncate">{doc.fileName}</span>
            </p>
          )}

          {doc.fileSize && (
            <p className="mt-2 text-xs font-semibold text-[#8A8175]">
              {formatFileSize(doc.fileSize)}
            </p>
          )}

          {doc.note && (
            <p className="mt-2 text-xs leading-5 text-[#746F64]">
              {doc.note}
            </p>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMenu(doc);
        }}
        aria-label="Options du document"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}

function DocumentViewer({ doc, close, onDownload }) {
  const fileName = doc.fileName || "Document";
  const isImage = isImageDocument(doc);
  const isPdf = isPdfDocument(doc);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white md:h-[96vh] md:w-[96vw] md:rounded-[2rem] md:shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#EFE4D6] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#A8B193]">
              Aperçu document
            </p>

            <h3 className="mt-1 truncate text-xl font-bold text-[#55534C]">
              {getDocumentTitle(doc)}
            </h3>

            <p className="mt-1 truncate text-xs text-[#746F64]">{fileName}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {doc.fileUrl && (
              <button
                type="button"
                onClick={() => onDownload(doc)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]"
                title="Ouvrir ou télécharger"
              >
                <Download className="h-5 w-5" />
              </button>
            )}

            <button
              type="button"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F3EA] text-lg font-bold text-[#746F64]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 bg-slate-950 p-2 md:p-4">
          {doc.fileUrl && isImage && (
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={doc.fileUrl}
                alt={getDocumentTitle(doc)}
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
            </div>
          )}

          {doc.fileUrl && isPdf && (
            <iframe
              src={doc.fileUrl}
              title={getDocumentTitle(doc)}
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
                  Ce type de fichier est conservé dans Camelio, mais l’aperçu
                  intégré est limité aux PDF et aux images.
                </p>

                <button
                  type="button"
                  onClick={() => onDownload(doc)}
                  className="mt-5 rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white"
                >
                  Ouvrir le document
                </button>
              </div>
            </div>
          )}

          {!doc.fileUrl && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center">
              <div>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#A8B193]" />
                <p className="mt-3 text-lg font-bold text-[#55534C]">
                  Chargement du document
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#EFE4D6] bg-white px-5 py-3">
          <p className="truncate text-xs font-bold text-[#746F64]">
            {doc.childName || "Enfant"} · {getDocumentCategory(doc)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Documents({
  children = [],
  docs: externalDocs,
  setDocs: externalSetDocs,
}) {
  const [internalDocs, setInternalDocs] = useState([]);
  const docs = Array.isArray(externalDocs) ? externalDocs : internalDocs;
  const setDocs =
    typeof externalSetDocs === "function" ? externalSetDocs : setInternalDocs;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showDocPopup, setShowDocPopup] = useState(false);
  const [selectedChildDocs, setSelectedChildDocs] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [docMenu, setDocMenu] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const firstChildId = children.length ? getChildId(children[0]) : "";

  const [form, setForm] = useState({
    title: "",
    childId: firstChildId,
    type: "Document",
    note: "",
    fileName: "",
    fileSize: null,
    fileType: "",
  });

  useEffect(() => {
    if (!form.childId && firstChildId) {
      setForm((current) => ({
        ...current,
        childId: firstChildId,
      }));
    }
  }, [firstChildId, form.childId]);

  const selectedChild = useMemo(() => {
    return children.find((child) => getChildId(child) === form.childId) || null;
  }, [children, form.childId]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/documents`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les documents.");
      }

      setDocs(data.documents || []);
    } catch (err) {
      setError(err.message || "Impossible de charger les documents.");
    } finally {
      setLoading(false);
    }
  }, [setDocs]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const childDocs = useCallback(
    (child) => {
      const id = getChildId(child);
      const name = getChildName(child);

      return docs.filter((doc) => doc.childId === id || doc.childName === name);
    },
    [docs]
  );

  const handleFileSelection = (file) => {
    if (!file) return;

    setSelectedFile(file);
    setForm((current) => ({
      ...current,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      title: current.title || file.name,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      childId: firstChildId,
      type: "Document",
      note: "",
      fileName: "",
      fileSize: null,
      fileType: "",
    });

    setSelectedFile(null);
  };

  const addDoc = async () => {
    setError("");
    setSuccess("");

    if (!children.length) {
      setError("Ajoute d’abord un enfant avant d’ajouter un document.");
      return;
    }

    if (!form.childId) {
      setError("Choisis l’enfant associé au document.");
      return;
    }

    if (!selectedFile) {
      setError("Choisis un fichier à envoyer.");
      return;
    }

    const child = children.find((item) => getChildId(item) === form.childId);

    if (!child) {
      setError("L’enfant sélectionné est introuvable.");
      return;
    }

    setSaving(true);

    try {
      const presignResponse = await fetch(`${API_BASE}/api/documents/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          childId: getChildId(child),
          childName: getChildName(child),
          category: form.type,
          title: form.title.trim() || selectedFile.name,
          note: form.note.trim(),
        }),
      });

      const presignData = await presignResponse.json();

      if (!presignResponse.ok) {
        throw new Error(
          presignData.message || "Impossible de préparer l’envoi du document."
        );
      }

      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Impossible d’envoyer le fichier vers S3.");
      }

      await loadDocuments();

      setSuccess("Document ajouté avec succès.");
      resetForm();
      setShowDocPopup(false);
    } catch (err) {
      setError(err.message || "Impossible d’ajouter le document.");
    } finally {
      setSaving(false);
    }
  };

  const openDocument = async (doc) => {
    setError("");
    setSelectedDocument({
      ...doc,
      fileUrl: "",
    });

    try {
      const response = await fetch(
        `${API_BASE}/api/documents/${doc.id}/download`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible d’ouvrir le document.");
      }

      setSelectedDocument({
        ...doc,
        fileUrl: data.downloadUrl,
      });
    } catch (err) {
      setSelectedDocument(null);
      setError(err.message || "Impossible d’ouvrir le document.");
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/documents/${doc.id}/download`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de télécharger.");
      }

      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Impossible de télécharger le document.");
    }
  };

  const confirmDeleteDoc = async () => {
    if (!deleteDoc) return;

    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/documents/${deleteDoc.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de supprimer le document.");
      }

      await loadDocuments();

      setDeleteDoc(null);
      setDocMenu(null);
      setSelectedDocument(null);
      setSuccess("Document supprimé.");
    } catch (err) {
      setError(err.message || "Impossible de supprimer le document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Documents"
        subtitle="Classer les documents liés à chaque enfant avec stockage sécurisé."
        icon={FileText}
      />

      {error && (
        <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl bg-[#EEF6EA] p-4 text-sm font-bold text-[#6C8A58] ring-1 ring-[#D9E8CE]">
          {success}
        </div>
      )}

      <div className="rounded-[2rem] bg-[#FFFAEF] p-5 shadow-sm ring-1 ring-[#F1DDAE]">
        <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#EFE4D6]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEC988] text-white shadow-sm">
            <FileText className="h-6 w-6" />
          </div>

          <h3 className="mt-3 text-xl font-bold text-[#55534C]">
            Ajouter un document
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#746F64]">
            Le document sera envoyé dans S3 et associé à l’enfant choisi dans
            DynamoDB.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDocPopup(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EEC988] px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
        >
          <Upload className="h-4 w-4" />
          Ajouter un document
        </button>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Documents par enfant
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Chaque document doit être associé à un enfant.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]"
            title="Rafraîchir"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </button>
        </div>

        {!children.length && (
          <div className="mt-5 rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
            Aucun enfant n’est disponible. Ajoute un enfant dans la section
            Profil enfant avant d’ajouter des documents.
          </div>
        )}

        <div className="mt-5 grid !grid-cols-1 gap-3 sm:!grid-cols-2">
          {children.map((child) => {
            const color = getColor(child.color);
            const documentsForChild = childDocs(child);
            const count = documentsForChild.length;
            const photo = getChildPhoto(child);

            return (
              <button
                key={getChildId(child)}
                type="button"
                onClick={() => setSelectedChildDocs(child)}
                className={`group rounded-3xl bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${color.soft}`}
              >
                <div className="flex items-center gap-4">
                  {photo ? (
                    <img
                      src={photo}
                      alt={getChildName(child)}
                      className="h-16 w-16 rounded-3xl object-cover shadow-sm ring-4 ring-white"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-xl font-extrabold text-[#A8B193] shadow-sm ring-4 ring-white">
                      {getChildName(child).slice(0, 1)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold text-[#55534C]">
                      {getChildName(child)}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#746F64]">
                      Fiche documents
                    </p>

                    <p className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-white">
                      {count} document{count > 1 ? "s" : ""}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-[#A8B193] transition group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Tous les documents
            </h3>
            <p className="mt-1 text-sm text-[#746F64]">
              Liste complète des documents enregistrés.
            </p>
          </div>

          <span className="rounded-full bg-[#F4F8FD] px-3 py-1 text-xs font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
            {docs.length}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {docs.length ? (
            docs.map((doc) => (
              <DocumentRow
                key={doc.id || doc.s3Key}
                doc={doc}
                onView={openDocument}
                onMenu={setDocMenu}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun document enregistré.
            </div>
          )}
        </div>
      </div>

      {selectedDocument && (
        <DocumentViewer
          doc={selectedDocument}
          close={() => setSelectedDocument(null)}
          onDownload={downloadDocument}
        />
      )}

      {docMenu && (
        <Popup
          title={getDocumentTitle(docMenu)}
          kicker="Options du document"
          close={() => setDocMenu(null)}
        >
          <div className="grid !grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => {
                openDocument(docMenu);
                setDocMenu(null);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              <Eye className="h-4 w-4" />
              Ouvrir le document
            </button>

            <button
              type="button"
              onClick={() => {
                downloadDocument(docMenu);
                setDocMenu(null);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteDoc(docMenu);
                setDocMenu(null);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer le document
            </button>

            <button
              type="button"
              onClick={() => setDocMenu(null)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              Annuler
            </button>
          </div>
        </Popup>
      )}

      {deleteDoc && (
        <Popup
          title="Supprimer ce document?"
          kicker="Confirmation"
          close={() => setDeleteDoc(null)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#746F64]">
              Es-tu certain de vouloir supprimer « {getDocumentTitle(deleteDoc)} »?
            </p>

            <div className="grid !grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteDoc(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDeleteDoc}
                disabled={saving}
                className="rounded-2xl bg-[#B96B77] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </Popup>
      )}

      {selectedChildDocs && (
        <Popup
          title={`Documents de ${getChildName(selectedChildDocs)}`}
          kicker="Fiche enfant"
          close={() => setSelectedChildDocs(null)}
        >
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 rounded-3xl p-4 ring-1 ${
                getColor(selectedChildDocs.color).soft
              }`}
            >
              {getChildPhoto(selectedChildDocs) ? (
                <img
                  src={getChildPhoto(selectedChildDocs)}
                  alt={getChildName(selectedChildDocs)}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-[#A8B193]">
                  {getChildName(selectedChildDocs).slice(0, 1)}
                </div>
              )}

              <div>
                <p className="font-bold text-[#55534C]">
                  {getChildName(selectedChildDocs)}
                </p>

                <p className="text-sm text-[#746F64]">
                  {childDocs(selectedChildDocs).length} document
                  {childDocs(selectedChildDocs).length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {childDocs(selectedChildDocs).length ? (
                childDocs(selectedChildDocs).map((doc) => (
                  <DocumentRow
                    key={doc.id || doc.s3Key}
                    doc={doc}
                    onView={openDocument}
                    onMenu={setDocMenu}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                  Aucun document pour cet enfant.
                </div>
              )}
            </div>
          </div>
        </Popup>
      )}

      {showDocPopup && (
        <Popup
          title="Ajouter un document"
          kicker="Nouveau document"
          close={() => {
            setShowDocPopup(false);
            setError("");
          }}
        >
          <div className="space-y-5">
            <FormField label="Titre">
              <input
                className={inputClass()}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Ex. Carte assurance maladie"
                autoFocus
              />
            </FormField>

            <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2">
              <FormField label="Type de document">
                <select
                  className={inputClass()}
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                >
                  {documentTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Associé à l’enfant">
                <select
                  className={inputClass()}
                  value={form.childId}
                  onChange={(event) =>
                    setForm({ ...form, childId: event.target.value })
                  }
                >
                  {!children.length && (
                    <option value="">Aucun enfant disponible</option>
                  )}

                  {children.map((child) => (
                    <option key={getChildId(child)} value={getChildId(child)}>
                      {getChildName(child)}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {selectedChild && (
              <div
                className={`rounded-3xl p-4 ring-1 ${
                  getColor(selectedChild.color).soft
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">
                  Document associé à
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#55534C]">
                  {getChildName(selectedChild)}
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-[#F8F3EA] p-4 ring-1 ring-[#DED6C9]">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#8A8175]">
                Fichier
              </p>

              <div className="mt-3 grid !grid-cols-1 gap-3 sm:!grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white px-3 py-4 text-center text-xs font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                  <Download className="h-5 w-5" />
                  Choisir un document
                  <input
                    type="file"
                    className="hidden"
                    accept={allowedAccept}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      handleFileSelection(file);
                    }}
                  />
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white px-3 py-4 text-center text-xs font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                  <Camera className="h-5 w-5" />
                  Prendre une photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    capture="environment"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      handleFileSelection(file);
                    }}
                  />
                </label>
              </div>

              {form.fileName && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-[#DED6C9]">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#55534C]">
                      {form.fileName}
                    </p>
                    <p className="text-xs text-[#746F64]">
                      {formatFileSize(form.fileSize)} · Document sélectionné
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setForm({
                        ...form,
                        fileName: "",
                        fileSize: null,
                        fileType: "",
                      });
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBECEF] text-lg font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <FormField label="Note">
              <textarea
                className={inputClass("resize-none")}
                rows={4}
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
                placeholder="Information utile sur ce document..."
              />
            </FormField>

            <div className="grid !grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDocPopup(false);
                  setError("");
                }}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={addDoc}
                disabled={saving || !children.length}
                className="rounded-2xl bg-[#EEC988] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Envoi..." : "Ajouter"}
              </button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}