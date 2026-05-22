import React, { useState } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

export default function SubscriptionPopup({ onClose }) {
  const [loadingType, setLoadingType] = useState("");
  const [error, setError] = useState("");

  const startCheckout = async (trial) => {
    try {
      setLoadingType(trial ? "trial" : "paid");
      setError("");

      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lookup_key: "camelio_monthly_499",
          trial,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Impossible de créer la session Stripe."
        );
      }

      if (!data.url) {
        throw new Error("Aucune URL Stripe reçue.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoadingType("");
    }
  };

  const closePopup = () => {
    localStorage.setItem("camelio_subscription_popup_seen", "true");
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-4">
      <div className="relative w-full max-w-[430px] rounded-[2rem] bg-[#FFFCF7] p-6 shadow-2xl ring-1 ring-black/5">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-4 top-4 rounded-full bg-[#F4EFE7] p-2 text-[#6B6258] transition hover:brightness-95"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4E8] text-[#8FA173]">
          <Sparkles className="h-7 w-7" />
        </div>

        <h2 className="pr-8 text-[1.55rem] font-bold leading-tight text-[#3F3B35]">
          Activez votre espace Camelio
        </h2>

        <p className="mt-3 text-[0.95rem] leading-6 text-[#6B6258]">
          Commencez avec un essai gratuit de 1 mois, ou passez directement à la
          version payante pour utiliser Camelio sans interruption.
        </p>

        <div className="mt-5 rounded-2xl bg-[#F8F3EA] p-4">
          <p className="text-sm font-bold text-[#3F3B35]">
            Forfait Camelio
          </p>

          <p className="mt-1 text-2xl font-bold text-[#8FA173]">
            4,99 $ CA / mois
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
              <span>Accès sécurisé à votre espace familial</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
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

        <button
          type="button"
          onClick={closePopup}
          className="mt-4 w-full text-sm font-semibold text-[#8A8178] underline-offset-4 hover:underline"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}