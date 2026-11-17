import { type ThreeEvent, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useDerivedStarLists } from '../../hooks/useDerivedStarLists';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { isPureTap, projectStarPositionToScreen } from '../../services/starSelectionService';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import { useSkyStore } from '../../store/useSkyStore';
import type { DerivedStarView, StarId } from '../../types/star';
import type { ScreenPoint } from '../../types/store';
import { resolveMemoryStarWorldPosition } from '../../utils/skyProjection';

// Angular visual scale factor compensating for MEMORY_DOME_RADIUS (~205 vs V1 ~50)
const DOME_STAR_VISUAL_SCALE = 3.2;

export function InteractiveStarField() {
  const { allViews } = useDerivedStarLists();
  const selectedStarId = useSkyStore((state) => state.selectedStarId);
  const hoveredStarId = useSkyStore((state) => state.hoveredStarId);
  const inFlightStarId = useSkyStore((state) => state.inFlightStarId);
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const selectStar = useSkyStore((state) => state.selectStar);
  const setHoveredStar = useSkyStore((state) => state.setHoveredStar);

  const { camera, size } = useThree();
  const { isTouchDevice } = useResponsiveLayout();
  const profile = getQualityProfile(qualityTier);

  // Track pointer down coordinates per star to disambiguate tap vs camera drag (TD-02)
  const pointerDownPositions = useRef<Map<StarId, ScreenPoint>>(new Map());

  const handlePointerDown = (starId: StarId, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isMultiTouchGestureActive()) {
      pointerDownPositions.current.delete(starId);
      return;
    }
    pointerDownPositions.current.set(starId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (star: DerivedStarView['star'], e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const downPos = pointerDownPositions.current.get(star.id);
    pointerDownPositions.current.delete(star.id);

    if (!downPos || isMultiTouchGestureActive()) {
      return;
    }

    const upPos: ScreenPoint = { x: e.clientX, y: e.clientY };
    if (!isPureTap(downPos, upPos, isTouchDevice)) {
      return; // Dragging camera, ignore selection
    }

    const worldPos = resolveMemoryStarWorldPosition(star);
    const projected = projectStarPositionToScreen(worldPos, camera, size);
    selectStar(star.id, projected.point);
  };

  const handleContextMenu = (star: DerivedStarView['star'], e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    e.nativeEvent.preventDefault();
    const worldPos = resolveMemoryStarWorldPosition(star);
    const projected = projectStarPositionToScreen(worldPos, camera, size);
    selectStar(star.id, projected.point);
  };

  // Base hit sphere radius scaled for dome distance & touch screen usability (TD-03)
  const hitRadius = (isTouchDevice ? 1.85 : 1.3) * profile.touchHitMultiplier * DOME_STAR_VISUAL_SCALE;

  return (
    <group>
      {allViews.map((view) => {
        const { star, status, isDedicated } = view;
        const isSelected = star.id === selectedStarId;
        const isHovered = star.id === hoveredStarId;
        const isInFlight = star.id === inFlightStarId;

        // Hide visual core at origin while star is actively flying to jar
        if (isInFlight) {
          return null;
        }

        const worldPos = resolveMemoryStarWorldPosition(star);

        // Color coding: Dedicated (rose-gold aura), Collected (dimmed memory imprint), Available (warm starlight)
        let coreColor = star.colorHex;
        let haloColor = star.colorHex;
        let opacity = 0.96;
        let scale = star.magnitude * DOME_STAR_VISUAL_SCALE;

        if (status === 'collected') {
          opacity = 0.45; // Soft translucent memory imprint (TD-07)
          scale *= 0.85;
        }

        if (isDedicated) {
          coreColor = '#ffd1dc'; // Rose-gold aura
          haloColor = '#ff8fab';
          scale *= 1.15;
          opacity = 1.0;
        }

        if (isSelected) {
          scale *= 1.42;
          opacity = 1.0;
        } else if (isHovered) {
          scale *= 1.24;
        }

        return (
          <group
            key={star.id}
            position={worldPos}
            onPointerDown={(e) => handlePointerDown(star.id, e)}
            onPointerUp={(e) => handlePointerUp(star, e)}
            onContextMenu={(e) => handleContextMenu(star, e)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredStar(star.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredStar(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* 1. Star Glowing Core (fog=false so night horizon fog never obscures stars) */}
            <mesh scale={scale * 0.42}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial
                color={coreColor}
                transparent
                opacity={opacity}
                toneMapped={false}
                fog={false}
              />
            </mesh>

            {/* 2. Permanent Subtle Memory Star Halo (distinguishes personal memory stars from background sky) */}
            <mesh scale={scale * (isSelected ? 1.85 : isHovered ? 1.4 : 1.05)}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial
                color={haloColor}
                transparent
                opacity={isSelected ? 0.48 : isHovered || isDedicated ? 0.28 : 0.16}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
                fog={false}
              />
            </mesh>

            {/* 3. Dedicated Rose-Gold Ring Indicator */}
            {isDedicated && (
              <mesh scale={scale * 1.95} rotation={[Math.PI / 3, 0, 0]}>
                <ringGeometry args={[0.9, 1.08, 32]} />
                <meshBasicMaterial
                  color="#ffb4c8"
                  transparent
                  opacity={0.72}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                  fog={false}
                />
              </mesh>
            )}

            {/* 4. Generous Invisible Touch / Click Hit Sphere (TD-03) */}
            <mesh scale={hitRadius}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial visible={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
