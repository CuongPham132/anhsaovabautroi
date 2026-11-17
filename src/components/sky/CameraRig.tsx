import React, { useEffect, useMemo, useRef } from 'react';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWorldSpot } from '../../data/worldSpots';
import { getZodiacById, resolveZodiacGeometry } from '../../data/zodiacCatalog';
import { starRepository } from '../../repositories/starRepository';
import { playerRuntime } from '../../services/playerRuntime';
import { useSkyStore } from '../../store/useSkyStore';
import { useZodiacStore } from '../../store/useZodiacStore';
import {
  computeObserverGazeAngles,
  resolveMemoryStarWorldPosition,
} from '../../utils/skyProjection';

export const RESET_CAMERA_EVENT = 'sky:reset-camera';

const DEFAULT_FOLLOW_DISTANCE = 6.2;
const MIN_FOLLOW_DISTANCE = 1.05;
const MAX_FOLLOW_DISTANCE = 14.5;
const TARGET_EYE_OFFSET_Y = 1.55;

// Third-Person + Full Sky-Gazing Polar Bounds:
//   minPolar ~ 28 deg => scenic high overview over hill/lake
//   maxPolar ~ 164 deg => tilt almost straight up to zenith (with automatic distance compression so camera NEVER clips underground!)
const THIRD_PERSON_MIN_POLAR = Math.PI * 0.16;
const THIRD_PERSON_MAX_POLAR = Math.PI * 0.91;

export function triggerResetCamera(): void {
  window.dispatchEvent(new CustomEvent(RESET_CAMERA_EVENT));
}

function shortestAngleTarget(currentRad: number, targetRad: number): number {
  const twoPi = Math.PI * 2;
  const delta = (((targetRad - currentRad + Math.PI) % twoPi) + twoPi) % twoPi - Math.PI;
  return currentRad + delta;
}

/**
 * Third-Person Follow Camera with Sky-Friendly Dynamic Ground Clearance (V2.2):
 *   - Smoothly follows the controlled character (`seeker` or `chronicler`) across all 4 zones.
 *   - User rotates 360 deg freely & zooms independently (`3.2m..14.5m`) without fighting WASD movement.
 *   - When tilting upward to admire the Moon / Milky Way / 12 Zodiacs, dynamically compresses orbit
 *     distance toward the character's shoulder so the camera NEVER penetrates the terrain or lake!
 */
