import type * as THREE from 'three';
import type { CharacterRole, WorldSpotId } from '../types/world';
import {
  OFFLINE_CHRONICLER_ID,
  OFFLINE_SEEKER_ID,
  playerRuntime,
} from './playerRuntime';

/**
 * Compatibility facade delegating cleanly to the multiplayer-ready `playerRuntime`.
 * Preserves existing imports while decoupling CameraRig and HUD from 2-character assumptions.
 */
export const characterRuntime = playerRuntime;

export function syncCombinedMoveInput(): void {
  playerRuntime.syncCombinedMoveInput();
}

export function getControlledPosition(role?: CharacterRole): THREE.Vector3 {
  if (!role) {
    return playerRuntime.getLocalPlayerPosition();
  }
  const targetId = role === 'seeker' ? OFFLINE_SEEKER_ID : OFFLINE_CHRONICLER_ID;
  return playerRuntime.getPlayer(targetId)?.position ?? playerRuntime.getLocalPlayerPosition();
}

export function requestSpotTeleport(spotId: WorldSpotId): void {
  playerRuntime.requestSpotTeleport(spotId);
}
