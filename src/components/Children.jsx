import React, { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Camera,
  ChevronDown,
  ChevronUp,
  FileText,
  ImagePlus,
  Plus,
  ScrollText,
  StickyNote,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Popup, SectionTitle } from "./shared.jsx";
import { displayName } from "./sectionsData.js";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const defaultPhotoPosition = { x: 50, y: 50 };

function createChildId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `child-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const childColorOptions = [
  { id: "sage", label: "Sauge", dot: "#A8B193" },
  { id: "rose", label: "Rose", dot: "#E99AAA" },
  { id: "blue", label: "Bleu doux", dot: "#8FB8DE" },
  { id: "mauve", label: "Mauve", dot: "#AA90C8" },
  { id: "gold", label: "Doré", dot: "#D4A85F" },
  { id: "peach", label: "Pêche", dot: "#E8A07E" },
  { id: "mint", label: "Menthe", dot: "#7CBFA2" },
  { id: "lavender", label: "Lavande", dot: "#C7B3E5" },
  { id: "mustard", label: "Moutarde", dot: "#D9BF5E" },
  { id: "olive", label: "Olive", dot: "#8E9A72" },
  { id: "coral", label: "Corail", dot: "#E8786D" },
  { id: "teal", label: "Sarcelle", dot: "#5BAEAA" },
  { id: "sky", label: "Ciel", dot: "#76BFE3" },
  { id: "grape", label: "Raisin", dot: "#8F78B8" },
  { id: "sand", label: "Sable", dot: "#D8C49A" },
];

const girlPresetPhotos = Array.from({ length: 15 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `fille-profil-${number}`,
    label: `Fille ${number}`,
    category: "fille",
    url: `/Profil/Fille/profil_${number}.png`,
  };
});

const boyPresetPhotos = Array.from({ length: 18 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");

  return {
    id: `garcon-profil-${number}`,
    label: `Garçon ${number}`,
    category: "garcon",
    url: `/Profil/Garcon/Garcon_${number}.png`,
  };
});

const presetPhotos = [...girlPresetPhotos, ...boyPresetPhotos];

function normalizePhotoPosition(position) {
  if (!position) return defaultPhotoPosition;

  if (typeof position === "string") {
    const [xRaw, yRaw] = position.split(" ");

    return {
      x: parseInt(xRaw, 10) || 50,
      y: parseInt(yRaw, 10) || 50,
    };
  }

  return {
    x: Number.isFinite(position.x) ? position.x : 50,
    y: Number.isFinite(position.y) ? position.y : 50,
  };
}

function getObjectPosition(position) {
  const clean = normalizePhotoPosition(position);
  return `${clean.x}% ${clean.y}%`;
}

function PhotoImage({ src, alt, position, zoom = 1, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`select-none object-cover ${className}`}
      style={{
        objectPosition: getObjectPosition(position),
        transform: `scale(${zoom})`,
        transformOrigin: getObjectPosition(position),
      }}
    />
  );
}

function PresetPhotoModal({ open, selectedPhoto, onClose, onChoose }) {
  const [filter, setFilter] = useState("tout");

  if (!open) return null;

  const filteredPhotos =
    filter === "tout"
      ? presetPhotos
      : presetPhotos.filter((photo) => photo.category === filter);

  const filters = [
    { id: "tout", label: "Tout" },
    { id: "fille", label: "Fille" },
    { id: "garcon", label: "Garçon" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#2F2A24]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-[#FFFDF8] shadow-2xl ring-1 ring-[#EFE4D6] sm:rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-[#EFE4D6] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A8B193]">
              Image prédéfinie
            </p>

            <h3 className="mt-1 text-lg font-bold text-[#4F4A45]">
              Choisir une image
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8EC] text-[#746F64] ring-1 ring-[#EFE4D6]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-[#EFE4D6] bg-[#FFFDF8] px-5 py-3">
          <div className="grid grid-cols-3 gap-2 rounded-full bg-[#F4EFE7] p-1">
            {filters.map((item) => {
              const active = filter === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-3 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-white text-[#4F4A45] shadow-sm"
                      : "text-[#8B7D6B]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {filteredPhotos.map((item) => {
              const selected = selectedPhoto === item.url;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChoose(item.url);
                    onClose();
                  }}
                  className={`group overflow-hidden rounded-[1.35rem] bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-sm ${
                    selected
                      ? "ring-2 ring-[#A8B193]"
                      : "ring-1 ring-[#EFE4D6]"
                  }`}
                >
                  <div className="aspect-square overflow-hidden rounded-2xl bg-[#F4EFE7]">
                    <img
                      src={item.url}
                      alt={item.label}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <p className="mt-2 truncate text-center text-[11px] font-bold text-[#746F64]">
                    {item.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoPicker({
  photo,
  position = defaultPhotoPosition,
  zoom = 1,
  fallback,
  onChoosePreset,
  onUpload,
  onPositionChange,
  onZoomChange,
}) {
  const [isCropping, setIsCropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const currentPosition = normalizePhotoPosition(position);

  const clamp = (value) => Math.max(0, Math.min(100, value));

  const updatePositionFromPointer = (event) => {
    if (!photo) return;

    const rect = event.currentTarget.getBoundingClientRect();

    const x = clamp(
      Math.round(((event.clientX - rect.left) / rect.width) * 100)
    );

    const y = clamp(
      Math.round(((event.clientY - rect.top) / rect.height) * 100)
    );

    onPositionChange({ x, y });
  };

  const movePosition = (deltaX, deltaY) => {
    onPositionChange({
      x: clamp(currentPosition.x + deltaX),
      y: clamp(currentPosition.y + deltaY),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-[#EFE4D6] bg-[#FFFDF8] p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EEF0E7] text-3xl font-bold text-[#8F9874] shadow-sm">
            {photo ? (
              <PhotoImage
                src={photo}
                alt="Aperçu rond"
                position={currentPosition}
                zoom={zoom}
                className="h-full w-full"
              />
            ) : (
              fallback || <UserRound className="h-10 w-10" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#4F4A45]">
              Photo du profil
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-[#8B7D6B]">
              Importe une photo ou choisis une image prédéfinie.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowPresetModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
              >
                <ImagePlus className="h-4 w-4" />
                Choisir
              </button>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#EFE4D6] bg-white px-4 py-2.5 text-sm font-bold text-[#746F64] shadow-sm transition hover:bg-[#FAF4EC]">
                <Camera className="h-4 w-4" />
                Importer
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                />
              </label>
            </div>
          </div>
        </div>

        {photo && (
          <button
            type="button"
            onClick={() => setIsCropping((current) => !current)}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-sm ring-1 ${
              isCropping
                ? "bg-[#A8B193] text-white ring-[#A8B193]"
                : "bg-white text-[#746F64] ring-[#EFE4D6]"
            }`}
          >
            <Camera className="h-4 w-4" />
            {isCropping ? "Terminer le recadrage" : "Recadrer la photo"}
          </button>
        )}

        {isCropping && photo && (
          <div className="mt-5 space-y-4">
            <p className="text-center text-xs font-semibold text-[#746F64]">
              Glisse l’image avec ton doigt pour ajuster le cadrage.
            </p>

            <div
              onPointerDown={(event) => {
                setIsDragging(true);
                event.currentTarget.setPointerCapture(event.pointerId);
                updatePositionFromPointer(event);
              }}
              onPointerMove={(event) => {
                if (!isDragging) return;
                updatePositionFromPointer(event);
              }}
              onPointerUp={(event) => {
                setIsDragging(false);
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => setIsDragging(false)}
              className="relative mx-auto flex h-64 w-full max-w-[380px] touch-none select-none items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#EEF0E7] ring-1 ring-[#D8C8B6]"
            >
              <PhotoImage
                src={photo}
                alt="Recadrage"
                position={currentPosition}
                zoom={zoom}
                className="h-full w-full"
              />

              <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-4 ring-white/50" />
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
              <label className="block text-xs font-bold text-[#746F64]">
                Zoom
                <input
                  type="range"
                  min="0.7"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => onZoomChange(Number(event.target.value))}
                  className="mt-3 w-full accent-[#A8B193]"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
              <p className="mb-3 text-xs font-bold text-[#746F64]">
                Ajustement précis
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div />

                <button
                  type="button"
                  onClick={() => movePosition(0, -5)}
                  className="rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  ↑
                </button>

                <div />

                <button
                  type="button"
                  onClick={() => movePosition(-5, 0)}
                  className="rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => onPositionChange(defaultPhotoPosition)}
                  className="rounded-xl bg-[#EEF0E7] px-3 py-2 text-xs font-bold text-[#6F785F] ring-1 ring-[#D8DDCB]"
                >
                  Centrer
                </button>

                <button
                  type="button"
                  onClick={() => movePosition(5, 0)}
                  className="rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  →
                </button>

                <div />

                <button
                  type="button"
                  onClick={() => movePosition(0, 5)}
                  className="rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  ↓
                </button>

                <div />
              </div>
            </div>
          </div>
        )}
      </div>

      <PresetPhotoModal
        open={showPresetModal}
        selectedPhoto={photo}
        onClose={() => setShowPresetModal(false)}
        onChoose={(url) => {
          onChoosePreset(url);
        }}
      />
    </div>
  );
}

