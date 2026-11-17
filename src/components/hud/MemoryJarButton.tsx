import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useDerivedStarLists } from '../../hooks/useDerivedStarLists';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useSkyStore } from '../../store/useSkyStore';

export const MemoryJarButton: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const controls = useAnimation();

  const jarPulseNonce = useSkyStore((state) => state.jarPulseNonce);
  const setJarScreenAnchor = useSkyStore((state) => state.setJarScreenAnchor);
  const setActiveModal = useSkyStore((state) => state.setActiveModal);
  const { visualCollectedCount } = useDerivedStarLists();
  const { isCompact } = useResponsiveLayout();

  // Keep jarScreenAnchor accurately synchronized with DOM layout, rotation & mobile visualViewport (TD-10)
  useEffect(() => {
    const updateAnchor = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      setJarScreenAnchor({ x: centerX, y: centerY });
    };

    updateAnchor();

    const resizeObserver = new ResizeObserver(() => {
      updateAnchor();
    });

    if (buttonRef.current) {
      resizeObserver.observe(buttonRef.current);
    }

    window.addEventListener('resize', updateAnchor, { passive: true });
    window.addEventListener('orientationchange', updateAnchor, { passive: true });
    window.addEventListener('scroll', updateAnchor, { passive: true });
    window.visualViewport?.addEventListener('resize', updateAnchor, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('orientationchange', updateAnchor);
      window.removeEventListener('scroll', updateAnchor);
      window.visualViewport?.removeEventListener('resize', updateAnchor);
    };
  }, [setJarScreenAnchor, isCompact]);

  // Pulse animation when a star arrives in the jar (TD-10)
  useEffect(() => {
    if (jarPulseNonce > 0) {
      controls.start({
        scale: [1, 1.32, 0.92, 1.08, 1],
        rotate: [0, -7, 7, -3, 0],
        transition: { duration: 0.6, ease: 'easeOut' },
      });
    }
  }, [jarPulseNonce, controls]);

  const handleClick = () => {
    setActiveModal({ type: 'jar' });
  };

  const buttonSize = isCompact ? 54 : 64;

  return (
    <div
      style={{
        position: 'fixed',
        right: `calc(var(--safe-right) + ${isCompact ? '12px' : '24px'})`,
        bottom: `calc(var(--safe-bottom) + ${isCompact ? '14px' : '24px'})`,
        zIndex: 30,
        pointerEvents: 'auto',
      }}
    >
      <motion.button
        ref={buttonRef}
        animate={controls}
        whileHover={isCompact ? undefined : { scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        onClick={handleClick}
        className="glass-panel-strong"
        aria-label="Mở Chiếc Lọ Kỷ Niệm"
        title="Mở Chiếc Lọ Kỷ Niệm"
        style={{
          position: 'relative',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'manipulation',
          border: '1.5px solid var(--star-gold)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 216, 155, 0.35)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 216, 155, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <span
          style={{
            fontSize: isCompact ? '1.5rem' : '1.75rem',
            filter: 'drop-shadow(0 0 6px rgba(255, 216, 155, 0.6))',
          }}
        >
          🏺
        </span>

        <motion.div
          key={visualCollectedCount}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '22px',
            height: '22px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #ffd89b 0%, #ff9ec4 100%)',
            color: '#070c20',
            fontWeight: 700,
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            border: '1.5px solid #030511',
          }}
        >
          {visualCollectedCount}
        </motion.div>
      </motion.button>
    </div>
  );
};
