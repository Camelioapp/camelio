import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

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
          trial: false,
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

function LoadingDisplay() {
  return (
    <BillingCard>
      <div className="billing-logo">⏳</div>

      <div className="billing-description">
        <h1>Activation en cours</h1>
        <p>Nous synchronisons votre abonnement avec Camelio.</p>
      </div>
    </BillingCard>
  );
}

function SuccessDisplay({ message }) {
  return (
    <BillingCard>
      <div className="billing-logo">✅</div>

      <div className="billing-description">
        <h1>Abonnement activé</h1>
        <p>{message}</p>
      </div>

      <a className="billing-link-button" href="/">
        Retourner à Camelio
      </a>
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

      <a className="billing-link-button" href="/">
        Retourner à Camelio
      </a>
    </BillingCard>
  );
}

function ErrorDisplay({ error }) {
  return (
    <BillingCard>
      <div className="billing-logo">⚠️</div>

      <div className="billing-description">
        <h1>Synchronisation incomplète</h1>
        <p>{error}</p>
      </div>

      <a className="billing-link-button" href="/">
        Retourner à Camelio
      </a>
    </BillingCard>
  );
}

export default function Billing() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSubscription = async () => {
      const query = new URLSearchParams(window.location.search);

      if (query.get("canceled") === "true") {
        setStatus("canceled");
        return;
      }

      if (query.get("success") !== "true") {
        setStatus("idle");
        return;
      }

      const sessionId = query.get("session_id");

      if (!sessionId) {
        setStatus("error");
        setError("La session Stripe est manquante.");
        return;
      }

      try {
        setStatus("loading");

        const response = await fetch(
          `${API_URL}/api/subscription/sync-checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              session_id: sessionId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              "Impossible de synchroniser l’abonnement."
          );
        }

        if (data.status === "trialing") {
          setMessage("Votre essai gratuit de 1 mois est maintenant actif.");
        } else if (data.status === "active") {
          setMessage("Votre abonnement Camelio est maintenant actif.");
        } else {
          setMessage("Votre abonnement a été enregistré dans Camelio.");
        }

        setStatus("success");
      } catch (err) {
        console.error("Erreur sync abonnement:", err);
        setStatus("error");
        setError(
          err.message ||
            "L’abonnement a été créé dans Stripe, mais n’a pas été synchronisé dans Camelio."
        );
      }
    };

    syncSubscription();
  }, []);

  if (status === "loading") {
    return <LoadingDisplay />;
  }

  if (status === "success") {
    return <SuccessDisplay message={message} />;
  }

  if (status === "canceled") {
    return <CanceledDisplay />;
  }

  if (status === "error") {
    return <ErrorDisplay error={error} />;
  }

  return <ProductDisplay />;
}