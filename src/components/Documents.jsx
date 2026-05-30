import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  Folder,
  HeartPulse,
  Image as ImageIcon,
  Link,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  School,
  Search,
  Share2,
  ShieldCheck,
  Syringe,
  Trash2,
  Unlink,
  Upload,
} from "lucide-react";

import { Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.camelio.app";
const CUSTOM_FOLDERS_STORAGE_KEY = "camelio_document_custom_folders_v2";
const FOLDER_OVERRIDES_STORAGE_KEY = "camelio_document_folder_overrides_v1";
const GENERAL_CHILD_ID = "general";
const GENERAL_CHILD_NAME = "Général";

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

const allowedAccept =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const FOLDER_STYLES = [
  { bg: "bg-[#F4F8FD]", ring: "ring-[#D3DFF1]", text: "text-[#6A85AF]", color: "#A2BADF" },
  { bg: "bg-[#EEF6EA]", ring: "ring-[#D9E8CE]", text: "text-[#6C8A58]", color: "#A8B193" },
  { bg: "bg-[#FFFAEF]", ring: "ring-[#F1DDAE]", text: "text-[#B68E3D]", color: "#EEC988" },
  { bg: "bg-[#F7F3FB]", ring: "ring-[#DED2EC]", text: "text-[#806C98]", color: "#B5A7C8" },
  { bg: "bg-[#FFF1F3]", ring: "ring-[#F3CDD3]", text: "text-[#B96B77]", color: "#EAA5AF" },
];

function getFileType(file) {
  const fileName = String(file?.name || "").toLowerCase();
  const fileType = String(file?.type || "").trim();
  if (fileType) return fileType;
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".doc")) return "application/msword";
  if (fileName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
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

function normalizeFileName(value) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
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

function readStorageArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function readStorageObject(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function storeValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDocFolderId(doc) {
  return doc.folderId || doc.folder || "other";
}

function getFolderById(folders, folderId) {
  return folders.find((folder) => folder.id === folderId) || folders.find((folder) => folder.id === "other");
}

function getDocumentChildName(doc) {
  return doc.childId === GENERAL_CHILD_ID ? GENERAL_CHILD_NAME : doc.childName || "Enfant";
}

function documentMatchesChild(doc, childFilter) {
  if (!childFilter || childFilter === "all") return true;
  if (childFilter === GENERAL_CHILD_ID) return doc.childId === GENERAL_CHILD_ID;
  return doc.childId === childFilter || doc.childId === GENERAL_CHILD_ID;
}

function documentMatchesSearch(doc, folder, normalizedQuery) {
  if (!normalizedQuery) return true;
  const searchable = normalizeText([
    getDocumentTitle(doc),
    getDocumentCategory(doc),
    getDocumentChildName(doc),
    doc.fileName,
    doc.note,
    folder?.name,
    folder?.description,
  ].join(" "));
  return searchable.includes(normalizedQuery);
}

function folderMatchesSearch(folder, matchingDocs, normalizedQuery) {
  if (!normalizedQuery) return true;
  const folderText = normalizeText([folder?.name, folder?.description].join(" "));
  if (folderText.includes(normalizedQuery)) return true;
  return matchingDocs.some((doc) => getDocFolderId(doc) === folder.id);
}

function applyFolderOverrides(folder, overrides) {
  const override = overrides?.[folder.id] || {};
  return { ...folder, ...override, icon: folder.icon || Folder };
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
            {getDocumentChildName(doc)} · {doc.childId === GENERAL_CHILD_ID ? "Visible pour tous les enfants" : getDocumentCategory(doc)}
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
          {doc.fileSize && <p className="mt-2 text-xs font-semibold text-[#8A8175]">{formatFileSize(doc.fileSize)}</p>}
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

function FolderCard({ folder, count, onOpen, onOptions }) {
  const Icon = folder.icon || Folder;
  return (
    <div className={`relative rounded-3xl p-4 ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${folder.bg} ${folder.ring} shadow-sm`}>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3 pr-10">
          {folder.photo ? (
            <img src={folder.photo} alt={folder.name} className="h-14 w-14 rounded-2xl object-cover bg-white ring-1 ring-white" />
          ) : (
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white ${folder.text} ring-1 ${folder.ring}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-white">
            {count}
          </span>
        </div>
        <p className="mt-4 font-black text-[#55534C]">{folder.name}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#746F64]">{folder.description}</p>
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#746F64]">
          Ouvrir le dossier <ChevronRight className="h-3.5 w-3.5" />
        </p>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOptions(folder);
        }}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[#746F64] ring-1 ring-white"
        aria-label="Options du dossier"
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
              <button type="button" onClick={() => onDownload(doc)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]" title="Ouvrir ou télécharger">
                <Download className="h-5 w-5" />
              </button>
            )}
            <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F3EA] text-lg font-bold text-[#746F64]">×</button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 bg-slate-950 p-2 md:p-4">
          {doc.fileUrl && isImage && <div className="flex h-full w-full items-center justify-center"><img src={doc.fileUrl} alt={getDocumentTitle(doc)} className="max-h-full max-w-full rounded-2xl object-contain" /></div>}
          {doc.fileUrl && isPdf && <iframe src={pdfUrl} title={getDocumentTitle(doc)} className="h-full w-full rounded-2xl bg-white" />}
          {doc.fileUrl && !isImage && !isPdf && (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center">
              <div>
                <FileText className="mx-auto h-12 w-12 text-[#A8B193]" />
                <p className="mt-3 text-lg font-bold text-[#55534C]">Aperçu non disponible</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#746F64]">Ce type de fichier est conservé dans Camelio, mais l’aperçu intégré est limité aux PDF et aux images.</p>
                <button type="button" onClick={() => onDownload(doc)} className="mt-5 rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white">Ouvrir le document</button>
              </div>
            </div>
          )}
          {!doc.fileUrl && <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white p-5 text-center"><div><Loader2 className="mx-auto h-12 w-12 animate-spin text-[#A8B193]" /><p className="mt-3 text-lg font-bold text-[#55534C]">Chargement du document</p></div></div>}
        </div>
        <div className="border-t border-[#EFE4D6] bg-white px-5 py-3"><p className="truncate text-xs font-bold text-[#746F64]">{getDocumentChildName(doc)} · {getDocumentCategory(doc)}</p></div>
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
  const [customFolders, setCustomFolders] = useState(() => readStorageArray(CUSTOM_FOLDERS_STORAGE_KEY));
  const [folderOverrides, setFolderOverrides] = useState(() => readStorageObject(FOLDER_OVERRIDES_STORAGE_KEY));
  const allFolders = useMemo(() => {
    const customWithIcon = customFolders.map((folder, index) => ({
      ...FOLDER_STYLES[index % FOLDER_STYLES.length],
      ...folder,
      icon: Folder,
      isCustom: true,
    }));
    return [...DEFAULT_DOCUMENT_FOLDERS, ...customWithIcon].map((folder) => applyFolderOverrides(folder, folderOverrides));
  }, [customFolders, folderOverrides]);

  const [searchQuery, setSearchQuery] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [showFolderPopup, setShowFolderPopup] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: "", description: "", photo: "", styleIndex: 1 });
  const [folderMenu, setFolderMenu] = useState(null);
  const [folderDetails, setFolderDetails] = useState(null);
  const [showAllDocsPopup, setShowAllDocsPopup] = useState(false);

  const [showDocPopup, setShowDocPopup] = useState(false);
  const [selectedChildDocs, setSelectedChildDocs] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [docMenu, setDocMenu] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [editDocForm, setEditDocForm] = useState({ title: "", note: "", folderId: "other", childId: GENERAL_CHILD_ID });
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareForm, setShareForm] = useState({ code: generateAccessCode(), requiresCode: true, durationDays: 1 });
  const [shareResult, setShareResult] = useState(null);
  const [shareError, setShareError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [disablingShare, setDisablingShare] = useState(false);
  const [disablingAllShares, setDisablingAllShares] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [secureLinks, setSecureLinks] = useState([]);
  const [loadingSecureLinks, setLoadingSecureLinks] = useState(false);
  const [disablingTrackedLink, setDisablingTrackedLink] = useState("");

  const firstChildId = children.length ? getChildId(children[0]) : "";
  const [form, setForm] = useState({
    title: "",
    childId: firstChildId || GENERAL_CHILD_ID,
    folderId: "other",
    note: "",
    fileName: "",
    fileSize: null,
    fileType: "",
  });

  useEffect(() => {
    if (!form.childId && (firstChildId || GENERAL_CHILD_ID)) {
      setForm((current) => ({ ...current, childId: firstChildId || GENERAL_CHILD_ID }));
    }
  }, [firstChildId, form.childId]);

  const selectedChild = useMemo(() => children.find((child) => getChildId(child) === form.childId) || null, [children, form.childId]);
  const normalizedSearchQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);

  const docsMatchingChild = useMemo(() => docs.filter((doc) => documentMatchesChild(doc, childFilter)), [docs, childFilter]);

  const matchingDocsForSearch = useMemo(() => {
    if (!normalizedSearchQuery) return docsMatchingChild;
    return docsMatchingChild.filter((doc) => {
      const folder = getFolderById(allFolders, getDocFolderId(doc));
      return documentMatchesSearch(doc, folder, normalizedSearchQuery);
    });
  }, [allFolders, docsMatchingChild, normalizedSearchQuery]);

  const visibleFolders = useMemo(() => {
    return allFolders.filter((folder) => folderMatchesSearch(folder, matchingDocsForSearch, normalizedSearchQuery));
  }, [allFolders, matchingDocsForSearch, normalizedSearchQuery]);

  const folderCounts = useMemo(() => {
    const counts = new Map();
    matchingDocsForSearch.forEach((doc) => {
      const id = getDocFolderId(doc);
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [matchingDocsForSearch]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/documents`, { method: "GET", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Impossible de charger les documents.");
      setDocs(data.documents || []);
    } catch (err) {
      setError(err.message || "Impossible de charger les documents.");
    } finally {
      setLoading(false);
    }
  }, [setDocs]);

  const loadSecureLinks = useCallback(async () => {
    setLoadingSecureLinks(true);
    try {
      const response = await fetch(`${API_BASE}/api/shared-documents`, { method: "GET", credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Impossible de charger les liens sécurisés.");
      setSecureLinks(Array.isArray(data?.shares) ? data.shares : []);
    } catch (err) {
      // Le suivi des liens ne doit pas bloquer la section Documents.
      console.warn(err);
    } finally {
      setLoadingSecureLinks(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadSecureLinks();
  }, [loadDocuments, loadSecureLinks]);

  const childDocs = useCallback(
    (child) => {
      const id = getChildId(child);
      const name = getChildName(child);
      return docs.filter((doc) => doc.childId === id || doc.childId === GENERAL_CHILD_ID || (!doc.childId && doc.childName === name));
    },
    [docs]
  );

  const getDocsForFolder = useCallback(
    (folder, sourceDocs = docsMatchingChild) => sourceDocs.filter((doc) => getDocFolderId(doc) === folder.id),
    [docsMatchingChild]
  );

  const hasDuplicateFileName = useCallback(
    (fileName) => {
      const normalized = normalizeFileName(fileName);
      if (!normalized) return false;
      return docs.some((doc) => normalizeFileName(doc.fileName) === normalized);
    },
    [docs]
  );

  const handleFileSelection = (file) => {
    if (!file) return;
    if (hasDuplicateFileName(file.name)) {
      setSelectedFile(null);
      setForm((current) => ({ ...current, fileName: "", fileSize: null, fileType: "" }));
      setError("Un document avec ce même nom de fichier existe déjà. Renomme le fichier avant de l’ajouter.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setForm((current) => ({
      ...current,
      fileName: file.name,
      fileSize: file.size,
      fileType: getFileType(file),
      title: file.name,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      childId: firstChildId || GENERAL_CHILD_ID,
      folderId: folderDetails?.id || "other",
      note: "",
      fileName: "",
      fileSize: null,
      fileType: "",
    });
    setSelectedFile(null);
  };

  const saveFolders = (folders) => {
    setCustomFolders(folders);
    storeValue(CUSTOM_FOLDERS_STORAGE_KEY, folders);
  };

  const saveFolderOverrides = (overrides) => {
    setFolderOverrides(overrides);
    storeValue(FOLDER_OVERRIDES_STORAGE_KEY, overrides);
  };

  const createCustomFolder = () => {
    const name = folderForm.name.trim();
    const description = folderForm.description.trim();
    if (!name) {
      setError("Inscris un nom de dossier.");
      return;
    }
    const style = FOLDER_STYLES[Number(folderForm.styleIndex) % FOLDER_STYLES.length] || FOLDER_STYLES[1];
    const id = `custom-${Date.now().toString(36)}`;
    const newFolder = {
      id,
      name,
      description: description || "Dossier personnalisé.",
      photo: folderForm.photo || "",
      ...style,
      isCustom: true,
    };
    const nextFolders = [...customFolders, newFolder];
    saveFolders(nextFolders);
    setFolderForm({ name: "", description: "", photo: "", styleIndex: 1 });
    setShowFolderPopup(false);
    setFolderDetails(newFolder);
    setSuccess("Dossier personnalisé créé.");
  };

  const saveFolderInfo = () => {
    if (!folderMenu) return;
    const name = folderForm.name.trim();
    if (!name) {
      setError("Inscris un nom de dossier.");
      return;
    }
    const style = FOLDER_STYLES[Number(folderForm.styleIndex) % FOLDER_STYLES.length] || FOLDER_STYLES[1];
    const update = {
      name,
      description: folderForm.description.trim() || "Dossier personnalisé.",
      photo: folderForm.photo || "",
      ...style,
    };
    if (folderMenu.isCustom) {
      const nextFolders = customFolders.map((folder) => (folder.id === folderMenu.id ? { ...folder, ...update } : folder));
      saveFolders(nextFolders);
    } else {
      saveFolderOverrides({ ...folderOverrides, [folderMenu.id]: update });
    }
    setFolderMenu(null);
    setFolderForm({ name: "", description: "", photo: "", styleIndex: 1 });
    setSuccess("Informations du dossier mises à jour.");
  };

  const openFolderOptions = (folder) => {
    const styleIndex = Math.max(0, FOLDER_STYLES.findIndex((style) => style.bg === folder.bg));
    setFolderMenu(folder);
    setFolderForm({ name: folder.name || "", description: folder.description || "", photo: folder.photo || "", styleIndex: styleIndex >= 0 ? styleIndex : 1 });
  };

  const addDoc = async () => {
    setError("");
    setSuccess("");
    if (!children.length && form.childId !== GENERAL_CHILD_ID) {
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
    if (hasDuplicateFileName(selectedFile.name)) {
      setError("Un document avec ce même nom de fichier existe déjà. Renomme le fichier avant de l’ajouter.");
      return;
    }
    const isGeneral = form.childId === GENERAL_CHILD_ID;
    const child = isGeneral ? null : children.find((item) => getChildId(item) === form.childId);
    if (!isGeneral && !child) {
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
          childId: isGeneral ? GENERAL_CHILD_ID : getChildId(child),
          childName: isGeneral ? GENERAL_CHILD_NAME : getChildName(child),
          category: "Document",
          folderId: selectedFolder?.id || "other",
          folderName: selectedFolder?.name || "Autres documents",
          title: selectedFile.name,
          note: form.note.trim(),
        }),
      });
      const presignData = await presignResponse.json();
      if (!presignResponse.ok) throw new Error(presignData.message || "Impossible de préparer l’envoi du document.");
      const uploadResponse = await fetch(presignData.uploadUrl, { method: "PUT", headers: { "Content-Type": getFileType(selectedFile) }, body: selectedFile });
      if (!uploadResponse.ok) throw new Error("Impossible d’envoyer le fichier vers S3.");

      const verifyResponse = await fetch(`${API_BASE}/api/uploads/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          uploadKind: "document",
          documentId: presignData.document?.id,
          s3Key: presignData.document?.s3Key,
          fileType: getFileType(selectedFile),
          fileSize: selectedFile.size,
        }),
      });
      const verifyData = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok) throw new Error(verifyData.message || "Le document envoyé n’a pas pu être validé.");

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
      if (!response.ok) throw new Error(data.message || "Impossible d’ouvrir le document.");
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
      if (!response.ok) throw new Error(data.message || "Impossible de télécharger.");
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "Impossible de télécharger le document.");
    }
  };

  const openSharePopup = (target) => {
    setError("");
    setSuccess("");
    setDocMenu(null);
    setShareTarget(target);
    setShareResult(null);
    setShareError("");
    setShareForm({ code: generateAccessCode(), requiresCode: true, durationDays: 1 });
  };

  const openEditDocument = (doc) => {
    setDocMenu(null);
    setError("");
    setSuccess("");
    setEditDoc(doc);
    setEditDocForm({
      title: getDocumentTitle(doc),
      note: doc.note || "",
      folderId: getDocFolderId(doc),
      childId: doc.childId || GENERAL_CHILD_ID,
    });
  };

  const saveDocumentInfo = async () => {
    if (!editDoc?.id) return;
    const title = editDocForm.title.trim();
    if (!title) {
      setError("Inscris un nom de document.");
      return;
    }
    const isGeneral = editDocForm.childId === GENERAL_CHILD_ID;
    const child = isGeneral ? null : children.find((item) => getChildId(item) === editDocForm.childId);
    if (!isGeneral && !child) {
      setError("L’enfant sélectionné est introuvable.");
      return;
    }
    const selectedFolder = getFolderById(allFolders, editDocForm.folderId);
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE}/api/documents/${editDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          note: editDocForm.note.trim(),
          childId: isGeneral ? GENERAL_CHILD_ID : getChildId(child),
          childName: isGeneral ? GENERAL_CHILD_NAME : getChildName(child),
          folderId: selectedFolder?.id || "other",
          folderName: selectedFolder?.name || "Autres documents",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Impossible de modifier le document.");
      await loadDocuments();
      setEditDoc(null);
      setSuccess("Document modifié.");
    } catch (err) {
      setError(err.message || "Impossible de modifier le document.");
    } finally {
      setSaving(false);
    }
  };

  const generateShareLink = async () => {
    if (!shareTarget) return;
    const requiresCode = shareForm.requiresCode !== false;
    const cleanCode = requiresCode ? String(shareForm.code || "").trim().toUpperCase() : "";
    if (requiresCode && !/^[A-Z0-9]{4}$/.test(cleanCode)) {
      setShareError("Le code doit contenir exactement 4 caractères, lettres ou chiffres.");
      return;
    }
    const durationDays = Number(shareForm.durationDays);
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
      setShareError("Choisis une durée entre 1 et 365 jours.");
      return;
    }
    setSharing(true);
    setError("");
    setShareError("");
    setShareResult(null);
    try {
      const endpoint = shareTarget.kind === "folder"
        ? `${API_BASE}/api/document-folders/${shareTarget.id}/share-link`
        : `${API_BASE}/api/documents/${shareTarget.id}/share-link`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: cleanCode, requiresCode, durationDays, accessMode: "view_only", allowDownload: false, folderName: shareTarget.name }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Impossible de générer le lien sécurisé.");
      const shareUrl = getShareUrlFromResponse(data);
      const token = getShareTokenFromResponse(data, shareUrl);
      setShareResult({
        shareUrl,
        token,
        code: requiresCode ? cleanCode : "",
        requiresCode,
        durationDays,
        expiresAt: data?.expiresAt || "",
        accessMode: data?.accessMode || "view_only",
        disabled: false,
        kind: shareTarget.kind,
      });
      loadSecureLinks();
      setSuccess(shareTarget.kind === "folder" ? "Lien sécurisé du dossier créé." : "Lien sécurisé créé en mode visionnement seulement.");
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
      if (!response.ok) throw new Error(data?.message || "Impossible de désactiver le lien.");
      setShareResult((current) => ({ ...current, disabled: true }));
      loadSecureLinks();
      setSuccess("Lien sécurisé désactivé.");
    } catch (err) {
      setShareError(err.message || "Impossible de désactiver le lien sécurisé.");
    } finally {
      setDisablingShare(false);
    }
  };

  const disableTrackedSecureLink = async (share) => {
    if (!share?.token) return;
    const confirmed = window.confirm("Désactiver ce lien sécurisé? Les personnes qui ont déjà reçu ce lien ne pourront plus l’utiliser.");
    if (!confirmed) return;
    setDisablingTrackedLink(share.token);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE}/api/shared-documents/${share.token}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Impossible de désactiver le lien.");
      await loadSecureLinks();
      setSuccess("Lien sécurisé désactivé.");
    } catch (err) {
      setError(err.message || "Impossible de désactiver le lien sécurisé.");
    } finally {
      setDisablingTrackedLink("");
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
      if (!response.ok) throw new Error(data?.message || "Impossible de désactiver les liens sécurisés.");
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
      if (shareTarget) setShareError("");
    } catch (err) {
      const message = "Impossible de copier automatiquement. Sélectionne le texte manuellement.";
      if (shareTarget) setShareError(message);
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
      if (!response.ok) throw new Error(data.message || "Impossible de supprimer le document.");
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

  const openAddDocumentForFolder = (folder) => {
    setForm((current) => ({ ...current, folderId: folder.id, title: "", note: "", fileName: "", fileSize: null, fileType: "" }));
    setSelectedFile(null);
    setShowDocPopup(true);
  };

  const openAllDocs = () => {
    setShowAllDocsPopup(true);
  };

  const documentsForAllPopup = useMemo(() => matchingDocsForSearch, [matchingDocsForSearch]);

  return (
    <div className="space-y-6">
      <SectionTitle title="Documents" subtitle="Classer, retrouver et partager les documents importants de chaque enfant." icon={FileText} />

      {error && <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">{error}</div>}
      {success && <div className="rounded-2xl bg-[#EEF6EA] p-4 text-sm font-bold text-[#6C8A58] ring-1 ring-[#D9E8CE]">{success}</div>}

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Documents familiaux</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">Recherchez rapidement une carte d’assurance maladie, un carnet de vaccination, un certificat ou une note.</p>
          </div>
          <button type="button" onClick={() => setShowDocPopup(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EEC988] px-6 py-4 text-base font-black text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-95">
            <Upload className="h-5 w-5" /> Ajouter un document
          </button>
        </div>

        <div className="mt-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A8B193]" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher un document, un dossier ou une note..." className="w-full rounded-2xl border border-[#DED6C9] bg-[#F7F3EA] py-4 pl-12 pr-4 text-sm font-semibold text-[#55534C] outline-none transition placeholder:text-[#A9A094] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/25" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={openAllDocs} className="rounded-full bg-[#FFFDF8] px-4 py-2 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
            Tous les documents · {matchingDocsForSearch.length}
          </button>
          {childFilter !== "all" && (
            <button type="button" onClick={() => setChildFilter("all")} className="rounded-full bg-[#EEF6EA] px-4 py-2 text-xs font-bold text-[#6C8A58] ring-1 ring-[#D9E8CE]">
              Réinitialiser le filtre enfant
            </button>
          )}
          <span className="rounded-full bg-[#EEF6EA] px-4 py-2 text-xs font-bold text-[#6C8A58] ring-1 ring-[#D9E8CE]">
            Dossiers affichés · {visibleFolders.length}
          </span>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Documents par enfant</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">Choisissez un enfant pour filtrer les dossiers importants. Les documents généraux apparaissent pour chaque enfant.</p>
          </div>
          <button type="button" onClick={() => setChildFilter("all")} className={`rounded-full px-4 py-2 text-xs font-bold ring-1 transition ${childFilter === "all" ? "bg-[#A8B193] text-white ring-[#A8B193]" : "bg-[#FFFDF8] text-[#746F64] ring-[#EFE4D6]"}`}>
            Tous
          </button>
        </div>
        {!children.length && <div className="mt-5 rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun enfant n’est disponible. Ajoute un enfant dans la section Profil enfant avant d’ajouter des documents.</div>}
        <div className="mt-5 grid !grid-cols-1 gap-3 sm:!grid-cols-2">
          {children.map((child) => {
            const childId = getChildId(child);
            const color = getColor(child.color);
            const documentsForChild = childDocs(child);
            const count = documentsForChild.length;
            const photo = getChildPhoto(child);
            const isActive = childFilter === childId;
            return (
              <button key={childId} type="button" onClick={() => setChildFilter(isActive ? "all" : childId)} className={`group rounded-3xl p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${isActive ? "bg-[#EEF6EA] ring-[#A8B193]" : `bg-white ${color.soft}`}`}>
                <div className="flex items-center gap-4">
                  {photo ? <img src={photo} alt={getChildName(child)} className="h-16 w-16 rounded-3xl object-cover shadow-sm ring-4 ring-white" /> : <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-xl font-extrabold text-[#A8B193] shadow-sm ring-4 ring-white">{getChildName(child).slice(0, 1)}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold text-[#55534C]">{getChildName(child)}</p>
                    <p className="mt-1 text-sm font-semibold text-[#746F64]">Filtrer les dossiers</p>
                    <p className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-white">{count} document{count > 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 shrink-0 text-[#A8B193] transition ${isActive ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Dossiers importants</h3>
            <p className="mt-1 text-sm text-[#746F64]">{childFilter === "all" ? "Ouvrez un dossier pour voir ses documents." : "Les dossiers sont filtrés selon l’enfant sélectionné."}</p>
          </div>
          <button type="button" onClick={loadDocuments} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]" title="Rafraîchir">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2 xl:!grid-cols-3">
          {visibleFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} count={folderCounts.get(folder.id) || 0} onOpen={() => setFolderDetails(folder)} onOptions={openFolderOptions} />
          ))}
          {searchQuery && !visibleFolders.length && <div className="rounded-3xl bg-[#FFFDF8] p-5 text-sm font-semibold leading-6 text-[#746F64] ring-1 ring-[#EFE4D6] sm:col-span-2 xl:col-span-3">Aucun dossier ne contient un document correspondant à cette recherche.</div>}
          <button type="button" onClick={() => setShowFolderPopup(true)} className="rounded-3xl border-2 border-dashed border-[#DED6C9] bg-[#FFFDF8] p-4 text-left transition hover:bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#A8B193] ring-1 ring-[#EFE4D6]"><Plus className="h-6 w-6" /></div>
            <p className="mt-3 font-black text-[#55534C]">Créer un dossier</p>
            <p className="mt-1 text-xs leading-5 text-[#746F64]">Ajoutez un dossier personnalisé, par exemple garderie, sport ou voyage.</p>
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Suivi des liens sécurisés</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">Consultez les liens actifs et désactivez-les au besoin.</p>
          </div>
          <button type="button" onClick={loadSecureLinks} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64] ring-1 ring-[#EFE4D6]" title="Rafraîchir les liens">
            {loadingSecureLinks ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {secureLinks.length ? secureLinks.map((share) => (
            <div key={share.token} className="rounded-3xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#55534C]">{share.shareKind === "folder" ? "Dossier" : "Document"} · {share.folderName || share.documentName || share.fileName || "Lien Camelio"}</p>
                  <p className="mt-1 text-xs font-semibold text-[#746F64]">{share.requiresCode ? "Mot de passe activé" : "Sans mot de passe"} · Expire le {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString("fr-CA") : "date inconnue"} · {share.accessCount || 0} consultation{Number(share.accessCount || 0) > 1 ? "s" : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyToClipboard(share.shareUrl || `${window.location.origin}/shared-document/${share.token}`, "Lien")} className="rounded-2xl bg-white px-4 py-2 text-xs font-bold text-[#746F64] ring-1 ring-[#DED6C9]"><Copy className="mr-1 inline h-3.5 w-3.5" /> Copier</button>
                  <button type="button" onClick={() => disableTrackedSecureLink(share)} disabled={disablingTrackedLink === share.token} className="rounded-2xl bg-[#FBECEF] px-4 py-2 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">{disablingTrackedLink === share.token ? "Désactivation..." : "Désactiver"}</button>
                </div>
              </div>
            </div>
          )) : <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun lien sécurisé actif pour le moment.</div>}
        </div>
      </div>

      {selectedDocument && <DocumentViewer doc={selectedDocument} close={() => setSelectedDocument(null)} onDownload={downloadDocument} />}

      {folderDetails && (
        <Popup title={folderDetails.name} kicker="Dossier" close={() => setFolderDetails(null)}>
          <div className="space-y-4">
            <div className={`rounded-3xl p-4 ring-1 ${folderDetails.bg} ${folderDetails.ring}`}>
              <div className="flex items-start gap-3">
                {folderDetails.photo ? <img src={folderDetails.photo} alt={folderDetails.name} className="h-14 w-14 rounded-2xl object-cover bg-white ring-1 ring-white" /> : <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white ${folderDetails.text} ring-1 ${folderDetails.ring}`}><Folder className="h-6 w-6" /></div>}
                <div>
                  <p className="font-black text-[#55534C]">{folderDetails.name}</p>
                  <p className="mt-1 text-sm leading-6 text-[#746F64]">{folderDetails.description}</p>
                </div>
              </div>
            </div>
            <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-3">
              <button type="button" onClick={() => openAddDocumentForFolder(folderDetails)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EEC988] px-4 py-4 text-sm font-black text-white shadow-md">
                <Upload className="h-4 w-4" /> Ajouter ici
              </button>
              <button type="button" onClick={() => openSharePopup({ kind: "folder", id: folderDetails.id, name: folderDetails.name })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F4F8FD] px-4 py-4 text-sm font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">
                <Share2 className="h-4 w-4" /> Partager le dossier
              </button>
              <button type="button" onClick={() => openFolderOptions(folderDetails)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F8F3EA] px-4 py-4 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
                <Edit3 className="h-4 w-4" /> Modifier
              </button>
            </div>
            <div className="space-y-3">
              {getDocsForFolder(folderDetails, matchingDocsForSearch).length ? getDocsForFolder(folderDetails, matchingDocsForSearch).map((doc) => (
                <DocumentRow key={doc.id || doc.s3Key} doc={doc} folder={folderDetails} onView={openDocument} onMenu={setDocMenu} />
              )) : <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun document dans ce dossier pour le filtre actuel.</div>}
            </div>
          </div>
        </Popup>
      )}

      {showAllDocsPopup && (
        <Popup title="Tous les documents" kicker="Documents" close={() => setShowAllDocsPopup(false)}>
          <div className="space-y-4">
            <select className={inputClass()} value={childFilter} onChange={(event) => setChildFilter(event.target.value)}>
              <option value="all">Tous les enfants</option>
              <option value={GENERAL_CHILD_ID}>Général</option>
              {children.map((child) => <option key={getChildId(child)} value={getChildId(child)}>{getChildName(child)}</option>)}
            </select>
            <div className="space-y-3">
              {documentsForAllPopup.length ? documentsForAllPopup.map((doc) => (
                <DocumentRow key={doc.id || doc.s3Key} doc={doc} folder={getFolderById(allFolders, getDocFolderId(doc))} onView={openDocument} onMenu={setDocMenu} />
              )) : <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun document trouvé.</div>}
            </div>
          </div>
        </Popup>
      )}

      {docMenu && (
        <Popup title={getDocumentTitle(docMenu)} kicker="Options du document" close={() => setDocMenu(null)}>
          <div className="grid !grid-cols-1 gap-3">
            <button type="button" onClick={() => { openDocument(docMenu); setDocMenu(null); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F3EA] px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"><Eye className="h-4 w-4" /> Ouvrir</button>
            <button type="button" onClick={() => openEditDocument(docMenu)} className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8ED] px-4 py-3 text-sm font-bold text-[#9A7652] ring-1 ring-[#F0D8B8]"><Edit3 className="h-4 w-4" /> Modifier les informations</button>
            <button type="button" onClick={() => openSharePopup({ kind: "document", id: docMenu.id, name: getDocumentTitle(docMenu) })} className="flex items-center justify-center gap-2 rounded-2xl bg-[#F4F8FD] px-4 py-3 text-sm font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]"><Link className="h-4 w-4" /> Partager par lien sécurisé</button>
            <button type="button" onClick={() => disableAllDocumentShareLinks(docMenu)} disabled={disablingAllShares} className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8ED] px-4 py-3 text-sm font-bold text-[#9A7652] ring-1 ring-[#F0D8B8] disabled:cursor-not-allowed disabled:opacity-60">{disablingAllShares ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />} {disablingAllShares ? "Désactivation..." : "Désactiver tous les liens sécurisés"}</button>
            <button type="button" onClick={() => { setDeleteDoc(docMenu); setDocMenu(null); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"><Trash2 className="h-4 w-4" /> Supprimer</button>
          </div>
        </Popup>
      )}

      {shareTarget && (
        <Popup title={shareTarget.kind === "folder" ? "Partager ce dossier" : "Partager ce document"} kicker="Lien sécurisé" close={() => { setShareTarget(null); setShareResult(null); setShareError(""); setError(""); }}>
          <div className="space-y-5">
            <div className="rounded-3xl bg-[#F4F8FD] p-4 ring-1 ring-[#D3DFF1]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6A85AF] ring-1 ring-[#D3DFF1]"><ShieldCheck className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="font-bold text-[#55534C]">{shareTarget.name}</p>
                  <p className="mt-1 text-sm leading-6 text-[#746F64]">Le lien sera protégé par un code de 4 caractères. Le destinataire pourra seulement visionner {shareTarget.kind === "folder" ? "les documents du dossier" : "le document"} dans Camelio.</p>
                </div>
              </div>
            </div>
            {shareError && <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">{shareError}</div>}
            {!shareResult && (
              <>
                <FormField label="Mode de partage">
                  <div className="rounded-3xl bg-[#EEF6EA] p-4 ring-1 ring-[#D9E8CE]"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6C8A58] ring-1 ring-[#D9E8CE]"><Eye className="h-5 w-5" /></div><div><p className="font-bold text-[#55534C]">Visionnement seulement</p><p className="mt-1 text-sm leading-6 text-[#746F64]">Le téléchargement est retiré de l’interface partagée. La personne peut consulter, mais aucun bouton de téléchargement n’est affiché.</p></div></div></div>
                </FormField>
                <FormField label="Mot de passe">
                  <div className="grid !grid-cols-2 gap-2">
                    {[true, false].map((enabled) => <button key={enabled ? "yes" : "no"} type="button" onClick={() => setShareForm((current) => ({ ...current, requiresCode: enabled, code: enabled && !current.code ? generateAccessCode() : current.code }))} className={`rounded-2xl px-4 py-3 text-sm font-bold ring-1 transition ${shareForm.requiresCode === enabled ? "bg-[#A8B193] text-white ring-[#A8B193]" : "bg-white text-[#746F64] ring-[#DED6C9]"}`}>{enabled ? "Oui" : "Non"}</button>)}
                  </div>
                </FormField>
                {shareForm.requiresCode && <FormField label="Code d’accès, 4 caractères"><div className="flex gap-2"><input className={inputClass("uppercase tracking-[0.35em]")} value={shareForm.code} maxLength={4} onChange={(event) => setShareForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) }))} placeholder="A7K2" /><button type="button" onClick={() => setShareForm((current) => ({ ...current, code: generateAccessCode() }))} className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Générer</button></div></FormField>}
                <FormField label="Délai avant désactivation">
                  <div className="grid !grid-cols-4 gap-2">{[1, 3, 7, 14].map((days) => <button key={days} type="button" onClick={() => setShareForm((current) => ({ ...current, durationDays: days }))} className={`rounded-2xl px-3 py-3 text-sm font-bold ring-1 transition ${Number(shareForm.durationDays) === days ? "bg-[#A8B193] text-white ring-[#A8B193]" : "bg-white text-[#746F64] ring-[#DED6C9]"}`}>{days === 1 ? "1 jour" : `${days} jours`}</button>)}</div>
                  <input type="number" min="1" max="365" className={`${inputClass()} mt-3`} value={shareForm.durationDays} onChange={(event) => setShareForm((current) => ({ ...current, durationDays: event.target.value }))} placeholder="Autre nombre de jours" />
                </FormField>
                <div className="grid !grid-cols-2 gap-3 pt-1"><button type="button" onClick={() => { setShareTarget(null); setShareResult(null); setError(""); }} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Annuler</button><button type="button" onClick={generateShareLink} disabled={sharing || (shareForm.requiresCode && String(shareForm.code || "").length !== 4)} className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{sharing ? "Création..." : "Générer le lien"}</button></div>
              </>
            )}
            {shareResult && (
              <div className="space-y-4">
                <div className={`rounded-3xl p-4 ring-1 ${shareResult.disabled ? "bg-[#F8F3EA] ring-[#EFE4D6]" : "bg-[#EEF6EA] ring-[#D9E8CE]"}`}><p className={`text-sm font-bold ${shareResult.disabled ? "text-[#746F64]" : "text-[#6C8A58]"}`}>{shareResult.disabled ? "Lien sécurisé désactivé." : "Lien sécurisé prêt à partager."}</p></div>
                {!shareResult.disabled && <button type="button" onClick={() => copyToClipboard(`Voici le lien sécurisé pour visionner ${shareTarget.kind === "folder" ? "le dossier" : "le document"} :\n${shareResult.shareUrl || ""}\n\n${shareResult.requiresCode ? `Code d’accès : ${shareResult.code}\n\n` : ""}Le lien sera actif pendant ${getDurationLabel(shareResult.durationDays)}${shareResult.expiresAt ? `, jusqu’au ${new Date(shareResult.expiresAt).toLocaleString("fr-CA")}` : ""}.\n\nAccès : visionnement seulement, téléchargement retiré de l’interface.`, "Message")} disabled={!shareResult.shareUrl} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Copy className="h-4 w-4" /> Copier le message complet</button>}
                <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2"><div className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]"><p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">Lien URL</p><p className="mt-2 break-all text-sm font-semibold text-[#55534C]">{shareResult.shareUrl || "Lien non retourné par le serveur"}</p><button type="button" onClick={() => copyToClipboard(shareResult.shareUrl, "Lien")} disabled={!shareResult.shareUrl || shareResult.disabled} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9] disabled:opacity-50"><Copy className="h-4 w-4" /> Copier le lien</button></div>{shareResult.requiresCode ? <div className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]"><p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">Code d’accès</p><p className="mt-2 text-2xl font-black tracking-[0.35em] text-[#55534C]">{shareResult.code}</p><button type="button" onClick={() => copyToClipboard(shareResult.code, "Code")} disabled={shareResult.disabled} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9] disabled:opacity-50"><Copy className="h-4 w-4" /> Copier le code</button></div> : <div className="rounded-2xl bg-[#EEF6EA] p-3 ring-1 ring-[#D9E8CE]"><p className="text-xs font-bold uppercase tracking-wide text-[#6C8A58]">Mot de passe</p><p className="mt-2 text-sm font-bold text-[#55534C]">Aucun mot de passe requis</p></div>}</div>
                <div className="rounded-2xl bg-[#F8F3EA] p-3 ring-1 ring-[#EFE4D6]"><p className="text-xs leading-5 text-[#746F64]">Note : le mode visionnement seulement retire le téléchargement dans l’interface partagée, mais une personne peut toujours faire une capture d’écran.</p></div>
                {!shareResult.disabled && <button type="button" onClick={disableShareLink} disabled={disablingShare} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">{disablingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />} {disablingShare ? "Désactivation..." : "Désactiver ce lien"}</button>}
              </div>
            )}
          </div>
        </Popup>
      )}

      {showFolderPopup && (
        <Popup title="Créer un dossier" kicker="Dossier personnalisé" close={() => setShowFolderPopup(false)}>
          <div className="space-y-4">
            <FormField label="Nom du dossier"><input className={inputClass()} value={folderForm.name} onChange={(event) => setFolderForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex. Garderie, soccer, orthophonie" /></FormField>
            <FormField label="Description facultative"><textarea className={inputClass("min-h-[100px] resize-none")} value={folderForm.description} onChange={(event) => setFolderForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ajoutez une courte description pour retrouver ce dossier plus facilement." /></FormField>
            <FormField label="Photo du dossier, URL facultative"><input className={inputClass()} value={folderForm.photo} onChange={(event) => setFolderForm((current) => ({ ...current, photo: event.target.value }))} placeholder="https://..." /></FormField>
            <FormField label="Couleur"><div className="grid !grid-cols-5 gap-2">{FOLDER_STYLES.map((style, index) => <button key={style.color} type="button" onClick={() => setFolderForm((current) => ({ ...current, styleIndex: index }))} className={`h-12 rounded-2xl ring-2 ${Number(folderForm.styleIndex) === index ? "ring-[#55534C]" : "ring-transparent"}`} style={{ backgroundColor: style.color }} aria-label={`Couleur ${index + 1}`} />)}</div></FormField>
            <div className="grid !grid-cols-2 gap-3"><button type="button" onClick={() => setShowFolderPopup(false)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Annuler</button><button type="button" onClick={createCustomFolder} className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white">Créer</button></div>
          </div>
        </Popup>
      )}

      {folderMenu && (
        <Popup title="Modifier le dossier" kicker={folderMenu.name} close={() => setFolderMenu(null)}>
          <div className="space-y-4">
            <FormField label="Nom du dossier"><input className={inputClass()} value={folderForm.name} onChange={(event) => setFolderForm((current) => ({ ...current, name: event.target.value }))} /></FormField>
            <FormField label="Description"><textarea className={inputClass("min-h-[100px] resize-none")} value={folderForm.description} onChange={(event) => setFolderForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
            <FormField label="Photo du dossier, URL facultative"><input className={inputClass()} value={folderForm.photo} onChange={(event) => setFolderForm((current) => ({ ...current, photo: event.target.value }))} placeholder="https://..." /></FormField>
            <FormField label="Couleur"><div className="grid !grid-cols-5 gap-2">{FOLDER_STYLES.map((style, index) => <button key={style.color} type="button" onClick={() => setFolderForm((current) => ({ ...current, styleIndex: index }))} className={`h-12 rounded-2xl ring-2 ${Number(folderForm.styleIndex) === index ? "ring-[#55534C]" : "ring-transparent"}`} style={{ backgroundColor: style.color }} aria-label={`Couleur ${index + 1}`} />)}</div></FormField>
            <div className="grid !grid-cols-2 gap-3"><button type="button" onClick={() => setFolderMenu(null)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Annuler</button><button type="button" onClick={saveFolderInfo} className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white">Enregistrer</button></div>
          </div>
        </Popup>
      )}

      {showDocPopup && (
        <Popup title="Ajouter un document" kicker="Documents" close={() => { resetForm(); setShowDocPopup(false); }}>
          <div className="space-y-4">
            <FormField label="Enfant associé">
              <div className="grid !grid-cols-2 gap-3 sm:!grid-cols-3">
                <button type="button" onClick={() => setForm((current) => ({ ...current, childId: GENERAL_CHILD_ID }))} className={`rounded-3xl p-3 text-left ring-2 transition ${form.childId === GENERAL_CHILD_ID ? "bg-[#EEF6EA] ring-[#A8B193]" : "bg-[#FFFDF8] ring-[#EFE4D6]"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#A8B193] ring-1 ring-[#D9E8CE]"><Folder className="h-5 w-5" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-black text-[#55534C]">Général</p><p className="text-xs font-semibold text-[#746F64]">Tous les enfants</p></div>
                  </div>
                </button>
                {children.map((child) => {
                  const childId = getChildId(child);
                  const photo = getChildPhoto(child);
                  const isActive = form.childId === childId;
                  return (
                    <button key={childId} type="button" onClick={() => setForm((current) => ({ ...current, childId }))} className={`rounded-3xl p-3 text-left ring-2 transition ${isActive ? "bg-[#EEF6EA] ring-[#A8B193]" : "bg-[#FFFDF8] ring-[#EFE4D6]"}`}>
                      <div className="flex items-center gap-3">
                        {photo ? <img src={photo} alt={getChildName(child)} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#A8B193] ring-1 ring-[#D9E8CE]">{getChildName(child).slice(0, 1)}</div>}
                        <div className="min-w-0"><p className="truncate text-sm font-black text-[#55534C]">{getChildName(child)}</p><p className="text-xs font-semibold text-[#746F64]">Enfant</p></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </FormField>
            <div className="rounded-3xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]"><p className="text-sm font-bold text-[#55534C]">{form.childId === GENERAL_CHILD_ID ? "Document général, visible pour tous les enfants" : selectedChild ? `Document pour ${getChildName(selectedChild)}` : "Document pour un enfant"}</p></div>
            <FormField label="Dossier"><select className={inputClass()} value={form.folderId} onChange={(event) => setForm((current) => ({ ...current, folderId: event.target.value }))}>{allFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></FormField>
            <FormField label="Nom du document"><input className={inputClass()} value={form.title} readOnly placeholder="Le nom sera identique au fichier importé" /></FormField>
            <FormField label="Fichier"><input type="file" accept={allowedAccept} onChange={(event) => handleFileSelection(event.target.files?.[0])} className="block w-full rounded-2xl border border-dashed border-[#DED6C9] bg-[#FFFDF8] px-4 py-4 text-sm font-semibold text-[#746F64]" /></FormField>
            {selectedFile && <div className="rounded-2xl bg-[#F4F8FD] p-3 text-sm font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]">{selectedFile.name} · {formatFileSize(selectedFile.size)}</div>}
            <FormField label="Note facultative"><textarea className={inputClass("min-h-[110px] resize-none")} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ajoutez une note pour retrouver le document plus facilement." /></FormField>
            <div className="grid !grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => { resetForm(); setShowDocPopup(false); }} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Annuler</button><button type="button" onClick={addDoc} disabled={saving || !selectedFile} className="rounded-2xl bg-[#EEC988] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Ajout..." : "Ajouter"}</button></div>
          </div>
        </Popup>
      )}

      {editDoc && (
        <Popup title="Modifier le document" kicker={getDocumentTitle(editDoc)} close={() => setEditDoc(null)}>
          <div className="space-y-4">
            <FormField label="Nom du document"><input className={inputClass()} value={editDocForm.title} onChange={(event) => setEditDocForm((current) => ({ ...current, title: event.target.value }))} placeholder="Nom affiché dans Camelio" /></FormField>
            <FormField label="Enfant associé">
              <div className="grid !grid-cols-2 gap-3 sm:!grid-cols-3">
                <button type="button" onClick={() => setEditDocForm((current) => ({ ...current, childId: GENERAL_CHILD_ID }))} className={`rounded-3xl p-3 text-left ring-2 transition ${editDocForm.childId === GENERAL_CHILD_ID ? "bg-[#EEF6EA] ring-[#A8B193]" : "bg-[#FFFDF8] ring-[#EFE4D6]"}`}>
                  <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#A8B193] ring-1 ring-[#D9E8CE]"><Folder className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-black text-[#55534C]">Général</p><p className="text-xs font-semibold text-[#746F64]">Tous les enfants</p></div></div>
                </button>
                {children.map((child) => {
                  const childId = getChildId(child);
                  const photo = getChildPhoto(child);
                  const isActive = editDocForm.childId === childId;
                  return (
                    <button key={childId} type="button" onClick={() => setEditDocForm((current) => ({ ...current, childId }))} className={`rounded-3xl p-3 text-left ring-2 transition ${isActive ? "bg-[#EEF6EA] ring-[#A8B193]" : "bg-[#FFFDF8] ring-[#EFE4D6]"}`}>
                      <div className="flex items-center gap-3">{photo ? <img src={photo} alt={getChildName(child)} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#A8B193] ring-1 ring-[#D9E8CE]">{getChildName(child).slice(0, 1)}</div>}<div className="min-w-0"><p className="truncate text-sm font-black text-[#55534C]">{getChildName(child)}</p><p className="text-xs font-semibold text-[#746F64]">Enfant</p></div></div>
                    </button>
                  );
                })}
              </div>
            </FormField>
            <FormField label="Dossier"><select className={inputClass()} value={editDocForm.folderId} onChange={(event) => setEditDocForm((current) => ({ ...current, folderId: event.target.value }))}>{allFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></FormField>
            <FormField label="Note facultative"><textarea className={inputClass("min-h-[110px] resize-none")} value={editDocForm.note} onChange={(event) => setEditDocForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ajoutez une note pour retrouver le document plus facilement." /></FormField>
            <div className="rounded-2xl bg-[#FFFDF8] p-3 text-xs leading-5 text-[#746F64] ring-1 ring-[#EFE4D6]">Le fichier original reste le même. Ici, tu modifies le nom affiché dans Camelio, le dossier, l’enfant associé et la note.</div>
            <div className="grid !grid-cols-2 gap-3 pt-2"><button type="button" onClick={() => setEditDoc(null)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Annuler</button><button type="button" onClick={saveDocumentInfo} disabled={saving} className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Enregistrement..." : "Enregistrer"}</button></div>
          </div>
        </Popup>
      )}

      {selectedChildDocs && (
        <Popup title={`Documents de ${getChildName(selectedChildDocs)}`} kicker="Documents par enfant" close={() => setSelectedChildDocs(null)}>
          <div className="space-y-3">
            {childDocs(selectedChildDocs).length ? childDocs(selectedChildDocs).map((doc) => <DocumentRow key={doc.id || doc.s3Key} doc={doc} folder={getFolderById(allFolders, getDocFolderId(doc))} onView={openDocument} onMenu={setDocMenu} />) : <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">Aucun document pour cet enfant.</div>}
          </div>
        </Popup>
      )}

      {deleteDoc && (
        <Popup title="Supprimer ce document?" kicker="Confirmation" close={() => setDeleteDoc(null)}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#746F64]">Cette action supprimera le document de Camelio. Elle ne peut pas être annulée.</p>
            <div className="grid !grid-cols-2 gap-3"><button type="button" onClick={() => setDeleteDoc(null)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#DED6C9]">Annuler</button><button type="button" onClick={confirmDeleteDoc} disabled={saving} className="rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3] disabled:opacity-60">{saving ? "Suppression..." : "Supprimer"}</button></div>
          </div>
        </Popup>
      )}
    </div>
  );
}
