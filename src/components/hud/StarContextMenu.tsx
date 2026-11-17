import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkyStore } from '../../store/useSkyStore';
import { starRepository } from '../../repositories/starRepository';
import { starCollectionService } from '../../services/starCollectionService';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { clampScreenPosition } from '../../utils/math3d';

export const StarContextMenu: React.FC = () => {
  const selectedStarId = useSkyStore((state) => state.selectedStarId);
  const contextMenuAnchor = useSkyStore((state) => state.contextMenuAnchor);
  const collectedStarIds = useSkyStore((state) => state.collectedStarIds);
  const dedicatedStarIds = useSkyStore((state) => state.dedicatedStarIds);
  const inFlightStarId = useSkyStore((state) => state.inFlightStarId);

  const clearSelection = useSkyStore((state) => state.clearSelection);
  const toggleDedicateStar = useSkyStore((state) => state.toggleDedicateStar);
  const setActiveModal = useSkyStore((state) => state.setActiveModal);

  const { isCompact, width, height } = useResponsiveLayout();

  const star = selectedStarId ? starRepository.getStarById(selectedStarId) : null;
  const content = star ? starRepository.getContentById(star.contentId) : null;
  const constellation = star?.constellationId
    ? starRepository.getConstellationById(star.constellationId)
    : null;

  const isCollected = selectedStarId ? collectedStarIds.includes(selectedStarId) : false;
  const isDedicated = selectedStarId ? dedicatedStarIds.includes(selectedStarId) : false;
  const isThisStarInFlight = inFlightStarId === selectedStarId;

  // Compute clamped position for desktop floating menu
  const menuPosition = useMemo(() => {
    if (!contextMenuAnchor || isCompact) return { x: 0, y: 0 };
    return clampScreenPosition(
      { x: contextMenuAnchor.x + 12, y: contextMenuAnchor.y - 40 },
      { width: 280, height: 260 },
      { width, height },
      16
    );
  }, [contextMenuAnchor, isCompact, width, height]);

  if (!selectedStarId || !star || !content) {
    return null;
  }

  const handleHarvestClick = () => {
    if (isCollected) {
      // If already harvested, open memory detail directly
      clearSelection();
      setActiveModal({ type: 'memory', starId: selectedStarId });
    } else {
      // Request harvesting: early-durable commit + flight animation
      starCollectionService.requestCollectStar(selectedStarId);
      clearSelection();
    }
  };

  const handleDedicateClick = () => {
    toggleDedicateStar(selectedStarId);
  };

  const handleLeaveClick = () => {
    clearSelection();
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: isCompact ? 'auto' : 'none',
          zIndex: 40,
        }}
      >
        {/* Backdrop for mobile / compact sheet */}
        {isCompact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearSelection}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(3px)',
              touchAction: 'none',
            }}
          />
        )}

        {/* Menu Container (Bottom Sheet on Mobile/Compact, Floating Card on Desktop) */}
        <motion.div
          initial={
            isCompact
              ? { y: '100%', opacity: 0 }
              : { opacity: 0, scale: 0.92, y: 8 }
          }
          animate={
            isCompact
              ? { y: 0, opacity: 1 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          exit={
            isCompact
              ? { y: '100%', opacity: 0 }
              : { opacity: 0, scale: 0.9, y: 6 }
          }
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="glass-panel-strong mobile-scroll-area"
          style={{
            position: 'absolute',
            pointerEvents: 'auto',
            ...(isCompact
              ? {
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                  borderBottom: 'none',
                  padding: '20px 20px calc(var(--safe-bottom) + 20px) 20px',
                  maxHeight: '82dvh',
                }
              : {
                  left: `${menuPosition.x}px`,
                  top: `${menuPosition.y}px`,
                  width: '280px',
                  borderRadius: '20px',
                  padding: '16px',
                }),
          }}
        >
          {/* Header Info */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isDedicated ? 'var(--star-rose)' : 'var(--star-gold)',
                  background: isDedicated
                    ? 'rgba(255, 158, 196, 0.16)'
                    : 'rgba(255, 216, 155, 0.14)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                {content.category}
              </span>

              {constellation && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--sky-text-muted)',
                  }}
                >
                  {constellation.name}
                </span>
              )}
            </div>

            <h3
              style={{
                margin: '4px 0 2px 0',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              {content.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--sky-text-muted)',
              }}
            >
              {content.dateLabel}
            </p>
          </div>

          {/* Action List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Action 1: Hái ngôi sao này / Xem lại kỷ niệm */}
            <button
              onClick={handleHarvestClick}
              disabled={isThisStarInFlight}
              className="glass-button"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '10px',
                fontSize: '0.85rem',
                fontWeight: 500,
                background: isCollected
                  ? 'rgba(158, 231, 255, 0.14)'
                  : 'rgba(255, 216, 155, 0.18)',
                borderColor: isCollected ? 'var(--star-cyan)' : 'var(--star-gold)',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>
                {isCollected ? '📖' : '✨'}
              </span>
              <span>
                {isThisStarInFlight
                  ? 'Đang bay về chiếc lọ...'
                  : isCollected
                  ? 'Đã trong lọ — Mở kỷ niệm'
                  : 'Hái ngôi sao này'}
              </span>
            </button>

            {/* Action 2: Dành riêng cho em */}
            <button
              onClick={handleDedicateClick}
              className="glass-button"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '10px',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: isDedicated ? 'var(--star-rose)' : 'inherit',
                background: isDedicated
                  ? 'rgba(255, 158, 196, 0.18)'
                  : 'rgba(255, 255, 255, 0.06)',
                borderColor: isDedicated ? 'var(--star-rose)' : 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>♥</span>
              <span>
                {isDedicated ? 'Đã dành riêng cho em' : 'Dành riêng cho em'}
              </span>
            </button>

            {/* Action 3: Để lại trên bầu trời */}
            <button
              onClick={handleLeaveClick}
              className="glass-button"
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '10px',
                fontSize: '0.82rem',
                color: 'var(--sky-text-muted)',
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>🌌</span>
              <span>Để lại trên bầu trời</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
