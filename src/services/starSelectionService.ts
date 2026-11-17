import type * as THREE from 'three';
import { projectWorldToScreen } from '../utils/math3d';
import type { StarPosition } from '../types/star';
import type { ScreenPoint } from '../types/store';

export const TAP_DRAG_THRESHOLD_DESKTOP = 6;
export const TAP_DRAG_THRESHOLD_TOUCH = 10;

export function isPureTap(
  downPoint: ScreenPoint,
  upPoint: ScreenPoint,
  isTouch: boolean
): boolean {
  const threshold = isTouch ? TAP_DRAG_THRESHOLD_TOUCH : TAP_DRAG_THRESHOLD_DESKTOP;
  const dx = upPoint.x - downPoint.x;
  const dy = upPoint.y - downPoint.y;
  return Math.hypot(dx, dy) < threshold;
}

export function projectStarPositionToScreen(
  position: StarPosition | THREE.Vector3,
  camera: THREE.Camera,
  viewport: { width: number; height: number }
): { point: ScreenPoint; isBehindCamera: boolean } {
  return projectWorldToScreen(position, camera, viewport);
}
