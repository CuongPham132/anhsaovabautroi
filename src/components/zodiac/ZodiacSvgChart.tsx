import React from 'react';
import type { ZodiacDefinition } from '../../types/zodiac';

interface ZodiacSvgChartProps {
  readonly zodiac: ZodiacDefinition;
  readonly discovered: boolean;
  readonly size?: number;
}

/**
 * Clean 2D SVG miniature constellation diagram rendered directly from a zodiac's star nodes & edges.
 */
export const ZodiacSvgChart: React.FC<ZodiacSvgChartProps> = ({
  zodiac,
  discovered,
  size = 110,
}) => {
  const pad = 16;
  const span = size - pad * 2;

  const mapPoint = (u: number, v: number) => ({
    x: pad + ((u + 1) * 0.5) * span,
    y: pad + ((1 - v) * 0.5) * span,
  });

  const strokeColor = discovered ? zodiac.colorHex : '#64749c';
  const starFill = discovered ? '#ffffff' : '#7b8db8';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Connecting lines */}
      {zodiac.edges.map(([idxA, idxB], idx) => {
        const sA = zodiac.stars[idxA];
        const sB = zodiac.stars[idxB];
        if (!sA || !sB) return null;
        const pA = mapPoint(sA.u, sA.v);
        const pB = mapPoint(sB.u, sB.v);
        return (
          <line
            key={idx}
            x1={pA.x}
            y1={pA.y}
            x2={pB.x}
            y2={pB.y}
            stroke={strokeColor}
            strokeWidth={discovered ? 1.5 : 1}
            strokeOpacity={discovered ? 0.72 : 0.28}
            strokeDasharray={discovered ? undefined : '3 3'}
          />
        );
      })}

      {/* Star nodes */}
      {zodiac.stars.map((s, idx) => {
        const pt = mapPoint(s.u, s.v);
        const r = Math.max(1.8, s.brightness * (discovered ? 2.2 : 1.5));
        return (
          <g key={idx}>
            {discovered && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r={r * 2.3}
                fill={zodiac.accentHex}
                opacity={0.22}
              />
            )}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={r}
              fill={starFill}
              opacity={discovered ? 0.98 : 0.45}
            />
          </g>
        );
      })}
    </svg>
  );
};
