import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function BillingCard({ children }) {
  return (
    <section className="billing-page">
      <div className="billing-card">{children}</div>
    </section>
  );
}

function ProductDisplay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lookup_key: "camelio_monthly_595",
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
      setLoading(false);
    }
  };

  return (
    <BillingCard>
      <div className="billing-logo">🦎</div>

      <div className="billing-description">
        <h1>Forfait Camelio</h1>
        <h2>5,95 $ CA / mois + taxes</h2>
        <p>
          Accédez à Camelio avec 5 Go de stockage inclus pour vos photos et
          documents familiaux.
        </p>
      </div>

      <div className="billing-features">
        <div>✅ 5 Go de stockage inclus</div>
        <div>✅ Photos et documents familiaux</div>
        <div>✅ Application sécurisée</div>
        <div>✅ Annulation en tout temps</div>
      </div>

      {error && <p className="billing-error">{error}</p>}

      <button
        className="billing-button"
        type="button"
        onClick={startCheckout}
        disabled={loading}
      >
        {loading ? "Redirection vers Stripe..." : "Commencer l’abonnement"}
      </button>
    </BillingCard>
  );
}

function SuccessDisplay({ sessionId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Impossible d’ouvrir le portail Stripe."
        );
      }

      if (!data.url) {
        throw new Error("Aucune URL du portail Stripe reçue.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BillingCard>
      <div className="billing-logo">✅</div>

      <div className="billing-description">
        <h1>Abonnement activé</h1>
        <p>Votre accès Camelio est maintenant actif.</p>
      </div>

      {error && <p className="billing-error">{error}</p>}

      <button
        className="billing-button"
        type="button"
        onClick={openCustomerPortal}
        disabled={loading}
      >
        {loading ? "Ouverture..." : "Gérer mon abonnement"}
      </button>
    </BillingCard>
  );
}

function CanceledDisplay() {
  return (
    <BillingCard>
      <div className="billing-logo">ℹ️</div>

      <div className="billing-description">
        <h1>Abonnement annulé</h1>
        <p>
          Aucun paiement n’a été effectué. Vous pouvez recommencer lorsque vous
          serez prêt.
        </p>
      </div>

      <a className="billing-link-button" href="/billing">
        Retourner à l’abonnement
      </a>
    </BillingCard>
  );
}

export default function Billing() {
  const [success, setSuccess] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("success") === "true") {
      setSuccess(true);
      setSessionId(query.get("session_id") || "");
    }

    if (query.get("canceled") === "true") {
      setCanceled(true);
    }
  }, []);

  if (success && sessionId) {
    return <SuccessDisplay sessionId={sessionId} />;
  }

  if (canceled) {
    return <CanceledDisplay />;
  }

  return <ProductDisplay />;
}