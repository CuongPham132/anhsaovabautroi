import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSkyStore } from '../../store/useSkyStore';
import { starRepository } from '../../repositories/starRepository';
import {
  easeInOutCubic,
  unprojectScreenToWorldAtDistance,
  updateFlightCurvePoints,
  type FlightControlPoints,
} from '../../utils/math3d';
import {
  starCollectionService,
  FLIGHT_DURATION_MS,
} from '../../services/starCollectionService';
import { resolveMemoryStarWorldPosition } from '../../utils/skyProjection';

// Unproject Memory Jar destination safely in front of foreground shore/mountains
const JAR_FLIGHT_TARGET_DISTANCE = 12;

export const CollectionFlightEffect: React.FC = () => {
  const inFlightStarId = useSkyStore((state) => state.inFlightStarId);
  const { camera, size } = useThree();

  const startTimeRef = useRef<number | null>(null);
  const activeStarIdRef = useRef<string | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Persistent scratch objects for zero-allocation useFrame
  const controlPoints = useMemo<FlightControlPoints>(
    () => [
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ],
    []
  );

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5),
    [controlPoints]
  );

  const startWorldPos = useMemo(() => new THREE.Vector3(), []);
  const endWorldPos = useMemo(() => new THREE.Vector3(), []);
  const currentPos = useMemo(() => new THREE.Vector3(), []);

  // Update starting position when inFlightStarId changes
  useEffect(() => {
    if (inFlightStarId) {
      const star = starRepository.getStar(inFlightStarId);
      if (star) {
        const resolved = resolveMemoryStarWorldPosition(star);
        startWorldPos.set(resolved[0], resolved[1], resolved[2]);
      } else {
        startWorldPos.set(0, 60, -160);
      }
      startTimeRef.current = performance.now();
      activeStarIdRef.current = inFlightStarId;
    } else {
      startTimeRef.current = null;
      activeStarIdRef.current = null;
    }
  }, [inFlightStarId, startWorldPos]);

  // TD-10: Reliability fallback on unmount
  useEffect(() => {
    return () => {
      const remainingStarId = activeStarIdRef.current;
      if (remainingStarId) {
        starCollectionService.finalizeCollectionVisual(remainingStarId);
      }
    };
  }, []);

  useFrame(() => {
    if (!inFlightStarId || startTimeRef.current === null) {
      if (meshRef.current) meshRef.current.visible = false;
      if (haloRef.current) haloRef.current.visible = false;
      return;
    }

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(Math.max(elapsed / FLIGHT_DURATION_MS, 0), 1);

    // Dynamically unproject live jarScreenAnchor at foreground distance so star never clips terrain
    const jarScreenAnchor = useSkyStore.getState().jarScreenAnchor;
    unprojectScreenToWorldAtDistance(
      jarScreenAnchor,
      camera,
      size,
      JAR_FLIGHT_TARGET_DISTANCE,
      endWorldPos
    );

    // Update curve control points in-place
    updateFlightCurvePoints(startWorldPos, endWorldPos, camera.up, controlPoints);
    curve.points = controlPoints;

    // Evaluate position along cosmic curve
    const easedT = easeInOutCubic(progress);
    curve.getPoint(easedT, currentPos);

    // Distance-aware scaling so the flying star maintains dramatic visual continuity from sky dome -> jar
    const distFromCamera = camera.position.distanceTo(currentPos);
    const apparentBaseScale = Math.max(0.18, distFromCamera * 0.0115);

    if (meshRef.current) {
      meshRef.current.visible = true;
      meshRef.current.position.copy(currentPos);
      meshRef.current.scale.setScalar(apparentBaseScale * (1.15 - progress * 0.35));
    }

    if (haloRef.current) {
      haloRef.current.visible = true;
      haloRef.current.position.copy(currentPos);
      const pulseBoost = 1.0 + Math.sin(progress * Math.PI) * 0.65;
      haloRef.current.scale.setScalar(apparentBaseScale * 2.4 * pulseBoost);
    }

    if (progress >= 1.0) {
      starCollectionService.finalizeCollectionVisual(inFlightStarId);
      startTimeRef.current = null;
      activeStarIdRef.current = null;
    }
  });

  if (!inFlightStarId) return null;

  return (
    <group renderOrder={999}>
      {/* Flight Star Core Mesh (depthTest=false & fog=false ensures clear visibility over horizon terrain) */}
      <mesh ref={meshRef} renderOrder={999}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          toneMapped={false}
          transparent
          opacity={0.96}
          depthTest={false}
          fog={false}
        />
      </mesh>

      {/* Flight Star Glowing Halo */}
      <mesh ref={haloRef} renderOrder={998}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffe49e"
          toneMapped={false}
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          fog={false}
        />
      </mesh>
    </group>
  );
};
