import type { WorldZoneId } from './protocol';

/**
 * Pure TypeScript 4-Zone Walkable Terrain & Collision Physics (Shared Client + Server).
 * Zero Three.js / DOM / browser dependencies so both Client-Side Prediction and
 * Server-Authoritative Movement execute the exact same heightfield & shoreline math.
 */

export interface Vec3Tuple {
  readonly 0: number;
  readonly 1: number;
  readonly 2: number;
}

export type SharedPosition = readonly [number, number, number];

export type InteractableActionType =
  | 'sit-lakeside'
  | 'open-zodiac-atlas'
  | 'open-memory-jar'
  | 'trigger-meteor';

export interface WorldInteractablePoint {
  readonly id: string;
  readonly actionType: InteractableActionType;
  readonly label: string;
  readonly icon: string;
  readonly position: SharedPosition;
  readonly triggerRadius: number;
}

export const OBSERVATORY_CENTER_XZ: readonly [number, number] = Object.freeze([-19, -24]);
export const OBSERVATORY_TERRACE_Y = 2.65;
export const OBSERVATORY_TERRACE_RADIUS = 6.8;

export const MEMORY_GARDEN_CENTER_XZ: readonly [number, number] = Object.freeze([12.2, -1.8]);
export const MEMORY_GARDEN_RADIUS = 5.2;

export const LAKESIDE_PIER_BOUNDS = Object.freeze({
  minX: -0.75,
  maxX: 2.65,
  minZ: -9.35,
  maxZ: -5.4,
  deckY: 0.34,
});

// Curved Starlight Bridge waypoints connecting Western Hilltop -> Observatory Terrace
const BRIDGE_START: SharedPosition = [-7.4, 0.62, -4.2];
const BRIDGE_MID: SharedPosition = [-13.2, 1.85, -11.2];
const BRIDGE_END: SharedPosition = [-16.6, OBSERVATORY_TERRACE_Y, -18.4];
export const BRIDGE_HALF_WIDTH = 1.5;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function sampleBridgePoint(t: number): [number, number, number] {
  const c = clamp01(t);
  const inv = 1 - c;
  const x = inv * inv * BRIDGE_START[0] + 2 * inv * c * BRIDGE_MID[0] + c * c * BRIDGE_END[0];
  const y = inv * inv * BRIDGE_START[1] + 2 * inv * c * BRIDGE_MID[1] + c * c * BRIDGE_END[1];
  const z = inv * inv * BRIDGE_START[2] + 2 * inv * c * BRIDGE_MID[2] + c * c * BRIDGE_END[2];
  return [x, y, z];
}

/**
 * Exact elevation of the main Hilltop + Eastern Memory Garden peninsula.
 * Shared identically between Three.js ObservationShore mesh, Client prediction, and Server authority.
 */
export function sampleHillHeight(x: number, z: number): number {
  const hillR = Math.hypot(x / 16.5, (z - 0.8) / 12.2);
  const mainDome = Math.max(0, 1 - hillR * hillR);

  const gardenR = Math.hypot(
    (x - MEMORY_GARDEN_CENTER_XZ[0]) / 9.2,
    (z - MEMORY_GARDEN_CENTER_XZ[1]) / 8.0
  );
  const gardenDome = Math.max(0, 1 - gardenR * gardenR) * 0.88;

  const bridgeHeadR = Math.hypot((x - BRIDGE_START[0]) / 5.5, (z - BRIDGE_START[2]) / 5.5);
  const bridgeDome = Math.max(0, 1 - bridgeHeadR * bridgeHeadR) * 0.74;

  const combined = Math.max(mainDome, gardenDome, bridgeDome);
  const undulation =
    (Math.sin(x * 0.24 + z * 0.2) * 0.08 + Math.cos(x * 0.5 - z * 0.42) * 0.04) *
    combined;

  return -1.15 + combined * 2.3 + undulation;
}

function sampleBridgeProximity(x: number, z: number): {
  onBridge: boolean;
  heightY: number;
  distance: number;
} {
  let bestDistSq = Infinity;
  let bestY = 0;

  const steps = 20;
  for (let i = 0; i <= steps; i += 1) {
    const [bx, by, bz] = sampleBridgePoint(i / steps);
    const dSq = (x - bx) * (x - bx) + (z - bz) * (z - bz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestY = by;
    }
  }

  const dist = Math.sqrt(bestDistSq);
  return {
    onBridge: dist <= BRIDGE_HALF_WIDTH,
    heightY: bestY,
    distance: dist,
  };
}

export interface TerrainSampleResult {
  readonly walkable: boolean;
  readonly heightY: number;
  readonly zoneId: WorldZoneId;
}

