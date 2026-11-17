import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useSkyStore } from '../../store/useSkyStore';
import {
  nebulaFragmentShader,
  nebulaVertexShader,
} from './shaders/nebula.glsl';

export function MilkyWayNebula() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const profile = getQualityProfile(qualityTier);
  const layers = profile.nebulaLayers;

  const matRef1 = useRef<THREE.ShaderMaterial>(null);
  const matRef2 = useRef<THREE.ShaderMaterial>(null);

  const uniforms1 = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#2d1b5c') }, // Deep indigo-purple nebula
      uColorB: { value: new THREE.Color('#19336e') }, // Midnight azure stream
      uCoreColor: { value: new THREE.Color('#8e5c9e') }, // Soft lavender galactic core
      uOpacity: { value: 0.44 },
      uLayerDetail: { value: 1.0 },
    }),
    []
  );

  const uniforms2 = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#66265a') }, // Rose-gold stardust veil
      uColorB: { value: new THREE.Color('#1b4575') }, // Ethereal cyan-indigo mist
      uCoreColor: { value: new THREE.Color('#d49bb8') }, // Warm rose-lavender highlights
      uOpacity: { value: 0.24 },
      uLayerDetail: { value: 0.8 },
    }),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (matRef1.current) {
      matRef1.current.uniforms.uTime.value = elapsed;
    }
    if (matRef2.current) {
      matRef2.current.uniforms.uTime.value = elapsed;
    }
  });

  return (
    <group raycast={() => null}>
      {/* Primary 360-degree Celestial Milky Way Dome Band */}
      <mesh raycast={() => null} renderOrder={-80}>
        <sphereGeometry args={[290, 48, 32]} />
        <shaderMaterial
          ref={matRef1}
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={uniforms1}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Secondary Romantic Rose-Gold Nebula Veil (medium & high tiers) */}
      {layers >= 2 && (
        <mesh rotation={[0.14, 0.22, -0.1]} raycast={() => null} renderOrder={-79}>
          <sphereGeometry args={[286, 40, 28]} />
          <shaderMaterial
            ref={matRef2}
            vertexShader={nebulaVertexShader}
            fragmentShader={nebulaFragmentShader}
            uniforms={uniforms2}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      )}
    </group>
  );
}
