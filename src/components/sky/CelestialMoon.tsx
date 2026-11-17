import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OBSERVER_EYE_POSITION } from '../../utils/skyProjection';
import {
  moonFragmentShader,
  moonHaloFragmentShader,
  moonHaloVertexShader,
  moonVertexShader,
} from './shaders/moon.glsl';

// Moon perched poetically above the distant Cosmic Observatory & mountain valley
const MOON_AZIMUTH_RAD = (-37 * Math.PI) / 180;
const MOON_ALTITUDE_RAD = (28.5 * Math.PI) / 180;
const MOON_DISTANCE = 258;
const MOON_RADIUS = 8.4;

export const MOON_WORLD_POSITION: readonly [number, number, number] = Object.freeze([
  OBSERVER_EYE_POSITION[0] + MOON_DISTANCE * Math.cos(MOON_ALTITUDE_RAD) * Math.sin(MOON_AZIMUTH_RAD),
  OBSERVER_EYE_POSITION[1] + MOON_DISTANCE * Math.sin(MOON_ALTITUDE_RAD),
  OBSERVER_EYE_POSITION[2] - MOON_DISTANCE * Math.cos(MOON_ALTITUDE_RAD) * Math.cos(MOON_AZIMUTH_RAD),
]);

/**
 * Luminous procedural 3D Moon with lunar maria, realistic phase lighting,
 * subtle earthshine on the dark limb, and an additive atmospheric corona halo.
 */
export function CelestialMoon() {
  const { camera } = useThree();
  const haloRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      // Sun angle producing an iconic romantic ~82% waxing gibbous Moon illuminated from upper-right
      uSunDir: { value: new THREE.Vector3(0.76, 0.34, 0.55).normalize() },
    }),
    []
  );

  // Keep the soft atmospheric halo facing the camera smoothly
  useFrame(() => {
    if (haloRef.current) {
      haloRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group
      name="celestial-moon"
      position={[
        MOON_WORLD_POSITION[0],
        MOON_WORLD_POSITION[1],
        MOON_WORLD_POSITION[2],
      ]}
      raycast={() => null}
      renderOrder={-50}
    >
      {/* 3D Procedural Lunar Sphere */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[MOON_RADIUS, 36, 36]} />
        <shaderMaterial
          vertexShader={moonVertexShader}
          fragmentShader={moonFragmentShader}
          uniforms={uniforms}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Soft Billboarded Moonlight Atmospheric Corona Halo */}
      <mesh ref={haloRef} raycast={() => null} renderOrder={-51}>
        <planeGeometry args={[MOON_RADIUS * 7.8, MOON_RADIUS * 7.8]} />
        <shaderMaterial
          vertexShader={moonHaloVertexShader}
          fragmentShader={moonHaloFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
