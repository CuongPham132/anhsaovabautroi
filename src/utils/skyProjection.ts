import type { InteractiveStar, StarPosition } from '../types/star';
import { clampNumber } from './math3d';

/**
 * Planned default observer location for future V1.3 real-astronomy integration
 * (no Geolocation or astronomical engine active in V1.1).
 */
export const DEFAULT_OBSERVER_LOCATION = Object.freeze({
  label: 'Hà Nội',
  latitude: 21.03,
  longitude: 105.85,
  elevationMeters: 12,
});

/**
 * Observer eye position standing on the lakeside observation hill (Y-up, right-handed).
 */
export const OBSERVER_EYE_POSITION: StarPosition = Object.freeze([0, 3.2, 0]);

/**
 * Radius of the celestial shell hosting the 18 curated memory stars.
 * Placed beyond the distant mountain ring (r ~ 178) and inside the background star sphere (r ~ 245..280).
 */
export const MEMORY_DOME_RADIUS = 205;

/**
 * Rigid upward pitch rotation (around +X axis) applied to V1 star sightlines.
 * Because this is an isometric SO(3) rotation, all 4 memory constellations preserve
 * their exact V1 shapes, angles, and relative proportions with zero distortion,
 * while elevating all 18 stars (including the 5 with y < 0) safely above the mountains.
 */
const V1_REFERENCE_CAMERA_Z = 18;
const V1_REFERENCE_MEAN_DISTANCE = 54;
const CONSTELLATION_RIGID_PITCH_RAD = (33 * Math.PI) / 180;
const COS_PITCH = Math.cos(CONSTELLATION_RIGID_PITCH_RAD);
const SIN_PITCH = Math.sin(CONSTELLATION_RIGID_PITCH_RAD);

/**
 * Default planetarium gaze angles (looking North over the reflective lake toward the 4 constellations).
 * Note: For an inside-out observer camera (offset = camera - target = -lookDir),
 * polarAngle = acos(-sin(altitude)):
 *   - pi / 2       => horizon (0 deg)
 *   - > pi / 2     => looking UP toward zenith
 *   - < pi / 2     => looking DOWN toward lake
 */
export const DEFAULT_OBSERVER_AZIMUTH = 0;
export const DEFAULT_OBSERVER_ALTITUDE_RAD = (24 * Math.PI) / 180;
export const DEFAULT_OBSERVER_POLAR = Math.acos(-Math.sin(DEFAULT_OBSERVER_ALTITUDE_RAD));

/**
 * Safe polar angle boundaries preventing the camera from ever clipping below ground
 * or hitting the zenith gimbal singularity.
 *   minPolar ~ 76 deg => max ~14 deg downward tilt (frames foreground lake cleanly)
 *   maxPolar ~ 171 deg => max ~81 deg upward tilt toward zenith
 */
export const OBSERVER_MIN_POLAR_ANGLE = Math.PI * 0.422;
export const OBSERVER_MAX_POLAR_ANGLE = Math.PI * 0.95;

const cachedWorldPositions = new Map<string, StarPosition>();

/**
 * Projects a V1 InteractiveStar onto the elevated planetarium sky dome using a rigid
 * SO(3) pitch rotation around the X-axis. Preserves exact constellation geometry and
 * leaves `starsCatalog.ts`, `Star ID`, and `Content ID` completely immutable (TD-09).
 */
export function resolveMemoryStarWorldPosition(star: InteractiveStar): StarPosition {
  const cached = cachedWorldPositions.get(star.id);
  if (cached) {
    return cached;
  }

  const [rawX, rawY, rawZ] = star.position;

  // Sightline vector from V1's original camera position [0, 0, 18]
  const vx = rawX;
  const vy = rawY;
  const vz = rawZ - V1_REFERENCE_CAMERA_Z;
  const rawDist = Math.hypot(vx, vy, vz) || V1_REFERENCE_MEAN_DISTANCE;

  // Rigid rotation around +X by +33 deg (tilts -Z sky upward toward +Y without distortion)
  const rx = vx;
  const ry = vy * COS_PITCH - vz * SIN_PITCH;
  const rz = vy * SIN_PITCH + vz * COS_PITCH;

  // Project onto the memory dome shell while preserving subtle relative depth cues
  const invLen = 1 / (Math.hypot(rx, ry, rz) || 1);
  const depthScale = clampNumber(rawDist / V1_REFERENCE_MEAN_DISTANCE, 0.92, 1.08);
  const radius = MEMORY_DOME_RADIUS * depthScale;

  const worldX = OBSERVER_EYE_POSITION[0] + rx * invLen * radius;
  const worldY = OBSERVER_EYE_POSITION[1] + ry * invLen * radius;
  const worldZ = OBSERVER_EYE_POSITION[2] + rz * invLen * radius;

  const resolved: StarPosition = Object.freeze([worldX, worldY, worldZ]);
  cachedWorldPositions.set(star.id, resolved);
  return resolved;
}

/**
 * Computes CameraControls (azimuthAngle, polarAngle) required for an inside-out observer
 * camera at `observerEye` to look toward a target world position.
 */
export function computeObserverGazeAngles(
  worldPos: StarPosition,
  observerEye: StarPosition = OBSERVER_EYE_POSITION
): {
  azimuthAngle: number;
  polarAngle: number;
} {
  const dx = worldPos[0] - observerEye[0];
  const dy = worldPos[1] - observerEye[1];
  const dz = worldPos[2] - observerEye[2];
  const length = Math.hypot(dx, dy, dz) || 1;

  // Inside-out camera offset = camera.position - target = -lookDir
  const offsetX = -dx / length;
  const offsetY = -dy / length;
  const offsetZ = -dz / length;

  const azimuthAngle = Math.atan2(offsetX, offsetZ);
  const rawPolar = Math.acos(clampNumber(offsetY, -1, 1));
  const polarAngle = clampNumber(
    rawPolar,
    OBSERVER_MIN_POLAR_ANGLE,
    OBSERVER_MAX_POLAR_ANGLE
  );

  return { azimuthAngle, polarAngle };
}
