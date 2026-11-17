import type { DeviceCapabilitiesSnapshot, QualityTier } from '../types/performance';

export function detectDeviceCapabilities(): DeviceCapabilitiesSnapshot {
  if (typeof window === 'undefined') {
    return {
      hardwareConcurrency: 4,
      deviceMemoryGb: 4,
      isMobileOrTouch: false,
      prefersReducedMotion: false,
      devicePixelRatio: 1,
    };
  }

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const navWithMemory = navigator as Navigator & { deviceMemory?: number };
  const deviceMemoryGb = navWithMemory.deviceMemory ?? null;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmallTouchScreen =
    ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    Math.min(window.innerWidth, window.innerHeight) < 900;
  const isTouch = hasCoarsePointer || isSmallTouchScreen;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);

  return {
    hardwareConcurrency,
    deviceMemoryGb,
    isMobileOrTouch: isTouch,
    prefersReducedMotion,
    devicePixelRatio,
  };
}

/**
 * Lightweight upfront WebGL capability check so devices with disabled/unavailable WebGL
 * fall back cleanly to the 2D Memory View without hitting the ErrorBoundary.
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    // Immediately release the probe context so we don't consume a mobile WebGL slot
    const loseExt = gl.getExtension('WEBGL_lose_context');
    loseExt?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function determineInitialQualityTier(
  capabilities: DeviceCapabilitiesSnapshot
): QualityTier {
  if (capabilities.prefersReducedMotion) {
    return 'low';
  }

  if (capabilities.deviceMemoryGb !== null && capabilities.deviceMemoryGb < 3) {
    return 'low';
  }

  if (capabilities.hardwareConcurrency <= 2) {
    return 'low';
  }

  if (capabilities.isMobileOrTouch) {
    if (capabilities.hardwareConcurrency >= 6 && (capabilities.deviceMemoryGb ?? 4) >= 4) {
      return 'medium';
    }
    return 'low';
  }

  if (capabilities.hardwareConcurrency >= 8 && (capabilities.deviceMemoryGb ?? 8) >= 6) {
    return 'high';
  }

  return 'medium';
}
