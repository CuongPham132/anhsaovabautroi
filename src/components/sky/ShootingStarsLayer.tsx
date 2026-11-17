import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useSkyStore } from '../../store/useSkyStore';
import { createSeededRng } from '../../utils/prng';
import {
  shootingStarFragmentShader,
  shootingStarVertexShader,
} from './shaders/shootingStar.glsl';

export type MeteorSpawnMode = 'in-view' | 'distant-horizon' | 'random-sky';

export interface MeteorShowerEventDetail {
  readonly count: number;
  readonly mode: MeteorSpawnMode;
  readonly seed?: string;
}

const METEOR_SHOWER_EVENT = 'sky:trigger-meteor-shower';
const METEOR_AMBIENT_EVENT = 'sky:toggle-ambient-meteors';

const MAX_METEOR_POOL = 36;
const METEOR_DOME_RADIUS = 236;
const DISTANT_HORIZON_RADIUS = 292;

const METEOR_COLORS = [
  new THREE.Color('#ffffff'), // Pure starlight
  new THREE.Color('#ffe4a8'), // Warm gold
  new THREE.Color('#9ee7ff'), // Ice cyan
  new THREE.Color('#ffc2dc'), // Romantic rose-gold
  new THREE.Color('#d4b8ff'), // Soft lavender
];

export function triggerMeteorShower(
  count: number,
  mode: MeteorSpawnMode = 'in-view',
  seed?: string
): void {
  const safeCount = Math.min(Math.max(Math.round(count), 1), MAX_METEOR_POOL);
  window.dispatchEvent(
    new CustomEvent<MeteorShowerEventDetail>(METEOR_SHOWER_EVENT, {
      detail: { count: safeCount, mode, seed },
    })
  );
}

export function setAmbientMeteorsEnabled(enabled: boolean): void {
  window.dispatchEvent(
    new CustomEvent<boolean>(METEOR_AMBIENT_EVENT, { detail: enabled })
  );
}

interface MeteorSlot {
  active: boolean;
  delay: number;
  elapsed: number;
  duration: number;
  length: number;
  width: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  color: THREE.Color;
}

function createEmptySlot(): MeteorSlot {
  return {
    active: false,
    delay: 0,
    elapsed: 0,
    duration: 1.0,
    length: 22,
    width: 1.4,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    color: METEOR_COLORS[0]!,
  };
}

/**
 * Zero-allocation pooled 3D Shooting Star / Meteor Shower system.
 * Supports both gentle natural ambient meteors and user-triggered meteor showers
 * (smartly aimed across the current camera view or randomly around the 360-degree dome).
 */
