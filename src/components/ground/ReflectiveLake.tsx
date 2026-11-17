import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useSkyStore } from '../../store/useSkyStore';
import { waterFragmentShader, waterVertexShader } from './shaders/water.glsl';

export const SCENE_FOG_COLOR = '#0b1128';
export const SCENE_FOG_DENSITY = 0.0044;

export function ReflectiveLake() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const profile = getQualityProfile(qualityTier);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const qualityNumeric =
    profile.waterReflectionQuality === 'simple'
      ? 0.0
      : profile.waterReflectionQuality === 'medium'
      ? 1.0
      : 2.0;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uQuality: { value: qualityNumeric },
      uFogColor: { value: new THREE.Color(SCENE_FOG_COLOR) },
      uFogDensity: { value: SCENE_FOG_DENSITY },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uQuality.value = qualityNumeric;
    }
  });

  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => null}
    >
      <circleGeometry args={[158, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        fog={false}
      />
    </mesh>
  );
}
