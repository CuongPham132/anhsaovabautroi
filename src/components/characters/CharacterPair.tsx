import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getWorldSpot } from '../../data/worldSpots';
import {
  OFFLINE_CHRONICLER_ID,
  OFFLINE_SEEKER_ID,
  playerRuntime,
} from '../../services/playerRuntime';
import type { AvatarArchetype } from '../../shared/protocol';
import {
  findNearestInteractable,
  resolveWalkableStep,
  sampleWalkableTerrain,
} from '../../shared/worldNavigation';
import { useSessionStore } from '../../store/useSessionStore';
import { useSkyStore } from '../../store/useSkyStore';
import { StylizedCharacter } from './StylizedCharacter';

const LEAD_WALK_SPEED = 4.6;
const COMPANION_FOLLOW_SPEED = 4.15;
const COMPANION_START_FOLLOW_DIST = 2.65;
const COMPANION_STOP_FOLLOW_DIST = 1.75;

const ROLE_WHISPERS: Record<AvatarArchetype, readonly string[]> = {
  seeker: [
    'Người tìm sao đang hướng kính thiên văn về phía dải Ngân Hà...',
    '“Đi cùng anh qua cây cầu ánh sao sang Đài quan sát nhé?”',
    'Cậu ấy khẽ nâng một đốm sáng ấm áp trao về phía em.',
  ],
  chronicler: [
    'Người ghi chép đang viết lại bước chân đêm nay vào cuốn nhật ký thiên văn...',
    '“Mặt hồ tối nay phản chiếu rõ cả dải Ngân Hà lẫn Mặt Trăng đấy.”',
    'Trang nhật ký phát sáng dịu dàng, lưu giữ thêm một khoảnh khắc chung.',
  ],
};

/**
 * Unified Player System Layer (Phase 1.5 — Multiplayer-Ready):
 *   - Offline mode: Runs Local Player + Companion AI + Tab role swap seamlessly.
 *   - Online mode (Phase 3+): Runs Local Player prediction + smoothly interpolates up to 10-30
 *     Remote Players from `useSessionStore.remotePlayers` via `playerRuntime`.
 */
