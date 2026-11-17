import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSkyStore } from '../../store/useSkyStore';
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
} from './shaders/atmosphere.glsl';

export function NightAtmosphereDome() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const cloudStrength = qualityTier === 'low' ? 0.0 : qualityTier === 'medium' ? 0.65 : 1.0;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCloudStrength: { value: cloudStrength },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uCloudStrength.value = cloudStrength;
    }
  });

  return (
    <mesh raycast={() => null} renderOrder={-100}>
      <sphereGeometry args={[320, 48, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}
