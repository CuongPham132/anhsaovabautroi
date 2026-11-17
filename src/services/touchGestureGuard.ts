/**
 * Global lightweight multi-touch tracker to prevent 2-finger pinch-to-zoom gestures
 * on mobile Chrome/Safari from accidentally firing tap selection on 3D stars or zodiacs.
 */
const activePointers = new Set<number>();
let multiTouchOccurred = false;
let initialized = false;

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const onPointerDown = (e: PointerEvent) => {
    activePointers.add(e.pointerId);
    if (activePointers.size > 1) {
      multiTouchOccurred = true;
    }
  };

  const onPointerEnd = (e: PointerEvent) => {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0 && multiTouchOccurred) {
      // Keep multiTouchOccurred true for the current pointerup dispatch tick, then clear
      setTimeout(() => {
        if (activePointers.size === 0) {
          multiTouchOccurred = false;
        }
      }, 60);
    }
  };

  const onReset = () => {
    activePointers.clear();
    multiTouchOccurred = false;
  };

  window.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
  window.addEventListener('pointerup', onPointerEnd, { passive: true, capture: true });
  window.addEventListener('pointercancel', onPointerEnd, { passive: true, capture: true });
  window.addEventListener('blur', onReset);
}

/**
 * Returns true if the current touch interaction involves (or just completed) a multi-touch pinch.
 */
export function isMultiTouchGestureActive(): boolean {
  ensureInitialized();
  return activePointers.size > 1 || multiTouchOccurred;
}
