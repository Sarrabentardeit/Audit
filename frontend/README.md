# 🏥 Application d'Audit d'Hygiène - Frontend

Application web progressive (PWA) pour la gestion des audits d'hygiène, fonctionnant hors ligne.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ et npm installés

### Installation

```bash
# Installer les dépendances
npm install
```

### Développement

```bash
# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build pour production

```bash
# Créer le build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure du projet

```
frontend/
├── src/
│   ├── components/      # Composants React réutilisables
│   │   ├── CategoryCard.tsx
│   │   └── ItemCard.tsx
│   ├── pages/           # Pages de l'application
│   │   ├── Home.tsx
│   │   └── Audit.tsx
│   ├── hooks/           # Custom hooks React
│   ├── services/        # Services (API, DB, etc.)
│   │   ├── db.ts        # IndexedDB (Dexie)
│   │   └── dataLoader.ts
│   ├── store/           # State management (Zustand)
│   │   └── auditStore.ts
│   ├── types/           # Types TypeScript
│   │   └── index.ts
│   ├── utils/           # Utilitaires
│   │   └── calculations.ts
│   ├── App.tsx          # Composant principal
│   └── main.tsx         # Point d'entrée
├── public/
│   └── data_structure.json  # Données de la grille d'audit
└── package.json
```

## 🛠️ Technologies utilisées

- **React 18+** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool rapide
- **Material-UI** - Composants UI
- **Zustand** - State management
- **Dexie.js** - IndexedDB wrapper
- **React Router** - Navigation
- **Workbox** - Service Workers (PWA)

## 📋 Fonctionnalités

### ✅ Implémentées
- [x] Structure de base du projet
- [x] Types TypeScript
- [x] Store Zustand pour la gestion d'état
- [x] Base de données IndexedDB (Dexie)
- [x] Calculs automatiques des scores
- [x] Interface de base avec Material-UI
- [x] Pages Home et Audit
- [x] Composants CategoryCard et ItemCard
- [x] Chargement des données depuis JSON

### 🚧 À venir
- [ ] Mode hors ligne complet (Service Workers)
- [ ] Gestion des photos
- [ ] Export PDF
- [ ] Graphique radar
- [ ] Synchronisation avec le backend
- [ ] Authentification

## 🎯 Utilisation

1. **Créer un nouvel audit** : Cliquez sur "Commencer un nouvel audit" depuis la page d'accueil
2. **Saisir les notes** : Pour chaque item, sélectionnez une note (Conforme, Mineur, Moyen, Majeur)
3. **Ajouter des commentaires** : Remplissez les champs de commentaires
4. **Voir les résultats** : Le score total, nombre de KO et amendes sont calculés automatiquement

## 📝 Notes

- Les données sont stockées localement dans IndexedDB
- Les calculs sont effectués en temps réel
- L'application fonctionne hors ligne (une fois les assets chargés)

## 🔧 Développement

### Ajouter un nouveau composant

```typescript
// src/components/MyComponent.tsx
import { Box } from '@mui/material';

export default function MyComponent() {
  return <Box>Mon composant</Box>;
}
```

### Utiliser le store

```typescript
import { useAuditStore } from '../store/auditStore';

function MyComponent() {
  const { currentAudit, updateItemNote } = useAuditStore();
  // ...
}
```

## 📚 Documentation

Voir les fichiers dans le dossier parent :
- `ROADMAP.md` - Plan de développement
- `TECHNOLOGIES.md` - Comparaison des technologies
- `DECISION.md` - Décisions techniques

## 🐛 Problèmes connus

- Le chargement des données JSON nécessite un serveur de développement (fetch)
- Les photos ne sont pas encore implémentées
- La synchronisation avec le backend n'est pas encore faite

## 📄 Licence

[À définir]



