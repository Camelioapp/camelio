import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  KeyRound,
  LogOut,
  UsersRound,
  ArrowRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

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

function normalizeGuestCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

export default function SubscriptionPopup({
  onClose = () => window.location.reload(),
  principalActivationOnly = false,
}) {
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
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

        const data = await response.json().catch(() => ({}));

        if (!isMounted) return;

        const subscriptionStatus = String(data?.status || "").toLowerCase();
        const accountType = String(data?.accountType || data?.subscription?.accountType || "").toLowerCase();

        const principalHasAccess =
          response.ok &&
          data.hasAccess === true &&
          subscriptionStatus !== "guest" &&
          accountType !== "guest";

        setHasAccess(
          principalActivationOnly
            ? principalHasAccess
            : response.ok && data.hasAccess === true
        );
      } catch (err) {
        console.error("Erreur vérification abonnement:", err);
        if (isMounted) setHasAccess(false);
      } finally {
        if (isMounted) setCheckingSubscription(false);
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, [principalActivationOnly]);

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trial: true, plan: planId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erreur serveur. Code HTTP : ${response.status}`
        );
      }

      if (!data.url) throw new Error("Aucune URL Stripe reçue.");

      window.location.assign(data.url);
    } catch (err) {
      console.error("Erreur Stripe Checkout:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoadingType("");
    }
  };

  const activateAccessCode = async () => {
    const cleanCode = accessCode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Veuillez inscrire un code promo.");
      return;
    }

    try {
      setLoadingType("code");
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/api/subscription/activate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erreur serveur. Code HTTP : ${response.status}`
        );
      }

      setHasAccess(true);
      setSuccessMessage("Votre accès Famille+ est maintenant activé.");
      setTimeout(() => onClose(), 700);
    } catch (err) {
      console.error("Erreur activation code:", err);
      setError(err.message || "Impossible d’activer ce code.");
    } finally {
      setLoadingType("");
    }
  };

  const activateGuestCode = async () => {
    const cleanCode = normalizeGuestCode(guestCode);

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Erreur serveur. Code HTTP : ${response.status}`
        );
      }

      setHasAccess(true);
      setSuccessMessage(data.message || "Votre accès invité est maintenant associé à votre compte.");

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error("Erreur activation code invité:", err);
      setError(err.message || "Impossible d’associer ce code invité.");
    } finally {
      setLoadingType("");
    }
  };

  if (checkingSubscription || hasAccess) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-[#FFFCF7] p-5 shadow-2xl ring-1 ring-black/5 sm:p-7">
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
            {principalActivationOnly ? "Activez votre compte principal" : "Activez votre espace Camelio"}
          </h2>
          <p className="mt-3 text-[0.95rem] leading-6 text-[#6B6258]">
            {principalActivationOnly
              ? "Vous êtes actuellement dans votre accès invité. Pour utiliser votre compte principal, choisissez un forfait. Tant que le compte principal n’est pas activé, seules les sections invitées restent accessibles."
              : "Choisissez un forfait avec 1 mois gratuit, utilisez un code promo ou associez un accès invité reçu par courriel."}
          </p>
        </div>

        {principalActivationOnly ? (
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-[#D8C8B6] bg-[#FFF8EC] px-4 py-3 text-center text-sm font-semibold leading-6 text-[#7A5F37]">
            Votre compte invité demeure actif. Le compte principal sera accessible uniquement après l’activation d’un abonnement.
          </div>
        ) : null}

        <div className="mx-auto mt-5 flex w-fit rounded-full border border-[#E7DCCB] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              billingCycle === "monthly" ? "bg-[#8FA173] text-white shadow-sm" : "text-[#6B6258] hover:bg-[#F4EFE6]"
            }`}
          >
            Abonnement mensuel
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              billingCycle === "annual" ? "bg-[#C9C4BC] text-white shadow-sm" : "text-[#6B6258] hover:bg-[#F4EFE6]"
            }`}
          >
            Abonnement annuel
          </button>
        </div>

        {billingCycle === "annual" ? (
          <p className="mx-auto mt-3 max-w-2xl rounded-2xl border border-[#E7DCCB] bg-[#F8F3EA] px-4 py-3 text-center text-sm font-semibold text-[#7C756D]">
            Les abonnements annuels seront bientôt disponibles.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-4 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            {successMessage}
          </p>
        ) : null}

        <div className={`mt-6 grid gap-4 ${principalActivationOnly ? "" : "lg:grid-cols-[1fr_320px]"}`}>
          <div className="grid gap-3 sm:grid-cols-3">
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
                      billingCycle === "annual" ? "bg-[#C9C4BC] opacity-80" : "bg-[#8FA173] hover:brightness-95 disabled:opacity-60"
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
          </div>

          {!principalActivationOnly ? (
          <div className="rounded-3xl border border-[#B5A7C8]/70 bg-[#FBF8FF] p-4 shadow-sm ring-1 ring-[#B5A7C8]/10">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#B5A7C8]/20 text-[#8B78A5]">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B78A5]">Invité</p>
                <h3 className="mt-1 text-xl font-black text-[#3F3B35]">Code d’accès</h3>
                <p className="mt-1 text-xs font-semibold text-[#7C756D]">Aucun paiement requis</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#4F4A45]">
              Utilisez le code reçu par courriel pour lier votre profil au compte principal qui vous a invité.
            </p>

            <div className="mt-4 space-y-2 text-xs text-[#565149]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8B78A5]" />
                <span>Accès limité aux sections partagées</span>
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

            <div className="mt-5 space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-[#8B78A5]">
                Code invité
              </label>
              <input
                type="text"
                value={guestCode}
                onChange={(event) => setGuestCode(normalizeGuestCode(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") activateGuestCode();
                }}
                placeholder="Ex. INV-ABC12345"
                className="w-full rounded-xl border border-[#B5A7C8]/50 bg-white px-3 py-3 text-sm font-semibold uppercase tracking-wide text-[#3F3B35] outline-none transition focus:border-[#B5A7C8] focus:ring-2 focus:ring-[#B5A7C8]/20"
                disabled={Boolean(loadingType)}
              />
              <button
                type="button"
                onClick={activateGuestCode}
                disabled={Boolean(loadingType)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B78A5] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingType === "guest-code" ? "Association..." : "Associer mon accès invité"}
                {loadingType !== "guest-code" ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
              <p className="text-xs leading-5 text-[#8A8178]">
                Le code fonctionne seulement avec l’adresse courriel utilisée pour l’invitation.
              </p>
            </div>
          </div>
          ) : null}
        </div>

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
            <span className="text-[#8A8178]">{showAccessCode ? "−" : "+"}</span>
          </button>

          {showAccessCode ? (
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
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-[#8A8178]">
          {principalActivationOnly
            ? "Les essais gratuits sont traités par Stripe. Votre accès invité reste disponible tant que le compte principal n’est pas activé."
            : "Les essais gratuits sont traités par Stripe. Le code invité ne demande aucun paiement."}
        </p>
      </div>
    </div>
  );
}
