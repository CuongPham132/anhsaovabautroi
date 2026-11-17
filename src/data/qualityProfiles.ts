import type { QualityProfile, QualityTier } from '../types/performance';

export const QUALITY_PROFILES: Readonly<Record<QualityTier, QualityProfile>> = Object.freeze({
  low: Object.freeze({
    tier: 'low',
    decorativeStarCount: 1500,
    nebulaLayers: 1,
    dprRange: Object.freeze([0.75, 1] as const),
    enablePostProcessing: false,
    enableBloom: false,
    touchHitMultiplier: 1.8,
    terrainRadialSegments: 64,
    treeCount: 0,
    waterReflectionQuality: 'simple',
  }),
  medium: Object.freeze({
    tier: 'medium',
    decorativeStarCount: 4000,
    nebulaLayers: 2,
    dprRange: Object.freeze([1, 1.5] as const),
    enablePostProcessing: true,
    enableBloom: true,
    touchHitMultiplier: 1.5,
    terrainRadialSegments: 128,
    treeCount: 64,
    waterReflectionQuality: 'medium',
  }),
  high: Object.freeze({
    tier: 'high',
    decorativeStarCount: 7500,
    nebulaLayers: 4,
    dprRange: Object.freeze([1, 2] as const),
    enablePostProcessing: true,
    enableBloom: true,
    touchHitMultiplier: 1.0,
    terrainRadialSegments: 192,
    treeCount: 136,
    waterReflectionQuality: 'high',
  }),
});

export function getQualityProfile(tier: QualityTier): QualityProfile {
  return QUALITY_PROFILES[tier];
}
