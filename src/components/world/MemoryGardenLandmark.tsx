import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { isPureTap } from '../../services/starSelectionService';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import { useSkyStore } from '../../store/useSkyStore';
import type { ScreenPoint } from '../../types/store';
import {
  MEMORY_GARDEN_CENTER_XZ,
  sampleHillHeight,
} from '../../utils/worldNavigation';

/**
 * Zone 4 — The Memory Garden (Eastern Hilltop Gazebo).
 * A glowing rose-gold & lavender celestial sanctuary celebrating stored memories & future gifts.
 */
export function MemoryGardenLandmark() {
  const { isTouchDevice } = useResponsiveLayout();
  const setActiveWorldSpot = useSkyStore((state) => state.setActiveWorldSpot);
  const setWorldToast = useSkyStore((state) => state.setWorldToast);

  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<ScreenPoint | null>(null);

  const baseY = useMemo(
    () => sampleHillHeight(MEMORY_GARDEN_CENTER_XZ[0], MEMORY_GARDEN_CENTER_XZ[1]),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbRef.current) {
      orbRef.current.position.y = 1.65 + Math.sin(t * 2.1) * 0.14;
      orbRef.current.rotation.y = t * 0.65;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.35;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.8) * 0.12;
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
    setActiveWorldSpot('garden');
    setWorldToast(
      isTouchDevice
        ? 'Vườn Kỷ Niệm — chạm nút mở Lọ Ký Ức khi đứng gần.'
        : 'Vườn Kỷ Niệm — nhấn E khi đứng gần để mở Chiếc Lọ Ký Ức.'
    );
    setTimeout(() => {
      useSkyStore.getState().setWorldToast(null);
    }, 3400);
  };

  const pillars = [
    [-2.4, -2.1],
    [2.4, -2.1],
    [-2.4, 2.1],
    [2.4, 2.1],
  ] as const;

  return (
    <group
      name="memory-garden-landmark"
      position={[MEMORY_GARDEN_CENTER_XZ[0], baseY, MEMORY_GARDEN_CENTER_XZ[1]]}
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
      {/* Stone Circular Sanctuary Floor */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[3.9, 4.3, 0.16, 20]} />
        <meshBasicMaterial color="#121833" fog={true} />
      </mesh>

      {/* Rose-Gold Illuminated Sanctuary Border */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.85, 0.045, 6, 36]} />
        <meshBasicMaterial
          color="#ffb6d5"
          transparent
          opacity={0.55}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Four Slender Celestial Gazebo Pillars */}
      {pillars.map(([px, pz], idx) => (
        <group key={idx} position={[px, 0, pz]}>
          <mesh position={[0, 1.55, 0]}>
            <cylinderGeometry args={[0.08, 0.11, 3.1, 8]} />
            <meshBasicMaterial color="#1a2244" fog={true} />
          </mesh>
          {/* Blossom Lantern Cap */}
          <mesh position={[0, 3.18, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshBasicMaterial color="#ffc2dc" toneMapped={false} fog={false} />
          </mesh>
        </group>
      ))}

      {/* Crown Halo Arch connecting Gazebo Pillars */}
      <mesh position={[0, 3.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.18, 0.06, 8, 36]} />
        <meshBasicMaterial color="#ffd89b" toneMapped={false} fog={false} />
      </mesh>

      {/* Central Memory Star Pedestal */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.42, 0.62, 0.92, 8]} />
        <meshBasicMaterial color="#161f42" fog={true} />
      </mesh>

      {/* Floating Radiant Memory Crystal above Pedestal */}
      <mesh ref={orbRef} position={[0, 1.65, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshBasicMaterial color="#ffe4a8" toneMapped={false} fog={false} />
      </mesh>

      <mesh ref={ringRef} position={[0, 1.65, 0]}>
        <torusGeometry args={[0.58, 0.028, 8, 28]} />
        <meshBasicMaterial color="#ffb6d5" toneMapped={false} fog={false} />
      </mesh>

      {/* Soft Starlight Blossoms around Garden Edge */}
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const a = (idx / 6) * Math.PI * 2 + 0.4;
        const fx = Math.cos(a) * 3.35;
        const fz = Math.sin(a) * 3.35;
        return (
          <mesh key={idx} position={[fx, 0.28, fz]}>
            <octahedronGeometry args={[0.11, 0]} />
            <meshBasicMaterial
              color={idx % 2 === 0 ? '#ffb6d5' : '#c7b8ff'}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
