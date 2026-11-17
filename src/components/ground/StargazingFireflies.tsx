import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useSkyStore } from '../../store/useSkyStore';
import { createSeededRng } from '../../utils/prng';

const fireflyVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    // Gentle floating firefly drift above the grassy hill & lakeside
    vec3 displaced = position;
    displaced.x += sin(uTime * aSpeed * 0.55 + aPhase) * 0.55;
    displaced.y += sin(uTime * aSpeed * 0.8 + aPhase * 1.7) * 0.35;
    displaced.z += cos(uTime * aSpeed * 0.45 + aPhase * 0.9) * 0.55;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 1.0);
    float glowPulse = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (aSpeed * 1.4) + aPhase));

    gl_PointSize = clamp((aSize * uPixelRatio * 34.0) / dist, 2.0, 14.0);
    vAlpha = glowPulse * 0.78;
  }
`;

const fireflyFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c) * 2.0;
    if (d > 1.0) discard;

    float glow = exp(-d * d * 4.2);
    gl_FragColor = vec4(vColor * 1.45, glow * vAlpha);
  }
`;

/**
 * Ambient nocturnal stargazing fireflies / floating stardust motes drifting lazily
 * over the hillside and lakeside shore (1 single Points draw call, zero raycast).
 */
export function StargazingFireflies() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const { prefersReducedMotion } = useResponsiveLayout();
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const count = prefersReducedMotion
    ? 0
    : qualityTier === 'low'
    ? 24
    : qualityTier === 'medium'
    ? 52
    : 85;

  const geometry = useMemo(() => {
    if (count === 0) return null;
    const rng = createSeededRng('a-sky-full-of-you-stargazing-fireflies');
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    const palette = ['#ffe49e', '#ffd1dc', '#b8e8ff', '#e4c8ff'];
    const tmpCol = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const angle = rng.range(-Math.PI, Math.PI);
      const radius = rng.range(2.5, 22);
      positions[i * 3] = Math.sin(angle) * radius;
      positions[i * 3 + 1] = rng.range(0.65, 5.2);
      positions[i * 3 + 2] = -Math.cos(angle) * radius * 0.9 - 1.5;

      tmpCol.set(rng.pick(palette));
      colors[i * 3] = tmpCol.r;
      colors[i * 3 + 1] = tmpCol.g;
      colors[i * 3 + 2] = tmpCol.b;

      phases[i] = rng.range(0, Math.PI * 2);
      speeds[i] = rng.range(0.55, 1.45);
      sizes[i] = rng.range(1.1, 2.3);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geom;
  }, [count]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    }),
    []
  );

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      matRef.current.uniforms.uPixelRatio.value = Math.min(
        state.gl.getPixelRatio(),
        2
      );
    }
  });

  if (!geometry) return null;

  return (
    <points geometry={geometry} raycast={() => null}>
      <shaderMaterial
        ref={matRef}
        vertexShader={fireflyVertexShader}
        fragmentShader={fireflyFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        fog={false}
      />
    </points>
  );
}
