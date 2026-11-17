import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useSkyStore } from '../../store/useSkyStore';
import { createSeededRng } from '../../utils/prng';
import { sampleHillHeight } from '../../utils/worldNavigation';
import { LakesideDock } from '../world/LakesideDock';
import { MemoryGardenLandmark } from '../world/MemoryGardenLandmark';
import { ObservatoryBuilding } from '../world/ObservatoryBuilding';
import { StarlightBridge } from '../world/StarlightBridge';
import { MountainRange } from './MountainRange';
import { NightAtmosphereDome } from './NightAtmosphereDome';
import { ReflectiveLake } from './ReflectiveLake';
import { StargazingFireflies } from './StargazingFireflies';

/**
 * Foreground observation hill & eastern Memory Garden peninsula underfoot.
 * Uses the exact same `sampleHillHeight(x, z)` function as character locomotion so feet stay grounded.
 */
function ObservationShore() {
  const geometry = useMemo(() => {
    const radialSegs = 64;
    const ringSegs = 22;
    const maxRadius = 26;

    const geom = new THREE.RingGeometry(0.1, maxRadius, radialSegs, ringSegs);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const shoreDark = new THREE.Color('#040712');
    const shoreRim = new THREE.Color('#0e152e');
    const temp = new THREE.Color();

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = sampleHillHeight(x, z);

      pos.setY(i, y);

      const elevNorm = Math.max(0, Math.min(1, (y + 0.5) / 2.0));
      temp.copy(shoreDark).lerp(shoreRim, elevNorm * 0.68);
      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshBasicMaterial vertexColors fog={true} />
    </mesh>
  );
}

/**
 * Instanced pine tree silhouettes framing the outer shoreline and foothills (1 draw call).
 * Intentionally keeps the northern lake vista unobstructed so memory constellations shine clearly.
 */
function PineForestSilhouettes({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const transforms = useMemo(() => {
    if (count <= 0) return [];
    const rng = createSeededRng('a-sky-full-of-you-pine-forest-v11');
    const items: Array<{ x: number; y: number; z: number; scaleY: number; scaleXZ: number; rotY: number }> = [];

    let attempts = 0;
    while (items.length < count && attempts < count * 8) {
      attempts += 1;

      // Distribute on flanking ridges & distant shorelines, keeping central -Z lake vista open
      const angle = rng.range(-Math.PI, Math.PI);
      const absFromNorth = Math.abs(angle); // 0 = straight North (-Z)
      if (absFromNorth < 0.48) {
        continue; // Keep ~55 deg open lake view toward North
      }

      const isNearShore = rng.next() < 0.22 && absFromNorth > 0.85;
      const radius = isNearShore ? rng.range(11.5, 16.5) : rng.range(78, 98);
      const x = radius * Math.sin(angle);
      const z = -radius * Math.cos(angle);

      const scaleY = isNearShore ? rng.range(1.6, 3.2) : rng.range(4.2, 8.8);
      const scaleXZ = scaleY * rng.range(0.28, 0.4);
      const baseY = isNearShore ? rng.range(-0.1, 0.5) : rng.range(0.2, 3.8);

      items.push({
        x,
        y: baseY + scaleY * 0.45,
        z,
        scaleY,
        scaleXZ,
        rotY: rng.range(0, Math.PI * 2),
      });
    }

    return items;
  }, [count]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || transforms.length === 0) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < transforms.length; i += 1) {
      const t = transforms[i]!;
      dummy.position.set(t.x, t.y, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(t.scaleXZ, t.scaleY, t.scaleXZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  if (transforms.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, transforms.length]}
      raycast={() => null}
      frustumCulled={false}
    >
      <coneGeometry args={[1, 1, 5]} />
      <meshBasicMaterial color="#050816" fog={true} />
    </instancedMesh>
  );
}

export function GroundHorizon() {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const profile = getQualityProfile(qualityTier);

  return (
    <group name="ground-horizon-environment" raycast={() => null}>
      {/* Full 360-degree Night Atmospheric Sky Dome */}
      <NightAtmosphereDome />

      {/* Calm Reflective Alpine Lake */}
      <ReflectiveLake />

      {/* Layered 360-degree Mountain Ranges & Lake Mist */}
      <MountainRange />

      {/* Foreground Lakeside Observation Hill */}
      <ObservationShore />

      {/* V2.0 / V2.2 Unified 4-Zone World Landmarks */}
      <LakesideDock />
      <StarlightBridge />
      <ObservatoryBuilding />
      <MemoryGardenLandmark />

      {/* Ambient Nocturnal Fireflies / Floating Stardust over Hill & Lake */}
      <StargazingFireflies />

      {/* Instanced Pine Forest Silhouettes (LOD gated by qualityTier) */}
      <PineForestSilhouettes count={profile.treeCount} />
    </group>
  );
}
