import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isValidZodiacId } from '../data/zodiacCatalog';
import type { ZodiacId } from '../types/zodiac';

const ZODIAC_STORAGE_KEY = 'sky-full-of-you:zodiac:v1';

interface PersistedZodiacSlice {
  discoveredZodiacIds: ZodiacId[];
  giftedZodiacIds: ZodiacId[];
}

interface TransientZodiacSlice {
  selectedZodiacId: ZodiacId | null;
  hoveredZodiacId: ZodiacId | null;
  guideTargetZodiacId: ZodiacId | null;
  isAtlasOpen: boolean;
}

interface ZodiacStoreActions {
  discoverZodiac: (zodiacId: ZodiacId) => boolean;
  selectZodiac: (zodiacId: ZodiacId | null) => void;
  setHoveredZodiac: (zodiacId: ZodiacId | null) => void;
  guideToZodiac: (zodiacId: ZodiacId | null) => void;
  setAtlasOpen: (open: boolean) => void;
  markZodiacGifted: (zodiacId: ZodiacId) => void;
}

export type ZodiacStore = PersistedZodiacSlice & TransientZodiacSlice & ZodiacStoreActions;

function sanitizeZodiacIds(raw: unknown): ZodiacId[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<ZodiacId>();
  const result: ZodiacId[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && isValidZodiacId(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

const initialTransient: TransientZodiacSlice = {
  selectedZodiacId: null,
  hoveredZodiacId: null,
  guideTargetZodiacId: null,
  isAtlasOpen: false,
};

/**
 * Independent persisted store for the 12 Zodiac Constellations (V2.1).
 * Strictly isolated from V1's `useSkyStore` so Memory Jar persistence (TD-08) is never affected.
 */
export const useZodiacStore = create<ZodiacStore>()(
  persist(
    (set, get) => ({
      discoveredZodiacIds: [],
      giftedZodiacIds: [],
      ...initialTransient,

      discoverZodiac: (zodiacId) => {
        const current = get().discoveredZodiacIds;
        const isNew = !current.includes(zodiacId);
        if (isNew) {
          set({
            discoveredZodiacIds: [...current, zodiacId],
            selectedZodiacId: zodiacId,
            guideTargetZodiacId: null,
          });
        } else {
          set({
            selectedZodiacId: zodiacId,
            guideTargetZodiacId: null,
          });
        }
        return isNew;
      },

      selectZodiac: (zodiacId) => {
        set({ selectedZodiacId: zodiacId });
      },

      setHoveredZodiac: (zodiacId) => {
        set({ hoveredZodiacId: zodiacId });
      },

      guideToZodiac: (zodiacId) => {
        set({
          guideTargetZodiacId: zodiacId,
          isAtlasOpen: false,
          selectedZodiacId: null,
        });
      },

      setAtlasOpen: (open) => {
        set({
          isAtlasOpen: open,
          selectedZodiacId: open ? null : get().selectedZodiacId,
        });
      },

      markZodiacGifted: (zodiacId) => {
        set((state) => {
          if (state.giftedZodiacIds.includes(zodiacId)) return state;
          return {
            giftedZodiacIds: [...state.giftedZodiacIds, zodiacId],
          };
        });
      },
    }),
    {
      name: ZODIAC_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        discoveredZodiacIds: state.discoveredZodiacIds,
        giftedZodiacIds: state.giftedZodiacIds,
      }),
      merge: (persisted, current) => {
        const raw = persisted as Partial<PersistedZodiacSlice> | undefined;
        return {
          ...current,
          discoveredZodiacIds: sanitizeZodiacIds(raw?.discoveredZodiacIds),
          giftedZodiacIds: sanitizeZodiacIds(raw?.giftedZodiacIds),
          ...initialTransient,
        };
      },
    }
  )
);