export const CameraRig: React.FC = () => {
  const controlsRef = useRef<CameraControls>(null);
  const preferredDistanceRef = useRef(DEFAULT_FOLLOW_DISTANCE);
  const wasCompressedRef = useRef(false);
  const smoothedTargetRef = useRef(new THREE.Vector3(-1.05, 2.6, 1.35));
  const lastTeleportHandledRef = useRef(0);

  const selectedStarId = useSkyStore((state) => state.selectedStarId);
  const guideTargetZodiacId = useZodiacStore((state) => state.guideTargetZodiacId);
  const selectedZodiacId = useZodiacStore((state) => state.selectedZodiacId);

  const scratchTarget = useMemo(() => new THREE.Vector3(), []);

  // Configure independent mouse/touch camera bindings once on mount
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.mouseButtons.left = CameraControlsImpl.ACTION.ROTATE;
    controls.mouseButtons.middle = CameraControlsImpl.ACTION.NONE;
    controls.mouseButtons.right = CameraControlsImpl.ACTION.NONE;
    controls.mouseButtons.wheel = CameraControlsImpl.ACTION.DOLLY;

    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_ROTATE;
    controls.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY_ROTATE;
    controls.touches.three = CameraControlsImpl.ACTION.NONE;

    // Initial scenic framing behind the local player looking North over lake & Observatory
    const spot = getWorldSpot('hilltop');
    const leadPos = playerRuntime.getLocalPlayerPosition();
    const tx = leadPos.x;
    const ty = leadPos.y + TARGET_EYE_OFFSET_Y;
    const tz = leadPos.z;
    smoothedTargetRef.current.set(tx, ty, tz);

    controls.setTarget(tx, ty, tz, false);
    controls.rotateTo(spot.defaultAzimuthRad, spot.defaultPolarRad, false);
    controls.dollyTo(DEFAULT_FOLLOW_DISTANCE, false);
  }, []);

  // Reset camera framing behind the currently controlled character
  useEffect(() => {
    const handleReset = () => {
      const controls = controlsRef.current;
      if (!controls) return;
      const spot = getWorldSpot(useSkyStore.getState().activeWorldSpot);
      preferredDistanceRef.current = DEFAULT_FOLLOW_DISTANCE;
      const targetAz = shortestAngleTarget(controls.azimuthAngle, spot.defaultAzimuthRad);
      controls.rotateTo(targetAz, spot.defaultPolarRad, true);
      controls.dollyTo(DEFAULT_FOLLOW_DISTANCE, true);
    };

    window.addEventListener(RESET_CAMERA_EVENT, handleReset);
    return () => window.removeEventListener(RESET_CAMERA_EVENT, handleReset);
  }, []);

  // Gently turn camera gaze toward selected Memory Star
  useEffect(() => {
    if (!selectedStarId || !controlsRef.current) return;
    const star = starRepository.getStar(selectedStarId);
    if (!star) return;

    const controls = controlsRef.current;
    const leadPos = playerRuntime.getLocalPlayerPosition();
    const eye: [number, number, number] = [leadPos.x, leadPos.y + TARGET_EYE_OFFSET_Y, leadPos.z];
    const worldPos = resolveMemoryStarWorldPosition(star);
    const { azimuthAngle, polarAngle } = computeObserverGazeAngles(worldPos, eye);
    const shortestAz = shortestAngleTarget(controls.azimuthAngle, azimuthAngle);

    controls.rotateTo(shortestAz, Math.min(polarAngle, THIRD_PERSON_MAX_POLAR), true);
  }, [selectedStarId]);

  // Gently turn camera gaze toward guided or selected Zodiac Constellation
  useEffect(() => {
    const targetZodiacId = guideTargetZodiacId ?? selectedZodiacId;
    if (!targetZodiacId || !controlsRef.current) return;
    const zodiac = getZodiacById(targetZodiacId);
    if (!zodiac) return;

    const controls = controlsRef.current;
    const leadPos = playerRuntime.getLocalPlayerPosition();
    const eye: [number, number, number] = [leadPos.x, leadPos.y + TARGET_EYE_OFFSET_Y, leadPos.z];
    const { centerWorld } = resolveZodiacGeometry(zodiac);
    const { azimuthAngle, polarAngle } = computeObserverGazeAngles(centerWorld, eye);
    const shortestAz = shortestAngleTarget(controls.azimuthAngle, azimuthAngle);

    controls.rotateTo(shortestAz, Math.min(polarAngle, THIRD_PERSON_MAX_POLAR), true);
  }, [guideTargetZodiacId, selectedZodiacId]);

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const dt = Math.min(rawDelta, 0.05);
    const storeState = useSkyStore.getState();
    const leadPos = playerRuntime.getLocalPlayerPosition();

    scratchTarget.set(leadPos.x, leadPos.y + TARGET_EYE_OFFSET_Y, leadPos.z);

    // If a quick-travel zone teleport just happened, snap camera framing smoothly to the new zone
    if (playerRuntime.pendingTeleportNonce !== lastTeleportHandledRef.current) {
      lastTeleportHandledRef.current = playerRuntime.pendingTeleportNonce;
      const spot = getWorldSpot(storeState.activeWorldSpot);
      smoothedTargetRef.current.copy(scratchTarget);
      controls.moveTo(scratchTarget.x, scratchTarget.y, scratchTarget.z, true);
      const targetAz = shortestAngleTarget(controls.azimuthAngle, spot.defaultAzimuthRad);
      controls.rotateTo(targetAz, spot.defaultPolarRad, true);
      preferredDistanceRef.current = DEFAULT_FOLLOW_DISTANCE;
      controls.dollyTo(DEFAULT_FOLLOW_DISTANCE, true);
      return;
    }

    // Smoothly track controlled character's movement without interfering with user camera orbit
    const followLerp = Math.min(1, dt * 8.5);
    smoothedTargetRef.current.lerp(scratchTarget, followLerp);
    controls.moveTo(
      smoothedTargetRef.current.x,
      smoothedTargetRef.current.y,
      smoothedTargetRef.current.z,
      false
    );

    // Dynamic Sky-Tilt Ground Clearance:
    // Compresses orbit distance smoothly toward shoulder when tilting up to stargaze,
    // and smoothly restores user's preferred third-person distance when tilting back down.
    const polar = controls.polarAngle;
    const cosPolar = Math.cos(polar);
    const maxSafeDist =
      cosPolar < -0.04
        ? Math.max(MIN_FOLLOW_DISTANCE, (TARGET_EYE_OFFSET_Y - 0.42) / -cosPolar)
        : MAX_FOLLOW_DISTANCE;

    if (preferredDistanceRef.current > maxSafeDist) {
      wasCompressedRef.current = true;
      if (Math.abs(controls.distance - maxSafeDist) > 0.05) {
        controls.dollyTo(maxSafeDist, false);
      }
    } else if (wasCompressedRef.current) {
      wasCompressedRef.current = false;
      controls.dollyTo(preferredDistanceRef.current, true);
    } else {
      preferredDistanceRef.current = THREE.MathUtils.clamp(
        controls.distance,
        2.6,
        MAX_FOLLOW_DISTANCE
      );
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.28}
      draggingSmoothTime={0.1}
      minDistance={MIN_FOLLOW_DISTANCE}
      maxDistance={MAX_FOLLOW_DISTANCE}
      minPolarAngle={THIRD_PERSON_MIN_POLAR}
      maxPolarAngle={THIRD_PERSON_MAX_POLAR}
      azimuthRotateSpeed={0.58}
      polarRotateSpeed={0.54}
      dollySpeed={0.9}
      truckSpeed={0}
    />
  );
};
