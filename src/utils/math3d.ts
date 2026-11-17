import * as THREE from 'three';
import type { StarPosition } from '../types/star';
import type { ScreenPoint } from '../types/store';

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

export interface ProjectedScreenResult {
  readonly point: ScreenPoint;
  readonly isBehindCamera: boolean;
}

export type FlightControlPoints = [
  THREE.Vector3,
  THREE.Vector3,
  THREE.Vector3,
  THREE.Vector3,
];

const scratchProjectVec = new THREE.Vector3();
const scratchViewVec = new THREE.Vector3();
const scratchDelta = new THREE.Vector3();
const scratchDirection = new THREE.Vector3();
const scratchCross = new THREE.Vector3();
const scratchArcOffset = new THREE.Vector3();

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.min(Math.max(value, low), high);
}

/**
 * Cubic ease-in-out clamped safely to [0, 1].
 */
export function easeInOutCubic(t: number): number {
  const clamped = clampNumber(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Euclidean distance in CSS pixels between two screen coordinates.
 */
export function computePointerDistance(a: ScreenPoint, b: ScreenPoint): number {
  if (
    !Number.isFinite(a.x) ||
    !Number.isFinite(a.y) ||
    !Number.isFinite(b.x) ||
    !Number.isFinite(b.y)
  ) {
    return 0;
  }
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Projects a 3D world position onto 2D viewport pixel coordinates without mutating inputs.
 */
export function projectWorldToScreen(
  worldPosition: StarPosition | THREE.Vector3,
  camera: THREE.Camera,
  viewport: ViewportSize
): ProjectedScreenResult {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return {
      point: { x: 0, y: 0 },
      isBehindCamera: true,
    };
  }

  if (worldPosition instanceof THREE.Vector3) {
    scratchProjectVec.copy(worldPosition);
  } else {
    scratchProjectVec.set(worldPosition[0], worldPosition[1], worldPosition[2]);
  }

  scratchViewVec.copy(scratchProjectVec).applyMatrix4(camera.matrixWorldInverse);
  scratchProjectVec.project(camera);

  const isBehindCamera =
    scratchViewVec.z >= 0 || scratchProjectVec.z > 1 || scratchProjectVec.z < -1;
  const x = (scratchProjectVec.x * 0.5 + 0.5) * viewport.width;
  const y = (-scratchProjectVec.y * 0.5 + 0.5) * viewport.height;

  return {
    point: {
      x: Number.isFinite(x) ? x : viewport.width * 0.5,
      y: Number.isFinite(y) ? y : viewport.height * 0.5,
    },
    isBehindCamera,
  };
}

/**
 * Unprojects a 2D viewport coordinate to a 3D world point at a fixed distance
 * along the camera viewing ray. Reuses `target` if provided (zero allocation in useFrame).
 */
export function unprojectScreenToWorldAtDistance(
  screenPoint: ScreenPoint,
  camera: THREE.Camera,
  viewport: ViewportSize,
  distanceFromCamera: number,
  target: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  const safeDistance =
    Number.isFinite(distanceFromCamera) && distanceFromCamera > 0
      ? distanceFromCamera
      : 8;

  if (viewport.width <= 0 || viewport.height <= 0) {
    camera.getWorldDirection(scratchDirection);
    return target
      .copy(camera.position)
      .addScaledVector(scratchDirection, safeDistance);
  }

  const ndcX = (screenPoint.x / viewport.width) * 2 - 1;
  const ndcY = -(screenPoint.y / viewport.height) * 2 + 1;

  target.set(
    clampNumber(ndcX, -1.5, 1.5),
    clampNumber(ndcY, -1.5, 1.5),
    0.5
  );
  target.unproject(camera);
  target.sub(camera.position);

  if (target.lengthSq() < 1e-10) {
    camera.getWorldDirection(target);
  } else {
    target.normalize();
  }

  return target.multiplyScalar(safeDistance).add(camera.position);
}

/**
 * Updates 4 CatmullRomCurve3 control points in-place for a curved cosmic arc
 * from startWorldPos to endWorldPos without allocating temporary vectors.
 */
export function updateFlightCurvePoints(
  startWorldPos: THREE.Vector3,
  endWorldPos: THREE.Vector3,
  cameraUp: THREE.Vector3,
  outPoints: FlightControlPoints
): FlightControlPoints {
  const [p0, p1, p2, p3] = outPoints;

  p0.copy(startWorldPos);
  p3.copy(endWorldPos);

  scratchDelta.subVectors(p3, p0);
  const span = scratchDelta.length();

  if (span < 1e-4) {
    p1.copy(p0);
    p2.copy(p3);
    return outPoints;
  }

  scratchDirection.copy(scratchDelta).divideScalar(span);
  scratchCross.crossVectors(scratchDirection, cameraUp);

  if (scratchCross.lengthSq() < 1e-6) {
    scratchCross.set(1, 0, 0);
  } else {
    scratchCross.normalize();
  }

  const arcMagnitude = clampNumber(span * 0.22, 1.2, 8.0);
  scratchArcOffset.copy(cameraUp);
  if (scratchArcOffset.lengthSq() < 1e-6) {
    scratchArcOffset.set(0, 1, 0);
  } else {
    scratchArcOffset.normalize();
  }
  scratchArcOffset
    .multiplyScalar(arcMagnitude * 0.72)
    .addScaledVector(scratchCross, arcMagnitude * 0.48);

  p1.lerpVectors(p0, p3, 0.3).add(scratchArcOffset);
  p2.lerpVectors(p0, p3, 0.72).addScaledVector(scratchArcOffset, 0.45);

  return outPoints;
}

/**
 * Clamps a floating overlay anchor so the element remains within viewport bounds.
 */
export function clampScreenPosition(
  anchor: ScreenPoint,
  elementSize: ElementSize,
  viewport: ViewportSize,
  padding: number = 16
): ScreenPoint {
  const safePadding = Math.max(0, padding);
  const safeWidth = Math.max(0, elementSize.width);
  const safeHeight = Math.max(0, elementSize.height);

  if (viewport.width <= 0 || viewport.height <= 0) {
    return { x: safePadding, y: safePadding };
  }

  const maxX = viewport.width - safeWidth - safePadding;
  const maxY = viewport.height - safeHeight - safePadding;

  const clampedX =
    maxX <= safePadding
      ? Math.max(0, (viewport.width - safeWidth) * 0.5)
      : clampNumber(anchor.x, safePadding, maxX);

  const clampedY =
    maxY <= safePadding
      ? Math.max(0, (viewport.height - safeHeight) * 0.5)
      : clampNumber(anchor.y, safePadding, maxY);

  return { x: clampedX, y: clampedY };
}
