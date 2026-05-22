import React, { useEffect, useState } from "react";

const ProductDisplay = () => (
  <section className="billing-page">
    <div className="billing-card">
      <div className="billing-logo">🦎</div>

      <div className="billing-description">
        <h3>Forfait Camelio</h3>
        <h5>4,99 $ CA / mois + taxes</h5>
        <p>
          Inclut 5 Go de stockage pour vos photos et documents familiaux.
        </p>
      </div>

      <form action="/create-checkout-session" method="POST">
        <input
          type="hidden"
          name="lookup_key"
          value="camelio_monthly_499"
        />

        <button className="billing-button" type="submit">
          Commencer l’abonnement
        </button>
      </form>
    </div>
  </section>
);

const SuccessDisplay = ({ sessionId }) => (
  <section className="billing-page">
    <div className="billing-card">
      <div className="billing-logo">✅</div>

      <div className="billing-description">
        <h3>Abonnement activé avec succès</h3>
        <p>Votre accès Camelio est maintenant actif.</p>
      </div>

      <form action="/create-portal-session" method="POST">
        <input
          type="hidden"
          id="session-id"
          name="session_id"
          value={sessionId}
        />

        <button className="billing-button" type="submit">
          Gérer mon abonnement
        </button>
      </form>
    </div>
  </section>
);

const Message = ({ message }) => (
  <section className="billing-page">
    <div className="billing-card">
      <p>{message}</p>
    </div>
  </section>
);

export default function Billing() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("success")) {
      setSuccess(true);
      setSessionId(query.get("session_id") || "");
    }

    if (query.get("canceled")) {
      setSuccess(false);
      setMessage(
        "L’abonnement a été annulé. Vous pouvez recommencer lorsque vous serez prêt."
      );
    }
  }, []);

  if (!success && message === "") {
    return <ProductDisplay />;
  }

  if (success && sessionId !== "") {
    return <SuccessDisplay sessionId={sessionId} />;
  }

  return <Message message={message} />;
}