import React from "react";

export default function Login() {
  const API_URL = import.meta.env.VITE_API_URL || "https://camelio.onrender.com";

  const loginWithCognito = () => {
    window.location.href = `${API_URL}/login`;
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/login`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>C</div>

        <h1 style={styles.title}>Bienvenue sur Camélio</h1>

        <p style={styles.subtitle}>
          Connectez-vous à votre espace familial sécurisé.
        </p>

        <button style={styles.googleButton} onClick={loginWithGoogle}>
          Continuer avec Google
        </button>

        <button style={styles.primaryButton} onClick={loginWithCognito}>
          Continuer avec courriel
        </button>

        <div style={styles.securityBox}>
          <div style={styles.securityIcon}>🔐</div>
          <div>
            <p style={styles.securityTitle}>Connexion sécurisée</p>
            <p style={styles.securityText}>
              Une vérification par SMS peut être demandée lors de la connexion.
            </p>
          </div>
        </div>

        <p style={styles.footerText}>
          Vos informations sont protégées avec AWS Cognito.
        </p>
      </div>

      <div style={styles.sidePanel}>
        <h2 style={styles.sideTitle}>Un seul endroit pour tout centraliser.</h2>
        <p style={styles.sideText}>
          Documents, informations importantes, souvenirs et organisation familiale.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#F8F3EC",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    margin: "auto",
    background: "#FFFFFF",
    padding: "40px",
    borderRadius: "28px",
    boxShadow: "0 20px 60px rgba(47, 45, 58, 0.08)",
    border: "1px solid #E8DED3",
  },
  logoCircle: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#7C6CF2",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    color: "#2F2D3A",
    fontSize: "30px",
    lineHeight: "1.2",
  },
  subtitle: {
    color: "#7A7685",
    fontSize: "16px",
    lineHeight: "1.5",
    marginTop: "12px",
    marginBottom: "28px",
  },
  googleButton: {
    width: "100%",
    padding: "15px 18px",
    borderRadius: "16px",
    border: "1px solid #E8DED3",
    background: "#FFFFFF",
    color: "#2F2D3A",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "12px",
  },
  primaryButton: {
    width: "100%",
    padding: "15px 18px",
    borderRadius: "16px",
    border: "none",
    background: "#7C6CF2",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  securityBox: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "#F7F4FF",
    border: "1px solid #E6DFFF",
    borderRadius: "18px",
    padding: "14px",
    marginTop: "20px",
  },
  securityIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },
  securityTitle: {
    margin: 0,
    color: "#2F2D3A",
    fontSize: "14px",
    fontWeight: "700",
  },
  securityText: {
    margin: "4px 0 0",
    color: "#7A7685",
    fontSize: "13px",
    lineHeight: "1.4",
  },
  footerText: {
    color: "#9A938A",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "24px",
  },
  sidePanel: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "80px",
    background:
      "radial-gradient(circle at top left, #E7DDFF, transparent 35%), radial-gradient(circle at bottom right, #DDEBFF, transparent 35%)",
  },
  sideTitle: {
    color: "#2F2D3A",
    fontSize: "42px",
    lineHeight: "1.1",
    maxWidth: "480px",
    margin: 0,
  },
  sideText: {
    color: "#6F6A78",
    fontSize: "18px",
    lineHeight: "1.6",
    maxWidth: "420px",
    marginTop: "18px",
  },
};
