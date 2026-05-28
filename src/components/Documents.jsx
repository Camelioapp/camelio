import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  HeartPulse,
  Image as ImageIcon,
  KeyRound,
  Link,
  LinkOff,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  School,
  Search,
  ShieldCheck,
  Syringe,
  Trash2,
  Upload,
} from "lucide-react";

import { Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.camelio.app";
const CUSTOM_FOLDERS_STORAGE_KEY = "camelio_document_custom_folders_v1";

const DEFAULT_DOCUMENT_FOLDERS = [
  {
    id: "health-card",
    name: "Carte d’assurance maladie",
    icon: CreditCard,
    color: "#A2BADF",
    bg: "bg-[#F4F8FD]",
    ring: "ring-[#D3DFF1]",
    text: "text-[#6A85AF]",
    description: "Carte RAMQ ou assurance maladie de l’enfant.",
  },
  {
    id: "vaccination-record",
    name: "Carnet de vaccination",
    icon: Syringe,
    color: "#A8B193",
    bg: "bg-[#EEF6EA]",
    ring: "ring-[#D9E8CE]",
    text: "text-[#6C8A58]",
    description: "Vaccins, rappels et preuves de vaccination.",
  },
  {
    id: "birth-certificate",
    name: "Certificat de naissance",
    icon: FileText,
    color: "#EEC988",
    bg: "bg-[#FFFAEF]",
    ring: "ring-[#F1DDAE]",
    text: "text-[#B68E3D]",
    description: "Certificat ou acte de naissance.",
  },
  {
    id: "sin",
    name: "Numéro d’assurance sociale",
    icon: Lock,
    color: "#B5A7C8",
    bg: "bg-[#F7F3FB]",
    ring: "ring-[#DED2EC]",
    text: "text-[#806C98]",
    description: "Document sensible lié au NAS de l’enfant.",
  },
  {
    id: "passport-photo",
    name: "Photo de passeport",
    icon: ImageIcon,
    color: "#EAA5AF",
    bg: "bg-[#FFF1F3]",
    ring: "ring-[#F3CDD3]",
    text: "text-[#B96B77]",
    description: "Photo officielle ou document de passeport.",
  },
  {
    id: "medical",
    name: "Documents médicaux",
    icon: HeartPulse,
    color: "#A2BADF",
    bg: "bg-[#F4F8FD]",
    ring: "ring-[#D3DFF1]",
    text: "text-[#6A85AF]",
    description: "Rapports médicaux, prescriptions ou suivis.",
  },
  {
    id: "school",
    name: "Documents scolaires",
    icon: School,
    color: "#EEC988",
    bg: "bg-[#FFFAEF]",
    ring: "ring-[#F1DDAE]",
    text: "text-[#B68E3D]",
    description: "Bulletins, communications et documents scolaires.",
  },
  {
    id: "legal",
    name: "Documents légaux",
    icon: ShieldCheck,
    color: "#B5A7C8",
    bg: "bg-[#F7F3FB]",
    ring: "ring-[#DED2EC]",
    text: "text-[#806C98]",
    description: "Jugements, ententes parentales ou autorisations.",
  },
  {
    id: "other",
    name: "Autres documents",
    icon: Folder,
    color: "#A8B193",
    bg: "bg-[#EEF6EA]",
    ring: "ring-[#D9E8CE]",
    text: "text-[#6C8A58]",
    description: "Documents divers.",
  },
];

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

function getFileType(file) {
  const fileName = String(file?.name || "").toLowerCase();
  const fileType = String(file?.type || "").trim();

  if (fileType) return fileType;
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".doc")) return "application/msword";
  if (fileName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "application/octet-stream";
}

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
  return String(child?.id || child?.childId || "");
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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function getShareUrlFromResponse(data) {
  if (data?.shareUrl) return data.shareUrl;
  if (data?.url) return data.url;
  if (data?.token) return `${window.location.origin}/shared-document/${data.token}`;
  return "";
}

function getShareTokenFromResponse(data, shareUrl = "") {
  if (data?.token) return String(data.token);
  if (data?.shareToken) return String(data.shareToken);

  try {
    const url = new URL(shareUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] === "shared-document" ? parts[1] || "" : "";
  } catch (error) {
    return "";
  }
}

