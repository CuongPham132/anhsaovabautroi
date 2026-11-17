import { useMemo } from 'react';
import * as THREE from 'three';
import { BRIDGE_HALF_WIDTH, sampleBridgePoint } from '../../utils/worldNavigation';

/**
 * Arched moonlit timber-and-stone Starlight Bridge connecting The Hill to The Observatory
 * across the western lake cove. Matches `sampleBridgePoint(t)` 1:1 with walkable physics.
 */
export function StarlightBridge() {
  const { planks, lanterns } = useMemo(() => {
    const plankCount = 18;
    const plankItems: Array<{
      pos: [number, number, number];
      rotY: number;
      pitch: number;
      showPost: boolean;
    }> = [];
    const lanternItems: Array<{ pos: [number, number, number] }> = [];

    for (let i = 0; i < plankCount; i += 1) {
      const t = (i + 0.5) / plankCount;
      const p = sampleBridgePoint(t);
      const pPrev = sampleBridgePoint(Math.max(0, t - 0.02));
      const pNext = sampleBridgePoint(Math.min(1, t + 0.02));

      const dx = pNext[0] - pPrev[0];
      const dy = pNext[1] - pPrev[1];
      const dz = pNext[2] - pPrev[2];
      const horiz = Math.hypot(dx, dz) || 1;

      const rotY = Math.atan2(dx, dz);
      const pitch = -Math.atan2(dy, horiz);

      plankItems.push({
        pos: [p[0], p[1] - 0.08, p[2]],
        rotY,
        pitch,
        showPost: i % 4 === 1,
      });

      if (i === 3 || i === 9 || i === 14) {
        // Place glowing lantern post on alternating outer railing sides
        const side = i % 2 === 1 ? 1 : -1;
        const perpX = Math.cos(rotY) * (BRIDGE_HALF_WIDTH - 0.08) * side;
        const perpZ = -Math.sin(rotY) * (BRIDGE_HALF_WIDTH - 0.08) * side;
        lanternItems.push({
          pos: [p[0] + perpX, p[1], p[2] + perpZ],
        });
      }
    }

    return { planks: plankItems, lanterns: lanternItems };
  }, []);

  return (
    <group name="starlight-bridge" raycast={() => null}>
      {planks.map((plank, idx) => (
        <group
          key={idx}
          position={plank.pos}
          rotation={[0, plank.rotY, 0]}
        >
          {/* Bridge Deck Plank */}
          <mesh rotation={[plank.pitch, 0, 0]}>
            <boxGeometry args={[BRIDGE_HALF_WIDTH * 1.9, 0.14, 1.08]} />
            <meshBasicMaterial color="#151d38" fog={true} />
          </mesh>

          {/* Subtle Golden Edge Trim */}
          <mesh position={[-BRIDGE_HALF_WIDTH + 0.08, 0.08, 0]} rotation={[plank.pitch, 0, 0]}>
            <boxGeometry args={[0.06, 0.04, 1.08]} />
            <meshBasicMaterial color="#b8986c" fog={true} />
          </mesh>
          <mesh position={[BRIDGE_HALF_WIDTH - 0.08, 0.08, 0]} rotation={[plank.pitch, 0, 0]}>
            <boxGeometry args={[0.06, 0.04, 1.08]} />
            <meshBasicMaterial color="#b8986c" fog={true} />
          </mesh>

          {/* Support Pillars plunging into lake + low railing posts */}
          {plank.showPost && (
            <>
              <mesh position={[-BRIDGE_HALF_WIDTH + 0.1, -1.2, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 3.2, 6]} />
                <meshBasicMaterial color="#0b1024" fog={true} />
              </mesh>
              <mesh position={[BRIDGE_HALF_WIDTH - 0.1, -1.2, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 3.2, 6]} />
                <meshBasicMaterial color="#0b1024" fog={true} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* Warm Glowing Bridge Lanterns */}
      {lanterns.map((lantern, idx) => (
        <group key={idx} position={lantern.pos}>
          <mesh position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 1.15, 6]} />
            <meshBasicMaterial color="#1d2647" fog={true} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshBasicMaterial color="#ffe4a3" toneMapped={false} fog={false} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.25, 10, 10]} />
            <meshBasicMaterial
              color="#ffd185"
              transparent
              opacity={0.32}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
