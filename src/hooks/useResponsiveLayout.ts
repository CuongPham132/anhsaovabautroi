import { useEffect, useState } from 'react';

export interface ResponsiveLayoutState {
  width: number;
  height: number;
  isMobile: boolean;
  isLandscapeMobile: boolean;
  /** True on portrait phones (< 640px wide) OR landscape phones (< 500px tall) */
  isCompact: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
}

function readViewportState(): ResponsiveLayoutState {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 720,
      isMobile: false,
      isLandscapeMobile: false,
      isCompact: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      prefersReducedMotion: false,
    };
  }

  const w = Math.round(window.visualViewport?.width ?? window.innerWidth);
  const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
  const isTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = w < 640;
  const isLandscapeMobile = h < 500 && w > h;
  const isCompact = isMobile || isLandscapeMobile;

  return {
    width: w,
    height: h,
    isMobile,
    isLandscapeMobile,
    isCompact,
    isTablet: !isCompact && w >= 640 && w < 1024,
    isDesktop: !isCompact && w >= 1024,
    isTouchDevice: isTouch,
    prefersReducedMotion: reducedMotion,
  };
}

export function useResponsiveLayout(): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(readViewportState);

  useEffect(() => {
    const handleResize = () => {
      const next = readViewportState();
      setLayout((prev) => {
        if (
          prev.width === next.width &&
          prev.height === next.height &&
          prev.isTouchDevice === next.isTouchDevice &&
          prev.prefersReducedMotion === next.prefersReducedMotion
        ) {
          return prev;
        }
        return next;
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    window.visualViewport?.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return layout;
}
