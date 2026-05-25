import React, { useState } from "react";
import { Sparkles, CheckCircle2, KeyRound } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

export default function SubscriptionPopup({ onClose = () => window.location.reload() }) {
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const startCheckout = async (trial) => {
    try {
      setLoadingType(trial ? "trial" : "paid");
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lookup_key: "camelio_monthly_595",
          trial,
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
            "Impossible de créer la session Stripe."
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
        throw new Error(
          data.message ||
            data.error ||
            "Ce code n’est pas valide."
        );
      }

      setSuccessMessage("Votre accès gratuit est maintenant activé.");

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-4">
      <div className="relative w-full max-w-[430px] rounded-[2rem] bg-[#FFFCF7] p-6 shadow-2xl ring-1 ring-black/5">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4E8] text-[#8FA173]">
          <Sparkles className="h-7 w-7" />
        </div>

        <h2 className="text-[1.55rem] font-bold leading-tight text-[#3F3B35]">
          Activez votre espace Camelio
        </h2>

        <p className="mt-3 text-[0.95rem] leading-6 text-[#6B6258]">
          Pour continuer, choisissez votre option d’abonnement. Vous pouvez
          commencer avec un essai gratuit de 1 mois, passer directement à la
          version payante ou utiliser un code d’accès.
        </p>

        <div className="mt-5 rounded-2xl bg-[#F8F3EA] p-4">
          <p className="text-sm font-bold text-[#3F3B35]">Forfait Camelio</p>

          <p className="mt-1 text-2xl font-bold text-[#8FA173]">
            5,95 $ CA / mois
          </p>

          <p className="mt-1 text-xs text-[#7C756D]">
            + taxes, annulation en tout temps
          </p>

          <div className="mt-4 space-y-2 text-sm text-[#565149]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8FA173]" />
              <span>5 Go de stockage inclus</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8FA173]" />
              <span>Photos et documents familiaux</span>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#8FA173]" />
              <span>Espace sécurisé accessible en tout temps</span>
            </div>
          </div>
        </div>

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

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => startCheckout(true)}
            disabled={Boolean(loadingType)}
            className="w-full rounded-2xl bg-[#8FA173] px-5 py-3.5 text-[0.98rem] font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingType === "trial"
              ? "Redirection vers Stripe..."
              : "Commencer mon essai gratuit de 1 mois"}
          </button>

          <button
            type="button"
            onClick={() => startCheckout(false)}
            disabled={Boolean(loadingType)}
            className="w-full rounded-2xl border border-[#8FA173]/40 bg-white px-5 py-3.5 text-[0.98rem] font-bold text-[#7A8B69] shadow-sm transition hover:bg-[#F4F7EF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingType === "paid"
              ? "Redirection vers Stripe..."
              : "Passer à la version payante"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#E7DCCB] bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-[#3F3B35]">
            <KeyRound className="h-4 w-4 text-[#8FA173]" />
            <p className="text-sm font-bold">J’ai un code d’accès</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  activateAccessCode();
                }
              }}
              placeholder="Ex. CAMELIO2026"
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
            Le code permet d’activer un accès gratuit sans passer par le paiement
            Stripe.
          </p>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-[#8A8178]">
          Le paiement est traité de façon sécurisée par Stripe.
        </p>
      </div>
    </div>
  );
}