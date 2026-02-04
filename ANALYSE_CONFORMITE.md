# ✅ Analyse de Conformité - Formules de Calcul

## 📊 Résumé des Vérifications

| Formule | Code Actuel | Document | Statut |
|---------|-------------|----------|--------|
| **Score item** | `note × pondération` | ✅ Correct | ✅ |
| **Score catégorie** | `(Σ(note × pondération) / Σ(pondération)) × 100` | ✅ Correct | ✅ |
| **Score total** | `Moyenne des catégories` | ✅ Correct | ✅ |
| **Amendes** | `Nombre de KO × 2250€` | ✅ Correct | ✅ |
| **Classification Binaire/Multiple** | ❌ Non implémentée | ⚠️ Requis | ❌ |
| **Calcul des KO** | ⚠️ Basé sur note < 1.0 | ⚠️ À revoir | ⚠️ |

---

## ✅ Ce qui est CORRECT

### 1. Formule du Score ✅
**Code actuel :**
```typescript
// Score catégorie
totalScore += note * item.ponderation;
totalPonderation += item.ponderation;
return (totalScore / totalPonderation) * 100;

// Score total
totalScore = categoryScoreValues.reduce((a, b) => a + b, 0) / categoryScoreValues.length;
```

**Document :**
```
Score = (Σ(note × pondération) / Σ(pondération)) × 100
```

✅ **CONFORME** - La formule est correcte.

---

### 2. Formule des Amendes ✅
**Code actuel :**
```typescript
const numberOfKO = calculateNumberOfKO(items);
return numberOfKO * 2250;
```

**Document :**
```
Amendes = Nombre de KO × 2250€
```

✅ **CONFORME** - La formule est correcte.

---

## ⚠️ Ce qui doit être CORRIGÉ

### 1. Classification Binaire/Multiple ❌

**Problème :** Le code actuel permet de sélectionner directement les notes (1.0, 0.7, 0.3, 0.0), mais selon votre document, il faut d'abord compter les non-conformités, puis convertir en note selon la classification.

**Document :**
- **Binaire** : 0 non-conformité = note 1.0, 1 non-conformité = note 0.0
- **Multiple** : 0 = 1.0, 1 = 0.7, 2 = 0.3, >3 = 0.0

**Code actuel :**
```typescript
// L'utilisateur sélectionne directement la note
<Button onClick={() => handleNoteChange(1.0)}>Conforme (1)</Button>
<Button onClick={() => handleNoteChange(0.7)}>Mineur (0.7)</Button>
```

**Ce qu'il faut :**
1. Ajouter un champ `classification: 'binary' | 'multiple'` dans `AuditItem`
2. Pour les items binaires : compter 0 ou 1 non-conformité, puis convertir en note
3. Pour les items multiples : compter 0, 1, 2, ou >3 non-conformités, puis convertir en note

---

### 2. Calcul des KO ⚠️

**Problème :** Le code actuel compte les items avec note < 1.0, mais selon votre document, les KO sont "le nombre de non-conformités qui engendrent une amende" et sont indépendants des notes.

**Code actuel :**
```typescript
export function calculateNumberOfKO(items: { note?: AuditNote }[]): number {
  return items.filter((item) => item.note !== undefined && item.note < 1.0).length;
}
```

**Document :**
> "Les KO sont le nombre de non-conformités qui engendrent une amende. La variable est un nombre entier. Par défaut la valeur est 0. Les KO sont indépendants des notes attribuées aux items."

**Ce qu'il faut :**
- Ajouter un champ `numberOfNonConformities: number` dans `AuditItem`
- Les KO = somme de toutes les non-conformités de tous les items
- Les KO ne dépendent pas des notes, mais du nombre de non-conformités comptées

---

## 🔧 Modifications Nécessaires

### 1. Ajouter la Classification

```typescript
// types/index.ts
export type ItemClassification = 'binary' | 'multiple';

export interface AuditItem {
  id: string;
  name: string;
  ponderation: number;
  classification: ItemClassification; // NOUVEAU
  numberOfNonConformities: number; // NOUVEAU (0, 1, 2, >3)
  note?: AuditNote; // Calculée automatiquement selon classification
  // ...
}
```

### 2. Fonction de Conversion Non-Conformités → Note

```typescript
// utils/calculations.ts
function convertNonConformitiesToNote(
  classification: ItemClassification,
  numberOfNonConformities: number
): AuditNote {
  if (classification === 'binary') {
    return numberOfNonConformities === 0 ? 1.0 : 0.0;
  } else {
    // Multiple
    if (numberOfNonConformities === 0) return 1.0;
    if (numberOfNonConformities === 1) return 0.7;
    if (numberOfNonConformities === 2) return 0.3;
    return 0.0; // >3
  }
}
```

### 3. Calcul des KO

```typescript
export function calculateNumberOfKO(items: { numberOfNonConformities: number }[]): number {
  return items.reduce((total, item) => total + item.numberOfNonConformities, 0);
}
```

---

## 📋 Liste des Items avec Classification

Selon votre document :

**Binaire :**
- Lutte contre les nuisibles
- Système de traçabilité
- Gestion des non-conformités
- Gestion des actions correctives de l'audit précédent
- Gestion des déchets
- Formation et instructions à disposition du personnel

**Multiple :**
- Maintenance des locaux et équipements
- Nettoyage et désinfection des locaux et équipements
- Maîtrise du froid positif et négatif
- Maîtrise du chaud
- Contrôle à réception
- Gestion des conditionnements et emballages
- Affichage
- Gestions des poubelles
- Hygiène et équipements du personnel

---

## ✅ Conclusion

| Élément | Statut | Action Requise |
|---------|--------|----------------|
| Formule du score | ✅ Correct | Aucune |
| Formule des amendes | ✅ Correct | Aucune |
| Classification binaire/multiple | ❌ Manquant | À implémenter |
| Calcul des KO | ⚠️ Incorrect | À corriger |
| Interface de saisie | ⚠️ À adapter | Modifier pour compter les non-conformités |

**Priorité :** Implémenter la classification binaire/multiple et corriger le calcul des KO.

