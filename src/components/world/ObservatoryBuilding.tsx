import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { isPureTap } from '../../services/starSelectionService';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import { useSkyStore } from '../../store/useSkyStore';
import type { ScreenPoint } from '../../types/store';
import {
  OBSERVATORY_CENTER_XZ,
  OBSERVATORY_TERRACE_RADIUS,
  OBSERVATORY_TERRACE_Y,
} from '../../utils/worldNavigation';

/**
 * Zone 3 — The Cosmic Observatory perched on the western lakeside promontory.
 * Connected seamlessly to The Hill via the arched Starlight Bridge (`[-19, 0, -24]`).
 */
export function ObservatoryBuilding() {
  const { isTouchDevice } = useResponsiveLayout();
  const setActiveWorldSpot = useSkyStore((state) => state.setActiveWorldSpot);
  const setWorldToast = useSkyStore((state) => state.setWorldToast);

  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<ScreenPoint | null>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = t * 0.28;
      outerRingRef.current.rotation.x = 0.45 + Math.sin(t * 0.4) * 0.08;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = -t * 0.42;
      innerRingRef.current.rotation.z = 0.6;
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
    setActiveWorldSpot('observatory');
    setWorldToast(
      isTouchDevice
        ? 'Đài quan sát — chạm nút mở Zodiac Atlas khi đứng trên sân đá.'
        : 'Đài quan sát — nhấn E khi đứng trên sân đá để mở Zodiac Atlas.'
    );
    setTimeout(() => {
      useSkyStore.getState().setWorldToast(null);
    }, 3400);
  };

  return (
    <group
      name="cosmic-observatory-landmark"
      position={[OBSERVATORY_CENTER_XZ[0], 0, OBSERVATORY_CENTER_XZ[1]]}
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
      {/* Rocky Promontory Hill rising out of the lake */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[OBSERVATORY_TERRACE_RADIUS + 0.6, 12.2, 4.4, 16]} />
        <meshBasicMaterial color="#070c1e" fog={true} />
      </mesh>

      {/* Walkable Stone Viewing Terrace (exact y = OBSERVATORY_TERRACE_Y = 2.65) */}
      <mesh position={[0, OBSERVATORY_TERRACE_Y - 0.14, 0]}>
        <cylinderGeometry args={[OBSERVATORY_TERRACE_RADIUS, OBSERVATORY_TERRACE_RADIUS + 0.4, 0.28, 20]} />
        <meshBasicMaterial color="#121a38" fog={true} />
      </mesh>

      {/* Terrace Golden Rim Light */}
      <mesh position={[0, OBSERVATORY_TERRACE_Y + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[OBSERVATORY_TERRACE_RADIUS - 0.05, 0.05, 6, 36]} />
        <meshBasicMaterial
          color="#ffd89b"
          transparent
          opacity={0.55}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Main Circular Observatory Tower positioned slightly NW so front viewing deck is spacious */}
      <group position={[-1.8, OBSERVATORY_TERRACE_Y, -1.8]}>
        <mesh position={[0, 2.6, 0]}>
          <cylinderGeometry args={[3.1, 3.45, 5.2, 16]} />
          <meshBasicMaterial color="#141c3c" fog={true} />
        </mesh>

        {/* Upper Cornice Ring */}
        <mesh position={[0, 5.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.22, 0.11, 8, 28]} />
          <meshBasicMaterial color="#2a3566" fog={true} />
        </mesh>

        {/* Warm Glowing Arched Lantern Windows */}
        {[0, 1, 2, 3, 4].map((idx) => {
          const angle = (idx / 5) * Math.PI * 2 + 0.35;
          const wx = Math.sin(angle) * 3.24;
          const wz = Math.cos(angle) * 3.24;
          return (
            <mesh key={idx} position={[wx, 2.75, wz]} rotation={[0, angle, 0]}>
              <planeGeometry args={[0.68, 1.3]} />
              <meshBasicMaterial
                color="#ffdf9e"
                side={THREE.DoubleSide}
                toneMapped={false}
                fog={false}
              />
            </mesh>
          );
        })}

        {/* Astronomical Dome Cupola */}
        <mesh position={[0, 5.24, 0]}>
          <sphereGeometry args={[3.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#1d2754" fog={true} />
        </mesh>

        {/* Golden Meridian Dome Rib */}
        <mesh position={[0, 5.26, 0]} rotation={[0, 0.55, 0]}>
          <torusGeometry args={[3.24, 0.065, 8, 28, Math.PI]} />
          <meshBasicMaterial color="#ffd89b" toneMapped={false} fog={false} />
        </mesh>

        {/* Protruding Brass Telescope aimed up at the Milky Way */}
        <group position={[0.95, 6.9, 1.1]} rotation={[-0.6, 0.65, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.26, 3.4, 12]} />
            <meshBasicMaterial color="#b58952" fog={true} />
          </mesh>
          <mesh position={[0, 0, 1.72]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshBasicMaterial color="#a8e6ff" toneMapped={false} fog={false} />
          </mesh>
        </group>

        {/* Celestial Armillary Spire & Rotating Rings */}
        <group position={[0, 9.45, 0]}>
          <mesh>
            <octahedronGeometry args={[0.28, 0]} />
            <meshBasicMaterial color="#ffe4a8" toneMapped={false} fog={false} />
          </mesh>
          <mesh ref={outerRingRef}>
            <torusGeometry args={[1.25, 0.038, 8, 32]} />
            <meshBasicMaterial color="#ffd89b" toneMapped={false} fog={false} />
          </mesh>
          <mesh ref={innerRingRef}>
            <torusGeometry args={[0.82, 0.03, 8, 24]} />
            <meshBasicMaterial color="#ffb6d5" toneMapped={false} fog={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
