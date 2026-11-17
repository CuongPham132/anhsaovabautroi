import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  executeInteractableAction,
  useCharacterControls,
} from '../../hooks/useCharacterControls';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import {
  characterRuntime,
  syncCombinedMoveInput,
} from '../../services/characterRuntime';
import { useSkyStore } from '../../store/useSkyStore';

const JOYSTICK_RADIUS = 41;
const KNOB_MAX_OFFSET = 26;

/**
 * Virtual Touch Joystick for mobile/tablet players — completely isolated from
 * camera rotation drags and automatically resets on tab switch / blur / orientation change.
 */
const MobileVirtualJoystick: React.FC = () => {
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { isLandscapeMobile } = useResponsiveLayout();

  const resetStick = () => {
    activePointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    characterRuntime.touchInput.x = 0;
    characterRuntime.touchInput.y = 0;
    syncCombinedMoveInput();
  };

  // Prevent stuck locomotion when user switches apps, locks phone, or rotates screen
  useEffect(() => {
    const handleVisibilityOrBlur = () => {
      resetStick();
    };
    window.addEventListener('blur', handleVisibilityOrBlur);
    window.addEventListener('orientationchange', handleVisibilityOrBlur);
    document.addEventListener('visibilitychange', handleVisibilityOrBlur);
    return () => {
      window.removeEventListener('blur', handleVisibilityOrBlur);
      window.removeEventListener('orientationchange', handleVisibilityOrBlur);
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
      resetStick();
    };
  }, []);

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > KNOB_MAX_OFFSET) {
      dx = (dx / dist) * KNOB_MAX_OFFSET;
      dy = (dy / dist) * KNOB_MAX_OFFSET;
    }

    setKnobOffset({ x: dx, y: dy });
    characterRuntime.touchInput.x = dx / KNOB_MAX_OFFSET;
    characterRuntime.touchInput.y = -dy / KNOB_MAX_OFFSET;
    syncCombinedMoveInput();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        activePointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
      onPointerCancel={resetStick}
      aria-label="Cần điều khiển di chuyển nhân vật"
      className="glass-panel"
      style={{
        position: 'fixed',
        left: 'calc(var(--safe-left) + 14px)',
        bottom: `calc(var(--safe-bottom) + ${isLandscapeMobile ? '68px' : '74px'})`,
        width: `${JOYSTICK_RADIUS * 2}px`,
        height: `${JOYSTICK_RADIUS * 2}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        zIndex: 28,
        borderColor: 'rgba(255, 216, 155, 0.3)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255, 224, 168, 0.92) 0%, rgba(255, 182, 213, 0.58) 100%)',
          boxShadow: '0 0 14px rgba(255, 216, 155, 0.5)',
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/**
 * V2.2 Locomotion & Contextual Interaction HUD:
 *   - Attaches keyboard controls (WASD / Tab / E / 1-3)
 *   - Positions mobile contextual interact button on the right-thumb side (zero overlap with left Joystick)
 *   - Displays Virtual Joystick on touch devices
 */
export const MovementHud: React.FC = () => {
  useCharacterControls();

  const nearbyInteractable = useSkyStore((state) => state.nearbyInteractable);
  const characterPose = useSkyStore((state) => state.characterPose);
  const { isTouchDevice, isCompact } = useResponsiveLayout();

  const promptLabel =
    nearbyInteractable?.actionType === 'sit-lakeside' && characterPose === 'sit'
      ? 'Đứng dậy rời bờ hồ'
      : nearbyInteractable?.label ?? '';

  return (
    <>
      {/* Contextual Proximity Prompt */}
      <AnimatePresence>
        {nearbyInteractable && (
          <motion.div
            key={nearbyInteractable.id}
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed',
              ...(isTouchDevice || isCompact
                ? {
                    right: 'calc(var(--safe-right) + 12px)',
                    bottom: 'calc(var(--safe-bottom) + 80px)',
                    maxWidth: 'calc(100vw - 122px)',
                  }
                : {
                    left: '50%',
                    bottom: 'calc(var(--safe-bottom) + 98px)',
                    transform: 'translateX(-50%)',
                  }),
              zIndex: 29,
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={() => executeInteractableAction(nearbyInteractable)}
              className="glass-panel-strong"
              style={{
                minHeight: '44px',
                padding: isCompact ? '9px 13px' : '9px 16px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                color: '#ffffff',
                fontSize: isCompact ? '0.78rem' : '0.84rem',
                fontWeight: 500,
                textAlign: 'left',
                borderColor: 'var(--star-gold)',
                boxShadow:
                  '0 10px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 216, 155, 0.28)',
              }}
            >
              <span
                style={{
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: 'rgba(255, 216, 155, 0.22)',
                  border: '1px solid var(--star-gold)',
                  color: 'var(--star-gold)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {isTouchDevice ? 'Chạm' : 'E'}
              </span>
              <span style={{ flexShrink: 0 }}>{nearbyInteractable.icon}</span>
              <span>{promptLabel}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile / Touch Virtual Joystick */}
      {isTouchDevice && <MobileVirtualJoystick />}
    </>
  );
};
