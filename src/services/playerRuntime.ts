import * as THREE from 'three';
import type {
  AvatarArchetype,
  NetworkPlayerSnapshot,
  PlayerPose,
  WorldZoneId,
} from '../shared/protocol';

/**
 * High-frequency 60 FPS motion state for any player (local or remote).
 * Kept outside React/Zustand to prevent per-frame re-renders and GC pressure.
 */
export interface PlayerMotionState {
  readonly playerId: string;
  avatarType: AvatarArchetype;
  displayName: string;
  isLocal: boolean;
  readonly position: THREE.Vector3;
  readonly targetPosition: THREE.Vector3;
  rotY: number;
  targetRotY: number;
  speed: number;
  pose: PlayerPose;
  lastServerTimeMs: number;
}

export const OFFLINE_SEEKER_ID = 'offline-seeker';
export const OFFLINE_CHRONICLER_ID = 'offline-chronicler';

class PlayerRuntimeRegistry {
  public readonly players = new Map<string, PlayerMotionState>();

  /** ID of the player currently followed by CameraRig & steered by local input */
  public localPlayerId: string = OFFLINE_SEEKER_ID;

  /** Combined locomotion vector from WASD / Arrow Keys / Mobile Virtual Joystick */
  public readonly moveInput = { x: 0, y: 0 };
  public readonly keyInput = { x: 0, y: 0 };
  public readonly touchInput = { x: 0, y: 0 };
  public isActivelyMoving = false;

  /** One-shot quick-travel request */
  public pendingTeleportSpot: WorldZoneId | null = null;
  public pendingTeleportNonce = 0;

  constructor() {
    // Seed default offline duo so Phase 1.5 runs seamlessly without requiring a backend
    this.ensurePlayer(OFFLINE_SEEKER_ID, {
      avatarType: 'seeker',
      displayName: 'Người tìm sao',
      isLocal: true,
      x: -1.05,
      y: 1.08,
      z: 1.35,
      rotY: 0.12,
      pose: 'idle',
    });

    this.ensurePlayer(OFFLINE_CHRONICLER_ID, {
      avatarType: 'chronicler',
      displayName: 'Người ghi chép',
      isLocal: false,
      x: 0.95,
      y: 1.08,
      z: 1.55,
      rotY: -0.18,
      pose: 'idle',
    });
  }

  public ensurePlayer(
    playerId: string,
    init: {
      avatarType: AvatarArchetype;
      displayName: string;
      isLocal: boolean;
      x: number;
      y: number;
      z: number;
      rotY: number;
      pose?: PlayerPose;
    }
  ): PlayerMotionState {
    const existing = this.players.get(playerId);
    if (existing) {
      existing.avatarType = init.avatarType;
      existing.displayName = init.displayName;
      existing.isLocal = init.isLocal;
      return existing;
    }

    const state: PlayerMotionState = {
      playerId,
      avatarType: init.avatarType,
      displayName: init.displayName,
      isLocal: init.isLocal,
      position: new THREE.Vector3(init.x, init.y, init.z),
      targetPosition: new THREE.Vector3(init.x, init.y, init.z),
      rotY: init.rotY,
      targetRotY: init.rotY,
      speed: 0,
      pose: init.pose ?? 'idle',
      lastServerTimeMs: 0,
    };
    this.players.set(playerId, state);
    return state;
  }

  public getPlayer(playerId: string): PlayerMotionState | undefined {
    return this.players.get(playerId);
  }

  public getLocalPlayer(): PlayerMotionState {
    return (
      this.players.get(this.localPlayerId) ??
      this.players.get(OFFLINE_SEEKER_ID)!
    );
  }

  public getLocalPlayerPosition(): THREE.Vector3 {
    return this.getLocalPlayer().position;
  }

  public setLocalPlayerId(playerId: string): void {
    this.localPlayerId = playerId;
    for (const [id, p] of this.players) {
      p.isLocal = id === playerId;
    }
  }

  /**
   * Ingests an authoritative 10-20Hz server snapshot for a remote player.
   * Sets interpolation targets; `stepRemoteInterpolation` smoothly blends at 60 FPS.
   */
  public upsertRemoteSnapshot(snapshot: NetworkPlayerSnapshot): void {
    if (snapshot.playerId === this.localPlayerId) {
      this.reconcileLocalPlayer(snapshot.x, snapshot.y, snapshot.z);
      return;
    }

    const existing = this.players.get(snapshot.playerId);
    if (!existing) {
      this.ensurePlayer(snapshot.playerId, {
        avatarType: snapshot.avatarType,
        displayName: snapshot.displayName,
        isLocal: false,
        x: snapshot.x,
        y: snapshot.y,
        z: snapshot.z,
        rotY: snapshot.rotY,
        pose: snapshot.pose,
      });
      return;
    }

    existing.avatarType = snapshot.avatarType;
    existing.displayName = snapshot.displayName;
    existing.targetPosition.set(snapshot.x, snapshot.y, snapshot.z);
    existing.targetRotY = snapshot.rotY;
    existing.speed = snapshot.speed;
    existing.pose = snapshot.pose;
    existing.lastServerTimeMs = snapshot.serverTimeMs;
  }

  /**
   * Gentle server reconciliation for local player prediction:
   * ignores tiny sub-decimeter jitter, blends medium drift smoothly, snaps only on large teleports.
   */
  public reconcileLocalPlayer(serverX: number, serverY: number, serverZ: number): void {
    const local = this.getLocalPlayer();
    const dx = serverX - local.position.x;
    const dz = serverZ - local.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.15) {
      return;
    }
    if (dist > 8.0) {
      local.position.set(serverX, serverY, serverZ);
      local.targetPosition.set(serverX, serverY, serverZ);
      return;
    }
    // Smoothly pull 25% toward authoritative state per server tick to avoid rubber-band snapping
    local.position.x += dx * 0.25;
    local.position.y += (serverY - local.position.y) * 0.25;
    local.position.z += dz * 0.25;
  }

  public removePlayer(playerId: string): void {
    if (playerId !== this.localPlayerId) {
      this.players.delete(playerId);
    }
  }

  /**
   * Advances smooth 60 FPS entity interpolation for all non-local networked players.
   */
  public stepRemoteInterpolation(dt: number, skipPlayerId?: string): void {
    const alpha = Math.min(1, dt * 11.5);
    const twoPi = Math.PI * 2;

    for (const [id, p] of this.players) {
      if (id === this.localPlayerId || id === skipPlayerId) continue;

      const distSq = p.position.distanceToSquared(p.targetPosition);
      if (distSq > 64) {
        p.position.copy(p.targetPosition);
      } else if (distSq > 1e-5) {
        p.position.lerp(p.targetPosition, alpha);
      }

      const diff = (((p.targetRotY - p.rotY + Math.PI) % twoPi) + twoPi) % twoPi - Math.PI;
      p.rotY += diff * alpha;
    }
  }

  public syncCombinedMoveInput(): void {
    const rawX = this.keyInput.x + this.touchInput.x;
    const rawY = this.keyInput.y + this.touchInput.y;
    const len = Math.hypot(rawX, rawY);
    if (len > 1) {
      this.moveInput.x = rawX / len;
      this.moveInput.y = rawY / len;
    } else {
      this.moveInput.x = rawX;
      this.moveInput.y = rawY;
    }
    this.isActivelyMoving = len > 0.05;
  }

  public requestSpotTeleport(spotId: WorldZoneId): void {
    this.pendingTeleportSpot = spotId;
    this.pendingTeleportNonce += 1;
  }
}

export const playerRuntime = new PlayerRuntimeRegistry();
