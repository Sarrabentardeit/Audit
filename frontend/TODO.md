# 📋 TODO - Frontend - Ce qui reste à faire

## ✅ CE QUI EST DÉJÀ FAIT

### Phase 1 : Setup & Architecture ✅
- [x] Projet React + TypeScript + Vite initialisé
- [x] Structure de dossiers créée
- [x] Types TypeScript complets
- [x] Thème Material-UI premium configuré
- [x] Design moderne et professionnel implémenté

### Phase 2 : Fonctionnalités Core ✅ (Partiellement)
- [x] Checklist interactive (CategoryCard, ItemCard)
- [x] Sélection de notes (Conforme, Mineur, Moyen, Majeur)
- [x] Champs commentaires
- [x] Calculs automatiques (scores, KO, amendes)
- [x] Stockage local IndexedDB (Dexie)
- [x] Chargement des données depuis JSON
- [x] Layout premium avec navigation
- [x] Pages Home et Audit

---

## 🚧 CE QUI RESTE À FAIRE

### 🔴 PRIORITÉ HAUTE

#### 1. **Gestion des Photos** 📸
- [ ] Créer le composant `PhotoUpload.tsx`
- [ ] Intégrer l'API Camera (mobile/tablette)
- [ ] Permettre l'import depuis la galerie
- [ ] Compression des images (browser-image-compression)
- [ ] Stockage local des photos (IndexedDB)
- [ ] Affichage des photos dans ItemCard
- [ ] Galerie de photos avec preview
- [ ] Suppression de photos

**Fichiers à créer :**
- `src/components/PhotoUpload.tsx`
- `src/components/PhotoGallery.tsx`
- `src/hooks/useCamera.ts`
- `src/utils/imageCompression.ts`

---

#### 2. **PWA & Mode Hors Ligne** 📱
- [ ] Créer `public/manifest.json`
- [ ] Configurer Workbox pour Service Workers
- [ ] Créer `public/sw.js` (Service Worker)
- [ ] Mettre en cache les assets statiques
- [ ] Mettre en cache les données JSON
- [ ] Détecter la connexion réseau
- [ ] Indicateur de statut hors ligne
- [ ] Queue de synchronisation
- [ ] Icônes PWA (192x192, 512x512)

**Fichiers à créer :**
- `public/manifest.json`
- `public/sw.js`
- `src/hooks/useOffline.ts`
- `src/services/sync.ts`
- `src/components/OfflineIndicator.tsx`

---

#### 3. **Export PDF** 📄
- [ ] Créer le template de rapport PDF
- [ ] Intégrer jsPDF + html2canvas
- [ ] Créer le graphique radar (Recharts)
- [ ] Page de synthèse avec résultats
- [ ] Détails par catégorie
- [ ] Actions correctives
- [ ] Inclusion des photos dans le PDF
- [ ] Bouton d'export dans la page Audit

**Fichiers à créer :**
- `src/utils/pdfExport.ts`
- `src/components/RadarChart.tsx`
- `src/components/PDFTemplate.tsx`

---

### 🟡 PRIORITÉ MOYENNE

#### 4. **Améliorations UX** ✨
- [ ] Animations de chargement (skeleton loaders)
- [ ] Messages de confirmation (Snackbar)
- [ ] Validation des formulaires
- [ ] Gestion des erreurs (ErrorBoundary)
- [ ] Feedback visuel lors de la sauvegarde
- [ ] Optimisation des performances (React.memo, useMemo)
- [ ] Tests de régression visuels

**Fichiers à créer :**
- `src/components/LoadingSkeleton.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/hooks/useSnackbar.ts`

---

#### 5. **Fonctionnalités Avancées** 🎯
- [ ] Liste des audits précédents
- [ ] Recherche et filtrage des audits
- [ ] Édition d'un audit existant
- [ ] Suppression d'un audit
- [ ] Duplication d'un audit
- [ ] Export Excel (optionnel)
- [ ] Graphiques de tendances

**Fichiers à créer :**
- `src/pages/AuditList.tsx`
- `src/components/AuditCard.tsx`
- `src/components/SearchBar.tsx`

---

#### 6. **Responsive & Accessibilité** 📱
- [ ] Tests sur différentes tailles d'écran
- [ ] Optimisation pour tablette (landscape/portrait)
- [ ] Optimisation pour smartphone
- [ ] Mode sombre (optionnel)
- [ ] Accessibilité (ARIA labels, keyboard navigation)
- [ ] Tests sur appareils réels

---

### 🟢 PRIORITÉ BASSE

#### 7. **Backend Integration** 🔌
- [ ] Service API pour communiquer avec le backend
- [ ] Authentification (quand backend sera prêt)
- [ ] Synchronisation avec le serveur
- [ ] Gestion des conflits de données
- [ ] Upload des photos vers le serveur

**Fichiers à créer :**
- `src/services/api.ts`
- `src/services/auth.ts`
- `src/hooks/useAuth.ts`

---

#### 8. **Tests** 🧪
- [ ] Tests unitaires (Jest + React Testing Library)
- [ ] Tests d'intégration
- [ ] Tests E2E (Playwright)
- [ ] Tests de performance

**Fichiers à créer :**
- `src/__tests__/`
- `playwright.config.ts`

---

## 📊 RÉSUMÉ PAR PHASE

| Phase | Statut | Progression |
|-------|--------|------------|
| **Phase 1** : Setup | ✅ Terminé | 100% |
| **Phase 2** : Core | ✅ Terminé | 100% |
| **Phase 3** : PWA | ❌ À faire | 0% |
| **Phase 4** : Photos | ❌ À faire | 0% |
| **Phase 5** : PDF | ❌ À faire | 0% |
| **Phase 6** : UX | 🟡 En cours | 70% |
| **Phase 7** : Backend | ❌ À faire | 0% |
| **Phase 8** : Tests | ❌ À faire | 0% |

**Progression globale : ~40%**

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### Ordre de priorité suggéré :

1. **Gestion des Photos** (1-2 jours)
   - Fonctionnalité essentielle pour un audit
   - Relativement simple à implémenter

2. **PWA & Mode Hors Ligne** (2-3 jours)
   - Fonctionnalité clé du projet
   - Nécessite du temps pour bien tester

3. **Export PDF** (2-3 jours)
   - Important pour générer les rapports
   - Peut être fait en parallèle avec PWA

4. **Améliorations UX** (1-2 jours)
   - Polish final de l'application
   - Améliore l'expérience utilisateur

---

## 📝 NOTES IMPORTANTES

- Le design premium est déjà en place ✅
- Les calculs automatiques fonctionnent ✅
- Le stockage local fonctionne ✅
- Il reste principalement les fonctionnalités "métier" à ajouter

---

**Dernière mise à jour :** 2025-01-XX


