import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { starRepository } from '../../repositories/starRepository';
import { useSkyStore } from '../../store/useSkyStore';
import type { Constellation } from '../../types/star';
import { resolveMemoryStarWorldPosition } from '../../utils/skyProjection';

export function ConstellationLayer() {
  const constellations = starRepository.getAllConstellations();
  const selectedStarId = useSkyStore((state) => state.selectedStarId);
  const hoveredStarId = useSkyStore((state) => state.hoveredStarId);

  // Active constellation highlighted when any of its stars is hovered or selected
  const activeConstellationId = useMemo(() => {
    const targetId = selectedStarId ?? hoveredStarId;
    if (!targetId) {
      return null;
    }
    const star = starRepository.getStar(targetId);
    return star?.constellationId ?? null;
  }, [selectedStarId, hoveredStarId]);

  return (
    <group raycast={() => null}>
      {constellations.map((constellation: Constellation) => {
        const isActive = constellation.id === activeConstellationId;
        const color = isActive ? '#ffe4b5' : constellation.colorHex;
        const lineWidth = isActive ? 1.85 : 1.15;

        return (
          <group key={constellation.id}>
            {constellation.connections.map(([starIdA, starIdB]) => {
              const starA = starRepository.getStar(starIdA);
              const starB = starRepository.getStar(starIdB);

              if (!starA || !starB) {
                return null;
              }

              const posA = resolveMemoryStarWorldPosition(starA);
              const posB = resolveMemoryStarWorldPosition(starB);

              return (
                <Line
                  key={`${starIdA}-${starIdB}`}
                  points={[posA, posB]}
                  color={color}
                  lineWidth={lineWidth}
                  transparent
                  opacity={isActive ? 0.82 : 0.34}
                  depthWrite={false}
                  fog={false}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
