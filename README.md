# Green City - Frontend React

Application frontend pour le système de gestion des espaces verts et loisirs.

## Technologies

- React 18
- React Router v6
- Axios pour les appels API
- Tailwind CSS pour le style
- Vite comme build tool
- Lucide React pour les icônes

## Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Builder pour la production
npm run build
```

## Configuration

L'application se connecte par défaut au backend Django sur `http://localhost:8000/api`.

Pour modifier l'URL de l'API, éditer le fichier `src/services/api.js`.

## Structure du projet

```
src/
├── components/      # Composants réutilisables
│   └── Layout.jsx
├── context/        # Context React (Auth)
│   └── AuthContext.jsx
├── pages/          # Pages de l'application
│   ├── Dashboard.jsx
│   ├── EspacesVerts.jsx
│   ├── Interventions.jsx
│   ├── Signalements.jsx
│   ├── Equipements.jsx
│   ├── Equipes.jsx
│   ├── Materiel.jsx
│   ├── Stock.jsx
│   └── Statistiques.jsx
├── services/       # Services API
│   └── api.js
├── App.jsx
└── main.jsx
```

## Fonctionnalités

### Authentification
- Connexion/Déconnexion
- Gestion des rôles (GestionnaireParticulier, GestionnaireGlobal, Maire)
- Protection des routes

### Modules
- **Dashboard**: Vue d'ensemble avec statistiques
- **Espaces Verts**: Gestion des parcs, jardins, squares
- **Interventions**: Planification et suivi des interventions
- **Signalements**: Gestion des anomalies et problèmes
- **Équipements**: Suivi des équipements dans les espaces
- **Équipes**: Gestion des équipes d'agents
- **Matériel**: Gestion du matériel (tondeuses, etc.)
- **Stock**: Gestion des stocks (fleurs, graines, etc.)
- **Statistiques**: Tableaux de bord et rapports

## Rôles et permissions

### Gestionnaire Particulier
- Consulter le planning
- Marquer les interventions effectuées
- Signaler des anomalies
- Notifier l'état des équipements

### Gestionnaire Global
- Toutes les permissions du Gestionnaire Particulier
- Créer/modifier les espaces verts
- Programmer les interventions
- Gérer le matériel et les stocks
- Gérer les équipes
- Consulter les statistiques

### Maire/Administrateur
- Consulter toutes les données
- Voir les statistiques globales
- Accès en lecture seule

## Développement

### Commandes disponibles

```bash
# Développement
npm run dev

# Build
npm run build

# Prévisualisation du build
npm run preview

# Lint
npm run lint
```

### Variables d'environnement

Créer un fichier `.env.local` :

```
VITE_API_URL=http://localhost:8000/api
```

## Notes

- Le token d'authentification est stocké dans localStorage
- Les requêtes API incluent automatiquement le token Bearer
- Les routes sont protégées et redirigent vers `/login` si non authentifié
