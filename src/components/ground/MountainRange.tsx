import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useSkyStore } from '../../store/useSkyStore';

interface MountainRingConfig {
  readonly innerRadius: number;
  readonly ridgeRadius: number;
  readonly outerRadius: number;
  readonly radialSegments: number;
  readonly baseHeight: number;
  readonly maxPeakHeight: number;
  readonly seedOffset: number;
  readonly valleyCarveDepth: number;
  readonly baseColorHex: string;
  readonly peakColorHex: string;
}

/**
 * Deterministic multi-octave ridged profile around 360 degrees.
 * Creates an organic alpine silhouette with a calm lake valley opening toward North (-Z).
 */
function sampleMountainRidgeHeight(
  angleRad: number,
  maxPeakHeight: number,
  seedOffset: number,
  valleyCarveDepth: number
): number {
  const a = angleRad;
  // Multi-harmonic ridged noise (smoothly periodic on [0, 2*PI])
  const n1 = Math.sin(a * 3.0 + seedOffset) * 0.45 + 0.5;
  const n2 = Math.abs(Math.sin(a * 7.0 + seedOffset * 1.7)) * 0.35;
  const n3 = (1.0 - Math.abs(Math.cos(a * 13.0 - seedOffset * 0.9))) * 0.24;
  const n4 = Math.sin(a * 23.0 + seedOffset * 2.3) * 0.08;
  const n5 = Math.cos(a * 37.0 - seedOffset * 1.4) * 0.04;

  const ridge = Math.max(0.08, n1 * 0.55 + n2 * 0.55 + n3 * 0.45 + n4 + n5);

  // Carve a graceful scenic valley around North (-Z, where sin(a) = 0, cos(a) = -1 => angle = PI)
  // Using coordinate convention x = r * sin(a), z = -r * cos(a) => North is a = 0!
  const northAlignment = Math.cos(a); // +1 at North (-Z), -1 at South (+Z)
  const valleyMask = Math.pow(Math.max(0, northAlignment), 4.0);
  const sculpted = ridge * (1.0 - valleyMask * valleyCarveDepth);

  return Math.max(1.2, sculpted * maxPeakHeight);
}

/**
 * Builds a true 3D triangular-ring mountain range (inner shoreline -> jagged ridge -> outer drop)
 * with vertex color aerial-perspective shading.
 */
function buildMountainRingGeometry(config: MountainRingConfig): THREE.BufferGeometry {
  const {
    innerRadius,
    ridgeRadius,
    outerRadius,
    radialSegments,
    baseHeight,
    maxPeakHeight,
    seedOffset,
    valleyCarveDepth,
    baseColorHex,
    peakColorHex,
  } = config;

  // 4 concentric rings of vertices for smooth 3D slope depth:
  // ring 0: inner foot (below water)
  // ring 1: mid-inner slope
  // ring 2: jagged alpine crest
  // ring 3: outer drop
  const ringCount = 4;
  const stride = radialSegments + 1;
  const vertexCount = ringCount * stride;

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);

  const baseColor = new THREE.Color(baseColorHex);
  const peakColor = new THREE.Color(peakColorHex);
  const tempColor = new THREE.Color();

  for (let i = 0; i <= radialSegments; i += 1) {
    const t = i / radialSegments;
    const angle = t * Math.PI * 2;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    const peakY = sampleMountainRidgeHeight(
      angle,
      maxPeakHeight,
      seedOffset,
      valleyCarveDepth
    );
    const midSlopeY = peakY * (0.44 + 0.12 * Math.sin(angle * 11.0 + seedOffset));
    const ridgeRadiusJitter =
      ridgeRadius + Math.sin(angle * 5.0 + seedOffset) * 5.5;
    const midRadius = (innerRadius + ridgeRadiusJitter) * 0.52;

    const ringSpecs: Array<[number, number, number]> = [
      [innerRadius, baseHeight, 0.0],
      [midRadius, midSlopeY, 0.36],
      [ridgeRadiusJitter, peakY, 1.0],
      [outerRadius, baseHeight - 4.0, 0.0],
    ];

    for (let r = 0; r < ringCount; r += 1) {
      const [rad, y, heightFrac] = ringSpecs[r]!;
      const vIdx = r * stride + i;
      const pIdx = vIdx * 3;

      positions[pIdx] = rad * sinA;
      positions[pIdx + 1] = y;
      positions[pIdx + 2] = -rad * cosA;

      // Subtle moonlit indigo-lavender sheen on elevated crests
      const northRimBoost = Math.max(0, cosA) * 0.15 * heightFrac;
      tempColor.copy(baseColor).lerp(peakColor, Math.min(1, heightFrac * 0.85 + northRimBoost));
      colors[pIdx] = tempColor.r;
      colors[pIdx + 1] = tempColor.g;
      colors[pIdx + 2] = tempColor.b;
    }
  }

  const indices: number[] = [];
  for (let r = 0; r < ringCount - 1; r += 1) {
    for (let i = 0; i < radialSegments; i += 1) {
      const a = r * stride + i;
      const b = a + 1;
      const c = (r + 1) * stride + i;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

const mistVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const mistFragmentShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    // Soft bell curve vertically hugging the lake waterline & mountain base
    float vertical = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
    float shimmer = 0.78 + 0.22 * sin(vUv.x * 37.699);
    vec3 mistColor = vec3(0.11, 0.14, 0.28);
    gl_FragColor = vec4(mistColor, vertical * shimmer * 0.34);
  }
`;

export function MountainRange() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const profile = getQualityProfile(qualityTier);
  const segs = profile.terrainRadialSegments;

  const { distantGeometry, midgroundGeometry } = useMemo(() => {
    const distant = buildMountainRingGeometry({
      innerRadius: 122,
      ridgeRadius: 152,
      outerRadius: 178,
      radialSegments: segs,
      baseHeight: -3.5,
      maxPeakHeight: 27,
      seedOffset: 1.35,
      valleyCarveDepth: 0.56,
      baseColorHex: '#091026',
      peakColorHex: '#1c244b',
    });

    const midground = buildMountainRingGeometry({
      innerRadius: 84,
      ridgeRadius: 106,
      outerRadius: 126,
      radialSegments: Math.max(48, Math.floor(segs * 0.75)),
      baseHeight: -2.5,
      maxPeakHeight: 13.5,
      seedOffset: 4.15,
      valleyCarveDepth: 0.72,
      baseColorHex: '#050816',
      peakColorHex: '#101836',
    });

    return { distantGeometry: distant, midgroundGeometry: midground };
  }, [segs]);

  useEffect(() => {
    return () => {
      distantGeometry.dispose();
      midgroundGeometry.dispose();
    };
  }, [distantGeometry, midgroundGeometry]);

  return (
    <group raycast={() => null}>
      {/* Background Majestic Alpine Peaks */}
      <mesh geometry={distantGeometry} raycast={() => null}>
        <meshBasicMaterial vertexColors fog={true} side={THREE.DoubleSide} />
      </mesh>

      {/* Midground Darker Layered Foothills */}
      <mesh geometry={midgroundGeometry} raycast={() => null}>
        <meshBasicMaterial vertexColors fog={true} side={THREE.DoubleSide} />
      </mesh>

      {/* Subtle Low-Lying Nocturnal Mist Band above Waterline */}
      <mesh position={[0, 3.6, 0]} raycast={() => null}>
        <cylinderGeometry args={[112, 112, 8.5, 64, 1, true]} />
        <shaderMaterial
          vertexShader={mistVertexShader}
          fragmentShader={mistFragmentShader}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          fog={false}
        />
      </mesh>
    </group>
  );
}
