import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://api.camelio.app";

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
          trial: false,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
  console.error("Erreur backend abonnement:", {
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
  const goToApp = () => {
    window.location.href = "/";
  };

  return (
    <BillingCard>
      <div className="billing-logo">✅</div>

      <div className="billing-description">
        <h1>Abonnement activé</h1>
        <p>{message}</p>
      </div>

      <button className="billing-button" type="button" onClick={goToApp}>
        Retourner à Camelio
      </button>
    </BillingCard>
  );
}

function CanceledDisplay() {
  const goToApp = () => {
    window.location.href = "/";
  };

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

      <button className="billing-button" type="button" onClick={goToApp}>
        Retourner à Camelio
      </button>
    </BillingCard>
  );
}

function ErrorDisplay({ error, details, onRetry }) {
  const goToApp = () => {
    window.location.href = "/";
  };

  return (
    <BillingCard>
      <div className="billing-logo">⚠️</div>

      <div className="billing-description">
        <h1>Synchronisation incomplète</h1>
        <p>{error}</p>

        {details && (
          <pre
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "12px",
              background: "#FFF4E8",
              color: "#6B4E2E",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
              textAlign: "left",
              overflowX: "auto",
            }}
          >
            {details}
          </pre>
        )}
      </div>

      <button className="billing-button" type="button" onClick={onRetry}>
        Réessayer la synchronisation
      </button>

      <button className="billing-link-button" type="button" onClick={goToApp}>
        Retourner à Camelio
      </button>
    </BillingCard>
  );
}

export default function Billing() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [details, setDetails] = useState("");
  const [sessionId, setSessionId] = useState("");

  const syncSubscription = async (checkoutSessionId) => {
    if (!checkoutSessionId) {
      setStatus("error");
      setError("La session Stripe est manquante.");
      setDetails("");
      return;
    }

    try {
      setStatus("loading");
      setError("");
      setDetails("");

      const response = await fetch(
        `${API_URL}/api/subscription/sync-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            session_id: checkoutSessionId,
          }),
        }
      );

      const responseText = await response.text();

      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {
          rawResponse: responseText,
        };
      }

      if (!response.ok) {
        const readableDetails = JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            response: data,
          },
          null,
          2
        );

        if (response.status === 401) {
          throw new Error(
            `Utilisateur non connecté au backend.\n\n${readableDetails}`
          );
        }

        if (response.status === 404) {
          throw new Error(
            `La route /api/subscription/sync-checkout est introuvable sur le backend.\n\n${readableDetails}`
          );
        }

        throw new Error(
          `${
            data.message ||
            data.error ||
            "Impossible de synchroniser l’abonnement."
          }\n\n${readableDetails}`
        );
      }

      if (!data.subscription) {
        throw new Error(
          "Le backend a répondu avec succès, mais aucun abonnement n’a été retourné."
        );
      }

      if (data.status === "trialing") {
        setMessage("Votre essai gratuit de 1 mois est maintenant actif.");
      } else if (data.status === "active") {
        setMessage("Votre abonnement Camelio est maintenant actif.");
      } else {
        setMessage(
          `Votre abonnement a été enregistré dans Camelio. Statut : ${data.status}`
        );
      }

      setStatus("success");
    } catch (err) {
      console.error("Erreur sync abonnement:", err);

      const fullMessage =
        err.message ||
        "L’abonnement a été créé dans Stripe, mais n’a pas été synchronisé dans Camelio.";

      const [mainError, technicalDetails] = fullMessage.split("\n\n");

      setStatus("error");
      setError(mainError);
      setDetails(technicalDetails || "");
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("canceled") === "true") {
      setStatus("canceled");
      return;
    }

    if (query.get("success") !== "true") {
      setStatus("idle");
      return;
    }

    const checkoutSessionId = query.get("session_id") || "";
    setSessionId(checkoutSessionId);

    syncSubscription(checkoutSessionId);
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
    return (
      <ErrorDisplay
        error={error}
        details={details}
        onRetry={() => syncSubscription(sessionId)}
      />
    );
  }

  return <ProductDisplay />;
}