export function CharacterPair() {
  const { camera } = useThree();

  const controlledRole = useSkyStore((state) => state.controlledRole);
  const characterPose = useSkyStore((state) => state.characterPose);
  const selectedStarId = useSkyStore((state) => state.selectedStarId);
  const jarPulseNonce = useSkyStore((state) => state.jarPulseNonce);
  const setCharacterPose = useSkyStore((state) => state.setCharacterPose);
  const setWorldToast = useSkyStore((state) => state.setWorldToast);

  const connectionMode = useSessionStore((state) => state.connectionMode);
  const localGuest = useSessionStore((state) => state.localGuest);
  const remotePlayers = useSessionStore((state) => state.remotePlayers);
  const hiddenPlayerIds = useSessionStore((state) => state.hiddenPlayerIds);

  const giftOrbRef = useRef<THREE.Mesh>(null);
  const interactionIndexRef = useRef(0);
  const companionFollowingRef = useRef(false);
  const lastTeleportNonceRef = useRef(0);
  const poseResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scratchCamFwd = useMemo(() => new THREE.Vector3(), []);
  const scratchCamRight = useMemo(() => new THREE.Vector3(), []);
  const scratchWorldUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const scratchMoveDir = useMemo(() => new THREE.Vector3(), []);

  const isOfflineMode = connectionMode === 'offline';

  // Sync localPlayerId cleanly with either offline role toggle or online Guest ID
  useEffect(() => {
    if (isOfflineMode) {
      playerRuntime.setLocalPlayerId(
        controlledRole === 'seeker' ? OFFLINE_SEEKER_ID : OFFLINE_CHRONICLER_ID
      );
    } else {
      playerRuntime.setLocalPlayerId(localGuest.playerId);
    }
  }, [isOfflineMode, controlledRole, localGuest.playerId]);

  // Seed initial hilltop placements once on mount
  useEffect(() => {
    const startSpot = getWorldSpot('hilltop');
    const seeker = playerRuntime.getPlayer(OFFLINE_SEEKER_ID);
    const chronicler = playerRuntime.getPlayer(OFFLINE_CHRONICLER_ID);
    if (seeker) {
      seeker.position.set(...startSpot.seekerPlacement.position);
      seeker.targetPosition.copy(seeker.position);
      seeker.rotY = startSpot.seekerPlacement.rotationY;
      seeker.targetRotY = seeker.rotY;
    }
    if (chronicler) {
      chronicler.position.set(...startSpot.chroniclerPlacement.position);
      chronicler.targetPosition.copy(chronicler.position);
      chronicler.rotY = startSpot.chroniclerPlacement.rotationY;
      chronicler.targetRotY = chronicler.rotY;
    }
  }, []);

  // Gentle 'lookUp' when selecting a memory star
  useEffect(() => {
    if (selectedStarId && characterPose !== 'sit') {
      setCharacterPose('lookUp');
    } else if (!selectedStarId && characterPose === 'lookUp') {
      setCharacterPose('idle');
    }
  }, [selectedStarId, characterPose, setCharacterPose]);

  // Celebrate with 'discover' when a star arrives in Memory Jar
  useEffect(() => {
    if (jarPulseNonce === 0) return;
    setCharacterPose('discover');
    if (poseResetTimerRef.current) clearTimeout(poseResetTimerRef.current);
    poseResetTimerRef.current = setTimeout(() => {
      if (useSkyStore.getState().characterPose === 'discover') {
        useSkyStore.getState().setCharacterPose('idle');
      }
    }, 2600);
  }, [jarPulseNonce, setCharacterPose]);

  useEffect(() => {
    return () => {
      if (poseResetTimerRef.current) clearTimeout(poseResetTimerRef.current);
      if (toastResetTimerRef.current) clearTimeout(toastResetTimerRef.current);
    };
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.getElapsedTime();

    const storeState = useSkyStore.getState();
    const sessionState = useSessionStore.getState();
    const offline = sessionState.connectionMode === 'offline';

    // 1. Handle quick-travel zone teleport
    if (
      playerRuntime.pendingTeleportSpot &&
      playerRuntime.pendingTeleportNonce !== lastTeleportNonceRef.current
    ) {
      lastTeleportNonceRef.current = playerRuntime.pendingTeleportNonce;
      const targetSpot = getWorldSpot(playerRuntime.pendingTeleportSpot);

      if (offline) {
        const seeker = playerRuntime.getPlayer(OFFLINE_SEEKER_ID);
        const chronicler = playerRuntime.getPlayer(OFFLINE_CHRONICLER_ID);
        if (seeker) {
          seeker.position.set(...targetSpot.seekerPlacement.position);
          seeker.targetPosition.copy(seeker.position);
          seeker.rotY = targetSpot.seekerPlacement.rotationY;
          seeker.speed = 0;
        }
        if (chronicler) {
          chronicler.position.set(...targetSpot.chroniclerPlacement.position);
          chronicler.targetPosition.copy(chronicler.position);
          chronicler.rotY = targetSpot.chroniclerPlacement.rotationY;
          chronicler.speed = 0;
        }
      } else {
        const local = playerRuntime.getLocalPlayer();
        local.position.set(...targetSpot.spawnCenter);
        local.targetPosition.copy(local.position);
        local.speed = 0;
      }

      companionFollowingRef.current = false;
      playerRuntime.pendingTeleportSpot = null;
    }

    const local = playerRuntime.getLocalPlayer();
    local.pose = storeState.characterPose;

    // 2. Local Player Locomotion (Camera-Relative WASD / Mobile Joystick using shared physics)
    const { x: inX, y: inY } = playerRuntime.moveInput;
    const inputMag = Math.hypot(inX, inY);

    if (inputMag > 0.05) {
      if (
        storeState.characterPose === 'sit' ||
        storeState.characterPose === 'wave' ||
        storeState.characterPose === 'point'
      ) {
        storeState.setCharacterPose('idle');
      }

      camera.getWorldDirection(scratchCamFwd);
      scratchCamFwd.y = 0;
      if (scratchCamFwd.lengthSq() < 1e-5) {
        scratchCamFwd.set(0, 0, -1);
      } else {
        scratchCamFwd.normalize();
      }
      scratchCamRight.crossVectors(scratchCamFwd, scratchWorldUp).normalize();

      scratchMoveDir
        .set(0, 0, 0)
        .addScaledVector(scratchCamRight, inX)
        .addScaledVector(scratchCamFwd, inY);
      if (scratchMoveDir.lengthSq() > 1e-5) {
        scratchMoveDir.normalize();
      }

      const stepDist = LEAD_WALK_SPEED * Math.min(1, inputMag) * dt;
      const nextX = local.position.x + scratchMoveDir.x * stepDist;
      const nextZ = local.position.z + scratchMoveDir.z * stepDist;

      const resolved = resolveWalkableStep(local.position.x, local.position.z, nextX, nextZ);
      local.position.set(resolved.x, resolved.y, resolved.z);
      local.targetPosition.copy(local.position);
      local.speed = resolved.moved ? LEAD_WALK_SPEED * Math.min(1, inputMag) : 0;
      local.rotY = Math.atan2(-scratchMoveDir.x, -scratchMoveDir.z);
      local.targetRotY = local.rotY;

      if (resolved.zoneId !== storeState.activeWorldSpot) {
        storeState.setActiveWorldSpot(resolved.zoneId, false);
      }
    } else {
      const ground = sampleWalkableTerrain(local.position.x, local.position.z);
      local.position.y = THREE.MathUtils.lerp(local.position.y, ground.heightY, Math.min(1, dt * 12));
      local.speed *= Math.max(0, 1 - dt * 14);
    }

    // 3. Offline Companion AI OR Online Remote Players Entity Interpolation
    const companionId =
      offline
        ? playerRuntime.localPlayerId === OFFLINE_SEEKER_ID
          ? OFFLINE_CHRONICLER_ID
          : OFFLINE_SEEKER_ID
        : undefined;

    if (offline && companionId) {
      const companion = playerRuntime.getPlayer(companionId);
      if (companion) {
        companion.pose = storeState.characterPose;
        const dxToLead = local.position.x - companion.position.x;
        const dzToLead = local.position.z - companion.position.z;
        const distToLead = Math.hypot(dxToLead, dzToLead);

        if (distToLead > COMPANION_START_FOLLOW_DIST) {
          companionFollowingRef.current = true;
        } else if (distToLead < COMPANION_STOP_FOLLOW_DIST) {
          companionFollowingRef.current = false;
        }

        if (companionFollowingRef.current && storeState.characterPose !== 'sit') {
          const sideSign = local.avatarType === 'seeker' ? 1 : -1;
          const offsetX = Math.cos(local.rotY) * 1.15 * sideSign + Math.sin(local.rotY) * 0.9;
          const offsetZ = -Math.sin(local.rotY) * 1.15 * sideSign + Math.cos(local.rotY) * 0.9;

          const desiredX = local.position.x + offsetX;
          const desiredZ = local.position.z + offsetZ;
          const toX = desiredX - companion.position.x;
          const toZ = desiredZ - companion.position.z;
          const toLen = Math.hypot(toX, toZ) || 1;

          const step = Math.min(toLen, COMPANION_FOLLOW_SPEED * dt);
          const nextCompX = companion.position.x + (toX / toLen) * step;
          const nextCompZ = companion.position.z + (toZ / toLen) * step;
          const compResolved = resolveWalkableStep(
            companion.position.x,
            companion.position.z,
            nextCompX,
            nextCompZ
          );

          if (!compResolved.moved && distToLead > 9.5) {
            const catchup = resolveWalkableStep(
              local.position.x,
              local.position.z,
              local.position.x + 0.9,
              local.position.z + 0.9
            );
            companion.position.set(catchup.x, catchup.y, catchup.z);
          } else {
            companion.position.set(compResolved.x, compResolved.y, compResolved.z);
          }

          companion.speed = compResolved.moved ? COMPANION_FOLLOW_SPEED : 0;
          companion.rotY = Math.atan2(-toX, -toZ);
        } else {
          const compGround = sampleWalkableTerrain(companion.position.x, companion.position.z);
          companion.position.y = THREE.MathUtils.lerp(
            companion.position.y,
            compGround.heightY,
            Math.min(1, dt * 12)
          );
          companion.speed *= Math.max(0, 1 - dt * 12);
        }
      }
    }

    // Interpolate all networked remote players smoothly at 60 FPS
    playerRuntime.stepRemoteInterpolation(dt, companionId);

    // 4. Contextual Proximity Interactable Check
    const nearby = findNearestInteractable(local.position.x, local.position.z);
    storeState.setNearbyInteractable(nearby);

    // 5. Shared Starlight Gift Orb animation during 'gift' pose
    const orb = giftOrbRef.current;
    if (orb) {
      const isGift = storeState.characterPose === 'gift';
      orb.visible = isGift;
      if (isGift) {
        const seeker = playerRuntime.getPlayer(OFFLINE_SEEKER_ID);
        const chronicler = playerRuntime.getPlayer(OFFLINE_CHRONICLER_ID);
        if (seeker && chronicler) {
          orb.position.set(
            (seeker.position.x + chronicler.position.x) * 0.5,
            (seeker.position.y + chronicler.position.y) * 0.5 + 1.18 + Math.sin(t * 3.2) * 0.08,
            (seeker.position.z + chronicler.position.z) * 0.5
          );
        } else {
          orb.position.set(local.position.x, local.position.y + 1.45, local.position.z - 0.6);
        }
        orb.scale.setScalar(0.92 + Math.sin(t * 4.5) * 0.14);
      }
    }
  });

  const handleCharacterInteract = (_playerId: string, role: AvatarArchetype) => {
    const lines = ROLE_WHISPERS[role];
    const idx = interactionIndexRef.current % lines.length;
    interactionIndexRef.current += 1;

    const nextPose = idx === 2 ? 'gift' : 'discover';
    setCharacterPose(nextPose);
    setWorldToast(lines[idx] ?? null);

    if (poseResetTimerRef.current) clearTimeout(poseResetTimerRef.current);
    poseResetTimerRef.current = setTimeout(() => {
      const current = useSkyStore.getState().characterPose;
      if (current === 'discover' || current === 'gift') {
        useSkyStore.getState().setCharacterPose('idle');
      }
    }, 3200);

    if (toastResetTimerRef.current) clearTimeout(toastResetTimerRef.current);
    toastResetTimerRef.current = setTimeout(() => {
      useSkyStore.getState().setWorldToast(null);
    }, 3800);
  };

  const visibleRemotePlayers = useMemo(() => {
    if (isOfflineMode) return [];
    const hiddenSet = new Set(hiddenPlayerIds);
    return remotePlayers.filter(
      (p) => p.playerId !== localGuest.playerId && !hiddenSet.has(p.playerId)
    );
  }, [isOfflineMode, remotePlayers, hiddenPlayerIds, localGuest.playerId]);

  return (
    <group name="celestial-players-layer">
      {isOfflineMode ? (
        <>
          <StylizedCharacter
            playerId={OFFLINE_SEEKER_ID}
            role="seeker"
            displayName="Người tìm sao"
            pose={characterPose}
            isControlled={controlledRole === 'seeker'}
            onInteract={handleCharacterInteract}
          />

          <StylizedCharacter
            playerId={OFFLINE_CHRONICLER_ID}
            role="chronicler"
            displayName="Người ghi chép"
            pose={characterPose}
            isControlled={controlledRole === 'chronicler'}
            onInteract={handleCharacterInteract}
          />
        </>
      ) : (
        <>
          <StylizedCharacter
            playerId={localGuest.playerId}
            role={localGuest.avatarType}
            displayName={localGuest.displayName}
            pose={characterPose}
            isControlled={true}
            onInteract={handleCharacterInteract}
          />

          {visibleRemotePlayers.map((remote) => (
            <StylizedCharacter
              key={remote.playerId}
              playerId={remote.playerId}
              role={remote.avatarType}
              displayName={remote.displayName}
              pose={remote.pose}
              isControlled={false}
              showNameplate={true}
              onInteract={handleCharacterInteract}
            />
          ))}
        </>
      )}

      {/* Shared Glowing Starlight Orb displayed during 'gift' animation */}
      <mesh ref={giftOrbRef} visible={false}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial
          color="#ffe3a8"
          transparent
          opacity={0.95}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
