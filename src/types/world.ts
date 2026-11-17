import type {
  AvatarArchetype,
  PlayerPose,
  WorldZoneId,
} from '../shared/protocol';
import type { WorldInteractablePoint } from '../shared/worldNavigation';
import type { StarPosition } from './star';

export type WorldSpotId = WorldZoneId;

export type CharacterRole = AvatarArchetype;

export type CharacterPose = PlayerPose;

export interface CharacterPlacement {
  readonly position: StarPosition;
  readonly rotationY: number;
}

export interface WorldSpotDefinition {
  readonly id: WorldSpotId;
  readonly label: string;
  readonly icon: string;
  readonly subtitle: string;
  readonly spawnCenter: StarPosition;
  readonly defaultAzimuthRad: number;
  readonly defaultPolarRad: number;
  readonly defaultPose: CharacterPose;
  readonly seekerPlacement: CharacterPlacement;
  readonly chroniclerPlacement: CharacterPlacement;
}

export type NearbyInteractable = WorldInteractablePoint;
