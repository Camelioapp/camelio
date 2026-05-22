import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Trash2,
} from "lucide-react";

import { Field, Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#EAA5AF] focus:ring-2 focus:ring-[#F3CDD3]";

const textareaClass =
  "mt-2 min-h-[105px] w-full resize-none rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm leading-6 text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#EAA5AF] focus:ring-2 focus:ring-[#F3CDD3]";

function PhotoCard({ photo, children, onOpen, onDelete }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-[#EFE4D6]">
      <button
        type="button"
        onClick={() => onOpen(photo)}
        className="block w-full"
      >
        <img
          src={photo.url}
          alt={photo.title}
          className="h-44 w-full object-cover"
        />
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-[#55534C]">{photo.title}</p>
            <p className="mt-1 text-xs text-[#746F64]">
              {photo.album} · {photo.date}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDelete(photo)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBECEF] text-[#B96B77] ring-1 ring-[#F3CDD3]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {photo.children?.length ? (
            photo.children.map((childName) => {
              const child = children.find((item) => item.name === childName);
              const color = getColor(child?.color);

              return (
                <span
                  key={childName}
                  className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${color.soft}`}
                >
                  {displayName(child || { name: childName })}
                </span>
              );
            })
          ) : (
            <span className="rounded-full bg-[#FFFDF8] px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
              Personne identifié
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ photo, photos = [], close, onDelete }) {
  const currentIndex = photos.findIndex((item) => item.id === photo.id);
  const [index, setIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

  const currentPhoto = photos[index] || photo;

  const previous = () => {
    setIndex((current) => (current === 0 ? photos.length - 1 : current - 1));
  };

  const next = () => {
    setIndex((current) => (current === photos.length - 1 ? 0 : current + 1));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white md:h-[96vh] md:w-[96vw] md:rounded-[2rem] md:shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#EFE4D6] bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#EAA5AF]">
              Aperçu photo
            </p>

            <h3 className="mt-1 truncate text-xl font-bold text-[#55534C]">
              {currentPhoto.title}
            </h3>

            <p className="mt-1 truncate text-xs text-[#746F64]">
              {currentPhoto.album} · {currentPhoto.date}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3EA] text-lg font-bold text-[#746F64]"
          >
            ×
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-2 md:p-4">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title}
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>

        <div className="grid !grid-cols-3 gap-3 border-t border-[#EFE4D6] bg-white p-4">
          <button
            type="button"
            onClick={previous}
            disabled={photos.length <= 1}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-40"
          >
            ← Précédente
          </button>

          <button
            type="button"
            onClick={() => onDelete(currentPhoto)}
            className="rounded-2xl bg-[#FBECEF] px-4 py-3 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
          >
            Supprimer
          </button>

          <button
            type="button"
            onClick={next}
            disabled={photos.length <= 1}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-40"
          >
            Suivante →
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryPopup({
  title,
  kicker,
  photos,
  emptyText,
  close,
  onOpen,
  onDelete,
  children,
  header,
}) {
  const [sortMode, setSortMode] = useState("recent");

  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortMode === "oldest") return (a.date || "").localeCompare(b.date || "");
    if (sortMode === "album") {
      return (
        (a.album || "").localeCompare(b.album || "") ||
        (b.date || "").localeCompare(a.date || "")
      );
    }

    return (b.date || "").localeCompare(a.date || "");
  });

  return (
    <Popup title={title} kicker={kicker} close={close}>
      <div className="space-y-4">
        {header}

        <div className="rounded-2xl bg-[#F8F3EA] p-4 ring-1 ring-[#EFE4D6]">
          <Field label="Trier par">
            <select
              className={inputClass}
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
            >
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="album">Album</option>
            </select>
          </Field>
        </div>

        <div className="grid !grid-cols-2 gap-3">
          {sortedPhotos.length ? (
            sortedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                children={children}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="col-span-2 rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              {emptyText}
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}

function PhotoPopup({
  albums,
  children,
  photoForm,
  setPhotoForm,
  toggleChild,
  uploadPhotos,
  removeSelectedPhoto,
  addPhoto,
  addAlbumFromPhotoPopup,
  close,
  isSaving,
}) {
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    title: "",
    description: "",
  });

  const createInlineAlbum = () => {
    const title = newAlbum.title.trim();
    if (!title) return;

    addAlbumFromPhotoPopup(title, newAlbum.description);

    setNewAlbum({
      title: "",
      description: "",
    });

    setShowNewAlbum(false);
  };

  return (
    <Popup title="Ajouter des photos" kicker="Nouvelle photo" close={close}>
      <div className="space-y-5">
        <div className="rounded-3xl bg-[#FFF8F9] p-4 ring-1 ring-[#F3CDD3]">
          <p className="label text-[#B96B77]">1. Choisir la ou les photos</p>

          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
            <Download className="h-4 w-4" />
            Importer une ou plusieurs photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={uploadPhotos}
            />
          </label>

          {photoForm.urls.length > 0 && (
            <div className="mt-4 grid !grid-cols-3 gap-2">
              {photoForm.urls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-[#EFE4D6]"
                >
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="h-24 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeSelectedPhoto(index)}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[#B96B77] shadow-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 ring-1 ring-[#EFE4D6]">
          <p className="label">2. Ajouter les détails</p>

          <div className="mt-4 space-y-5">
            <Field label="Titre">
              <input
                className={inputClass}
                value={photoForm.title}
                onChange={(event) =>
                  setPhotoForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Ex. Sortie au parc"
                autoFocus
              />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="label">Album</p>

                <button
                  type="button"
                  onClick={() => setShowNewAlbum((current) => !current)}
                  className="text-xs font-bold text-[#B96B77]"
                >
                  + Ajouter un album
                </button>
              </div>

              <select
                className={inputClass}
                value={photoForm.album}
                onChange={(event) =>
                  setPhotoForm((current) => ({
                    ...current,
                    album: event.target.value,
                  }))
                }
              >
                {albums.map((album) => (
                  <option key={album.title} value={album.title}>
                    {album.title}
                  </option>
                ))}
              </select>

              {showNewAlbum && (
                <div className="mt-4 space-y-4 rounded-2xl bg-[#FFF8F9] p-4 ring-1 ring-[#F3CDD3]">
                  <Field label="Nom du nouvel album">
                    <input
                      className={inputClass}
                      value={newAlbum.title}
                      onChange={(event) =>
                        setNewAlbum((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Ex. Vacances, école, famille..."
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      className={textareaClass}
                      value={newAlbum.description}
                      onChange={(event) =>
                        setNewAlbum((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Optionnel"
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={createInlineAlbum}
                    className="w-full rounded-2xl bg-[#EAA5AF] px-4 py-3 text-xs font-bold text-white"
                  >
                    Créer et sélectionner l’album
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="label">Qui est sur la photo?</p>

              <div className="mt-3 space-y-2">
                {children.map((child) => {
                  const selected = photoForm.children.includes(child.name);
                  const color = getColor(child.color);

                  return (
                    <button
                      key={child.name}
                      type="button"
                      onClick={() => toggleChild(child.name)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ${
                        selected
                          ? `${color.soft} ring-2`
                          : "bg-white text-[#746F64] ring-[#EFE4D6]"
                      }`}
                    >
                      <img
                        src={child.photo}
                        alt={displayName(child)}
                        className="h-10 w-10 rounded-xl object-cover"
                      />

                      <div className="flex-1">
                        <p className="font-bold">{displayName(child)}</p>
                        <p className="text-xs">
                          {selected
                            ? "Présent sur la photo"
                            : "Cliquer pour identifier"}
                        </p>
                      </div>

                      <span className="text-sm font-bold">
                        {selected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid !grid-cols-2 gap-3">
          <button
            type="button"
            onClick={close}
            disabled={isSaving}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6] disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={addPhoto}
            disabled={isSaving}
            className="rounded-2xl bg-[#EAA5AF] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSaving ? "Enregistrement..." : "Ajouter"}
          </button>
        </div>
      </div>
    </Popup>
  );
}

function AlbumPopup({ albumForm, setAlbumForm, addAlbum, close }) {
  return (
    <Popup title="Créer un album" kicker="Nouvel album" close={close}>
      <div className="space-y-5">
        <Field label="Nom de l’album">
          <input
            className={inputClass}
            value={albumForm.title}
            onChange={(event) =>
              setAlbumForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Ex. Vacances été 2026"
            autoFocus
          />
        </Field>

        <Field label="Description">
          <textarea
            className={textareaClass}
            value={albumForm.description}
            onChange={(event) =>
              setAlbumForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Ex. Photos des vacances, école, activités..."
          />
        </Field>

        <div className="grid !grid-cols-2 gap-3">
          <button
            type="button"
            onClick={close}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={addAlbum}
            className="rounded-2xl bg-[#EAA5AF] px-4 py-3 text-sm font-bold text-white"
          >
            Créer
          </button>
        </div>
      </div>
    </Popup>
  );
}

export default function Photos({ children = [] }) {
  const [albums, setAlbums] = useState([
    {
      title: "Souvenirs",
      description: "Moments importants",
      photos: 0,
    },
  ]);

  const [photos, setPhotos] = useState([]);
  const [selectedGalleryChild, setSelectedGalleryChild] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [showAlbumPopup, setShowAlbumPopup] = useState(false);
  const [showRecentPhotos, setShowRecentPhotos] = useState(true);
  const [recentChildFilter, setRecentChildFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [photoForm, setPhotoForm] = useState({
    title: "",
    album: "Souvenirs",
    children: [],
    urls: [],
    files: [],
  });

  const [albumForm, setAlbumForm] = useState({
    title: "",
    description: "",
  });

  const normalizedAlbums = useMemo(() => {
    const albumMap = new Map();

    albums.forEach((album) => {
      albumMap.set(album.title, {
        ...album,
        photos: 0,
      });
    });

    photos.forEach((photo) => {
      if (!albumMap.has(photo.album)) {
        albumMap.set(photo.album, {
          title: photo.album,
          description: "Album photo",
          photos: 0,
        });
      }

      const current = albumMap.get(photo.album);
      albumMap.set(photo.album, {
        ...current,
        photos: current.photos + 1,
      });
    });

    return Array.from(albumMap.values());
  }, [albums, photos]);

  const recentPhotos = useMemo(() => {
    const sortedPhotos = [...photos].sort((a, b) =>
      (b.date || "").localeCompare(a.date || "")
    );

    if (recentChildFilter === "all") {
      return sortedPhotos;
    }

    return sortedPhotos.filter((photo) =>
      photo.children?.includes(recentChildFilter)
    );
  }, [photos, recentChildFilter]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/photos`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Impossible de charger les photos.");
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error(error);
      setErrorMessage("Impossible de charger les photos depuis le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const toggleChild = (childName) => {
    setPhotoForm((current) => ({
      ...current,
      children: current.children.includes(childName)
        ? current.children.filter((name) => name !== childName)
        : [...current.children, childName],
    }));
  };

  const uploadPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setPhotoForm((current) => ({
      ...current,
      files: [...current.files, ...files],
      urls: [...current.urls, ...files.map((file) => URL.createObjectURL(file))],
    }));

    event.target.value = "";
  };

  const removeSelectedPhoto = (indexToRemove) => {
    setPhotoForm((current) => ({
      ...current,
      urls: current.urls.filter((_, index) => index !== indexToRemove),
      files: current.files.filter((_, index) => index !== indexToRemove),
    }));
  };

  const addAlbum = () => {
    const title = albumForm.title.trim();
    if (!title) return;

    const alreadyExists = normalizedAlbums.some(
      (album) => album.title.toLowerCase() === title.toLowerCase()
    );

    if (!alreadyExists) {
      setAlbums((current) => [
        {
          title,
          description: albumForm.description.trim() || "Album personnalisé",
          photos: 0,
        },
        ...current,
      ]);
    }

    setPhotoForm((current) => ({
      ...current,
      album: title,
    }));

    setAlbumForm({
      title: "",
      description: "",
    });

    setShowAlbumPopup(false);
  };

  const addAlbumFromPhotoPopup = (title, description = "") => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const alreadyExists = normalizedAlbums.some(
      (album) => album.title.toLowerCase() === cleanTitle.toLowerCase()
    );

    if (!alreadyExists) {
      setAlbums((current) => [
        {
          title: cleanTitle,
          description: description.trim() || "Album personnalisé",
          photos: 0,
        },
        ...current,
      ]);
    }

    setPhotoForm((current) => ({
      ...current,
      album: cleanTitle,
    }));
  };

  const uploadOnePhoto = async (file, title, album, selectedChildren) => {
    const presignResponse = await fetch(`${API_URL}/api/photos/presign`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || "image/jpeg",
      }),
    });

    if (!presignResponse.ok) {
      throw new Error("Impossible de préparer l’envoi vers S3.");
    }

    const presignData = await presignResponse.json();

    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Impossible d’envoyer l’image vers S3.");
    }

    const saveResponse = await fetch(`${API_URL}/api/photos`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: presignData.photoId,
        title,
        album,
        children: selectedChildren,
        s3Key: presignData.s3Key,
        fileName: file.name,
      }),
    });

    if (!saveResponse.ok) {
      throw new Error("Impossible d’enregistrer la photo dans DynamoDB.");
    }
  };

  const addPhoto = async () => {
    if (!photoForm.files.length) {
      alert("Ajoute au moins une photo avant d’enregistrer.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const baseTitle = photoForm.title.trim() || "Photo";

      for (let index = 0; index < photoForm.files.length; index += 1) {
        const file = photoForm.files[index];

        const title =
          photoForm.files.length > 1 ? `${baseTitle} ${index + 1}` : baseTitle;

        await uploadOnePhoto(file, title, photoForm.album, photoForm.children);
      }

      setPhotoForm({
        title: "",
        album: photoForm.album,
        children: [],
        urls: [],
        files: [],
      });

      setShowPhotoPopup(false);
      await loadPhotos();
    } catch (error) {
      console.error("Erreur ajout photo:", error);
      alert(error.message || "Impossible d’ajouter la photo.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/photos/${photoToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Impossible de supprimer la photo.");
      }

      setSelectedPhoto(null);
      setPhotoToDelete(null);
      await loadPhotos();
    } catch (error) {
      console.error(error);
      setErrorMessage("Impossible de supprimer la photo.");
    }
  };

  const galleryPhotos = selectedGalleryChild
    ? photos.filter((photo) =>
        photo.children?.includes(selectedGalleryChild.name)
      )
    : [];

  const albumPhotos = selectedAlbum
    ? photos.filter((photo) => photo.album === selectedAlbum.title)
    : [];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Photos"
        subtitle="Classer les photos, indiquer qui est dessus et créer des albums."
        icon={Camera}
      />

      {errorMessage && (
        <div className="rounded-2xl bg-[#FBECEF] p-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
          {errorMessage}
        </div>
      )}

      <div className="rounded-[2rem] bg-[#FFF8F9] p-5 shadow-sm ring-1 ring-[#F3CDD3]">
        <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#EFE4D6]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAA5AF] text-white shadow-sm">
            <Camera className="h-6 w-6" />
          </div>

          <h3 className="mt-3 text-xl font-bold text-[#55534C]">
            Ajouter des photos
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#746F64]">
            Importe une ou plusieurs photos, choisis les enfants présents et
            classe-les dans un album.
          </p>
        </div>

        <div className="mt-5 grid !grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowPhotoPopup(true)}
            className="rounded-2xl bg-[#EAA5AF] px-4 py-4 text-sm font-bold text-white shadow-sm"
          >
            Ajouter des photos
          </button>

          <button
            type="button"
            onClick={() => setShowAlbumPopup(true)}
            className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
          >
            Créer un album
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Galeries par enfant
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Ouvre une galerie personnalisée selon les photos taguées.
            </p>
          </div>

          <div className="rounded-full bg-[#FFF8F9] px-3 py-1 text-xs font-extrabold text-[#B96B77] ring-1 ring-[#F3CDD3]">
            {children.length}
          </div>
        </div>

        <div className="mt-5 grid !grid-cols-1 gap-3 sm:!grid-cols-2">
          {children.map((child) => {
            const color = getColor(child.color);
            const count = photos.filter((photo) =>
              photo.children?.includes(child.name)
            ).length;

            return (
              <button
                key={child.name}
                type="button"
                onClick={() => setSelectedGalleryChild(child)}
                className={`group rounded-3xl bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${color.soft}`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={child.photo}
                    alt={displayName(child)}
                    className="h-20 w-20 rounded-3xl object-cover shadow-sm ring-4 ring-white"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold text-[#55534C]">
                      {displayName(child)}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#746F64]">
                      Galerie personnelle
                    </p>

                    <p className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-white">
                      {count} photo{count > 1 ? "s" : ""}
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">Albums</h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Sélectionne un album pour ouvrir sa galerie.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAlbumPopup(true)}
            className="rounded-full bg-[#FFF8F9] px-3 py-1 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]"
          >
            + Album
          </button>
        </div>

        <div className="mt-5 grid !grid-cols-1 gap-3 sm:!grid-cols-2">
          {normalizedAlbums.map((album) => (
            <button
              key={album.title}
              type="button"
              onClick={() => setSelectedAlbum(album)}
              className="group rounded-3xl bg-[#FFF8F9] p-4 text-left ring-1 ring-[#F3CDD3] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#55534C]">
                    {album.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#746F64]">
                    {album.description}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-[#EAA5AF] transition group-hover:translate-x-0.5" />
              </div>

              <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
                {album.photos} photo{album.photos > 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <button
          type="button"
          onClick={() => setShowRecentPhotos((current) => !current)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Photos récentes
            </h3>

            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              {recentPhotos.length} photo{recentPhotos.length > 1 ? "s" : ""}{" "}
              affichée{recentPhotos.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF8F9] text-[#B96B77] ring-1 ring-[#F3CDD3]">
            {showRecentPhotos ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {showRecentPhotos && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <Field label="Filtrer par enfant">
                <select
                  className={inputClass}
                  value={recentChildFilter}
                  onChange={(event) => setRecentChildFilter(event.target.value)}
                >
                  <option value="all">Tous les enfants</option>

                  {children.map((child) => (
                    <option key={child.name} value={child.name}>
                      {displayName(child)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {isLoading ? (
              <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                Chargement des photos...
              </div>
            ) : recentPhotos.length ? (
              <div className="grid !grid-cols-2 gap-3">
                {recentPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    children={children}
                    onOpen={setSelectedPhoto}
                    onDelete={setPhotoToDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
                Aucune photo ne correspond au filtre sélectionné.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedGalleryChild && (
        <GalleryPopup
          title={`Galerie de ${displayName(selectedGalleryChild)}`}
          kicker="Galerie enfant"
          photos={galleryPhotos}
          emptyText="Aucune photo taguée pour cet enfant."
          close={() => setSelectedGalleryChild(null)}
          onOpen={setSelectedPhoto}
          onDelete={setPhotoToDelete}
          children={children}
          header={
            <div
              className={`flex items-center gap-3 rounded-3xl p-4 ring-1 ${
                getColor(selectedGalleryChild.color).soft
              }`}
            >
              <img
                src={selectedGalleryChild.photo}
                alt={displayName(selectedGalleryChild)}
                className="h-14 w-14 rounded-2xl object-cover"
              />

              <div>
                <p className="font-bold text-[#55534C]">
                  {displayName(selectedGalleryChild)}
                </p>

                <p className="text-sm text-[#746F64]">
                  {galleryPhotos.length} photo
                  {galleryPhotos.length > 1 ? "s" : ""} taguée
                  {galleryPhotos.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          }
        />
      )}

      {selectedAlbum && (
        <GalleryPopup
          title={`Album ${selectedAlbum.title}`}
          kicker="Galerie album"
          photos={albumPhotos}
          emptyText="Aucune photo dans cet album."
          close={() => setSelectedAlbum(null)}
          onOpen={setSelectedPhoto}
          onDelete={setPhotoToDelete}
          children={children}
          header={
            <div className="rounded-3xl bg-[#FFF8F9] p-4 ring-1 ring-[#F3CDD3]">
              <p className="font-bold text-[#55534C]">{selectedAlbum.title}</p>

              <p className="mt-1 text-sm text-[#746F64]">
                {selectedAlbum.description}
              </p>

              <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#B96B77] ring-1 ring-[#F3CDD3]">
                {albumPhotos.length} photo{albumPhotos.length > 1 ? "s" : ""}
              </p>
            </div>
          }
        />
      )}

      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          photos={recentPhotos.length ? recentPhotos : photos}
          close={() => setSelectedPhoto(null)}
          onDelete={setPhotoToDelete}
        />
      )}

      {photoToDelete && (
        <Popup
          title="Supprimer cette photo?"
          kicker="Confirmation"
          close={() => setPhotoToDelete(null)}
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#746F64]">
              Es-tu certain de vouloir supprimer « {photoToDelete.title} »?
            </p>

            <div className="grid !grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDeletePhoto}
                className="rounded-2xl bg-[#B96B77] px-4 py-3 text-sm font-bold text-white"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Popup>
      )}

      {showPhotoPopup && (
        <PhotoPopup
          albums={normalizedAlbums}
          children={children}
          photoForm={photoForm}
          setPhotoForm={setPhotoForm}
          toggleChild={toggleChild}
          uploadPhotos={uploadPhotos}
          removeSelectedPhoto={removeSelectedPhoto}
          addPhoto={addPhoto}
          addAlbumFromPhotoPopup={addAlbumFromPhotoPopup}
          close={() => setShowPhotoPopup(false)}
          isSaving={isSaving}
        />
      )}

      {showAlbumPopup && (
        <AlbumPopup
          albumForm={albumForm}
          setAlbumForm={setAlbumForm}
          addAlbum={addAlbum}
          close={() => setShowAlbumPopup(false)}
        />
      )}
    </div>
  );
}