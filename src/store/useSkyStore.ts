import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getWorldSpot } from '../data/worldSpots';
import { starRepository } from '../repositories/starRepository';
import { requestSpotTeleport } from '../services/characterRuntime';
import {
  detectDeviceCapabilities,
  determineInitialQualityTier,
} from '../services/devicePerfService';
import type {
  ActiveModalState,
  PersistedSkySlice,
  ScreenPoint,
  SkyStore,
  TransientSkySlice,
} from '../types/store';

const STORAGE_KEY = 'sky-full-of-you:v1';

const defaultScreenAnchor: ScreenPoint = {
  x: typeof window !== 'undefined' ? Math.max(0, window.innerWidth - 64) : 100,
  y: typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 64) : 100,
};

const initialTransientState: TransientSkySlice = {
  selectedStarId: null,
  inFlightStarId: null,
  activeModal: { type: 'none' },
  hoveredStarId: null,
  contextMenuAnchor: null,
  jarScreenAnchor: defaultScreenAnchor,
  jarPulseNonce: 0,
  qualityTier: determineInitialQualityTier(detectDeviceCapabilities()),
  activeWorldSpot: 'hilltop',
  controlledRole: 'seeker',
  characterPose: 'idle',
  nearbyInteractable: null,
  worldToastMessage: null,
};

const initialPersistedState: PersistedSkySlice = {
  collectedStarIds: [],
  dedicatedStarIds: [],
};

export const useSkyStore = create<SkyStore>()(
  persist(
    (set) => ({
      ...initialPersistedState,
      ...initialTransientState,

      selectStar: (starId, anchor) => {
        set({
          selectedStarId: starId,
          contextMenuAnchor: anchor,
        });
      },

      clearSelection: () => {
        set({
          selectedStarId: null,
          contextMenuAnchor: null,
        });
      },

      setHoveredStar: (starId) => {
        set({ hoveredStarId: starId });
      },

      setContextMenuAnchor: (anchor) => {
        set({ contextMenuAnchor: anchor });
      },

      // Early-durable commit (TD-08, TD-10): persist string[] immediately
      commitCollectAndStartFlight: (starId) => {
        set((state) => {
          if (state.collectedStarIds.includes(starId) || state.inFlightStarId === starId) {
            return state;
          }
          return {
            collectedStarIds: [...state.collectedStarIds, starId],
            inFlightStarId: starId,
            selectedStarId: null,
            contextMenuAnchor: null,
          };
        });
      },

      // Flight completion / watchdog release (TD-10)
      releaseFlightAndPulseJar: (starId) => {
        set((state) => {
          const nextInFlight = state.inFlightStarId === starId ? null : state.inFlightStarId;
          return {
            inFlightStarId: nextInFlight,
            jarPulseNonce: state.jarPulseNonce + 1,
          };
        });
      },

      toggleDedicateStar: (starId) => {
        set((state) => {
          const isCurrentlyDedicated = state.dedicatedStarIds.includes(starId);
          const nextDedicated = isCurrentlyDedicated
            ? state.dedicatedStarIds.filter((id) => id !== starId)
            : [...state.dedicatedStarIds, starId];
          return {
            dedicatedStarIds: nextDedicated,
            selectedStarId: null,
            contextMenuAnchor: null,
          };
        });
      },

      setActiveModal: (modal: ActiveModalState) => {
        set({
          activeModal: modal,
          selectedStarId: null,
          contextMenuAnchor: null,
        });
      },

      closeModal: () => {
        set({ activeModal: { type: 'none' } });
      },

      setJarScreenAnchor: (anchor) => {
        set({ jarScreenAnchor: anchor });
      },

      setQualityTier: (tier) => {
        set({ qualityTier: tier });
      },

      setActiveWorldSpot: (spotId, teleport = true) => {
        const spot = getWorldSpot(spotId);
        if (teleport) {
          requestSpotTeleport(spotId);
        }
        set((state) => ({
          activeWorldSpot: spotId,
          characterPose: teleport ? spot.defaultPose : state.characterPose,
          selectedStarId: null,
          contextMenuAnchor: null,
        }));
      },

      switchControlledRole: () => {
        set((state) => {
          const nextRole = state.controlledRole === 'seeker' ? 'chronicler' : 'seeker';
          return {
            controlledRole: nextRole,
            worldToastMessage:
              nextRole === 'seeker'
                ? 'Đang đồng hành cùng Người tìm sao (Nam · Kính thiên văn)'
                : 'Đang đồng hành cùng Người ghi chép (Nữ · Nhật ký thiên văn)',
          };
        });
      },

      setCharacterPose: (pose) => {
        set({ characterPose: pose });
      },

      setNearbyInteractable: (item) => {
        set((state) => {
          if (state.nearbyInteractable?.id === item?.id) {
            return state;
          }
          return { nearbyInteractable: item };
        });
      },

      setWorldToast: (message) => {
        set({ worldToastMessage: message });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Only persist string[] arrays (TD-08)
      partialize: (state) => ({
        collectedStarIds: state.collectedStarIds,
        dedicatedStarIds: state.dedicatedStarIds,
      }),
      merge: (persistedState, currentState) => {
        const raw = persistedState as Partial<PersistedSkySlice> | undefined;
        const sanitizedCollected = starRepository.sanitizeStarIds(raw?.collectedStarIds);
        const sanitizedDedicated = starRepository.sanitizeStarIds(raw?.dedicatedStarIds);

        return {
          ...currentState,
          collectedStarIds: sanitizedCollected,
          dedicatedStarIds: sanitizedDedicated,
          // Always ensure transient states start fresh on reload
          ...initialTransientState,
        };
      },
    }
  )
);
