import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const trialPlans = [
  {
    id: "solo",
    name: "Solo",
    price: "5,95 $ CA / mois",
    storage: "5 Go",
    description: "Pour un parent qui veut centraliser ses souvenirs et documents.",
    highlights: ["5 Go de stockage", "Aucun invité", "Photos et documents familiaux"],
  },
  {
    id: "duo",
    name: "Duo",
    price: "9,95 $ CA / mois",
    storage: "10 Go",
    description: "Pour partager avec une personne de confiance.",
    highlights: ["10 Go de stockage", "1 invité", "Partage de profil inclus"],
  },
  {
    id: "famille_plus",
    name: "Famille+",
    price: "19,95 $ CA / mois",
    storage: "50 Go",
    description: "Pour une famille élargie avec plusieurs accès invités.",
    highlights: ["50 Go de stockage", "5 invités", "Espace familial complet"],
  },
];

export default function SubscriptionPopup({
  onClose = () => window.location.reload(),
}) {
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showGuestCode, setShowGuestCode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSubscription() {
      try {
        setCheckingSubscription(true);

        const response = await fetch(`${API_URL}/api/subscription`, {
          method: "GET",
          credentials: "include",
        });

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!isMounted) return;

        if (response.ok && data.hasAccess === true) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        console.error("Erreur vérification abonnement:", err);

        if (isMounted) {
          setHasAccess(false);
        }
      } finally {
        if (isMounted) {
          setCheckingSubscription(false);
        }
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    window.location.href = `${API_URL}/logout`;
  };

  const startCheckout = async (planId) => {
    try {
      setLoadingType(`trial-${planId}`);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          trial: true,
          plan: planId,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        console.error("Erreur backend Stripe Checkout:", {
          status: response.status,
          data,
        });

        throw new Error(
          data.message ||
            data.error ||
            `Erreur serveur. Code HTTP : ${response.status}`
        );
      }

      if (!data.url) {
        throw new Error("Aucune URL Stripe reçue.");
      }

      window.location.assign(data.url);
    } catch (err) {
      console.error("Erreur Stripe Checkout:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoadingType("");
    }
  };

  const activateAccessCode = async () => {
    const cleanCode = accessCode.trim();

    if (!cleanCode) {
      setError("Veuillez inscrire un code d’accès.");
      return;
    }

    try {
      setLoadingType("code");
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/api/subscription/activate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: cleanCode,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        console.error("Erreur backend code d’accès:", {
          status: response.status,
          data,
        });

        throw new Error(
          data.message ||
            data.error ||
            `Erreur serveur. Code HTTP : ${response.status}`
        );
      }

      setHasAccess(true);
      setSuccessMessage("Votre accès Famille+ est maintenant activé.");

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Erreur activation code:", err);
      setError(err.message || "Impossible d’activer ce code.");
    } finally {
      setLoadingType("");
    }
  };

  const activateGuestCode = async () => {
    const cleanCode = guestCode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Veuillez inscrire le code invité reçu par courriel.");
      return;
    }

    try {
      setLoadingType("guest-code");
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/api/profile-shares/redeem-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: cleanCode,
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Erreur serveur. Code HTTP : ${response.status}`
        );
      }

      setSuccessMessage(
        data.message || "Votre accès invité est maintenant associé à votre compte."
      );

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Erreur activation code invité:", err);
      setError(err.message || "Impossible d’associer ce code invité.");
    } finally {
      setLoadingType("");
    }
  };

  if (checkingSubscription) {
    return null;
  }

  if (hasAccess) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="relative max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[2rem] bg-[#FFFCF7] p-6 shadow-2xl ring-1 ring-black/5">
        <button
          type="button"
          onClick={handleLogout}
          className="absolute right-5 top-5 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#8A8178] transition hover:bg-[#F4EFE6] hover:text-[#3F3B35]"
          title="Se déconnecter"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Quitter</span>
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4E8] text-[#8FA173]">
          <Sparkles className="h-7 w-7" />
        </div>

        <h2 className="text-[1.55rem] font-bold leading-tight text-[#3F3B35]">
          Activez votre espace Camelio
        </h2>

        <p className="mt-3 max-w-2xl text-[0.95rem] leading-6 text-[#6B6258]">
          Votre profil parent est créé. Choisissez maintenant votre façon d’activer Camelio : un essai gratuit avec Stripe, un code promo Famille+ ou un code invité reçu par courriel.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </p>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {trialPlans.map((plan) => (
            <div key={plan.id} className="rounded-3xl border border-[#E7DCCB] bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-[#3F3B35]">{plan.name}</p>
              <p className="mt-1 text-xl font-black text-[#8FA173]">{plan.price}</p>
              <p className="mt-1 text-xs font-semibold text-[#7C756D]">
                Essai gratuit de 1 mois
              </p>
              <p className="mt-3 text-xs leading-5 text-[#6B6258]">{plan.description}</p>

              <div className="mt-4 space-y-2 text-xs text-[#565149]">
                {plan.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8FA173]" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => startCheckout(plan.id)}
                disabled={Boolean(loadingType)}
                className="mt-4 w-full rounded-2xl bg-[#8FA173] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingType === `trial-${plan.id}`
                  ? "Redirection..."
                  : `Choisir ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E7DCCB] bg-white">
            <button
              type="button"
              onClick={() => {
                setShowAccessCode((current) => !current);
                setError("");
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-[#3F3B35]">
                <KeyRound className="h-4 w-4 text-[#8FA173]" />
                J’ai un code promo Camelio
              </span>

              <span className="text-[#8A8178]">
                {showAccessCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {showAccessCode && (
              <div className="border-t border-[#F0E7DB] px-4 pb-4 pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") activateAccessCode();
                    }}
                    placeholder="Ex. PROMOMELANIE"
                    className="min-w-0 flex-1 rounded-xl border border-[#E7DCCB] bg-[#FFFCF7] px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#3F3B35] outline-none transition focus:border-[#8FA173] focus:ring-2 focus:ring-[#8FA173]/20"
                    disabled={Boolean(loadingType)}
                  />

                  <button
                    type="button"
                    onClick={activateAccessCode}
                    disabled={Boolean(loadingType)}
                    className="rounded-xl bg-[#3F3B35] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingType === "code" ? "..." : "Activer"}
                  </button>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#8A8178]">
                  Le code promo active un espace principal Famille+ dans DynamoDB, sans sélectionner de forfait Stripe.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E7DCCB] bg-white">
            <button
              type="button"
              onClick={() => {
                setShowGuestCode((current) => !current);
                setError("");
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-[#3F3B35]">
                <KeyRound className="h-4 w-4 text-[#8FA173]" />
                J’ai un code invité reçu par courriel
              </span>

              <span className="text-[#8A8178]">
                {showGuestCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {showGuestCode && (
              <div className="border-t border-[#F0E7DB] px-4 pb-4 pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guestCode}
                    onChange={(event) => setGuestCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") activateGuestCode();
                    }}
                    placeholder="Ex. INV-ABC12345"
                    className="min-w-0 flex-1 rounded-xl border border-[#E7DCCB] bg-[#FFFCF7] px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#3F3B35] outline-none transition focus:border-[#8FA173] focus:ring-2 focus:ring-[#8FA173]/20"
                    disabled={Boolean(loadingType)}
                  />

                  <button
                    type="button"
                    onClick={activateGuestCode}
                    disabled={Boolean(loadingType)}
                    className="rounded-xl bg-[#3F3B35] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingType === "guest-code" ? "..." : "Associer"}
                  </button>
                </div>

                <p className="mt-2 text-xs leading-5 text-[#8A8178]">
                  Ce code est unique, associé à votre adresse courriel et lie votre compte au compte principal qui vous a invité.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-[#8A8178]">
          Les essais gratuits sont traités par Stripe. Le code invité ne demande aucun paiement.
        </p>
      </div>
    </div>
  );
}
