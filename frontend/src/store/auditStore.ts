import { create } from 'zustand';
import type { Audit, AuditCategory, AuditResults } from '../types';
import { saveAudit, getAudit, getAllAudits } from '../services/db';
import { calculateResults, convertNonConformitiesToNote } from '../utils/calculations';

interface AuditState {
  currentAudit: Audit | null;
  audits: Audit[];
  results: AuditResults | null;
  
  // Actions
  createAudit: (dateExecution: string, adresse: string, categories: AuditCategory[]) => Promise<void>;
  loadAudit: (id: string) => Promise<void>;
  loadAllAudits: () => Promise<void>;
  updateItemNonConformities: (categoryId: string, itemId: string, numberOfNonConformities: number) => Promise<void>;
  updateItemComment: (categoryId: string, itemId: string, comment: string) => Promise<void>;
  addPhoto: (categoryId: string, itemId: string, photoUrl: string) => Promise<void>;
  removePhoto: (categoryId: string, itemId: string, photoIndex: number) => Promise<void>;
  calculateResults: () => void;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  currentAudit: null,
  audits: [],
  results: null,

  createAudit: async (dateExecution, adresse, categories) => {
    const newAudit: Audit = {
      id: crypto.randomUUID(),
      dateExecution,
      adresse,
      categories,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveAudit(newAudit);
    
    set({ currentAudit: newAudit });
    get().calculateResults();
  },

  loadAudit: async (id) => {
    const audit = await getAudit(id);
    if (audit) {
      set({ currentAudit: audit });
      get().calculateResults();
    }
  },

  loadAllAudits: async () => {
    const audits = await getAllAudits();
    set({ audits });
  },

  updateItemNonConformities: async (categoryId, itemId, numberOfNonConformities) => {
    const { currentAudit } = get();
    if (!currentAudit) return;

    const updatedCategories = currentAudit.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id === itemId) {
              // Calculer automatiquement la note à partir du nombre de non-conformités
              const note = convertNonConformitiesToNote(item.classification, numberOfNonConformities);
              return {
                ...item,
                numberOfNonConformities,
                note,
              };
            }
            return item;
          }),
        };
      }
      return cat;
    });

    const updatedAudit: Audit = {
      ...currentAudit,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveAudit(updatedAudit);
    set({ currentAudit: updatedAudit });
    get().calculateResults();
  },

  updateItemComment: async (categoryId, itemId, comment) => {
    const { currentAudit } = get();
    if (!currentAudit) return;

    const updatedCategories = currentAudit.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, comments: comment } : item
          ),
        };
      }
      return cat;
    });

    const updatedAudit: Audit = {
      ...currentAudit,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveAudit(updatedAudit);
    set({ currentAudit: updatedAudit });
  },

  addPhoto: async (categoryId, itemId, photoUrl) => {
    const { currentAudit } = get();
    if (!currentAudit) return;

    const updatedCategories = currentAudit.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? { ...item, photos: [...item.photos, photoUrl] }
              : item
          ),
        };
      }
      return cat;
    });

    const updatedAudit: Audit = {
      ...currentAudit,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveAudit(updatedAudit);
    set({ currentAudit: updatedAudit });
  },

  removePhoto: async (categoryId, itemId, photoIndex) => {
    const { currentAudit } = get();
    if (!currentAudit) return;

    const updatedCategories = currentAudit.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id === itemId) {
              const newPhotos = [...item.photos];
              newPhotos.splice(photoIndex, 1);
              return { ...item, photos: newPhotos };
            }
            return item;
          }),
        };
      }
      return cat;
    });

    const updatedAudit: Audit = {
      ...currentAudit,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await saveAudit(updatedAudit);
    set({ currentAudit: updatedAudit });
  },

  calculateResults: () => {
    const { currentAudit } = get();
    if (!currentAudit) {
      set({ results: null });
      return;
    }

    const results = calculateResults(currentAudit);
    set({ results });
  },
}));

