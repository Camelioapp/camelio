// À utiliser avec une route backend POST /api/uploads/avatar
// qui retourne { url: "https://..." }

import React, { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
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

const childColorOptions = [
  { id: "sage", label: "Sauge", dot: "#A8B193" },
  { id: "rose", label: "Rose", dot: "#E99AAA" },
  { id: "blue", label: "Bleu", dot: "#9EBBE1" },
  { id: "mauve", label: "Mauve", dot: "#AD9BCF" },
  { id: "gold", label: "Doré", dot: "#D8B77F" },
  { id: "peach", label: "Pêche", dot: "#DF9F8A" },
  { id: "mint", label: "Menthe", dot: "#8FBFA8" },
  { id: "purple", label: "Violet", dot: "#AA99CF" },
  { id: "yellow", label: "Jaune", dot: "#D7C37F" },
  { id: "gray", label: "Gris", dot: "#A9AA91" },
  { id: "coral", label: "Corail", dot: "#E9897E" },
  { id: "teal", label: "Turquoise", dot: "#72B7B2" },
  { id: "sky", label: "Ciel", dot: "#8FC7E8" },
  { id: "lilac", label: "Lilas", dot: "#C4A7E7" },
  { id: "cream", label: "Crème", dot: "#E8D7B1" },
];

const presetPhotos = [
  {
    id: "camelio-enfant-1",
    label: "Enfant 1",
    url: "https://studiocameleon.ca/wp-content/uploads/2026/05/Camelio_enfant1.png",
  },
  {
    id: "enfant-blond-mauve",
    label: "Enfant blond",
    url: "https://studiocameleon.ca/wp-content/uploads/2026/05/enfant_06_sans_lunettes_clair_blond_mauve.png",
  },
  {
    id: "enfant-olive-roux",
    label: "Enfant roux",
    url: "https://studiocameleon.ca/wp-content/uploads/2026/05/enfant_48_sans_lunettes_olive_roux_rouge.png",
  },
  {
    id: "enfant-fonce-roux",
    label: "Enfant turquoise",
    url: "https://studiocameleon.ca/wp-content/uploads/2026/05/enfant_50_sans_lunettes_fonce_roux_turquoise.png",
  },
  {
    id: "garcon-peau-foncee",
    label: "Garçon",
    url: "https://studiocameleon.ca/wp-content/uploads/2026/05/garcon_sans_lunettes_brun_peau_foncee.png",
  },
];

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
  const [dragging, setDragging] = useState(false);
  const currentPosition = normalizePhotoPosition(position);

  const updatePosition = (clientX, clientY, target) => {
    if (!photo) return;

    const rect = target.getBoundingClientRect();

    onPositionChange({
      x: Math.max(
        0,
        Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100))
      ),
      y: Math.max(
        0,
        Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100))
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-dashed border-[#D8C8B6] bg-[#FFFDF8] p-5">
        <div className="flex flex-col items-center">
          <p className="mb-3 text-sm font-bold text-[#4F4A45]">
            Aperçu du profil
          </p>

          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EEF0E7] text-3xl font-bold text-[#8F9874] shadow-sm">
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

          {photo && (
            <button
              type="button"
              onClick={() => setIsCropping((current) => !current)}
              className={`mt-4 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm ring-1 ${
                isCropping
                  ? "bg-[#A8B193] text-white ring-[#A8B193]"
                  : "bg-white text-[#746F64] ring-[#EFE4D6]"
              }`}
            >
              <Camera className="h-4 w-4" />
              {isCropping ? "Terminer le recadrage" : "Recadrer"}
            </button>
          )}
        </div>

        {isCropping && photo && (
          <div className="mt-5 space-y-4">
            <div
              onMouseDown={() => setDragging(true)}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
              onMouseMove={(event) => {
                if (!dragging) return;
                updatePosition(
                  event.clientX,
                  event.clientY,
                  event.currentTarget
                );
              }}
              onTouchMove={(event) => {
                const touch = event.touches?.[0];
                if (!touch) return;

                updatePosition(
                  touch.clientX,
                  touch.clientY,
                  event.currentTarget
                );
              }}
              className="relative mx-auto flex h-72 w-full max-w-[380px] cursor-move items-center justify-center overflow-hidden rounded-[2rem] bg-[#EEF0E7] ring-1 ring-[#D8C8B6]"
            >
              <PhotoImage
                src={photo}
                alt="Recadrage"
                position={currentPosition}
                zoom={zoom}
                className="h-full w-full"
              />
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
              <label className="block text-xs font-bold text-[#746F64]">
                Zoom
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => onZoomChange(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
          </div>
        )}

        <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#EFE4D6] bg-white px-4 py-2 text-sm font-bold text-[#746F64] shadow-sm transition hover:bg-[#FAF4EC]">
          <Camera className="h-4 w-4" />
          Importer une photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
        </label>
      </div>

      <div className="rounded-[1.75rem] bg-white p-4 ring-1 ring-[#EFE4D6]">
        <p className="text-sm font-bold text-[#4F4A45]">
          Photos préprogrammées
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {presetPhotos.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChoosePreset(item.url)}
              className="overflow-hidden rounded-2xl bg-[#FFFDF8] p-2 ring-1 ring-[#EFE4D6] transition hover:bg-[#FAF4EC]"
            >
              <img
                src={item.url}
                alt={item.label}
                className="h-16 w-full rounded-xl object-cover"
              />
            </button>
          ))}
        </div>
      </div>
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
    firstName: "",
    lastName: "",
    nickname: "",
    birthDate: "",
    sex: "Garçon",
    color: "sage",
    photo: "",
    photoPosition: defaultPhotoPosition,
    photoZoom: 1,
  });

  const inputClass =
    "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

  const selectClass =
    "w-full rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold text-[#4F4A45] shadow-sm outline-none transition focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

  const textareaClass =
    "w-full min-h-[150px] rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-sm font-semibold leading-6 text-[#4F4A45] shadow-sm outline-none transition placeholder:text-[#A99D91] focus:border-[#A8B193] focus:bg-white focus:ring-2 focus:ring-[#A8B193]/20";

  const uploadAvatarToS3 = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur upload S3");
    }

    return data.url;
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

    return {
      ...child,
      id: child.id,
      name: nickname,
      firstName,
      lastName: child.lastName || "",
      nickname,
      birthDate: child.birthDate || "",
      sex: child.gender || child.sex || "",
      gender: child.gender || child.sex || "",
      color: child.color || "sage",
      age: getAgeFromBirthDate(child.birthDate),
      photo: child.avatar || child.photo || child.image || "",
      image: child.avatar || child.photo || child.image || "",
      avatar: child.avatar || child.photo || child.image || "",
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

    const localPreview = URL.createObjectURL(file);

    setPreviewPhoto(localPreview);
    setNewChild((current) => ({
      ...current,
      photo: localPreview,
      photoPosition: defaultPhotoPosition,
      photoZoom: 1,
    }));

    try {
      const s3Url = await uploadAvatarToS3(file);

      setNewChild((current) => ({
        ...current,
        photo: s3Url,
        avatar: s3Url,
        photoPosition: defaultPhotoPosition,
        photoZoom: 1,
      }));
    } catch (error) {
      console.error(error);
      alert("Impossible d’envoyer la photo vers S3.");
    }
  };

  const handlePhotoChange = async (childId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);

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
      const s3Url = await uploadAvatarToS3(file);

      const s3Update = {
        photo: s3Url,
        image: s3Url,
        avatar: s3Url,
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
      console.error(error);
      alert("Impossible d’envoyer la photo vers S3.");
    }
  };

  const resetForm = () => {
    setNewChild({
      firstName: "",
      lastName: "",
      nickname: "",
      birthDate: "",
      sex: "Garçon",
      color: "sage",
      photo: "",
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
          firstName,
          lastName: newChild.lastName.trim(),
          nickname,
          birthDate: newChild.birthDate || "",
          gender: newChild.sex || "",
          color: selectedColor.id,
          avatar: newChild.photo || "",
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
          nickname,
          avatar: newChild.photo || "",
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
      avatar:
        selectedChild.avatar || selectedChild.photo || selectedChild.image || "",
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
                setNewChild({
                  ...newChild,
                  photo: url,
                  avatar: url,
                  photoPosition: defaultPhotoPosition,
                  photoZoom: 1,
                });
              }}
              onUpload={handlePreviewPhoto}
              onPositionChange={(position) =>
                setNewChild({
                  ...newChild,
                  photoPosition: position,
                })
              }
              onZoomChange={(zoom) =>
                setNewChild({
                  ...newChild,
                  photoZoom: zoom,
                })
              }
            />

            <div className="w-full min-w-0 space-y-6">
              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                <FormField label="Prénom">
                  <input
                    className={inputClass}
                    value={newChild.firstName}
                    onChange={(event) =>
                      setNewChild({
                        ...newChild,
                        firstName: event.target.value,
                      })
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
                      setNewChild({
                        ...newChild,
                        lastName: event.target.value,
                      })
                    }
                    placeholder="Ex. Tremblay"
                  />
                </FormField>

                <FormField label="Surnom">
                  <input
                    className={inputClass}
                    value={newChild.nickname}
                    onChange={(event) =>
                      setNewChild({
                        ...newChild,
                        nickname: event.target.value,
                      })
                    }
                    placeholder="Ex. Coco"
                  />
                </FormField>

                <FormField label="Sexe">
                  <select
                    className={selectClass}
                    value={newChild.sex}
                    onChange={(event) =>
                      setNewChild({ ...newChild, sex: event.target.value })
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
                      setNewChild({
                        ...newChild,
                        birthDate: event.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <FormField label="Couleur du calendrier">
                <ColorPicker
                  value={newChild.color}
                  options={availableColors}
                  onChange={(colorId) =>
                    setNewChild({
                      ...newChild,
                      color: colorId,
                    })
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
            const photo = child.photo || child.image || "";

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
                setSelectedChild({
                  ...selectedChild,
                  photo: url,
                  image: url,
                  avatar: url,
                  photoPosition: defaultPhotoPosition,
                  photoZoom: 1,
                })
              }
              onUpload={(event) => handlePhotoChange(selectedChild.id, event)}
              onPositionChange={(position) =>
                setSelectedChild({
                  ...selectedChild,
                  photoPosition: position,
                })
              }
              onZoomChange={(zoom) =>
                setSelectedChild({
                  ...selectedChild,
                  photoZoom: zoom,
                })
              }
            />

            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Prénom">
                <input
                  className={inputClass}
                  value={selectedChild.firstName || ""}
                  onChange={(event) =>
                    setSelectedChild({
                      ...selectedChild,
                      firstName: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Nom">
                <input
                  className={inputClass}
                  value={selectedChild.lastName || ""}
                  onChange={(event) =>
                    setSelectedChild({
                      ...selectedChild,
                      lastName: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Surnom">
                <input
                  className={inputClass}
                  value={selectedChild.nickname || ""}
                  onChange={(event) =>
                    setSelectedChild({
                      ...selectedChild,
                      nickname: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Sexe">
                <select
                  className={selectClass}
                  value={selectedChild.sex || selectedChild.gender || ""}
                  onChange={(event) =>
                    setSelectedChild({
                      ...selectedChild,
                      sex: event.target.value,
                      gender: event.target.value,
                    })
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
                    setSelectedChild({
                      ...selectedChild,
                      birthDate: event.target.value,
                      age: getAgeFromBirthDate(event.target.value),
                    })
                  }
                />
              </FormField>
            </div>

            <FormField label="Couleur du calendrier">
              <ColorPicker
                value={selectedChild.color || "sage"}
                options={childColorOptions}
                onChange={(colorId) =>
                  setSelectedChild({
                    ...selectedChild,
                    color: colorId,
                  })
                }
              />
            </FormField>

            <FormField label="Note du profil">
              <textarea
                className={textareaClass}
                rows={5}
                value={selectedChild.profileNote || ""}
                onChange={(event) =>
                  setSelectedChild({
                    ...selectedChild,
                    profileNote: event.target.value,
                  })
                }
                placeholder="Habitudes, préférences, informations utiles..."
              />
            </FormField>

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
            className="h-5 w-5 shrink-0 rounded-full"
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
                    selected ? "border-[#55534C]" : "border-[#EFE4D6]"
                  }`}
                  title={color.label}
                  aria-label={color.label}
                >
                  <span
                    className="h-7 w-7 rounded-full"
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