import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  KeyRound,
  ChevronDown,
  ChevronUp,
  LogOut,
  UsersRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

const trialPlans = [
  {
    id: "solo",
    name: "Solo",
    monthlyPrice: "5,95 $ CA / mois",
    annualPrice: "Bientôt disponible",
    subtitle: "Pour commencer simplement.",
    included: ["5 Go de stockage", "Photos et documents", "Souvenirs et notes"],
    excluded: ["Accès invité", "Partage avancé"],
  },
  {
    id: "duo",
    name: "Duo",
    monthlyPrice: "9,95 $ CA / mois",
    annualPrice: "Bientôt disponible",
    subtitle: "Pour partager avec une personne de confiance.",
    included: ["10 Go de stockage", "1 accès invité", "Partage de profil"],
    excluded: ["Plusieurs invités"],
  },
  {
    id: "famille_plus",
    name: "Famille+",
    monthlyPrice: "19,95 $ CA / mois",
    annualPrice: "Bientôt disponible",
    subtitle: "Pour une famille élargie et mieux organisée.",
    included: ["50 Go de stockage", "5 accès invités", "Espace familial complet"],
    excluded: [],
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
  const [billingCycle, setBillingCycle] = useState("monthly");

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
      <div className="relative max-h-[92vh] w-full max-w-[980px] overflow-y-auto rounded-[2rem] bg-[#FFFCF7] p-6 shadow-2xl ring-1 ring-black/5">
        <button
          type="button"
          onClick={handleLogout}
          className="absolute right-5 top-5 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#8A8178] transition hover:bg-[#F4EFE6] hover:text-[#3F3B35]"
          title="Se déconnecter"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Quitter</span>
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4E8] text-[#8FA173]">
          <Sparkles className="h-7 w-7" />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[1.55rem] font-bold leading-tight text-[#3F3B35]">
            Activez votre espace Camelio
          </h2>

          <p className="mt-3 text-[0.95rem] leading-6 text-[#6B6258]">
            Votre profil est créé. Choisissez un forfait avec 1 mois gratuit, utilisez un code promo ou associez un accès invité reçu par courriel.
          </p>
        </div>

        <div className="mx-auto mt-5 flex w-fit rounded-full border border-[#E7DCCB] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              billingCycle === "monthly"
                ? "bg-[#8FA173] text-white shadow-sm"
                : "text-[#6B6258] hover:bg-[#F4EFE6]"
            }`}
          >
            Abonnement mensuel
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              billingCycle === "annual"
                ? "bg-[#C9C4BC] text-white shadow-sm"
                : "text-[#6B6258] hover:bg-[#F4EFE6]"
            }`}
          >
            Abonnement annuel
          </button>
        </div>

        {billingCycle === "annual" ? (
          <p className="mx-auto mt-3 max-w-2xl rounded-2xl border border-[#E7DCCB] bg-[#F8F3EA] px-4 py-3 text-center text-sm font-semibold text-[#7C756D]">
            Les abonnements annuels seront bientôt disponibles. Les tarifs annuels sont affichés comme à venir et les boutons sont désactivés pour le moment.
          </p>
        ) : null}

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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trialPlans.map((plan) => (
            <div key={plan.id} className="flex rounded-3xl border border-[#E7DCCB] bg-white p-4 shadow-sm">
              <div className="flex w-full flex-col">
                <p className="text-sm font-black text-[#3F3B35]">{plan.name}</p>
                <p className={`mt-1 text-xl font-black ${billingCycle === "annual" ? "text-[#9A948C]" : "text-[#8FA173]"}`}>
                  {billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#7C756D]">
                  {billingCycle === "annual" ? "Tarif annuel à venir" : "1 mois gratuit inclus"}
                </p>
                <p className="mt-3 min-h-[42px] text-xs font-semibold leading-5 text-[#4F4A45]">
                  {plan.subtitle}
                </p>

                <div className="mt-3 space-y-2 text-xs text-[#565149]">
                  {plan.included.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8FA173]" />
                      <span>{item}</span>
                    </div>
                  ))}

                  {plan.excluded.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[#9A948C]">
                      <XCircle className="h-4 w-4 shrink-0 text-[#C9C4BC]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => billingCycle === "monthly" && startCheckout(plan.id)}
                  disabled={Boolean(loadingType) || billingCycle === "annual"}
                  className={`mt-auto w-full rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed ${
                    billingCycle === "annual"
                      ? "bg-[#C9C4BC] opacity-80"
                      : "bg-[#8FA173] hover:brightness-95 disabled:opacity-60"
                  }`}
                >
                  {billingCycle === "annual"
                    ? "Bientôt disponible"
                    : loadingType === `trial-${plan.id}`
                    ? "Redirection..."
                    : "Commencer 1 mois gratuit"}
                </button>
              </div>
            </div>
          ))}

          <div className="flex rounded-3xl border border-[#B5A7C8]/60 bg-[#FBF8FF] p-4 shadow-sm ring-1 ring-[#B5A7C8]/10">
            <div className="flex w-full flex-col">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B5A7C8]/20 text-[#8B78A5]">
                <UsersRound className="h-5 w-5" />
              </div>

              <p className="text-sm font-black text-[#3F3B35]">Invité</p>
              <p className="mt-1 text-xl font-black text-[#8B78A5]">Code d’accès</p>
              <p className="mt-1 text-xs font-semibold text-[#7C756D]">
                Aucun paiement requis
              </p>
              <p className="mt-3 min-h-[42px] text-xs font-semibold leading-5 text-[#4F4A45]">
                Pour rejoindre un espace familial partagé avec un code reçu par courriel.
              </p>

              <div className="mt-3 space-y-2 text-xs text-[#565149]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8B78A5]" />
                  <span>Accès lié au compte principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8B78A5]" />
                  <span>Permissions définies par le parent</span>
                </div>
                <div className="flex items-center gap-2 text-[#9A948C]">
                  <XCircle className="h-4 w-4 shrink-0 text-[#C9C4BC]" />
                  <span>Pas d’abonnement Stripe</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowGuestCode((current) => !current);
                  setError("");
                }}
                disabled={Boolean(loadingType)}
                className="mt-auto w-full rounded-2xl bg-[#B5A7C8] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showGuestCode ? "Fermer le code invité" : "Entrer mon code invité"}
              </button>
            </div>
          </div>
        </div>

        {showGuestCode && (
          <div className="mt-4 rounded-2xl border border-[#B5A7C8]/60 bg-[#FBF8FF] px-4 pb-4 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={guestCode}
                onChange={(event) => setGuestCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") activateGuestCode();
                }}
                placeholder="Ex. INV-ABC12345"
                className="min-w-0 flex-1 rounded-xl border border-[#B5A7C8]/50 bg-white px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#3F3B35] outline-none transition focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#B5A7C8]/20"
                disabled={Boolean(loadingType)}
              />

              <button
                type="button"
                onClick={activateGuestCode}
                disabled={Boolean(loadingType)}
                className="rounded-xl bg-[#8B78A5] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingType === "guest-code" ? "Association..." : "Associer mon accès"}
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#8A8178]">
              Ce code est unique, associé à votre adresse courriel et lie votre profil au compte principal qui vous a invité.
            </p>
          </div>
        )}

        <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#E7DCCB] bg-white">
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
              <div className="flex flex-col gap-2 sm:flex-row">
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
                  {loadingType === "code" ? "Activation..." : "Activer"}
                </button>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#8A8178]">
                Le code promo active un espace principal Famille+ dans DynamoDB, sans sélectionner de forfait Stripe.
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-[#8A8178]">
          Les essais gratuits sont traités par Stripe. Le code invité ne demande aucun paiement.
        </p>
      </div>
    </div>
  );
}
