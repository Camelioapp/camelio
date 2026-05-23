import React, { useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const APP_VERSION = "1.0.0";

const cardClass =
  "rounded-[1.5rem] border border-[#EADFCF] bg-[#FFFDF8] p-4 shadow-sm";

const dividerClass = "border-t border-[#EADFCF]";

export default function SettingsView({
  parentProfile = { name: "", email: "", phone: "", userId: "" },
  setParentProfile = () => {},
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: parentProfile.name || "",
    phone: parentProfile.phone || "",
  });

  const displayName = useMemo(() => {
    return parentProfile.name?.trim() || "Parent Camelio";
  }, [parentProfile.name]);

  const displayEmail = useMemo(() => {
    return parentProfile.email?.trim() || "test@test";
  }, [parentProfile.email]);

  const avatarLetter = useMemo(() => {
    const source = displayName || displayEmail || "P";
    return source.trim().charAt(0).toUpperCase();
  }, [displayName, displayEmail]);

  const handleSaveProfile = () => {
    setParentProfile({
      ...parentProfile,
      name: profileForm.name,
      phone: profileForm.phone,
    });

    setShowProfileModal(false);
  };

  const handleStartTrial = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lookup_key: "camelio_monthly_595",
          trial: true,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(
          data.message ||
            data.error ||
            "Impossible de démarrer l’essai gratuit."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      alert(error.message || "Une erreur est survenue.");
    }
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] px-4 pb-6 pt-3 text-[#55534C]">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8FA173]">Camelio</p>
            <h1 className="text-2xl font-black text-[#55534C]">Paramètres</h1>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF8] text-[#8FA173] shadow-sm ring-1 ring-[#EADFCF]"
            aria-label="Retour"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
        </header>

        <section className={cardClass}>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[#8FA173]" />
            <h2 className="font-bold text-[#55534C]">Mon profil</h2>
          </div>

          <div className={`${dividerClass} mt-3 pt-4`}>
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F1E2] text-3xl font-black text-[#8FA173]">
                {avatarLetter}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#9A9285]">Nom</span>
                <span className="max-w-[60%] truncate font-bold text-[#55534C]">
                  {displayName}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[#9A9285]">Courriel</span>
                <span className="max-w-[60%] truncate font-bold text-[#55534C]">
                  {displayEmail}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setProfileForm({
                    name: parentProfile.name || "",
                    phone: parentProfile.phone || "",
                  });
                  setShowProfileModal(true);
                }}
                className="rounded-full border border-[#8FA173] bg-white px-6 py-2 text-sm font-bold text-[#8FA173] transition hover:bg-[#F4F8F0]"
              >
                Modifier le profil
              </button>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#8FA173]" />
            <h2 className="font-bold text-[#55534C]">Abonnement</h2>
          </div>

          <div className={`${dividerClass} mt-3 pt-4 text-center`}>
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#E99AAA]">
              <span className="h-2 w-2 rounded-full bg-[#E99AAA]" />
              Aucun abonnement
            </p>

            <p className="mt-3 text-sm leading-relaxed text-[#8A8378]">
              Forfait Camelio · 5,95 $ CA / mois
              <br />
              5 Go de stockage inclus
            </p>

            <button
              type="button"
              onClick={handleStartTrial}
              className="mt-4 rounded-full bg-[#8FA173] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#7F9166]"
            >
              Commencer l’essai gratuit
            </button>
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#8FA173]" />
            <h2 className="font-bold text-[#55534C]">Application</h2>
          </div>

          <div className={`${dividerClass} mt-3`}>
            <SettingsRow
              icon={Bell}
              label="Notifications"
              onClick={() => setShowNotificationsModal(true)}
            />

            <SettingsRow
              icon={Lock}
              label="Confidentialité"
              onClick={() => setShowPrivacyModal(true)}
            />

            <SettingsRow
              icon={HelpCircle}
              label="Aide et support"
              onClick={() => setShowSupportModal(true)}
            />

            <SettingsRow
              icon={Info}
              label="À propos de Camelio"
              onClick={() => setShowAboutModal(true)}
              last
            />
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#FF6B5F] bg-white px-4 py-3 text-sm font-bold text-[#FF6B5F] transition hover:bg-[#FFF1F0]"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      {showProfileModal && (
        <Modal title="Modifier le profil" onClose={() => setShowProfileModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-[#55534C]">Nom</label>
              <input
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    name: event.target.value,
                  })
                }
                placeholder="Parent Camelio"
                className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm outline-none focus:border-[#8FA173] focus:ring-2 focus:ring-[#DDE8D6]"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#55534C]">
                Téléphone
              </label>
              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    phone: event.target.value,
                  })
                }
                placeholder="514 555-1234"
                className="mt-2 w-full rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm outline-none focus:border-[#8FA173] focus:ring-2 focus:ring-[#DDE8D6]"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#55534C]">
                Courriel
              </label>
              <input
                value={displayEmail}
                readOnly
                className="mt-2 w-full cursor-not-allowed rounded-2xl border border-[#EADFCF] bg-[#F4EFE7] px-4 py-3 text-sm font-bold text-[#777064] outline-none"
              />
              <p className="mt-2 text-xs text-[#8A8378]">
                Le courriel est lié au compte de connexion.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full rounded-2xl bg-[#8FA173] px-4 py-3 text-sm font-black text-white transition hover:bg-[#7F9166]"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      )}

      {showNotificationsModal && (
        <Modal
          title="Notifications"
          onClose={() => setShowNotificationsModal(false)}
        >
          <p className="text-sm leading-relaxed text-[#746F64]">
            Les préférences de notifications pourront être configurées ici :
            rappels, alertes importantes, documents, calendrier et mises à jour
            de compte.
          </p>
        </Modal>
      )}

      {showPrivacyModal && (
        <Modal
          title="Confidentialité"
          onClose={() => setShowPrivacyModal(false)}
        >
          <div className="space-y-3">
            <a
              href="/politique-confidentialite-camelio.pdf"
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#55534C]"
            >
              Politique de confidentialité
            </a>

            <a
              href="/conditions-utilisation-camelio.pdf"
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-[#EADFCF] bg-[#FFFDF8] px-4 py-3 text-sm font-bold text-[#55534C]"
            >
              Conditions d’utilisation
            </a>
          </div>
        </Modal>
      )}

      {showSupportModal && (
        <Modal title="Aide et support" onClose={() => setShowSupportModal(false)}>
          <p className="text-sm leading-relaxed text-[#746F64]">
            Pour obtenir de l’aide, contactez l’équipe Camelio ou consultez les
            ressources disponibles dans l’application.
          </p>

          <a
            href="mailto:support@camelio.app"
            className="mt-4 block rounded-2xl bg-[#8FA173] px-4 py-3 text-center text-sm font-black text-white"
          >
            Contacter le support
          </a>
        </Modal>
      )}

      {showAboutModal && (
        <Modal
          title="À propos de Camelio"
          onClose={() => setShowAboutModal(false)}
        >
          <p className="text-sm leading-relaxed text-[#746F64]">
            Camelio est un carnet numérique familial conçu pour centraliser les
            souvenirs, les documents et les informations importantes de votre
            enfant.
          </p>

          <p className="mt-4 text-xs font-bold text-[#A8A096]">
            Version de l’application {APP_VERSION}
          </p>
        </Modal>
      )}
    </div>
  );
}

function SettingsRow({ icon: Icon, label, onClick, last = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-[#FFF8EC] ${
        last ? "" : "border-b border-[#F0E6D8]"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[#9A9285]" />
        <span className="text-sm font-medium text-[#6A645B]">{label}</span>
      </div>

      <ChevronRight className="h-4 w-4 text-[#9A9285]" />
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-black text-[#55534C]">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8EC] text-[#55534C] ring-1 ring-[#EADFCF]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}