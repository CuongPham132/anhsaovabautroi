export type QualityTier = 'low' | 'medium' | 'high';

export type DprRange = readonly [number, number];

export type WaterReflectionQuality = 'simple' | 'medium' | 'high';

export interface QualityProfile {
  readonly tier: QualityTier;
  readonly decorativeStarCount: number;
  readonly nebulaLayers: number;
  readonly dprRange: DprRange;
  readonly enablePostProcessing: boolean;
  readonly enableBloom: boolean;
  readonly touchHitMultiplier: number;
  readonly terrainRadialSegments: number;
  readonly treeCount: number;
  readonly waterReflectionQuality: WaterReflectionQuality;
}

export interface DeviceCapabilitiesSnapshot {
  readonly hardwareConcurrency: number;
  readonly deviceMemoryGb: number | null;
  readonly isMobileOrTouch: boolean;
  readonly prefersReducedMotion: boolean;
  readonly devicePixelRatio: number;
}

