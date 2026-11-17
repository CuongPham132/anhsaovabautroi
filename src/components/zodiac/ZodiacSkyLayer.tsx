import { Html, Line } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  resolveZodiacGeometry,
  ZODIAC_CATALOG,
} from '../../data/zodiacCatalog';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { isPureTap } from '../../services/starSelectionService';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import { useSkyStore } from '../../store/useSkyStore';
import { useZodiacStore } from '../../store/useZodiacStore';
import type { ScreenPoint } from '../../types/store';
import type { ZodiacDefinition, ZodiacId } from '../../types/zodiac';

interface ZodiacConstellationNodeProps {
  readonly zodiac: ZodiacDefinition;
  readonly isDiscovered: boolean;
  readonly isSelected: boolean;
  readonly isHovered: boolean;
  readonly isGuided: boolean;
  readonly isTouchDevice: boolean;
  readonly onTapZodiac: (zodiac: ZodiacDefinition) => void;
  readonly onHoverChange: (id: ZodiacId | null) => void;
}

function ZodiacConstellationNode({
  zodiac,
  isDiscovered,
  isSelected,
  isHovered,
  isGuided,
  isTouchDevice,
  onTapZodiac,
  onHoverChange,
}: ZodiacConstellationNodeProps) {
  const pointerDownRef = useRef<ScreenPoint | null>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => resolveZodiacGeometry(zodiac), [zodiac]);

  useFrame((state) => {
    const beacon = beaconRef.current;
    if (!beacon) return;

    const showBeacon = isGuided || isSelected || isHovered;
    beacon.visible = showBeacon;
    if (showBeacon) {
      const t = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(t * 3.4) * 0.14;
      beacon.scale.setScalar(pulse);
      beacon.lookAt(state.camera.position);
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
    onTapZodiac(zodiac);
  };

  const starColor = isDiscovered || isGuided || isHovered ? zodiac.colorHex : '#b9c8f0';
  const lineColor = isDiscovered || isSelected ? zodiac.colorHex : isGuided || isHovered ? zodiac.accentHex : '#7b8ec8';
  const lineOpacity = isSelected || isGuided
    ? 0.88
    : isHovered
    ? 0.72
    : isDiscovered
    ? 0.56
    : 0.15;
  const lineWidth = isSelected || isGuided ? 2.1 : isDiscovered ? 1.5 : 1.0;

  const hitSphereRadius = isTouchDevice ? 28 : 22;

  return (
    <group name={zodiac.id}>
      {/* Constellation Connecting Lines */}
      <group raycast={() => null}>
        {zodiac.edges.map(([idxA, idxB]) => {
          const posA = geometry.starWorldPositions[idxA];
          const posB = geometry.starWorldPositions[idxB];
          if (!posA || !posB) return null;
          return (
            <Line
              key={`${zodiac.id}-${idxA}-${idxB}`}
              points={[posA, posB]}
              color={lineColor}
              lineWidth={lineWidth}
              transparent
              opacity={lineOpacity}
              depthWrite={false}
              fog={false}
            />
          );
        })}
      </group>

      {/* Diamond-Faceted Zodiac Stars (visually distinct from V1 spherical Memory Stars) */}
      <group raycast={() => null}>
        {zodiac.stars.map((node, index) => {
          const worldPos = geometry.starWorldPositions[index];
          if (!worldPos) return null;
          const baseScale =
            node.brightness *
            (isSelected || isGuided ? 1.75 : isHovered ? 1.5 : isDiscovered ? 1.35 : 0.95);

          return (
            <group key={`${zodiac.id}-star-${index}`} position={worldPos}>
              <mesh scale={baseScale}>
                <octahedronGeometry args={[1, 0]} />
                <meshBasicMaterial
                  color={starColor}
                  transparent
                  opacity={isDiscovered || isHovered || isGuided ? 0.96 : 0.62}
                  toneMapped={false}
                  fog={false}
                />
              </mesh>
              {(isDiscovered || isHovered || isGuided) && (
                <mesh scale={baseScale * 2.1}>
                  <sphereGeometry args={[1, 10, 10]} />
                  <meshBasicMaterial
                    color={zodiac.accentHex}
                    transparent
                    opacity={isSelected || isGuided ? 0.34 : 0.18}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    toneMapped={false}
                    fog={false}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* Guiding / Hover Pulsing Beacon Ring at Constellation Center */}
      <mesh ref={beaconRef} position={geometry.centerWorld} visible={false} raycast={() => null}>
        <ringGeometry args={[14, 15.6, 36]} />
        <meshBasicMaterial
          color={zodiac.colorHex}
          transparent
          opacity={isGuided ? 0.8 : 0.45}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Subtle Floating Label on Hover, Guide, or Selection (avoids cluttering the night sky) */}
      {(isHovered || isGuided || isSelected) && (
        <Html
          position={geometry.centerWorld}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: zodiac.colorHex,
              color: '#ffffff',
            }}
          >
            <span style={{ color: zodiac.colorHex, fontSize: '0.9rem' }}>
              {zodiac.symbol}
            </span>
            <span>
              {isDiscovered ? zodiac.nameVi : 'Chòm sao bí ẩn — Chạm để khám phá'}
            </span>
          </div>
        </Html>
      )}

      {/* Generous Invisible Interactive Hit Volume for Sky Discovery */}
      <mesh
        position={geometry.centerWorld}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverChange(zodiac.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHoverChange(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[hitSphereRadius, 10, 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

/**
 * Separate 3D celestial layer for the 12 Zodiac Constellations (V2.1).
 * Completely independent from V1's 18 Personal Memory Stars and Memory Jar persistence.
 */
export function ZodiacSkyLayer() {
  const discoveredZodiacIds = useZodiacStore((state) => state.discoveredZodiacIds);
  const selectedZodiacId = useZodiacStore((state) => state.selectedZodiacId);
  const hoveredZodiacId = useZodiacStore((state) => state.hoveredZodiacId);
  const guideTargetZodiacId = useZodiacStore((state) => state.guideTargetZodiacId);
  const discoverZodiac = useZodiacStore((state) => state.discoverZodiac);
  const setHoveredZodiac = useZodiacStore((state) => state.setHoveredZodiac);

  const { isTouchDevice } = useResponsiveLayout();

  const discoveredSet = useMemo(
    () => new Set(discoveredZodiacIds),
    [discoveredZodiacIds]
  );

  const handleTapZodiac = (zodiac: ZodiacDefinition) => {
    // Ensure V1 star context menu doesn't overlap with Zodiac Detail Modal
    useSkyStore.getState().clearSelection();

    const isNewlyDiscovered = discoverZodiac(zodiac.id);
    if (isNewlyDiscovered) {
      useSkyStore.getState().setCharacterPose('discover');
      useSkyStore
        .getState()
        .setWorldToast(
          `Đã khám phá cung ${zodiac.nameVi} ${zodiac.symbol} — ${zodiac.theme}!`
        );
      setTimeout(() => {
        useSkyStore.getState().setWorldToast(null);
      }, 4200);
    }
  };

  return (
    <group name="zodiac-constellations-layer">
      {ZODIAC_CATALOG.map((zodiac) => (
        <ZodiacConstellationNode
          key={zodiac.id}
          zodiac={zodiac}
          isDiscovered={discoveredSet.has(zodiac.id)}
          isSelected={selectedZodiacId === zodiac.id}
          isHovered={hoveredZodiacId === zodiac.id}
          isGuided={guideTargetZodiacId === zodiac.id}
          isTouchDevice={isTouchDevice}
          onTapZodiac={handleTapZodiac}
          onHoverChange={setHoveredZodiac}
        />
      ))}
    </group>
  );
}