export default function Children({ children, setChildren, onOpen = () => {} }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newChild, setNewChild] = useState({
  id: createChildId(),
  firstName: "",
  lastName: "",
  nickname: "",
  birthDate: "",
  sex: "Garçon",
  color: "sage",
  photo: "",
  avatar: "",
  avatarS3Key: "",
  photoPosition: defaultPhotoPosition,
  photoZoom: 1,
});

  const inputClass =
    "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

  const selectClass =
    "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

  const textareaClass =
    "w-full min-h-[150px] rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold leading-6 text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  };

  const uploadAvatarToS3 = async (file, childId = "general") => {
    const presignResponse = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        childId,
      }),
    });

    const presignData = await presignResponse.json();

    if (!presignResponse.ok) {
      throw new Error(presignData.message || "Erreur préparation upload S3");
    }

    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Erreur upload fichier vers S3");
    }

    return {
      s3Key: presignData.s3Key,
      avatarUrl: presignData.downloadUrl || presignData.url || "",
    };
  };

  const getAgeFromBirthDate = (birthDate) => {
    if (!birthDate || birthDate === "À compléter") return "À compléter";

    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return "À compléter";

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();

    const birthdayPassed =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() >= birth.getDate());

    if (!birthdayPassed) age -= 1;

    return `${age} ans`;
  };

  const formatChildFromServer = (child) => {
    const firstName = child.firstName || "";
    const nickname = child.nickname || firstName || "Enfant";
    const photo = child.avatar || child.photo || child.image || "";

    return {
      ...child,
      id: child.id || child.SK?.replace("CHILD#", "") || "",
      name: nickname,
      firstName,
      lastName: child.lastName || "",
      nickname,
      birthDate: child.birthDate || "",
      sex: child.gender || child.sex || "",
      gender: child.gender || child.sex || "",
      color: child.color || "sage",
      age: getAgeFromBirthDate(child.birthDate),
      photo,
      image: photo,
      avatar: photo,
      avatarS3Key: child.avatarS3Key || "",
      photoPosition: normalizePhotoPosition(child.photoPosition),
      photoZoom: child.photoZoom || 1,
      profileNote: child.notes || child.profileNote || "",
    };
  };

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/children`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Erreur chargement enfants:", data);
          return;
        }

        setChildren((data.children || []).map(formatChildFromServer));
      } catch (error) {
        console.error("Erreur chargement enfants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChildren();
  }, [setChildren]);

  const usedColors = useMemo(
    () => children.map((child) => child.color).filter(Boolean),
    [children]
  );

  const availableColors = childColorOptions.filter(
    (color) => !usedColors.includes(color.id) || color.id === newChild.color
  );

  const getInitials = (child) => {
    const first =
      child?.firstName?.trim()?.[0] || child?.name?.trim()?.[0] || "";
    const last = child?.lastName?.trim()?.[0] || "";
    const initials = `${first}${last}`.toUpperCase();

    return initials || <UserRound className="h-8 w-8" />;
  };

  const handlePreviewPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreview = await fileToDataUrl(file);

    setPreviewPhoto(localPreview);
    setNewChild((current) => ({
      ...current,
      photo: localPreview,
      avatar: localPreview,
      photoPosition: defaultPhotoPosition,
      photoZoom: 1,
    }));

    try {
      const uploadedAvatar = await uploadAvatarToS3(file, newChild.id);

      setPreviewPhoto(uploadedAvatar.avatarUrl);

      setNewChild((current) => ({
        ...current,
        photo: uploadedAvatar.avatarUrl,
        avatar: uploadedAvatar.avatarUrl,
        avatarS3Key: uploadedAvatar.s3Key,
        photoPosition: defaultPhotoPosition,
        photoZoom: 1,
      }));
    } catch (error) {
      console.error("Upload S3 impossible, conservation locale:", error);
    } finally {
      event.target.value = "";
    }
  };

  const handlePhotoChange = async (childId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreview = await fileToDataUrl(file);

    const localUpdate = {
      photo: localPreview,
      image: localPreview,
      avatar: localPreview,
      photoPosition: defaultPhotoPosition,
      photoZoom: 1,
    };

    setChildren((current) =>
      current.map((child) =>
        child.id === childId ? { ...child, ...localUpdate } : child
      )
    );

    if (selectedChild?.id === childId) {
      setSelectedChild((current) => ({
        ...current,
        ...localUpdate,
      }));
    }

    try {
      const uploadedAvatar = await uploadAvatarToS3(file, childId);

      const s3Update = {
        photo: uploadedAvatar.avatarUrl,
        image: uploadedAvatar.avatarUrl,
        avatar: uploadedAvatar.avatarUrl,
        avatarS3Key: uploadedAvatar.s3Key,
        photoPosition: defaultPhotoPosition,
        photoZoom: 1,
      };

      setChildren((current) =>
        current.map((child) =>
          child.id === childId ? { ...child, ...s3Update } : child
        )
      );

      if (selectedChild?.id === childId) {
        setSelectedChild((current) => ({
          ...current,
          ...s3Update,
        }));
      }
    } catch (error) {
      console.error("Upload S3 impossible, conservation locale:", error);
    } finally {
      event.target.value = "";
    }
  };

  const resetForm = () => {
  setNewChild({
    id: createChildId(),
    firstName: "",
    lastName: "",
    nickname: "",
    birthDate: "",
    sex: "Garçon",
    color: "sage",
    photo: "",
    avatar: "",
    avatarS3Key: "",
    photoPosition: defaultPhotoPosition,
    photoZoom: 1,
  });

  setPreviewPhoto("");
  setShowAddForm(false);
};

  const addChild = async (event) => {
    event.preventDefault();

    const firstName = newChild.firstName.trim();
    if (!firstName) return;

    try {
      setIsSaving(true);

      const nickname = newChild.nickname.trim() || firstName;

      const selectedColor =
        availableColors.find((color) => color.id === newChild.color) ||
        availableColors[0] ||
        childColorOptions[0];

      const response = await fetch(`${API_BASE_URL}/api/children`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: newChild.id,
          firstName,
          lastName: newChild.lastName.trim(),
          nickname,
          birthDate: newChild.birthDate || "",
          gender: newChild.sex || "",
          color: selectedColor.id,
          avatar: newChild.photo || "",
          photo: newChild.photo || "",
          image: newChild.photo || "",
          avatarS3Key: newChild.avatarS3Key || "",
          photoPosition: newChild.photoPosition || defaultPhotoPosition,
          photoZoom: newChild.photoZoom || 1,
          notes: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur création enfant:", data);
        alert(data.message || "Impossible de créer le profil enfant.");
        return;
      }

      setChildren((current) => [
        ...current,
        formatChildFromServer({
  ...data.child,
  id: data.child?.id || newChild.id,
  nickname,
  avatar: newChild.photo || "",
  photo: newChild.photo || "",
  image: newChild.photo || "",
  avatarS3Key: newChild.avatarS3Key || "",
  photoPosition: newChild.photoPosition || defaultPhotoPosition,
  photoZoom: newChild.photoZoom || 1,
}),
      ]);

      resetForm();
    } catch (error) {
      console.error("Erreur réseau:", error);
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const openProfile = (child) => {
    setSelectedChild({
      ...child,
      photoPosition: normalizePhotoPosition(child.photoPosition),
      photoZoom: child.photoZoom || 1,
    });

    setConfirmRemove(false);
  };

  const saveSelectedChild = async () => {
    if (!selectedChild) return;

    const firstName = selectedChild.firstName?.trim() || "";
    const nickname =
      selectedChild.nickname?.trim() || firstName || selectedChild.name || "";

    const photo =
      selectedChild.avatar || selectedChild.photo || selectedChild.image || "";

    const payload = {
      firstName,
      lastName: selectedChild.lastName || "",
      nickname,
      birthDate:
        selectedChild.birthDate && selectedChild.birthDate !== "À compléter"
          ? selectedChild.birthDate
          : "",
      gender: selectedChild.sex || selectedChild.gender || "",
      color: selectedChild.color || "sage",
      avatar: photo,
      photo,
      image: photo,
      avatarS3Key: selectedChild.avatarS3Key || "",
      photoPosition: selectedChild.photoPosition || defaultPhotoPosition,
      photoZoom: selectedChild.photoZoom || 1,
      notes: selectedChild.profileNote || selectedChild.notes || "",
    };

    try {
      setIsSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/children/${selectedChild.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur modification enfant:", data);
        alert(data.message || "Impossible d’enregistrer les modifications.");
        return;
      }

      setChildren((current) =>
        current.map((child) =>
          child.id === selectedChild.id
            ? formatChildFromServer({
                ...data.child,
                nickname,
                avatar: payload.avatar,
                photo: payload.photo,
                image: payload.image,
                avatarS3Key: payload.avatarS3Key,
                photoPosition: payload.photoPosition,
                photoZoom: payload.photoZoom,
              })
            : child
        )
      );

      setSelectedChild(null);
      setConfirmRemove(false);
    } catch (error) {
      console.error("Erreur réseau:", error);
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeSelectedChild = async () => {
    if (!selectedChild) return;

    try {
      setIsSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/api/children/${selectedChild.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur suppression enfant:", data);
        alert(data.message || "Impossible de retirer ce profil.");
        return;
      }

      setChildren((current) =>
        current.filter((child) => child.id !== selectedChild.id)
      );

      setConfirmRemove(false);
      setSelectedChild(null);
    } catch (error) {
      console.error("Erreur réseau:", error);
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <SectionTitle
            title="Profils des enfants"
            subtitle="Centralise les informations importantes de chaque enfant au même endroit."
            icon={Baby}
          />

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A8B193] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
          >
            <Plus className="h-5 w-5" />
            Ajouter un enfant
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-[2rem] border border-[#EFE4D6] bg-white p-5 text-center text-sm font-semibold text-[#746F64] shadow-sm">
          Chargement des profils enfants...
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={addChild}
          className="overflow-hidden rounded-[2rem] border border-[#EFE4D6] bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[#EFE4D6] bg-[#FFFDF8] px-5 py-4 md:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A8B193]">
                Nouveau profil
              </p>

              <h3 className="mt-1 text-xl font-bold text-[#55534C]">
                Ajouter votre enfant
              </h3>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EFE4D6] bg-white text-[#746F64] shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid w-full gap-6 p-5 md:grid-cols-[320px_1fr] md:p-6">
            <PhotoPicker
              photo={newChild.photo || previewPhoto}
              position={newChild.photoPosition}
              zoom={newChild.photoZoom || 1}
              fallback={<UserRound className="h-10 w-10" />}
              onChoosePreset={(url) => {
                setPreviewPhoto("");
                setNewChild((current) => ({
                  ...current,
                  photo: url,
                  avatar: url,
                  avatarS3Key: "",
                  photoPosition: defaultPhotoPosition,
                  photoZoom: 1,
                }));
              }}
              onUpload={handlePreviewPhoto}
              onPositionChange={(position) =>
                setNewChild((current) => ({
                  ...current,
                  photoPosition: position,
                }))
              }
              onZoomChange={(zoom) =>
                setNewChild((current) => ({
                  ...current,
                  photoZoom: zoom,
                }))
              }
            />

            <div className="w-full min-w-0 space-y-6">
            
              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                <FormField label="Prénom">
                  <input
                    className={inputClass}
                    value={newChild.firstName}
                    onChange={(event) =>
                      setNewChild((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="Ex. Léo"
                    autoFocus
                  />
                </FormField>

                <FormField label="Nom">
                  <input
                    className={inputClass}
                    value={newChild.lastName}
                    onChange={(event) =>
                      setNewChild((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    placeholder="Ex. Tremblay"
                  />
                </FormField>

                <FormField label="Surnom">
                  <input
                    className={inputClass}
                    value={newChild.nickname}
                    onChange={(event) =>
                      setNewChild((current) => ({
                        ...current,
                        nickname: event.target.value,
                      }))
                    }
                    placeholder="Ex. Coco"
                  />
                </FormField>

                <FormField label="Sexe">
                  <select
                    className={selectClass}
                    value={newChild.sex}
                    onChange={(event) =>
                      setNewChild((current) => ({
                        ...current,
                        sex: event.target.value,
                      }))
                    }
                  >
                    <option>Garçon</option>
                    <option>Fille</option>
                    <option>Autre</option>
                  </select>
                </FormField>

                <FormField label="Date de fête">
                  <input
                    type="date"
                    className={inputClass}
                    value={newChild.birthDate}
                    onChange={(event) =>
                      setNewChild((current) => ({
                        ...current,
                        birthDate: event.target.value,
                      }))
                    }
                  />
                </FormField>
              </div>

              <FormField label="Couleur du calendrier">
                <ColorPicker
                  value={newChild.color}
                  options={availableColors}
                  onChange={(colorId) =>
                    setNewChild((current) => ({
                      ...current,
                      color: colorId,
                    }))
                  }
                />
              </FormField>

              <div className="grid w-full grid-cols-1 gap-3 pt-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isSaving ? "Création..." : "Créer le profil"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {children.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {children.map((child) => {
            const photo = child.photo || child.image || child.avatar || "";

            return (
              <article
                key={child.id}
                className="overflow-hidden rounded-[2rem] border border-[#EFE4D6] bg-white shadow-sm"
              >
                <div className="relative bg-[#FFFDF8] p-5">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => openProfile(child)}
                      className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EEF0E7] text-2xl font-bold text-[#8F9874] shadow-sm"
                    >
                      {photo ? (
                        <PhotoImage
                          src={photo}
                          alt={displayName(child)}
                          position={child.photoPosition}
                          zoom={child.photoZoom || 1}
                          className="h-full w-full"
                        />
                      ) : (
                        getInitials(child)
                      )}
                    </button>

                    <div className="min-w-0 flex-1 pt-2">
                      <h3 className="truncate text-2xl font-bold text-[#55534C]">
                        {displayName(child)}
                      </h3>

                      <p className="mt-1 text-sm text-[#746F64]">
                        Date de fête : {child.birthDate || "À compléter"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-[#EEF0E7] px-3 py-1 text-xs font-bold text-[#6F785F] ring-1 ring-[#D8DDCB]">
                          {child.sex || child.gender || "À compléter"}
                        </span>

                        <span className="inline-flex rounded-full bg-[#F4F0FA] px-3 py-1 text-xs font-bold text-[#8475A5] ring-1 ring-[#DED6EF]">
                          {child.age || getAgeFromBirthDate(child.birthDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => openProfile(child)}
                    className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl bg-[#EEF0E7] px-2 py-3 text-center text-xs font-bold text-[#6F785F] ring-1 ring-[#D8DDCB]"
                  >
                    <ScrollText className="mb-2 h-5 w-5" />
                    Profil
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpen("documents")}
                    className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl bg-[#FFF8EC] px-2 py-3 text-center text-xs font-bold text-[#9A7A43] ring-1 ring-[#EAD7B8]"
                  >
                    <FileText className="mb-2 h-5 w-5" />
                    Documents
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpen("sante")}
                    className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl bg-[#EEF5FB] px-2 py-3 text-center text-xs font-bold text-[#657F9F] ring-1 ring-[#C9DCEB]"
                  >
                    <StickyNote className="mb-2 h-5 w-5" />
                    Santé
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedChild && (
        <Popup
          title={`${selectedChild.firstName || ""} ${
            selectedChild.lastName || ""
          }`.trim()}
          kicker="Profil"
          close={() => {
            setSelectedChild(null);
            setConfirmRemove(false);
          }}
        >
          <div className="w-full min-w-0 space-y-5">
            <PhotoPicker
  photo={selectedChild.photo || selectedChild.image}
  position={selectedChild.photoPosition || defaultPhotoPosition}
  zoom={selectedChild.photoZoom || 1}
  fallback={getInitials(selectedChild)}
  onChoosePreset={(url) =>
    setSelectedChild((current) => ({
      ...current,
      photo: url,
      image: url,
      avatar: url,
      avatarS3Key: "",
      photoPosition: defaultPhotoPosition,
      photoZoom: 1,
    }))
  }
  onUpload={(event) => handlePhotoChange(selectedChild.id, event)}
  onPositionChange={(position) =>
    setSelectedChild((current) => ({
      ...current,
      photoPosition: position,
    }))
  }
  onZoomChange={(zoom) =>
    setSelectedChild((current) => ({
      ...current,
      photoZoom: zoom,
    }))
  }
/>

            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Prénom">
                <input
                  className={inputClass}
                  value={selectedChild.firstName || ""}
                  onChange={(event) =>
                    setSelectedChild((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Nom">
                <input
                  className={inputClass}
                  value={selectedChild.lastName || ""}
                  onChange={(event) =>
                    setSelectedChild((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Surnom">
                <input
                  className={inputClass}
                  value={selectedChild.nickname || ""}
                  onChange={(event) =>
                    setSelectedChild((current) => ({
                      ...current,
                      nickname: event.target.value,
                    }))
                  }
                />
              </FormField>

              <FormField label="Sexe">
                <select
                  className={selectClass}
                  value={selectedChild.sex || selectedChild.gender || ""}
                  onChange={(event) =>
                    setSelectedChild((current) => ({
                      ...current,
                      sex: event.target.value,
                      gender: event.target.value,
                    }))
                  }
                >
                  <option value="">À compléter</option>
                  <option>Garçon</option>
                  <option>Fille</option>
                  <option>Autre</option>
                </select>
              </FormField>

              <FormField label="Date de fête">
                <input
                  type="date"
                  className={inputClass}
                  value={
                    selectedChild.birthDate &&
                    selectedChild.birthDate !== "À compléter"
                      ? selectedChild.birthDate
                      : ""
                  }
                  onChange={(event) =>
                    setSelectedChild((current) => ({
                      ...current,
                      birthDate: event.target.value,
                      age: getAgeFromBirthDate(event.target.value),
                    }))
                  }
                />
              </FormField>
            </div>

            <FormField label="Couleur du calendrier">
              <ColorPicker
                value={selectedChild.color || "sage"}
                options={childColorOptions}
                onChange={(colorId) =>
                  setSelectedChild((current) => ({
                    ...current,
                    color: colorId,
                  }))
                }
              />
            </FormField>

            <FormField label="Note du profil">
  <textarea
    className={textareaClass}
    rows={5}
    value={selectedChild.profileNote || ""}
    onChange={(event) =>
      setSelectedChild((current) => ({
        ...current,
        profileNote: event.target.value,
      }))
    }
    placeholder="Habitudes, préférences, informations utiles..."
  />
</FormField>
<div className="rounded-2xl border border-[#EFE4D6] bg-white/60 px-4 py-3">
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8B193]">
        ID enfant
      </p>

      <code className="mt-1 block max-w-[260px] truncate text-[11px] font-semibold text-[#9A8D7C] sm:max-w-none">
        {selectedChild.id || "ID non disponible"}
      </code>
    </div>

    {selectedChild.id && (
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(selectedChild.id)}
        className="shrink-0 rounded-full border border-[#EFE4D6] bg-[#FFFDF8] px-3 py-1.5 text-[11px] font-bold text-[#8F9874] transition hover:bg-[#F7F1E8]"
      >
        Copier
      </button>
    )}
  </div>
</div>

            {confirmRemove && (
              <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm leading-6 text-[#B96B77] ring-1 ring-[#F3CDD3]">
                Es-tu certain de vouloir retirer ce profil enfant?
              </div>
            )}

            <div className="grid w-full grid-cols-1 gap-3 pt-2 md:grid-cols-2">
              {!confirmRemove ? (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
                >
                  <Trash2 className="h-4 w-4" />
                  Retirer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={removeSelectedChild}
                  disabled={isSaving}
                  className="rounded-2xl bg-[#B96B77] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isSaving ? "Suppression..." : "Confirmer le retrait"}
                </button>
              )}

              <button
                type="button"
                onClick={saveSelectedChild}
                disabled={isSaving}
                className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
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

function FormField({ label, children }) {
  return (
    <div className="w-full min-w-0 space-y-2.5">
      <label className="block text-sm font-bold text-[#4F4A45]">{label}</label>
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}

function ColorPicker({ value, onChange, options }) {
  const [open, setOpen] = useState(false);

  const selectedColor =
    options.find((color) => color.id === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#EFE4D6] bg-[#FFF8EC] px-4 py-3 text-sm font-bold text-[#4F4A45] shadow-sm"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="h-5 w-5 shrink-0 rounded-full shadow-inner"
            style={{ backgroundColor: selectedColor?.dot }}
          />

          <span className="truncate">
            {selectedColor?.label || "Choisir une couleur"}
          </span>
        </span>

        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#746F64]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#746F64]" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-[#EFE4D6]">
          <p className="mb-3 text-sm font-bold text-[#55534C]">
            Choisir une couleur
          </p>

          <div className="grid grid-cols-5 gap-3">
            {options.map((color) => {
              const selected = value === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => {
                    onChange(color.id);
                    setOpen(false);
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition hover:scale-105 ${
                    selected
                      ? "border-[#4F4A45] bg-[#FFF8EC] shadow-sm"
                      : "border-[#EFE4D6] bg-white"
                  }`}
                  title={color.label}
                  aria-label={color.label}
                >
                  <span
                    className="h-7 w-7 rounded-full shadow-inner"
                    style={{ backgroundColor: color.dot }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}