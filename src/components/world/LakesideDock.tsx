import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { isPureTap } from '../../services/starSelectionService';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import { useSkyStore } from '../../store/useSkyStore';
import type { ScreenPoint } from '../../types/store';

/**
 * Quiet moonlit stone-and-timber lakeside pier with a glowing lantern.
 * Provides a natural sitting spot right above the reflective water for the two characters.
 */
export function LakesideDock() {
  const { isTouchDevice } = useResponsiveLayout();
  const setActiveWorldSpot = useSkyStore((state) => state.setActiveWorldSpot);
  const setWorldToast = useSkyStore((state) => state.setWorldToast);

  const lanternGlowRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<ScreenPoint | null>(null);

  useFrame((state) => {
    if (lanternGlowRef.current) {
      const t = state.clock.getElapsedTime();
      const pulse = 0.92 + Math.sin(t * 2.6) * 0.1;
      lanternGlowRef.current.scale.setScalar(pulse);
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
    setActiveWorldSpot('lakeside');
    setWorldToast('Hai người ngồi lặng yên bên mặt hồ phản chiếu ánh sao...');
    setTimeout(() => {
      useSkyStore.getState().setWorldToast(null);
    }, 3400);
  };

  return (
    <group
      name="lakeside-dock-spot"
      position={[0.95, 0, -8.2]}
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
      {/* Main Flat Viewing Pier Deck */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[3.4, 0.18, 2.3]} />
        <meshBasicMaterial color="#121830" fog={true} />
      </mesh>

      {/* Pier Support Pillars plunging into lake */}
      {[
        [-1.4, -0.5, -0.9],
        [1.4, -0.5, -0.9],
        [-1.4, -0.5, 0.9],
        [1.4, -0.5, 0.9],
      ].map(([px, py, pz], idx) => (
        <mesh key={idx} position={[px!, py!, pz!]}>
          <cylinderGeometry args={[0.1, 0.12, 1.4, 6]} />
          <meshBasicMaterial color="#090d1c" fog={true} />
        </mesh>
      ))}

      {/* Stone Stepping Slabs connecting Hilltop down to Pier */}
      <mesh position={[-0.25, 0.42, 1.9]}>
        <boxGeometry args={[1.5, 0.14, 0.9]} />
        <meshBasicMaterial color="#0e1429" fog={true} />
      </mesh>
      <mesh position={[-0.45, 0.66, 3.2]}>
        <boxGeometry args={[1.4, 0.14, 0.9]} />
        <meshBasicMaterial color="#0e1429" fog={true} />
      </mesh>

      {/* Cozy Lakeside Lantern Post */}
      <group position={[-1.45, 0.34, -0.82]}>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 1.25, 6]} />
          <meshBasicMaterial color="#1c2445" fog={true} />
        </mesh>
        <mesh position={[0.16, 1.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.025, 0.34, 6]} />
          <meshBasicMaterial color="#1c2445" fog={true} />
        </mesh>
        {/* Warm Glowing Lantern Core */}
        <mesh position={[0.28, 1.06, 0]}>
          <octahedronGeometry args={[0.11, 0]} />
          <meshBasicMaterial color="#ffe4a3" toneMapped={false} fog={false} />
        </mesh>
        {/* Soft Additive Lantern Halo */}
        <mesh ref={lanternGlowRef} position={[0.28, 1.06, 0]}>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshBasicMaterial
            color="#ffd185"
            transparent
            opacity={0.34}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      </group>
    </group>
  );
}