export function ShootingStarsLayer() {
  const { camera } = useThree();
  const { prefersReducedMotion } = useResponsiveLayout();

  const ambientEnabledRef = useRef(true);
  const nextAmbientCountdownRef = useRef(5.5);

  // Pre-allocate pool of meteor state slots + mesh/material refs
  const slotsRef = useRef<MeteorSlot[]>(
    Array.from({ length: MAX_METEOR_POOL }, () => createEmptySlot())
  );
  const meshRefs = useRef<Array<THREE.Mesh | null>>(
    Array.from({ length: MAX_METEOR_POOL }, () => null)
  );
  const matRefs = useRef<Array<THREE.ShaderMaterial | null>>(
    Array.from({ length: MAX_METEOR_POOL }, () => null)
  );

  // Scratch vectors & matrix for zero-GC useFrame transforms
  const scratchForward = useMemo(() => new THREE.Vector3(), []);
  const scratchRight = useMemo(() => new THREE.Vector3(), []);
  const scratchUp = useMemo(() => new THREE.Vector3(), []);
  const scratchWorldUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const scratchDir = useMemo(() => new THREE.Vector3(), []);
  const scratchMoveDir = useMemo(() => new THREE.Vector3(), []);
  const scratchHead = useMemo(() => new THREE.Vector3(), []);
  const scratchCenter = useMemo(() => new THREE.Vector3(), []);
  const scratchToCam = useMemo(() => new THREE.Vector3(), []);
  const scratchSide = useMemo(() => new THREE.Vector3(), []);
  const scratchNormal = useMemo(() => new THREE.Vector3(), []);
  const scratchBasis = useMemo(() => new THREE.Matrix4(), []);

  const uniformsList = useMemo(
    () =>
      Array.from({ length: MAX_METEOR_POOL }, () => ({
        uColor: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: 0 },
      })),
    []
  );

  const spawnSingleMeteor = (
    slot: MeteorSlot,
    mode: MeteorSpawnMode,
    staggerDelay: number,
    nextRand: () => number = Math.random
  ) => {
    const camPos = camera.position;

    if (mode === 'in-view') {
      camera.getWorldDirection(scratchForward);
      if (scratchForward.y < 0.28) {
        scratchForward.y = 0.28;
        scratchForward.normalize();
      }
      scratchRight.crossVectors(scratchForward, scratchWorldUp);
      if (scratchRight.lengthSq() < 1e-5) {
        scratchRight.set(1, 0, 0);
      } else {
        scratchRight.normalize();
      }
      scratchUp.crossVectors(scratchRight, scratchForward).normalize();

      const hOffset = (nextRand() - 0.5) * 1.15;
      const vOffset = (nextRand() - 0.18) * 0.62;

      scratchDir
        .copy(scratchForward)
        .addScaledVector(scratchRight, hOffset)
        .addScaledVector(scratchUp, vOffset)
        .normalize();

      if (scratchDir.y < 0.34) {
        scratchDir.y = 0.34 + nextRand() * 0.24;
        scratchDir.normalize();
      }

      slot.startPos.copy(camPos).addScaledVector(scratchDir, METEOR_DOME_RADIUS);

      const diagRight = 0.55 + (nextRand() - 0.5) * 0.32;
      const diagDown = -(0.52 + nextRand() * 0.28);
      scratchMoveDir
        .copy(scratchRight)
        .multiplyScalar(diagRight)
        .addScaledVector(scratchUp, diagDown)
        .normalize();

      const travelDist = 52 + nextRand() * 44;
      slot.endPos
        .copy(slot.startPos)
        .addScaledVector(scratchMoveDir, travelDist);
      slot.duration = 0.72 + nextRand() * 0.58;
      slot.length = 22 + nextRand() * 22;
      slot.width = 1.15 + nextRand() * 0.95;
    } else if (mode === 'distant-horizon') {
      // Far-away cinematic shooting stars cascading behind distant mountains & Observatory valley
      const az = (-54 + nextRand() * 96) * (Math.PI / 180);
      const alt = (16 + nextRand() * 17) * (Math.PI / 180);
      const cosAlt = Math.cos(alt);
      scratchDir.set(
        cosAlt * Math.sin(az),
        Math.sin(alt),
        -cosAlt * Math.cos(az)
      );
      slot.startPos.copy(camPos).addScaledVector(scratchDir, DISTANT_HORIZON_RADIUS);

      scratchRight.set(Math.cos(az), 0, Math.sin(az));
      scratchUp.set(-Math.sin(alt) * Math.sin(az), cosAlt, Math.sin(alt) * Math.cos(az));
      const driftSign = az < 0 ? 1 : -1;
      scratchMoveDir
        .copy(scratchRight)
        .multiplyScalar(driftSign * (0.48 + nextRand() * 0.34))
        .addScaledVector(scratchUp, -(0.56 + nextRand() * 0.24))
        .normalize();

      const travelDist = 42 + nextRand() * 34;
      slot.endPos.copy(slot.startPos).addScaledVector(scratchMoveDir, travelDist);

      slot.duration = 1.15 + nextRand() * 0.68;
      slot.length = 18 + nextRand() * 16;
      slot.width = 0.75 + nextRand() * 0.45;
    } else {
      const az = nextRand() * Math.PI * 2;
      const alt = (24 + nextRand() * 48) * (Math.PI / 180);
      const cosAlt = Math.cos(alt);
      scratchDir.set(
        cosAlt * Math.sin(az),
        Math.sin(alt),
        -cosAlt * Math.cos(az)
      );
      slot.startPos.copy(camPos).addScaledVector(scratchDir, METEOR_DOME_RADIUS);

      scratchRight.set(Math.cos(az), 0, Math.sin(az));
      scratchUp.set(-Math.sin(alt) * Math.sin(az), cosAlt, Math.sin(alt) * Math.cos(az));
      const sign = nextRand() < 0.5 ? 1 : -1;
      scratchMoveDir
        .copy(scratchRight)
        .multiplyScalar(sign * (0.5 + nextRand() * 0.45))
        .addScaledVector(scratchUp, -(0.45 + nextRand() * 0.35))
        .normalize();

      const travelDist = 56 + nextRand() * 46;
      slot.endPos.copy(slot.startPos).addScaledVector(scratchMoveDir, travelDist);
      slot.duration = 0.72 + nextRand() * 0.58;
      slot.length = 22 + nextRand() * 22;
      slot.width = 1.15 + nextRand() * 0.95;
    }

    slot.active = true;
    slot.delay = staggerDelay;
    slot.elapsed = 0;
    slot.color = METEOR_COLORS[Math.floor(nextRand() * METEOR_COLORS.length)]!;
  };

  // Subscribe to manual / server-synced meteor shower & ambient toggle events
  useEffect(() => {
    const handleShower = (event: Event) => {
      const custom = event as CustomEvent<MeteorShowerEventDetail>;
      const { count, mode, seed } = custom.detail;
      const slots = slotsRef.current;

      // Deterministic PRNG when server broadcasts a shared world_event seed (Phase 3 ready)
      const rng = seed ? createSeededRng(seed) : null;
      const nextRand = rng ? () => rng.next() : Math.random;

      let spawned = 0;
      const totalStaggerWindow = count <= 1 ? 0 : Math.min(2.6, 0.45 + count * 0.085);

      for (let i = 0; i < MAX_METEOR_POOL && spawned < count; i += 1) {
        const slot = slots[i]!;
        if (!slot.active) {
          const delay = spawned === 0 ? 0 : nextRand() * totalStaggerWindow;
          spawnSingleMeteor(slot, mode, delay, nextRand);
          spawned += 1;
        }
      }

      for (let i = 0; i < MAX_METEOR_POOL && spawned < count; i += 1) {
        const slot = slots[i]!;
        const delay = spawned === 0 ? 0 : nextRand() * totalStaggerWindow;
        spawnSingleMeteor(slot, mode, delay, nextRand);
        spawned += 1;
      }

      // Delightful world reaction: characters look up at the meteor shower!
      useSkyStore.getState().setCharacterPose(count >= 5 ? 'discover' : 'lookUp');
      const toastText =
        mode === 'distant-horizon'
          ? `Những vệt sao băng đang rơi xa xa phía trên dãy núi và Đài quan sát...`
          : count >= 5
          ? `Cơn mưa ${count} sao băng đang lướt qua bầu trời — hãy ước một điều ước nhé!`
          : 'Một ngôi sao băng vừa xẹt qua bầu trời đêm...';
      useSkyStore.getState().setWorldToast(toastText);
      setTimeout(() => {
        useSkyStore.getState().setWorldToast(null);
      }, 3600);
    };

    const handleAmbientToggle = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      ambientEnabledRef.current = Boolean(custom.detail);
    };

    window.addEventListener(METEOR_SHOWER_EVENT, handleShower);
    window.addEventListener(METEOR_AMBIENT_EVENT, handleAmbientToggle);
    return () => {
      window.removeEventListener(METEOR_SHOWER_EVENT, handleShower);
      window.removeEventListener(METEOR_AMBIENT_EVENT, handleAmbientToggle);
    };
  }, [camera]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const slots = slotsRef.current;

    // Gentle ambient natural shooting star every ~6.5–12 seconds (skipped if reduced motion)
    if (ambientEnabledRef.current && !prefersReducedMotion) {
      nextAmbientCountdownRef.current -= dt;
      if (nextAmbientCountdownRef.current <= 0) {
        nextAmbientCountdownRef.current = 6.5 + Math.random() * 5.5;
        const freeSlot = slots.find((s) => !s.active);
        if (freeSlot) {
          // 70% chance in current view so the stargazer enjoys spotting it naturally
          spawnSingleMeteor(
            freeSlot,
            Math.random() < 0.7 ? 'in-view' : 'random-sky',
            0
          );
        }
      }
    }

    for (let i = 0; i < MAX_METEOR_POOL; i += 1) {
      const slot = slots[i]!;
      const mesh = meshRefs.current[i];
      const mat = matRefs.current[i];

      if (!mesh || !mat) continue;

      if (!slot.active) {
        mesh.visible = false;
        continue;
      }

      if (slot.delay > 0) {
        slot.delay -= dt;
        mesh.visible = false;
        continue;
      }

      slot.elapsed += dt;
      const t = slot.elapsed / slot.duration;
      if (t >= 1.0) {
        slot.active = false;
        mesh.visible = false;
        continue;
      }

      // Smooth cubic deceleration across atmospheric entry
      const eased = 1 - Math.pow(1 - t, 1.85);
      scratchHead.lerpVectors(slot.startPos, slot.endPos, eased);

      // Velocity direction along the streak
      scratchMoveDir.subVectors(slot.endPos, slot.startPos).normalize();

      // Dynamic streak length grows on ignition and tapers smoothly at burnout
      const lengthEnvelope = Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.85);
      const currentLength = Math.max(4, slot.length * (0.45 + 0.75 * lengthEnvelope));

      // Position ribbon centered behind the bright head
      scratchCenter
        .copy(scratchHead)
        .addScaledVector(scratchMoveDir, -currentLength * 0.5);

      // Orient billboard ribbon so X-axis aligns with velocity and face normal points at camera
      scratchToCam.subVectors(camera.position, scratchCenter).normalize();
      scratchSide.crossVectors(scratchToCam, scratchMoveDir);
      if (scratchSide.lengthSq() < 1e-5) {
        scratchSide.set(0, 1, 0);
      } else {
        scratchSide.normalize();
      }
      scratchNormal.crossVectors(scratchMoveDir, scratchSide).normalize();

      scratchBasis.makeBasis(scratchMoveDir, scratchSide, scratchNormal);
      mesh.position.copy(scratchCenter);
      mesh.quaternion.setFromRotationMatrix(scratchBasis);
      mesh.scale.set(currentLength, slot.width, 1);
      mesh.visible = true;

      // Ignite quickly, sustain luminously, dissolve gently into stardust
      const opacity =
        Math.min(1, t / 0.14) * (1 - Math.max(0, (t - 0.55) / 0.45));

      mat.uniforms.uColor.value.copy(slot.color);
      mat.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <group name="shooting-stars-layer" raycast={() => null} renderOrder={-40}>
      {uniformsList.map((uniforms, index) => (
        <mesh
          key={index}
          ref={(el) => {
            meshRefs.current[index] = el;
          }}
          visible={false}
          frustumCulled={false}
          raycast={() => null}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            ref={(el) => {
              matRefs.current[index] = el;
            }}
            vertexShader={shootingStarVertexShader}
            fragmentShader={shootingStarFragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}
