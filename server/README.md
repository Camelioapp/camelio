# Camelio Server

Backend Node / Express pour connecter Camelio à Amazon Cognito avec `openid-client`.

## Installation

```bash
cd server
npm install
```

## Configuration

Copie le fichier `.env.example` vers `.env`.

```bash
copy .env.example .env
```

Remplis ensuite les valeurs Cognito.

## Démarrer

```bash
npm run dev
```

Serveur local :

```text
http://localhost:3001
```

## Routes

```text
GET /health
GET /login
GET /callback
GET /me
GET /logout
POST /api/referral-code
```

## Configuration Cognito

Dans ton App Client Cognito, ajoute :

Callback URL :

```text
http://localhost:3001/callback
```

Sign out URL :

```text
http://localhost:5173
```

Scopes :

```text
openid
email
profile
```

## Frontend React

Pour connecter ton bouton Connexion :

```js
window.location.href = "http://localhost:3001/login";
```

Pour vérifier la session :

```js
fetch("http://localhost:3001/me", {
  credentials: "include"
})
  .then((res) => res.json())
  .then(console.log);
```

## Important

`express-session` utilise le stockage mémoire par défaut.
C'est correct pour un prototype local, mais pas pour la production.
En production, utilise Redis, DynamoDB ou une base de données pour les sessions.
