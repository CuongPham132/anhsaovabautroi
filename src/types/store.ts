import type { QualityTier } from './performance';
import type { StarId } from './star';
import type {
  CharacterPose,
  CharacterRole,
  NearbyInteractable,
  WorldSpotId,
} from './world';

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

export type ActiveModalState =
  | { readonly type: 'none' }
  | { readonly type: 'jar' }
  | { readonly type: 'memory'; readonly starId: StarId };

/**
 * Strictly string[] arrays for JSON persistence safety (TD-08).
 * Never store Set instances directly inside Zustand persisted state.
 */
export interface PersistedSkySlice {
  collectedStarIds: StarId[];
  dedicatedStarIds: StarId[];
}

/**
 * Ephemeral UI, selection, flight lock, and adaptive quality state (TD-08).
 * Excluded from localStorage via `partialize`.
 */
export interface TransientSkySlice {
  selectedStarId: StarId | null;
  inFlightStarId: StarId | null;
  activeModal: ActiveModalState;
  hoveredStarId: StarId | null;
  contextMenuAnchor: ScreenPoint | null;
  jarScreenAnchor: ScreenPoint;
  jarPulseNonce: number;
  qualityTier: QualityTier;
  activeWorldSpot: WorldSpotId;
  controlledRole: CharacterRole;
  characterPose: CharacterPose;
  nearbyInteractable: NearbyInteractable | null;
  worldToastMessage: string | null;
}

export interface SkyStoreActions {
  selectStar: (starId: StarId, anchor: ScreenPoint) => void;
  clearSelection: () => void;
  setHoveredStar: (starId: StarId | null) => void;
  setContextMenuAnchor: (anchor: ScreenPoint | null) => void;

  commitCollectAndStartFlight: (starId: StarId) => void;
  releaseFlightAndPulseJar: (starId: StarId) => void;
  toggleDedicateStar: (starId: StarId) => void;

  setActiveModal: (modal: ActiveModalState) => void;
  closeModal: () => void;
  setJarScreenAnchor: (anchor: ScreenPoint) => void;
  setQualityTier: (tier: QualityTier) => void;

  setActiveWorldSpot: (spotId: WorldSpotId, teleport?: boolean) => void;
  switchControlledRole: () => void;
  setCharacterPose: (pose: CharacterPose) => void;
  setNearbyInteractable: (item: NearbyInteractable | null) => void;
  setWorldToast: (message: string | null) => void;
}

export type SkyStore = PersistedSkySlice & TransientSkySlice & SkyStoreActions;

