import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useSkyStore } from '../../store/useSkyStore';
import { createSeededRng } from '../../utils/prng';
import {
  starFieldFragmentShader,
  starFieldVertexShader,
} from './shaders/starField.glsl';

export function DecorativeStarField() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const profile = getQualityProfile(qualityTier);
  const count = profile.decorativeStarCount;

  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate deterministic celestial dome positions & attributes on qualityTier change
  const geometryData = useMemo(() => {
    const rng = createSeededRng('a-sky-full-of-you-bg-stars');

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    const tempColor = new THREE.Color();
    // Subtle, astronomical starlight color palette (realistic blue-white to warm amber)
    const celestialPalettes = [
      '#ffffff', // Pure starlight
      '#dbeafe', // Blue-white B/A star
      '#eef6ff', // Diamond white
      '#ffe8c2', // Warm yellow-white F/G star
      '#ffd8a8', // Soft amber K star
      '#e4d4ff', // Subtle lavender shimmer
    ];

    for (let i = 0; i < count; i += 1) {
      const idx3 = i * 3;

      // Upper celestial hemisphere distribution (above horizon, biased along tilted galactic plane)
      const u = rng.next();
      const v = rng.next();
      const theta = u * 2.0 * Math.PI;
      // Concentrate stars cleanly in the visible upper dome (altitude ~ -2 deg to 90 deg)
      const sinAlt = -0.03 + v * 1.03;
      const cosAlt = Math.sqrt(Math.max(0, 1.0 - sinAlt * sinAlt));
      const radius = rng.range(245, 280);

      let x = radius * cosAlt * Math.cos(theta);
      let y = radius * sinAlt;
      let z = radius * cosAlt * Math.sin(theta);

      // Gentle density clustering along the arching Milky Way band
      if (rng.next() < 0.42) {
        const bandSpread = rng.gaussian() * 24.0;
        const t = rng.range(0.08, Math.PI - 0.08);
        const galX = radius * Math.cos(t);
        const galY = radius * Math.sin(t) * 0.88;
        const galZ = -radius * Math.sin(t) * 0.48;
        x = galX + bandSpread * 0.65;
        y = Math.max(4, galY + bandSpread * 0.45);
        z = galZ + bandSpread * 0.75;
        const norm = radius / (Math.hypot(x, y, z) || 1);
        x *= norm;
        y *= norm;
        z *= norm;
      }

      positions[idx3] = x;
      positions[idx3 + 1] = y;
      positions[idx3 + 2] = z;

      tempColor.set(rng.pick(celestialPalettes));
      colors[idx3] = tempColor.r;
      colors[idx3 + 1] = tempColor.g;
      colors[idx3 + 2] = tempColor.b;

      // Variable apparent brightness with rare crisp guide stars
      const isHero = rng.next() < 0.04;
      sizes[i] = isHero ? rng.range(2.6, 3.8) : rng.range(1.0, 2.0);

      phases[i] = rng.range(0, Math.PI * 2);
      speeds[i] = rng.range(0.7, 2.3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    return geometry;
  }, [count]);

  // Free previous GPU BufferGeometry when qualityTier changes or component unmounts
  useEffect(() => {
    return () => {
      geometryData.dispose();
    };
  }, [geometryData]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uPixelRatio.value = Math.min(
        state.gl.getPixelRatio(),
        2
      );
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometryData}
      // TD-03: Zero raycast on decorative background stars to preserve 60 FPS
      raycast={() => null}
      renderOrder={-70}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={starFieldVertexShader}
        fragmentShader={starFieldFragmentShader}
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
