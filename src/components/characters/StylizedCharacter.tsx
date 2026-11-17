import { Html } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { playerRuntime } from '../../services/playerRuntime';
import { isPureTap } from '../../services/starSelectionService';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import type { AvatarArchetype, PlayerPose } from '../../shared/protocol';
import { useSkyStore } from '../../store/useSkyStore';
import type { ScreenPoint } from '../../types/store';
import {
  AVATAR_GEOMETRIES,
  AVATAR_MATERIALS,
  PROP_MATERIALS,
} from './avatarResources';

export interface CharacterActorProps {
  readonly playerId: string;
  readonly role: AvatarArchetype;
  readonly displayName?: string;
  readonly pose: PlayerPose;
  readonly isControlled: boolean;
  readonly showNameplate?: boolean;
  readonly onInteract?: (playerId: string, role: AvatarArchetype) => void;
}

/**
 * Pure Multiplayer-Ready Stylized Avatar (Phase 1.5+).
 * Shares GPU geometries & materials across all 1..30 players, reads live motion directly from
 * `playerRuntime.getPlayer(playerId)` in `useFrame` (0 React re-renders per frame),
 * and supports all 8 poses/emotes: idle, lookUp, walk, sit, discover, gift, wave, point.
 */
export function StylizedCharacter({
  playerId,
  role,
  displayName,
  pose,
  isControlled,
  showNameplate = false,
  onInteract,
}: CharacterActorProps) {
  const { isTouchDevice } = useResponsiveLayout();
  const qualityTier = useSkyStore((state) => state.qualityTier);

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const cloakTailRef = useRef<THREE.Mesh>(null);
  const ribbonRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const propRef = useRef<THREE.Group>(null);
  const discoverHaloRef = useRef<THREE.Mesh>(null);

  const pointerDownRef = useRef<ScreenPoint | null>(null);
  const stridePhaseRef = useRef(role === 'seeker' ? 0 : 1.7);
  const phaseOffset = role === 'seeker' ? 0 : 1.85;

  const mats = AVATAR_MATERIALS[role];
  const isLowQualityRemote = !isControlled && qualityTier === 'low';

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.getElapsedTime() + phaseOffset;

    const root = rootRef.current;
    const motion = playerRuntime.getPlayer(playerId);
    if (!root || !motion) return;

    root.position.copy(motion.position);

    const activePose: PlayerPose = isControlled ? pose : motion.pose || pose;

    // Smooth yaw orientation (face partner gently during 'gift' pose)
    const desiredRotY =
      activePose === 'gift'
        ? role === 'seeker'
          ? motion.rotY + 1.15
          : motion.rotY - 1.15
        : motion.rotY;

    const twoPi = Math.PI * 2;
    const diff = (((desiredRotY - root.rotation.y + Math.PI) % twoPi) + twoPi) % twoPi - Math.PI;
    root.rotation.y += diff * Math.min(1, dt * 10);

    const speedNorm = Math.min(1, motion.speed / 4.2);
    const isWalkingNow = speedNorm > 0.08 || activePose === 'walk';
    const effectivePose: PlayerPose = isWalkingNow ? 'walk' : activePose;

    if (isWalkingNow) {
      stridePhaseRef.current += dt * (6.5 + speedNorm * 4.5);
    }
    const stride = stridePhaseRef.current;

    // Body vertical breath / sit / walk bob
    if (bodyRef.current) {
      let targetY = Math.sin(t * 1.7) * 0.02;
      let targetPitch = 0;

      if (effectivePose === 'sit') {
        targetY = -0.38 + Math.sin(t * 1.3) * 0.012;
        targetPitch = 0.06;
      } else if (effectivePose === 'walk') {
        targetY = Math.abs(Math.sin(stride)) * 0.095 * Math.max(0.4, speedNorm);
        targetPitch = 0.1 * Math.max(0.4, speedNorm);
      } else if (effectivePose === 'discover') {
        targetY = 0.06 + Math.sin(t * 3.8) * 0.035;
        targetPitch = -0.05;
      } else if (effectivePose === 'wave') {
        targetY = 0.02 + Math.sin(t * 4.5) * 0.025;
      }

      bodyRef.current.position.y = THREE.MathUtils.lerp(
        bodyRef.current.position.y,
        targetY,
        Math.min(1, dt * 9)
      );
      bodyRef.current.rotation.x = THREE.MathUtils.lerp(
        bodyRef.current.rotation.x,
        targetPitch,
        Math.min(1, dt * 8)
      );
    }

    // Head gaze animation
    if (headRef.current) {
      let headPitch = -0.14 + Math.sin(t * 0.85) * 0.05;
      let headYaw = Math.sin(t * 0.55) * 0.14;

      if (effectivePose === 'walk') {
        headPitch = -0.06;
        headYaw = Math.sin(stride * 0.5) * 0.06;
      } else if (
        effectivePose === 'lookUp' ||
        effectivePose === 'discover' ||
        effectivePose === 'point'
      ) {
        headPitch = -0.52 + Math.sin(t * 1.4) * 0.04;
        headYaw = Math.sin(t * 0.6) * 0.08;
      } else if (effectivePose === 'wave') {
        headPitch = -0.05;
        headYaw = Math.sin(t * 3.2) * 0.12;
      } else if (effectivePose === 'sit') {
        headPitch = -0.1 + Math.sin(t * 0.7) * 0.04;
        headYaw = (role === 'seeker' ? 0.14 : -0.14) + Math.sin(t * 0.45) * 0.08;
      } else if (effectivePose === 'gift') {
        headPitch = 0.02;
        headYaw = 0;
      }

      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        headPitch,
        Math.min(1, dt * 6)
      );
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        headYaw,
        Math.min(1, dt * 6)
      );
    }

    // Cloak & scarf billow
    if (cloakTailRef.current) {
      cloakTailRef.current.rotation.x =
        0.16 + speedNorm * 0.36 + Math.sin(t * 2.2 + stride * 0.3) * 0.08;
      cloakTailRef.current.rotation.z = Math.cos(t * 1.6) * 0.06;
    }
    if (ribbonRef.current) {
      ribbonRef.current.rotation.x =
        0.24 + speedNorm * 0.48 + Math.sin(t * 3.0 + 0.7) * 0.14;
      ribbonRef.current.rotation.y = Math.sin(t * 2.1) * 0.18;
    }

    // Arm choreography including Wave & Point social emotes
    if (leftArmRef.current && rightArmRef.current) {
      let leftX = -0.1;
      let rightX = -0.12;
      let leftZ = 0.14;
      let rightZ = -0.14;

      if (effectivePose === 'walk') {
        leftX = Math.sin(stride) * 0.55 * Math.max(0.45, speedNorm);
        rightX = -Math.sin(stride) * 0.55 * Math.max(0.45, speedNorm);
      } else if (effectivePose === 'wave') {
        leftX = -0.1;
        rightX = -2.45;
        rightZ = -0.35 + Math.sin(t * 9.5) * 0.42;
      } else if (effectivePose === 'point') {
        leftX = -0.25;
        rightX = -2.18;
        rightZ = -0.18;
      } else if (effectivePose === 'discover') {
        leftX = -1.15 + Math.sin(t * 3.5) * 0.08;
        rightX = -1.25 + Math.cos(t * 3.5) * 0.08;
        leftZ = 0.35;
        rightZ = -0.35;
      } else if (effectivePose === 'gift') {
        leftX = -0.95;
        rightX = -0.95;
        leftZ = -0.12;
        rightZ = 0.12;
      } else if (effectivePose === 'lookUp') {
        leftX = role === 'seeker' ? -0.55 : -0.42;
        rightX = role === 'seeker' ? -0.68 : -0.45;
      } else if (effectivePose === 'sit') {
        leftX = -0.32;
        rightX = -0.32;
      }

      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x,
        leftX,
        Math.min(1, dt * 9)
      );
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        rightX,
        Math.min(1, dt * 9)
      );
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.z,
        leftZ,
        Math.min(1, dt * 9)
      );
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        rightZ,
        Math.min(1, dt * 9)
      );
    }

    // Prop subtle motion
    if (propRef.current) {
      if (role === 'chronicler') {
        propRef.current.position.y = 1.02 + Math.sin(t * 2.4) * 0.045;
        propRef.current.rotation.y = Math.sin(t * 1.1) * 0.12;
      } else {
        const targetScopeTilt =
          effectivePose === 'lookUp' || effectivePose === 'discover' || effectivePose === 'point'
            ? 0.56
            : 0.25;
        propRef.current.rotation.x = THREE.MathUtils.lerp(
          propRef.current.rotation.x,
          targetScopeTilt,
          Math.min(1, dt * 5)
        );
      }
    }

    // Celebration aura ring during 'discover', 'gift', or 'point'
    if (discoverHaloRef.current) {
      const showAura =
        !isLowQualityRemote &&
        (effectivePose === 'discover' || effectivePose === 'gift' || effectivePose === 'point');
      discoverHaloRef.current.visible = showAura;
      if (showAura) {
        const pulse = 1.0 + Math.sin(t * 4.2) * 0.18;
        discoverHaloRef.current.scale.setScalar(pulse);
        discoverHaloRef.current.rotation.z = t * 0.65;
      }
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isMultiTouchGestureActive()) {
      pointerDownRef.current = null;
      return;
    }
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const down = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!down || isMultiTouchGestureActive()) return;
    if (!isPureTap(down, { x: e.clientX, y: e.clientY }, isTouchDevice)) {
      return;
    }
    onInteract?.(playerId, role);
  };

  return (
    <group
      ref={rootRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Remote Player Subtle Nameplate (hidden for local player to keep sky unobstructed) */}
      {showNameplate && displayName && !isControlled && (
        <Html
          position={[0, 2.05, 0]}
          center
          distanceFactor={14}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
              color: '#eef3ff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            {displayName}
          </div>
        </Html>
      )}

      {/* Foot Aura */}
      {!isLowQualityRemote && (
        <mesh
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={isControlled ? AVATAR_GEOMETRIES.footRingLocal : AVATAR_GEOMETRIES.footRingRemote}
          material={isControlled ? mats.footAuraLocal : mats.footAuraRemote}
        />
      )}

      {/* Discover / Gift / Point Celebration Ring */}
      <mesh
        ref={discoverHaloRef}
        visible={false}
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={AVATAR_GEOMETRIES.celebrateRing}
        material={mats.celebrateAura}
      />

      {/* Animated Stylized Body using Shared Geometries & Materials */}
      <group ref={bodyRef} scale={mats.scale}>
        <mesh
          position={[0, 0.62, 0]}
          geometry={role === 'seeker' ? AVATAR_GEOMETRIES.cloakSeeker : AVATAR_GEOMETRIES.cloakChronicler}
          material={mats.cloak}
        />

        <mesh
          position={[0, 0.08, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          geometry={role === 'seeker' ? AVATAR_GEOMETRIES.hemSeeker : AVATAR_GEOMETRIES.hemChronicler}
          material={mats.trim}
        />

        <mesh
          position={[0, 1.06, 0]}
          geometry={AVATAR_GEOMETRIES.mantle}
          material={mats.cloak}
        />

        <mesh
          position={[0, 1.24, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          geometry={AVATAR_GEOMETRIES.collar}
          material={mats.trim}
        />

        <mesh
          ref={cloakTailRef}
          position={[0, 0.82, 0.22]}
          geometry={AVATAR_GEOMETRIES.cloakTail}
          material={mats.inner}
        />

        {!isLowQualityRemote && (
          <mesh
            ref={ribbonRef}
            position={[role === 'seeker' ? 0.1 : -0.1, 1.08, 0.28]}
            geometry={AVATAR_GEOMETRIES.ribbon}
            material={mats.accent}
          />
        )}

        <group ref={leftArmRef} position={[-0.24, 1.16, 0]}>
          <mesh position={[0, -0.22, 0]} geometry={AVATAR_GEOMETRIES.arm} material={mats.cloak} />
        </group>

        <group ref={rightArmRef} position={[0.24, 1.16, 0]}>
          <mesh position={[0, -0.22, 0]} geometry={AVATAR_GEOMETRIES.arm} material={mats.cloak} />
        </group>

        <group ref={headRef} position={[0, 1.44, 0]}>
          <mesh geometry={AVATAR_GEOMETRIES.head} material={mats.skin} />
          <mesh position={[0, 0.03, 0.03]} geometry={AVATAR_GEOMETRIES.hairCrown} material={mats.hair} />
          {role === 'chronicler' && (
            <mesh
              position={[0, -0.14, 0.11]}
              rotation={[0.18, 0, 0]}
              geometry={AVATAR_GEOMETRIES.hairFlow}
              material={mats.hair}
            />
          )}
          <mesh
            position={[role === 'seeker' ? 0.14 : -0.14, 0.11, -0.05]}
            geometry={AVATAR_GEOMETRIES.hairpin}
            material={mats.trim}
          />
        </group>

        {/* Role Signature Props */}
        {!isLowQualityRemote && (
          role === 'seeker' ? (
            <group ref={propRef} position={[-0.36, 1.06, -0.24]} rotation={[0.28, 0.12, 0]}>
              <mesh
                rotation={[Math.PI / 2, 0, 0]}
                geometry={AVATAR_GEOMETRIES.spyglassTube}
                material={PROP_MATERIALS.brass}
              />
              <mesh
                position={[0, 0, -0.33]}
                geometry={AVATAR_GEOMETRIES.spyglassLens}
                material={PROP_MATERIALS.lens}
              />
            </group>
          ) : (
            <group ref={propRef} position={[0.3, 1.04, -0.34]} rotation={[0.32, -0.25, 0]}>
              <mesh
                position={[-0.1, 0, 0]}
                rotation={[0, 0.22, 0]}
                geometry={AVATAR_GEOMETRIES.bookPage}
                material={PROP_MATERIALS.bookPages}
              />
              <mesh
                position={[0.1, 0, 0]}
                rotation={[0, -0.22, 0]}
                geometry={AVATAR_GEOMETRIES.bookPage}
                material={PROP_MATERIALS.bookPages}
              />
              <mesh
                position={[0, 0, 0.01]}
                geometry={AVATAR_GEOMETRIES.bookSpine}
                material={PROP_MATERIALS.bookSpine}
              />
              <mesh
                position={[0, 0.2, -0.04]}
                geometry={AVATAR_GEOMETRIES.bookMote}
                material={PROP_MATERIALS.bookMote}
              />
            </group>
          )
        )}
      </group>
    </group>
  );
}
