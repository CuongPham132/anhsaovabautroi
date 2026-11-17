import type { StarPosition } from './star';

export type ZodiacId =
  | 'zodiac-aries'
  | 'zodiac-taurus'
  | 'zodiac-gemini'
  | 'zodiac-cancer'
  | 'zodiac-leo'
  | 'zodiac-virgo'
  | 'zodiac-libra'
  | 'zodiac-scorpio'
  | 'zodiac-sagittarius'
  | 'zodiac-capricorn'
  | 'zodiac-aquarius'
  | 'zodiac-pisces';

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export type ZodiacStatus = 'undiscovered' | 'discovered' | 'gifted';

/**
 * Local 2D normalized pattern coordinate (u, v in [-1, 1]) + relative brightness.
 * Projected tangentially onto the 360-degree celestial dome without distortion.
 */
export interface ZodiacStarNode {
  readonly u: number;
  readonly v: number;
  readonly brightness: number;
}

export interface ZodiacDefinition {
  readonly id: ZodiacId;
  readonly nameVi: string;
  readonly nameEn: string;
  readonly symbol: string;
  readonly element: ZodiacElement;
  readonly dateRange: string;
  readonly theme: string;
  readonly shortDescription: string;
  readonly mythLore: string;
  readonly colorHex: string;
  readonly accentHex: string;
  /** Center position on the 360-degree sky dome (0 = North -Z, +90 = East +X, 180 = South +Z, -90 = West -X) */
  readonly skyAzimuthDeg: number;
  readonly skyAltitudeDeg: number;
  /** Angular half-width of the constellation pattern in degrees */
  readonly angularScaleDeg: number;
  readonly stars: readonly ZodiacStarNode[];
  /** Connected pairs of star indices within `stars` */
  readonly edges: ReadonlyArray<readonly [number, number]>;
}

export interface ResolvedZodiacGeometry {
  readonly centerWorld: StarPosition;
  readonly starWorldPositions: readonly StarPosition[];
}
