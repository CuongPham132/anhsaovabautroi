import type { WorldSpotDefinition, WorldSpotId } from '../types/world';
import {
  LAKESIDE_PIER_BOUNDS,
  MEMORY_GARDEN_CENTER_XZ,
  OBSERVATORY_TERRACE_Y,
  sampleHillHeight,
} from '../utils/worldNavigation';

const DEG = Math.PI / 180;

const hillSeekerY = sampleHillHeight(-1.05, 1.35);
const hillChroniclerY = sampleHillHeight(0.95, 1.55);
const gardenSeekerY = sampleHillHeight(MEMORY_GARDEN_CENTER_XZ[0] - 1.1, MEMORY_GARDEN_CENTER_XZ[1] + 0.6);
const gardenChroniclerY = sampleHillHeight(MEMORY_GARDEN_CENTER_XZ[0] + 0.9, MEMORY_GARDEN_CENTER_XZ[1] + 0.8);

/**
 * 4 Seamless Walkable Areas in the unified V2.2 world:
 *   1. The Hill (opening panoramic ridge)
 *   2. The Lake (reflective stone & timber pier)
 *   3. The Observatory (connected via Starlight Bridge over the western cove)
 *   4. The Memory Garden (serene lantern gazebo on the eastern ridge)
 */
export const WORLD_SPOTS: Readonly<Record<WorldSpotId, WorldSpotDefinition>> = Object.freeze({
  hilltop: Object.freeze({
    id: 'hilltop',
    label: 'Ngọn đồi',
    icon: '⛰️',
    subtitle: 'Nơi bắt đầu hành trình — ngắm toàn cảnh Ngân Hà & Mặt Trăng',
    spawnCenter: Object.freeze([0, hillSeekerY, 1.4] as const),
    defaultAzimuthRad: 0,
    defaultPolarRad: 98 * DEG, // Slightly tilted upward so 75% of screen shows night sky + Moon + Observatory
    defaultPose: 'idle',
    seekerPlacement: Object.freeze({
      position: Object.freeze([-1.05, hillSeekerY, 1.35] as const),
      rotationY: 0.12,
    }),
    chroniclerPlacement: Object.freeze({
      position: Object.freeze([0.95, hillChroniclerY, 1.55] as const),
      rotationY: -0.18,
    }),
  }),

  lakeside: Object.freeze({
    id: 'lakeside',
    label: 'Bờ hồ',
    icon: '🌊',
    subtitle: 'Mặt nước phản chiếu bầu trời — ngồi nghỉ cạnh nhau',
    spawnCenter: Object.freeze([0.95, LAKESIDE_PIER_BOUNDS.deckY, -8.3] as const),
    defaultAzimuthRad: 26 * DEG,
    defaultPolarRad: 96 * DEG,
    defaultPose: 'sit',
    seekerPlacement: Object.freeze({
      position: Object.freeze([0.4, LAKESIDE_PIER_BOUNDS.deckY, -8.45] as const),
      rotationY: 0.08,
    }),
    chroniclerPlacement: Object.freeze({
      position: Object.freeze([1.5, LAKESIDE_PIER_BOUNDS.deckY, -8.35] as const),
      rotationY: -0.14,
    }),
  }),

  observatory: Object.freeze({
    id: 'observatory',
    label: 'Đài quan sát',
    icon: '🔭',
    subtitle: 'Đi qua cầu ánh sao tới Đài quan sát & Zodiac Atlas',
    spawnCenter: Object.freeze([-16.2, OBSERVATORY_TERRACE_Y, -21.2] as const),
    defaultAzimuthRad: -32 * DEG,
    defaultPolarRad: 100 * DEG,
    defaultPose: 'lookUp',
    seekerPlacement: Object.freeze({
      position: Object.freeze([-16.8, OBSERVATORY_TERRACE_Y, -20.8] as const),
      rotationY: -0.3,
    }),
    chroniclerPlacement: Object.freeze({
      position: Object.freeze([-15.3, OBSERVATORY_TERRACE_Y, -21.5] as const),
      rotationY: -0.5,
    }),
  }),

  garden: Object.freeze({
    id: 'garden',
    label: 'Vườn kỷ niệm',
    icon: '🌸',
    subtitle: 'Khu vườn ánh sao lưu giữ ký ức, lời nhắn & Chiếc Lọ',
    spawnCenter: Object.freeze([MEMORY_GARDEN_CENTER_XZ[0], gardenSeekerY, MEMORY_GARDEN_CENTER_XZ[1]] as const),
    defaultAzimuthRad: -18 * DEG,
    defaultPolarRad: 97 * DEG,
    defaultPose: 'idle',
    seekerPlacement: Object.freeze({
      position: Object.freeze([MEMORY_GARDEN_CENTER_XZ[0] - 1.1, gardenSeekerY, MEMORY_GARDEN_CENTER_XZ[1] + 0.6] as const),
      rotationY: -0.25,
    }),
    chroniclerPlacement: Object.freeze({
      position: Object.freeze([MEMORY_GARDEN_CENTER_XZ[0] + 0.9, gardenChroniclerY, MEMORY_GARDEN_CENTER_XZ[1] + 0.8] as const),
      rotationY: 0.25,
    }),
  }),
});

export const WORLD_SPOT_LIST: readonly WorldSpotDefinition[] = Object.freeze([
  WORLD_SPOTS.hilltop,
  WORLD_SPOTS.lakeside,
  WORLD_SPOTS.observatory,
  WORLD_SPOTS.garden,
]);

export function getWorldSpot(spotId: WorldSpotId): WorldSpotDefinition {
  return WORLD_SPOTS[spotId];
}
