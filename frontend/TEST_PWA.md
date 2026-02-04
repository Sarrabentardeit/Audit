# 🧪 Guide de Test du PWA

## 📋 Prérequis

1. Node.js installé
2. Navigateur moderne (Chrome, Edge, Firefox, Safari)
3. Pour mobile : navigateur mobile ou émulateur

---

## 🚀 Étape 1 : Lancer l'application en mode développement

```bash
cd frontend
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## ✅ Étape 2 : Vérifier le Service Worker

### Dans Chrome/Edge :

1. Ouvrir les **DevTools** (F12)
2. Aller dans l'onglet **"Application"** (ou "Applications")
3. Dans le menu de gauche, cliquer sur **"Service Workers"**
4. Vous devriez voir :
   - ✅ Service Worker actif avec le statut "activated and is running"
   - L'URL : `http://localhost:5173/sw.js`

### Si le Service Worker n'apparaît pas :

- Vérifier la console pour les erreurs
- Cliquer sur "Update" ou "Unregister" puis recharger la page
- Vérifier que le fichier `public/sw.js` existe

---

## 🌐 Étape 3 : Tester le Mode Hors Ligne

### Méthode 1 : Via les DevTools

1. Ouvrir les **DevTools** (F12)
2. Aller dans l'onglet **"Network"** (Réseau)
3. Cocher la case **"Offline"** (ou sélectionner "Offline" dans le dropdown)
4. Recharger la page (F5)
5. ✅ L'application doit **continuer à fonctionner** normalement

### Méthode 2 : Désactiver la connexion réseau

1. Sur Windows : Désactiver le Wi-Fi/Ethernet dans les paramètres
2. Sur Mac : Désactiver le Wi-Fi dans la barre de menu
3. Recharger la page
4. ✅ L'application doit fonctionner hors ligne

### Ce qui doit fonctionner hors ligne :

- ✅ Navigation entre les pages
- ✅ Affichage des audits existants
- ✅ Création de nouveaux audits
- ✅ Ajout de notes, commentaires
- ✅ Ajout de photos
- ✅ Calculs automatiques
- ✅ Export PDF

---

## 📱 Étape 4 : Tester l'Installation PWA

### Sur Desktop (Chrome/Edge) :

1. Ouvrir l'application dans Chrome ou Edge
2. Chercher l'icône **"Installer"** dans la barre d'adresse (à droite)
   - Ou aller dans le menu (⋮) → **"Installer l'application"**
3. Cliquer sur **"Installer"**
4. ✅ L'application s'ouvre dans une fenêtre séparée (sans barre d'adresse)

### Sur Mobile (Android/Chrome) :

1. Ouvrir l'application dans Chrome mobile
2. Appuyer sur le menu (⋮) en haut à droite
3. Sélectionner **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**
4. Confirmer l'installation
5. ✅ Une icône apparaît sur l'écran d'accueil
6. Ouvrir l'application depuis l'icône → elle s'ouvre en mode standalone

### Sur iOS (Safari) :

1. Ouvrir l'application dans Safari
2. Appuyer sur le bouton **"Partager"** (carré avec flèche)
3. Faire défiler et sélectionner **"Sur l'écran d'accueil"**
4. Confirmer
5. ✅ L'icône apparaît sur l'écran d'accueil

---

## 🔍 Étape 5 : Vérifier le Manifest

### Dans les DevTools :

1. Ouvrir les **DevTools** (F12)
2. Aller dans **"Application"** → **"Manifest"**
3. Vérifier :
   - ✅ Nom : "Audit d'Hygiène"
   - ✅ Icônes : icon-192.svg et icon-512.svg
   - ✅ Theme color : #1976d2
   - ✅ Display : standalone

---

## 📊 Étape 6 : Vérifier le Cache

### Dans les DevTools :

1. Ouvrir les **DevTools** (F12)
2. Aller dans **"Application"** → **"Cache Storage"**
3. Vous devriez voir :
   - ✅ `audit-hygiene-v1` avec les fichiers mis en cache
   - index.html, data_structure.json, icônes, etc.

---

## 🧪 Tests à Effectuer

### Test 1 : Créer un audit hors ligne
- [ ] Désactiver la connexion
- [ ] Créer un nouvel audit
- [ ] Ajouter des notes et commentaires
- [ ] Ajouter des photos
- [ ] Vérifier que tout est sauvegardé localement

### Test 2 : Recharger hors ligne
- [ ] Créer un audit
- [ ] Fermer l'application
- [ ] Désactiver la connexion
- [ ] Rouvrir l'application
- [ ] Vérifier que l'audit est toujours là

### Test 3 : Notification hors ligne
- [ ] Désactiver la connexion
- [ ] Vérifier qu'une notification "Mode hors ligne" apparaît en bas
- [ ] Réactiver la connexion
- [ ] Vérifier qu'une notification "Connexion rétablie" apparaît

### Test 4 : Installation PWA
- [ ] Installer l'application
- [ ] Vérifier qu'elle s'ouvre en mode standalone
- [ ] Vérifier qu'elle fonctionne hors ligne
- [ ] Vérifier que les données persistent

---

## 🐛 Dépannage

### Le Service Worker ne se charge pas :

1. Vérifier la console pour les erreurs
2. Vérifier que `public/sw.js` existe
3. Vider le cache : DevTools → Application → Clear storage → Clear site data
4. Recharger la page

### L'application ne fonctionne pas hors ligne :

1. Vérifier que le Service Worker est actif
2. Vérifier que les fichiers sont dans le cache (Application → Cache Storage)
3. Vérifier la console pour les erreurs

### L'icône d'installation n'apparaît pas :

1. Vérifier que le manifest.json est accessible : `http://localhost:5173/manifest.json`
2. Vérifier que les icônes existent : `http://localhost:5173/icon-192.svg`
3. Vérifier les erreurs dans la console
4. Utiliser HTTPS (certains navigateurs nécessitent HTTPS pour l'installation)

---

## 📝 Notes Importantes

- En mode développement (`npm run dev`), le Service Worker peut ne pas fonctionner parfaitement
- Pour un test complet, utilisez `npm run build` puis `npm run preview`
- Sur mobile, utilisez un serveur HTTPS ou testez en localhost via USB debugging
- Les données sont stockées dans IndexedDB et persistent même après fermeture

---

## ✅ Checklist de Validation

- [ ] Service Worker actif et fonctionnel
- [ ] Application fonctionne hors ligne
- [ ] Données sauvegardées localement
- [ ] Notification hors ligne visible
- [ ] Notification de reconnexion visible
- [ ] Manifest.json valide
- [ ] Icônes chargées correctement
- [ ] Installation PWA fonctionnelle (si supportée)
- [ ] Cache fonctionnel

---

**Bon test ! 🚀**