export function sampleWalkableTerrain(x: number, z: number): TerrainSampleResult {
  // 1. Observatory Terrace & Stone Platform (solid central tower obstacle)
  const obsDx = x - OBSERVATORY_CENTER_XZ[0];
  const obsDz = z - OBSERVATORY_CENTER_XZ[1];
  const obsDist = Math.hypot(obsDx, obsDz);
  if (obsDist <= OBSERVATORY_TERRACE_RADIUS) {
    const towerCenterDist = Math.hypot(
      x - (OBSERVATORY_CENTER_XZ[0] - 1.8),
      z - (OBSERVATORY_CENTER_XZ[1] - 1.8)
    );
    if (towerCenterDist > 3.55) {
      return {
        walkable: true,
        heightY: OBSERVATORY_TERRACE_Y,
        zoneId: 'observatory',
      };
    }
    return {
      walkable: false,
      heightY: OBSERVATORY_TERRACE_Y,
      zoneId: 'observatory',
    };
  }

  // 2. Curved Starlight Bridge
  const bridge = sampleBridgeProximity(x, z);
  if (bridge.onBridge) {
    return {
      walkable: true,
      heightY: bridge.heightY,
      zoneId: z < -14 ? 'observatory' : 'hilltop',
    };
  }

  // 3. Lakeside Pier Deck
  if (
    x >= LAKESIDE_PIER_BOUNDS.minX &&
    x <= LAKESIDE_PIER_BOUNDS.maxX &&
    z >= LAKESIDE_PIER_BOUNDS.minZ &&
    z <= LAKESIDE_PIER_BOUNDS.maxZ
  ) {
    return {
      walkable: true,
      heightY: LAKESIDE_PIER_BOUNDS.deckY,
      zoneId: 'lakeside',
    };
  }

  // 4. Main Hilltop & Eastern Memory Garden Peninsula
  const hillY = sampleHillHeight(x, z);
  if (hillY >= 0.16) {
    const gardenDist = Math.hypot(
      x - MEMORY_GARDEN_CENTER_XZ[0],
      z - MEMORY_GARDEN_CENTER_XZ[1]
    );
    const zoneId: WorldZoneId =
      gardenDist <= MEMORY_GARDEN_RADIUS + 1.0
        ? 'garden'
        : z < -5.2 && Math.abs(x - 1.0) < 3.5
        ? 'lakeside'
        : 'hilltop';

    return {
      walkable: true,
      heightY: hillY,
      zoneId,
    };
  }

  return {
    walkable: false,
    heightY: Math.max(0.05, hillY),
    zoneId: 'hilltop',
  };
}

export function resolveWalkableStep(
  prevX: number,
  prevZ: number,
  nextX: number,
  nextZ: number
): { x: number; y: number; z: number; zoneId: WorldZoneId; moved: boolean } {
  const full = sampleWalkableTerrain(nextX, nextZ);
  if (full.walkable) {
    return { x: nextX, y: full.heightY, z: nextZ, zoneId: full.zoneId, moved: true };
  }

  const slideX = sampleWalkableTerrain(nextX, prevZ);
  if (slideX.walkable) {
    return { x: nextX, y: slideX.heightY, z: prevZ, zoneId: slideX.zoneId, moved: true };
  }

  const slideZ = sampleWalkableTerrain(prevX, nextZ);
  if (slideZ.walkable) {
    return { x: prevX, y: slideZ.heightY, z: nextZ, zoneId: slideZ.zoneId, moved: true };
  }

  const stay = sampleWalkableTerrain(prevX, prevZ);
  return { x: prevX, y: stay.heightY, z: prevZ, zoneId: stay.zoneId, moved: false };
}

export const WORLD_INTERACTABLES: readonly WorldInteractablePoint[] = Object.freeze([
  {
    id: 'interact-lakeside-sit',
    actionType: 'sit-lakeside',
    label: 'Ngồi ngắm sao bên bờ hồ',
    icon: '🌊',
    position: Object.freeze([0.95, LAKESIDE_PIER_BOUNDS.deckY, -8.35] as const),
    triggerRadius: 2.6,
  },
  {
    id: 'interact-observatory-atlas',
    actionType: 'open-zodiac-atlas',
    label: 'Mở Zodiac Atlas tại Đài quan sát',
    icon: '🔭',
    position: Object.freeze([-16.8, OBSERVATORY_TERRACE_Y, -21.8] as const),
    triggerRadius: 4.5,
  },
  {
    id: 'interact-garden-jar',
    actionType: 'open-memory-jar',
    label: 'Mở Vườn Kỷ Niệm & Chiếc Lọ',
    icon: '🌸',
    position: Object.freeze([MEMORY_GARDEN_CENTER_XZ[0], 0.92, MEMORY_GARDEN_CENTER_XZ[1]] as const),
    triggerRadius: 3.6,
  },
  {
    id: 'interact-hill-meteor',
    actionType: 'trigger-meteor',
    label: 'Gọi cơn mưa sao băng từ đỉnh đồi',
    icon: '☄️',
    position: Object.freeze([0.0, 1.08, 0.2] as const),
    triggerRadius: 2.4,
  },
]);

export function findNearestInteractable(
  x: number,
  z: number
): WorldInteractablePoint | null {
  let closest: WorldInteractablePoint | null = null;
  let closestDist = Infinity;

  for (const item of WORLD_INTERACTABLES) {
    const dist = Math.hypot(x - item.position[0], z - item.position[2]);
    if (dist <= item.triggerRadius && dist < closestDist) {
      closest = item;
      closestDist = dist;
    }
  }

  return closest;
}