function getDurationLabel(days) {
  const value = Number(days);
  if (value === 1) return "1 journée";
  if (value === 3) return "3 jours";
  if (value === 7) return "7 jours";
  return `${value} jour(s)`;
}

function isImageDocument(doc) {
  const fileName = String(doc.fileName || "").toLowerCase();
  const fileType = String(doc.fileType || "").toLowerCase();

  return fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/.test(fileName);
}

function isPdfDocument(doc) {
  const fileName = String(doc.fileName || "").toLowerCase();
  const fileType = String(doc.fileType || "").toLowerCase();

  return fileType === "application/pdf" || fileName.endsWith(".pdf");
}

function readStoredFolders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function storeFolders(folders) {
  localStorage.setItem(CUSTOM_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

function getDocFolderId(doc) {
  return doc.folderId || doc.folder || "other";
}

function getFolderById(folders, folderId) {
  return folders.find((folder) => folder.id === folderId) || folders.find((folder) => folder.id === "other");
}

function DocumentRow({ doc, folder, onView, onMenu }) {
  const FolderIcon = folder?.icon || Folder;

  return (
    <div className="relative rounded-2xl bg-white ring-1 ring-[#EFE4D6] transition hover:bg-[#FFFDF8]">
      <button type="button" onClick={() => onView(doc)} className="w-full p-4 pr-14 text-left">
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

          {folder && (
            <p className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${folder.bg} ${folder.text} ${folder.ring}`}>
              <FolderIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </p>
          )}

          {doc.fileName && (
            <p className="mt-2 inline-flex max-w-full rounded-full bg-[#F4F8FD] px-3 py-1 text-xs font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
              <span className="truncate">{doc.fileName}</span>
            </p>
          )}

          {doc.fileSize && (
            <p className="mt-2 text-xs font-semibold text-[#8A8175]">{formatFileSize(doc.fileSize)}</p>
          )}

          {doc.note && <p className="mt-2 text-xs leading-5 text-[#746F64]">{doc.note}</p>}
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

function FolderCard({ folder, count, active, onClick }) {
  const Icon = folder.icon || Folder;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${folder.bg} ${folder.ring} ${active ? "shadow-md outline outline-2 outline-[#A8B193]/35" : "shadow-sm"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white ${folder.text} ring-1 ${folder.ring}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-white">
          {count}
        </span>
      </div>
      <p className="mt-3 font-black text-[#55534C]">{folder.name}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#746F64]">{folder.description}</p>
    </button>
  );
}

function DocumentViewer({ doc, close, onDownload }) {
  const fileName = doc.fileName || "Document";
  const isImage = isImageDocument(doc);
  const isPdf = isPdfDocument(doc);
  const pdfUrl = doc.fileUrl ? `${doc.fileUrl}#toolbar=0&navpanes=0` : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white md:h-[96vh] md:w-[96vw] md:rounded-[2rem] md:shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#EFE4D6] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#A8B193]">Aperçu document</p>
            <h3 className="mt-1 truncate text-xl font-bold text-[#55534C]">{getDocumentTitle(doc)}</h3>
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

            <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F3EA] text-lg font-bold text-[#746F64]">
              ×
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 bg-slate-950 p-2 md:p-4">
          {doc.fileUrl && isImage && (
            <div className="flex h-full w-full items-center justify-center">
              <img src={doc.fileUrl} alt={getDocumentTitle(doc)} className="max-h-full max-w-full rounded-2xl object-contain" />
            </div>
          )}

          {doc.fileUrl && isPdf && <iframe src={pdfUrl} title={getDocumentTitle(doc)} className="h-full w-full rounded-2xl bg-white" />}

          {doc.fileUrl && !isImage && !isPdf && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center">
              <div>
                <FileText className="mx-auto h-12 w-12 text-[#A8B193]" />
                <p className="mt-3 text-lg font-bold text-[#55534C]">Aperçu non disponible</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#746F64]">
                  Ce type de fichier est conservé dans Camelio, mais l’aperçu intégré est limité aux PDF et aux images.
                </p>
                <button type="button" onClick={() => onDownload(doc)} className="mt-5 rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white">
                  Ouvrir le document
                </button>
              </div>
            </div>
          )}

          {!doc.fileUrl && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center">
              <div>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#A8B193]" />
                <p className="mt-3 text-lg font-bold text-[#55534C]">Chargement du document</p>
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

export default function Documents({ children = [], docs: externalDocs, setDocs: externalSetDocs }) {
  const [internalDocs, setInternalDocs] = useState([]);
  const docs = Array.isArray(externalDocs) ? externalDocs : internalDocs;
  const setDocs = typeof externalSetDocs === "function" ? externalSetDocs : setInternalDocs;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customFolders, setCustomFolders] = useState(() => readStoredFolders());
  const allFolders = useMemo(() => [...DEFAULT_DOCUMENT_FOLDERS, ...customFolders], [customFolders]);
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: "", description: "" });

  const [showDocPopup, setShowDocPopup] = useState(false);
  const [selectedChildDocs, setSelectedChildDocs] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [docMenu, setDocMenu] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);
  const [shareForm, setShareForm] = useState({ code: generateAccessCode(), durationDays: 1, accessMode: "view_only" });
  const [shareResult, setShareResult] = useState(null);
  const [shareError, setShareError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [disablingShare, setDisablingShare] = useState(false);
  const [disablingAllShares, setDisablingAllShares] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const firstChildId = children.length ? getChildId(children[0]) : "";

  const [form, setForm] = useState({
    title: "",
    childId: firstChildId,
    type: "Document",
    folderId: "other",
    note: "",
    fileName: "",
    fileSize: null,
    fileType: "",
  });

  useEffect(() => {
    if (!form.childId && firstChildId) {
      setForm((current) => ({ ...current, childId: firstChildId }));
    }
  }, [firstChildId, form.childId]);

  const selectedChild = useMemo(() => children.find((child) => getChildId(child) === form.childId) || null, [children, form.childId]);

  const folderCounts = useMemo(() => {
    const counts = new Map();
    docs.forEach((doc) => {
      const id = getDocFolderId(doc);
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const query = normalizeText(searchQuery);

    return docs.filter((doc) => {
      const folder = getFolderById(allFolders, getDocFolderId(doc));
      const matchesFolder = selectedFolderId === "all" || getDocFolderId(doc) === selectedFolderId;

      if (!matchesFolder) return false;
      if (!query) return true;

      const searchable = normalizeText([
        getDocumentTitle(doc),
        getDocumentCategory(doc),
        doc.childName,
        doc.fileName,
        doc.note,
        folder?.name,
        folder?.description,
      ].join(" "));

      return searchable.includes(query);
    });
  }, [allFolders, docs, searchQuery, selectedFolderId]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/documents`, { method: "GET", credentials: "include" });
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
      return docs.filter((doc) => doc.childId === id || (!doc.childId && doc.childName === name));
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
      fileType: getFileType(file),
      title: current.title || file.name,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      childId: firstChildId,
      type: "Document",
      folderId: selectedFolderId !== "all" ? selectedFolderId : "other",
      note: "",
      fileName: "",
      fileSize: null,
      fileType: "",
    });
    setSelectedFile(null);
  };

  const createCustomFolder = () => {
    const name = folderForm.name.trim();
    const description = folderForm.description.trim();

    if (!name) {
      setError("Inscris un nom de dossier.");
      return;
    }

    const id = `custom-${Date.now().toString(36)}`;
    const newFolder = {
      id,
      name,
      description: description || "Dossier personnalisé.",
      icon: Folder,
      color: "#A8B193",
      bg: "bg-[#EEF6EA]",
      ring: "ring-[#D9E8CE]",
      text: "text-[#6C8A58]",
      isCustom: true,
    };

    const nextFolders = [...customFolders, newFolder];
    setCustomFolders(nextFolders);
    storeFolders(nextFolders);
    setSelectedFolderId(id);
    setForm((current) => ({ ...current, folderId: id }));
    setFolderForm({ name: "", description: "" });
    setShowFolderPopup(false);
    setSuccess("Dossier personnalisé créé.");
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

    const selectedFolder = getFolderById(allFolders, form.folderId);
    setSaving(true);

    try {
      const presignResponse = await fetch(`${API_BASE}/api/documents/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: getFileType(selectedFile),
          fileSize: selectedFile.size,
          childId: getChildId(child),
          childName: getChildName(child),
          category: form.type,
          folderId: selectedFolder?.id || "other",
          folderName: selectedFolder?.name || "Autres documents",
          title: form.title.trim() || selectedFile.name,
          note: form.note.trim(),
        }),
      });

      const presignData = await presignResponse.json();

      if (!presignResponse.ok) {
        throw new Error(presignData.message || "Impossible de préparer l’envoi du document.");
      }

      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": getFileType(selectedFile) },
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
    setSelectedDocument({ ...doc, fileUrl: "" });

    try {
      const response = await fetch(`${API_BASE}/api/documents/${doc.id}/download`, { method: "GET", credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible d’ouvrir le document.");
      }

      setSelectedDocument({ ...doc, fileUrl: data.downloadUrl });
    } catch (err) {
      setSelectedDocument(null);
      setError(err.message || "Impossible d’ouvrir le document.");
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const response = await fetch(`${API_BASE}/api/documents/${doc.id}/download`, { method: "GET", credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de télécharger.");
      }

      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Impossible de télécharger le document.");
    }
  };

  const openSharePopup = (doc) => {
    setError("");
    setSuccess("");
    setDocMenu(null);
    setShareDoc(doc);
    setShareResult(null);
    setShareError("");
    setShareForm({ code: generateAccessCode(), durationDays: 1, accessMode: "view_only" });
  };

  const generateShareLink = async () => {
    if (!shareDoc) return;

    const cleanCode = String(shareForm.code || "").trim().toUpperCase();

    if (!/^[A-Z0-9]{4}$/.test(cleanCode)) {
      setShareError("Le code doit contenir exactement 4 caractères, lettres ou chiffres.");
      return;
    }

    const durationDays = Number(shareForm.durationDays);

    if (![1, 3, 7].includes(durationDays)) {
      setShareError("Choisis une durée valide : 1 journée, 3 jours ou 7 jours.");
      return;
    }

    setSharing(true);
    setError("");
    setShareError("");
    setShareResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/documents/${shareDoc.id}/share-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: cleanCode, durationDays, accessMode: "view_only", allowDownload: false }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de générer le lien sécurisé.");
      }

      const shareUrl = getShareUrlFromResponse(data);
      const token = getShareTokenFromResponse(data, shareUrl);

      setShareResult({
        shareUrl,
        token,
        code: cleanCode,
        durationDays,
        expiresAt: data?.expiresAt || "",
        accessMode: data?.accessMode || "view_only",
        disabled: false,
      });

      setSuccess("Lien sécurisé créé en mode visionnement seulement.");
    } catch (err) {
      setShareError(err.message || "Impossible de générer le lien sécurisé.");
    } finally {
      setSharing(false);
    }
  };

  const disableShareLink = async () => {
    if (!shareResult?.token) {
      setShareError("Impossible de désactiver ce lien, le serveur n’a pas retourné de token.");
      return;
    }

    setDisablingShare(true);
    setShareError("");

    try {
      const response = await fetch(`${API_BASE}/api/shared-documents/${shareResult.token}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de désactiver le lien.");
      }

      setShareResult((current) => ({ ...current, disabled: true }));
      setSuccess("Lien sécurisé désactivé.");
    } catch (err) {
      setShareError(err.message || "Impossible de désactiver le lien sécurisé.");
    } finally {
      setDisablingShare(false);
    }
  };

  const disableAllDocumentShareLinks = async (doc) => {
    if (!doc?.id) {
      setError("Impossible de désactiver les liens sécurisés, document introuvable.");
      return;
    }

    const confirmed = window.confirm("Désactiver tous les liens sécurisés associés à ce document? Les personnes qui ont déjà reçu un lien ne pourront plus l’utiliser.");
    if (!confirmed) return;

    setDisablingAllShares(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/api/documents/${doc.id}/share-links`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de désactiver les liens sécurisés.");
      }

      setDocMenu(null);
      setSuccess(data?.message || "Tous les liens sécurisés de ce document ont été désactivés.");
    } catch (err) {
      setError(err.message || "Impossible de désactiver les liens sécurisés de ce document.");
    } finally {
      setDisablingAllShares(false);
    }
  };

  const copyToClipboard = async (value, label = "Information") => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setSuccess(`${label} copié.`);
      if (shareDoc) setShareError("");
    } catch (err) {
      const message = "Impossible de copier automatiquement. Sélectionne le texte manuellement.";
      if (shareDoc) setShareError(message);
      else setError(message);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!deleteDoc) return;

    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/documents/${deleteDoc.id}`, { method: "DELETE", credentials: "include" });
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

  const selectedFolder = selectedFolderId === "all" ? null : getFolderById(allFolders, selectedFolderId);

  return (
    <div className="space-y-6">
      <SectionTitle title="Documents" subtitle="Classer, retrouver et partager les documents importants de chaque enfant." icon={FileText} />

      {error && <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">{error}</div>}
      {success && <div className="rounded-2xl bg-[#EEF6EA] p-4 text-sm font-bold text-[#6C8A58] ring-1 ring-[#D9E8CE]">{success}</div>}

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Documents familiaux</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Recherchez rapidement une carte d’assurance maladie, un carnet de vaccination, un certificat ou une note.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFolderPopup(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              <FolderPlus className="h-4 w-4" />
              Créer un dossier
            </button>
            <button
              type="button"
              onClick={() => setShowDocPopup(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EEC988] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            >
              <Upload className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A8B193]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un document, un enfant, un dossier ou une note..."
            className="w-full rounded-2xl border border-[#DED6C9] bg-[#F7F3EA] py-4 pl-12 pr-4 text-sm font-semibold text-[#55534C] outline-none transition placeholder:text-[#A9A094] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/25"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolderId("all")}
            className={`rounded-full px-4 py-2 text-xs font-bold ring-1 ${selectedFolderId === "all" ? "bg-[#A8B193] text-white ring-[#A8B193]" : "bg-[#FFFDF8] text-[#746F64] ring-[#EFE4D6]"}`}
          >
            Tous les dossiers · {docs.length}
          </button>
          {children.map((child) => (
            <button
              key={getChildId(child)}
              type="button"
              onClick={() => setSearchQuery(getChildName(child))}
              className="rounded-full bg-[#FFFDF8] px-4 py-2 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
            >
              {getChildName(child)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Dossiers importants</h3>
            <p className="mt-1 text-sm text-[#746F64]">Les dossiers essentiels sont créés par défaut.</p>
          </div>
          <button
            type="button"
            onClick={loadDocuments}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]"
            title="Rafraîchir"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2 xl:!grid-cols-3">
          {allFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              count={folderCounts.get(folder.id) || 0}
              active={selectedFolderId === folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
            />
          ))}

          <button
            type="button"
            onClick={() => setShowFolderPopup(true)}
            className="rounded-3xl border-2 border-dashed border-[#DED6C9] bg-[#FFFDF8] p-4 text-left transition hover:bg-white"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#A8B193] ring-1 ring-[#EFE4D6]">
              <Plus className="h-6 w-6" />
            </div>
            <p className="mt-3 font-black text-[#55534C]">Créer un dossier</p>
            <p className="mt-1 text-xs leading-5 text-[#746F64]">Ajoutez un dossier personnalisé, par exemple garderie, sport ou voyage.</p>
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Documents par enfant</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">Chaque document doit être associé à un enfant.</p>
          </div>
        </div>

        {!children.length && (
          <div className="mt-5 rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
            Aucun enfant n’est disponible. Ajoute un enfant dans la section Profil enfant avant d’ajouter des documents.
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
                    <img src={photo} alt={getChildName(child)} className="h-16 w-16 rounded-3xl object-cover shadow-sm ring-4 ring-white" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-xl font-extrabold text-[#A8B193] shadow-sm ring-4 ring-white">
                      {getChildName(child).slice(0, 1)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold text-[#55534C]">{getChildName(child)}</p>
                    <p className="mt-1 text-sm font-semibold text-[#746F64]">Fiche documents</p>
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
            <h3 className="text-lg font-bold text-[#55534C]">{selectedFolder ? selectedFolder.name : "Tous les documents"}</h3>
            <p className="mt-1 text-sm text-[#746F64]">
              {searchQuery ? `Résultats pour “${searchQuery}”.` : "Liste complète des documents enregistrés."}
            </p>
          </div>

          <span className="rounded-full bg-[#F4F8FD] px-3 py-1 text-xs font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
            {filteredDocs.length}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {filteredDocs.length ? (
            filteredDocs.map((doc) => (
              <DocumentRow key={doc.id || doc.s3Key} doc={doc} folder={getFolderById(allFolders, getDocFolderId(doc))} onView={openDocument} onMenu={setDocMenu} />
            ))
          ) : (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucun document trouvé.
            </div>
          )}
        </div>
      </div>

      {selectedDocument && <DocumentViewer doc={selectedDocument} close={() => setSelectedDocument(null)} onDownload={downloadDocument} />}

      {docMenu && (
        <Popup title={getDocumentTitle(docMenu)} kicker="Options du document" close={() => setDocMenu(null)}>
          <div className="grid !grid-cols-1 gap-3">
            <button type="button" onClick={() => { openDocument(docMenu); setDocMenu(null); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
              <Eye className="h-4 w-4" />
              Ouvrir
            </button>

            <button type="button" onClick={() => openSharePopup(docMenu)} className="flex items-center justify-center gap-2 rounded-2xl bg-[#F4F8FD] px-4 py-3 text-sm font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
              <Link className="h-4 w-4" />
              Partager par lien sécurisé
            </button>

            <button type="button" onClick={() => disableAllDocumentShareLinks(docMenu)} disabled={disablingAllShares} className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8ED] px-4 py-3 text-sm font-bold text-[#9A7652] ring-1 ring-[#F0D8B8] disabled:cursor-not-allowed disabled:opacity-60">
              {disablingAllShares ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkOff className="h-4 w-4" />}
              {disablingAllShares ? "Désactivation..." : "Désactiver tous les liens sécurisés"}
            </button>

            <button type="button" onClick={() => { setDeleteDoc(docMenu); setDocMenu(null); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </Popup>
      )}

      {shareDoc && (
        <Popup title="Partager ce document" kicker="Lien sécurisé" close={() => { setShareDoc(null); setShareResult(null); setShareError(""); setError(""); }}>
          <div className="space-y-5">
            <div className="rounded-3xl bg-[#F4F8FD] p-4 ring-1 ring-[#D3DFF1]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6A85AF] ring-1 ring-[#D3DFF1]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#55534C]">{getDocumentTitle(shareDoc)}</p>
                  <p className="mt-1 text-sm leading-6 text-[#746F64]">
                    Le lien sera protégé par un code de 4 caractères. Le destinataire pourra seulement visionner le document dans Camelio.
                  </p>
                </div>
              </div>
            </div>

            {shareError && <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">{shareError}</div>}

            {!shareResult && (
              <>
                <FormField label="Mode de partage">
                  <div className="rounded-3xl bg-[#EEF6EA] p-4 ring-1 ring-[#D9E8CE]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6C8A58] ring-1 ring-[#D9E8CE]">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#55534C]">Visionnement seulement</p>
                        <p className="mt-1 text-sm leading-6 text-[#746F64]">
                          Le téléchargement est retiré de l’interface partagée. La personne peut consulter le document, mais aucun bouton de téléchargement n’est affiché.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormField>

                <FormField label="Code d’accès, 4 caractères">
                  <div className="flex gap-2">
                    <input className={inputClass("uppercase tracking-[0.35em]")} value={shareForm.code} maxLength={4} onChange={(event) => setShareForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) }))} placeholder="A7K2" />
                    <button type="button" onClick={() => setShareForm((current) => ({ ...current, code: generateAccessCode() }))} className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                      Générer
                    </button>
                  </div>
                </FormField>

                <FormField label="Délai avant désactivation">
                  <div className="grid !grid-cols-3 gap-2">
                    {[1, 3, 7].map((days) => (
                      <button key={days} type="button" onClick={() => setShareForm((current) => ({ ...current, durationDays: days }))} className={`rounded-2xl px-3 py-3 text-sm font-bold ring-1 transition ${Number(shareForm.durationDays) === days ? "bg-[#A8B193] text-white ring-[#A8B193]" : "bg-white text-[#746F64] ring-[#DED6C9]"}`}>
                        {days === 1 ? "1 journée" : `${days} jours`}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid !grid-cols-2 gap-3 pt-1">
                  <button type="button" onClick={() => { setShareDoc(null); setShareResult(null); setError(""); }} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                    Annuler
                  </button>
                  <button type="button" onClick={generateShareLink} disabled={sharing || String(shareForm.code || "").length !== 4} className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                    {sharing ? "Création..." : "Générer le lien"}
                  </button>
                </div>
              </>
            )}

            {shareResult && (
              <div className="space-y-4">
                <div className={`rounded-3xl p-4 ring-1 ${shareResult.disabled ? "bg-[#F8F3EA] ring-[#EFE4D6]" : "bg-[#EEF6EA] ring-[#D9E8CE]"}`}>
                  <p className={`text-sm font-bold ${shareResult.disabled ? "text-[#746F64]" : "text-[#6C8A58]"}`}>
                    {shareResult.disabled ? "Lien sécurisé désactivé." : "Lien sécurisé créé avec succès."}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#746F64]">
                    {shareResult.disabled ? "Ce lien ne devrait plus permettre l’accès au document." : `Ce lien sera actif pendant ${getDurationLabel(shareResult.durationDays)}. Il est en mode visionnement seulement.`}
                  </p>
                </div>

                {!shareResult.disabled && (
                  <div className="rounded-3xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">Message à partager</p>
                    <div className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-[#55534C] ring-1 ring-[#EFE4D6]">
                      <p>Voici le lien sécurisé pour visionner le document :</p>
                      <p className="mt-2 break-all font-bold">{shareResult.shareUrl || "Lien non retourné par le serveur"}</p>
                      <p className="mt-2">Code d’accès : <strong>{shareResult.code}</strong></p>
                      <p className="mt-2">
                        Le lien sera actif pendant {getDurationLabel(shareResult.durationDays)}{shareResult.expiresAt ? `, jusqu’au ${new Date(shareResult.expiresAt).toLocaleString("fr-CA")}` : ""}.
                      </p>
                      <p className="mt-2 font-bold text-[#6C8A58]">Accès : visionnement seulement, téléchargement retiré de l’interface.</p>
                    </div>
                    <button type="button" onClick={() => copyToClipboard(`Voici le lien sécurisé pour visionner le document :\n${shareResult.shareUrl || ""}\n\nCode d’accès : ${shareResult.code}\n\nLe lien sera actif pendant ${getDurationLabel(shareResult.durationDays)}${shareResult.expiresAt ? `, jusqu’au ${new Date(shareResult.expiresAt).toLocaleString("fr-CA")}` : ""}.\n\nAccès : visionnement seulement, téléchargement retiré de l’interface.`, "Message")} disabled={!shareResult.shareUrl} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                      <Copy className="h-4 w-4" />
                      Copier le message complet
                    </button>
                  </div>
                )}

                <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2">
                  <div className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">Lien URL</p>
                    <p className="mt-2 break-all text-sm font-semibold text-[#55534C]">{shareResult.shareUrl || "Lien non retourné par le serveur"}</p>
                    <button type="button" onClick={() => copyToClipboard(shareResult.shareUrl, "Lien")} disabled={!shareResult.shareUrl || shareResult.disabled} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9] disabled:opacity-50">
                      <Copy className="h-4 w-4" />
                      Copier le lien
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">Code d’accès</p>
                    <p className="mt-2 text-2xl font-black tracking-[0.35em] text-[#55534C]">{shareResult.code}</p>
                    <button type="button" onClick={() => copyToClipboard(shareResult.code, "Code")} disabled={shareResult.disabled} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9] disabled:opacity-50">
                      <Copy className="h-4 w-4" />
                      Copier le code
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8F3EA] p-3 ring-1 ring-[#EFE4D6]">
                  <p className="text-xs leading-5 text-[#746F64]">
                    Note : le mode visionnement seulement retire le téléchargement dans l’interface partagée, mais une personne peut toujours faire une capture d’écran.
                  </p>
                </div>

                {!shareResult.disabled && (
                  <button type="button" onClick={disableShareLink} disabled={disablingShare} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">
                    {disablingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkOff className="h-4 w-4" />}
                    {disablingShare ? "Désactivation..." : "Désactiver ce lien"}
                  </button>
                )}
              </div>
            )}
          </div>
        </Popup>
      )}

      {showFolderPopup && (
        <Popup title="Créer un dossier" kicker="Dossier personnalisé" close={() => setShowFolderPopup(false)}>
          <div className="space-y-4">
            <FormField label="Nom du dossier">
              <input className={inputClass()} value={folderForm.name} onChange={(event) => setFolderForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex. Garderie, soccer, orthophonie" />
            </FormField>
            <FormField label="Description facultative">
              <textarea className={inputClass("min-h-[100px] resize-none")} value={folderForm.description} onChange={(event) => setFolderForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ajoutez une courte description pour retrouver ce dossier plus facilement." />
            </FormField>
            <div className="grid !grid-cols-2 gap-3">
              <button type="button" onClick={() => setShowFolderPopup(false)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                Annuler
              </button>
              <button type="button" onClick={createCustomFolder} className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white">
                Créer
              </button>
            </div>
          </div>
        </Popup>
      )}

      {showDocPopup && (
        <Popup title="Ajouter un document" kicker="Documents" close={() => { resetForm(); setShowDocPopup(false); }}>
          <div className="space-y-4">
            <FormField label="Enfant associé">
              <select className={inputClass()} value={form.childId} onChange={(event) => setForm((current) => ({ ...current, childId: event.target.value }))}>
                {!children.length && <option value="">Aucun enfant disponible</option>}
                {children.map((child) => (
                  <option key={getChildId(child)} value={getChildId(child)}>{getChildName(child)}</option>
                ))}
              </select>
            </FormField>

            {selectedChild && (
              <div className="rounded-3xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="text-sm font-bold text-[#55534C]">Document pour {getChildName(selectedChild)}</p>
              </div>
            )}

            <FormField label="Dossier">
              <select className={inputClass()} value={form.folderId} onChange={(event) => setForm((current) => ({ ...current, folderId: event.target.value }))}>
                {allFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Type de document">
              <select className={inputClass()} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </FormField>

            <FormField label="Nom du document">
              <input className={inputClass()} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex. Carte d’assurance maladie" />
            </FormField>

            <FormField label="Fichier">
              <input type="file" accept={allowedAccept} onChange={(event) => handleFileSelection(event.target.files?.[0])} className="block w-full rounded-2xl border border-dashed border-[#DED6C9] bg-[#FFFDF8] px-4 py-4 text-sm font-semibold text-[#746F64]" />
            </FormField>

            {selectedFile && (
              <div className="rounded-2xl bg-[#F4F8FD] p-3 text-sm font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
                {selectedFile.name} · {formatFileSize(selectedFile.size)}
              </div>
            )}

            <FormField label="Note facultative">
              <textarea className={inputClass("min-h-[110px] resize-none")} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ajoutez une note pour retrouver le document plus facilement." />
            </FormField>

            <div className="grid !grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => { resetForm(); setShowDocPopup(false); }} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                Annuler
              </button>
              <button type="button" onClick={addDoc} disabled={saving} className="rounded-2xl bg-[#EEC988] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                {saving ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        </Popup>
      )}

      {selectedChildDocs && (
        <Popup title={`Documents de ${getChildName(selectedChildDocs)}`} kicker="Documents par enfant" close={() => setSelectedChildDocs(null)}>
          <div className="space-y-3">
            {childDocs(selectedChildDocs).length ? (
              childDocs(selectedChildDocs).map((doc) => <DocumentRow key={doc.id || doc.s3Key} doc={doc} folder={getFolderById(allFolders, getDocFolderId(doc))} onView={openDocument} onMenu={setDocMenu} />)
            ) : (
              <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun document pour cet enfant.</div>
            )}
          </div>
        </Popup>
      )}

      {deleteDoc && (
        <Popup title="Supprimer ce document?" kicker="Confirmation" close={() => setDeleteDoc(null)}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#746F64]">Cette action supprimera le document de Camelio. Elle ne peut pas être annulée.</p>
            <div className="grid !grid-cols-2 gap-3">
              <button type="button" onClick={() => setDeleteDoc(null)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">
                Annuler
              </button>
              <button type="button" onClick={confirmDeleteDoc} disabled={saving} className="rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">
                {saving ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </Popup>
      )}
    </div>
  );
}
