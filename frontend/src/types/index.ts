// Types pour l'application d'audit d'hygiène

/**
 * Note d'audit possible
 */
export type AuditNote = 1.0 | 0.7 | 0.3 | 0.0;

/**
 * Libellé de la note
 */
export type NoteLabel = 'Conforme' | 'Mineur' | 'Moyen' | 'Majeur';

/**
 * Mapping note -> libellé
 */
export const NOTE_LABELS: Record<AuditNote, NoteLabel> = {
  1.0: 'Conforme',
  0.7: 'Mineur',
  0.3: 'Moyen',
  0.0: 'Majeur',
};

/**
 * Mapping libellé -> note
 */
export const LABEL_NOTES: Record<NoteLabel, AuditNote> = {
  Conforme: 1.0,
  Mineur: 0.7,
  Moyen: 0.3,
  Majeur: 0.0,
};

/**
 * Classification d'un item (binaire ou multiple)
 */
export type ItemClassification = 'binary' | 'multiple';

/**
 * Observation/commentaire pour un item
 */
export interface Observation {
  id: string;
  text: string;
  action?: string;
}

/**
 * Item d'audit (sous-catégorie)
 */
export interface AuditItem {
  id: string;
  name: string;
  ponderation: number; // Poids dans le calcul (ex: 0.333, 0.5)
  classification: ItemClassification; // Classification binaire ou multiple
  numberOfNonConformities: number; // Nombre de non-conformités (0, 1, 2, >3)
  note?: AuditNote; // Note calculée automatiquement selon classification et numberOfNonConformities
  observations: Observation[];
  photos: string[]; // URLs ou base64 des photos
  comments: string; // Commentaires libres
}

/**
 * Catégorie principale d'audit
 */
export interface AuditCategory {
  id: string;
  name: string;
  items: AuditItem[];
}

/**
 * Données d'un audit complet
 */
export interface Audit {
  id: string;
  dateExecution: string; // Format: YYYY-MM-DD
  adresse: string;
  categories: AuditCategory[];
  createdAt: string;
  updatedAt: string;
  synced: boolean; // Si synchronisé avec le serveur
}

/**
 * Résultats calculés d'un audit
 */
export interface AuditResults {
  totalScore: number; // Score total en pourcentage
  numberOfKO: number; // Nombre de non-conformités
  potentialFines: number; // Amendes potentielles en euros
  categoryScores: Record<string, number>; // Score par catégorie
}

/**
 * Données pour le graphique radar
 */
export interface RadarData {
  category: string;
  score: number; // 0-100
}

/**
 * Action corrective
 */
export interface CorrectiveAction {
  id: string;
  itemId: string;
  deviation: string; // Écart constaté
  action: string; // Action corrective définie
  deadline: string; // Délai
  completionDate?: string; // Date de réalisation
  status: 'pending' | 'completed' | 'verified';
}



