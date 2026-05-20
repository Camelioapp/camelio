# Camelio, structure simplifiée

Cette version garde une seule page d'accueil et un seul dashboard principal.

## Structure

- `src/App.jsx` : décide quoi afficher selon l'état de connexion.
- `src/components/WelcomeScreen.jsx` : page d'accueil / connexion.
- `src/components/CamelioDashboard.jsx` : seul dashboard principal.
- `src/components/DashboardHome.jsx` : accueil interne du dashboard.
- `src/components/Children.jsx` : profil enfant, ajout d'enfant, modification.

## Fichiers retirés

- `src/components/Dashboard.jsx`
- `src/components/Dashboard3.jsx`
- `node_modules/`
- `dist/`
- `.env`

## Installation

Dans le dossier `app` :

```bash
npm install
npm run dev
```

Dans le dossier `app/server` :

```bash
npm install
npm run dev
```

Le frontend roule sur :

```txt
http://localhost:5173
```

Le backend Cognito roule sur :

```txt
http://localhost:3001
```
