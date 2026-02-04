import type { AuditCategory, AuditItem, Observation, ItemClassification } from '../types';

// Mapping des items avec leur classification selon le document PDF
const ITEM_CLASSIFICATIONS: Record<string, ItemClassification> = {
  'Lutte contre les nuisibles': 'binary',
  'Maintenance des locaux et équipements': 'multiple',
  'Nettoyage et désinfection des locaux et équipements': 'multiple',
  'Maîtrise du froid positif et négatif (enregistrement de températures, températures effectives, joints, givre…)': 'multiple',
  'Maîtrise du chaud (Bain-marie, friteuses, grilles de four…)': 'multiple',
  'Contrôle à réception': 'multiple',
  'Gestions des conditionnements et emballages': 'multiple',
  'Affichage': 'multiple',
  'Système de traçabilité (Réalisation, qualité des photos, traçabilité fonctionnelle…)': 'binary',
  'Gestion des non-conformités': 'binary',
  'Gestion des actions correctives de l\'audit précédent': 'binary',
  'Gestion des déchets': 'binary',
  'Gestions des poubelles': 'multiple',
  'Hygiène et équipements du personnel (lave-mains et consommables, sanitaires, vestiaires…)': 'multiple',
  'Formation et instructions à disposition du personnel': 'binary',
};

// Type pour les données JSON importées
interface JSONCategory {
  name: string;
  items: Array<{
    name: string;
    ponderation: number;
    note: number;
    comments: string[];
    actions: string[];
  }>;
}

interface JSONData {
  categories: JSONCategory[];
}

// Charger les données depuis le fichier public
async function loadJSONData(): Promise<JSONData> {
  const response = await fetch('/data_structure.json');
  return await response.json();
}

/**
 * Convertir les données JSON en structure AuditCategory
 */
export async function loadCategoriesFromJSON(): Promise<AuditCategory[]> {
  const auditData = await loadJSONData();
  const categories: AuditCategory[] = [];

  auditData.categories.forEach((cat, catIndex) => {
    const items: AuditItem[] = cat.items.map((item, itemIndex) => {
      const observations: Observation[] = item.comments.map((comment, obsIndex) => ({
        id: `obs-${catIndex}-${itemIndex}-${obsIndex}`,
        text: comment,
        action: item.actions[obsIndex] || undefined,
      }));

      // Déterminer la classification (par défaut 'multiple' si non trouvée)
      const classification: ItemClassification = ITEM_CLASSIFICATIONS[item.name] || 'multiple';

      return {
        id: `item-${catIndex}-${itemIndex}`,
        name: item.name,
        ponderation: item.ponderation,
        classification,
        numberOfNonConformities: 0, // Par défaut 0 (conforme)
        note: undefined, // Sera calculée automatiquement
        observations,
        photos: [],
        comments: '',
      };
    });

    categories.push({
      id: `cat-${catIndex}`,
      name: cat.name,
      items,
    });
  });

  return categories;
}

