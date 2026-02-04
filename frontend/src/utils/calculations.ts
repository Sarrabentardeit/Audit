import type { Audit, AuditResults, AuditNote, ItemClassification } from '../types';

/**
 * Convertir le nombre de non-conformités en note selon la classification
 * 
 * Binaire:
 * - 0 non-conformité = 1.0 (100%)
 * - 1 non-conformité = 0.0 (0%)
 * 
 * Multiple:
 * - 0 = 1.0 (100%)
 * - 1 = 0.7 (70%)
 * - 2 = 0.3 (30%)
 * - >3 = 0.0 (0%)
 */
export function convertNonConformitiesToNote(
  classification: ItemClassification,
  numberOfNonConformities: number
): AuditNote {
  if (classification === 'binary') {
    // Binaire: 0 non-conformité = 1.0, 1 non-conformité = 0.0
    return numberOfNonConformities === 0 ? 1.0 : 0.0;
  } else {
    // Multiple: 0 = 1.0, 1 = 0.7, 2 = 0.3, >3 = 0.0
    if (numberOfNonConformities === 0) return 1.0;
    if (numberOfNonConformities === 1) return 0.7;
    if (numberOfNonConformities === 2) return 0.3;
    return 0.0; // >= 3
  }
}

/**
 * Calculer le score d'une catégorie
 * Formule : (Σ(note × pondération) / Σ(pondération)) × 100
 * 
 * La note est calculée automatiquement à partir du nombre de non-conformités
 */
export function calculateCategoryScore(items: { 
  classification: ItemClassification;
  numberOfNonConformities: number;
  ponderation: number;
}[]): number {
  if (items.length === 0) return 0;

  let totalPonderation = 0;
  let totalScore = 0;

  items.forEach((item) => {
    // Calculer la note à partir du nombre de non-conformités
    const note = convertNonConformitiesToNote(item.classification, item.numberOfNonConformities);
    totalScore += note * item.ponderation;
    totalPonderation += item.ponderation;
  });

  if (totalPonderation === 0) return 0;
  
  return (totalScore / totalPonderation) * 100;
}

/**
 * Calculer le nombre de KO (non-conformités)
 * 
 * Selon le document: "Les KO sont le nombre de non-conformités qui engendre une amende"
 * "Les KO sont indépendants des notes attribuées aux items"
 * 
 * Les KO = somme de toutes les non-conformités de tous les items
 */
export function calculateNumberOfKO(items: { numberOfNonConformities: number }[]): number {
  return items.reduce((total, item) => total + item.numberOfNonConformities, 0);
}

/**
 * Calculer les amendes potentielles
 * Formule Excel (cartographie, ligne 31, colonne C): =C30*450*5
 * Où C30 = Nombre de KO (somme des non-conformités)
 * Donc: Nombre de KO × 2250€
 * 
 * Chaque non-conformité coûte 2250€
 */
export function calculatePotentialFines(items: { numberOfNonConformities: number }[]): number {
  const numberOfKO = calculateNumberOfKO(items);
  // Formule Excel: Nombre de KO × 450 × 5 = Nombre de KO × 2250
  return numberOfKO * 2250;
}

/**
 * Calculer tous les résultats d'un audit
 */
export function calculateResults(audit: Audit): AuditResults {
  const categoryScores: Record<string, number> = {};
  let totalScore = 0;
  let totalKO = 0;

  // Calculer les scores par catégorie et le nombre total de KO
  audit.categories.forEach((category) => {
    const categoryScore = calculateCategoryScore(category.items);
    categoryScores[category.id] = categoryScore;
    
    totalKO += calculateNumberOfKO(category.items);
  });

  // Calculer le score total (moyenne des catégories)
  const categoryScoreValues = Object.values(categoryScores);
  if (categoryScoreValues.length > 0) {
    totalScore = categoryScoreValues.reduce((a, b) => a + b, 0) / categoryScoreValues.length;
  }

  // Calculer les amendes sur le nombre total de KO (selon formule Excel)
  // Formule Excel: =C30*450*5 où C30 = Nombre total de KO
  const totalFines = totalKO * 2250;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    numberOfKO: totalKO,
    potentialFines: totalFines,
    categoryScores,
  };
}
