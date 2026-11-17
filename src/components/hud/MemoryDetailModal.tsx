import React from 'react';
import { motion } from 'framer-motion';
import { useSkyStore } from '../../store/useSkyStore';
import { starRepository } from '../../repositories/starRepository';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { StarId } from '../../types/star';

interface MemoryDetailModalProps {
  starId: StarId;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({ starId }) => {
  const closeModal = useSkyStore((state) => state.closeModal);
  const setActiveModal = useSkyStore((state) => state.setActiveModal);
  const dedicatedStarIds = useSkyStore((state) => state.dedicatedStarIds);
  const toggleDedicateStar = useSkyStore((state) => state.toggleDedicateStar);

  const { isCompact } = useResponsiveLayout();

  const star = starRepository.getStarById(starId);
  const content = star ? starRepository.getContentById(star.contentId) : null;
  const constellation = star?.constellationId
    ? starRepository.getConstellationById(star.constellationId)
    : null;
  const isDedicated = dedicatedStarIds.includes(starId);

  if (!star || !content) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: isCompact ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isCompact ? 0 : '24px',
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(3, 5, 17, 0.78)',
          backdropFilter: 'blur(10px)',
          touchAction: 'none',
        }}
      />

      {/* Modal Card */}
      <motion.div
        initial={
          isCompact
            ? { y: '100%', opacity: 0 }
            : { scale: 0.92, opacity: 0, y: 16 }
        }
        animate={
          isCompact
            ? { y: 0, opacity: 1 }
            : { scale: 1, opacity: 1, y: 0 }
        }
        exit={
          isCompact
            ? { y: '100%', opacity: 0 }
            : { scale: 0.92, opacity: 0, y: 16 }
        }
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass-panel-strong"
        style={{
          position: 'relative',
          width: isCompact ? '100%' : '520px',
          maxHeight: isCompact ? '90dvh' : '86dvh',
          borderRadius: isCompact ? '26px 26px 0 0' : '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveModal({ type: 'jar' })}
              className="glass-button"
              title="Quay lại Chiếc Lọ"
              style={{
                padding: '6px 10px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>←</span>
              <span>Lọ Kỷ Niệm</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Dedication heart toggle button */}
            <button
              onClick={() => toggleDedicateStar(starId)}
              className="glass-button"
              title={isDedicated ? 'Bỏ dành riêng' : 'Dành riêng cho em'}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isDedicated ? 'var(--star-rose)' : 'inherit',
                borderColor: isDedicated ? 'var(--star-rose)' : 'rgba(255, 255, 255, 0.2)',
                background: isDedicated ? 'rgba(255, 158, 196, 0.16)' : 'transparent',
              }}
            >
              <span>{isDedicated ? '♥' : '♡'}</span>
              <span>{isDedicated ? 'Dành riêng cho em' : 'Dành riêng'}</span>
            </button>

            {/* Close button */}
            <button
              onClick={closeModal}
              className="glass-button"
              aria-label="Đóng thẻ kỷ niệm"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div
          className="mobile-scroll-area"
          style={{
            flex: 1,
            padding: '20px 22px calc(var(--safe-bottom) + 28px) 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header Metadata */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
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
                <span style={{ fontSize: '0.75rem', color: 'var(--sky-text-muted)' }}>
                  {constellation.name}
                </span>
              )}
            </div>

            <h2
              style={{
                margin: '0 0 6px 0',
                fontSize: '1.45rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1.25,
              }}
            >
              {content.title}
            </h2>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sky-text-muted)' }}>
              {content.dateLabel}
            </p>
          </div>

          {/* Optional Illustration / Image */}
          {content.imageUrl && (
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(5, 9, 24, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src={content.imageUrl}
                alt={content.title}
                loading="lazy"
                style={{
                  width: '100%',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  padding: '16px',
                }}
              />
              {content.imageCaption && (
                <div
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    fontSize: '0.75rem',
                    color: 'var(--sky-text-muted)',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {content.imageCaption}
                </div>
              )}
            </div>
          )}

          {/* Romantic Message */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(255, 216, 155, 0.08)',
              border: '1px solid rgba(255, 216, 155, 0.2)',
              fontStyle: 'italic',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--star-gold)',
            }}
          >
            "{content.message}"
          </div>

          {/* Memory Story */}
          {content.memoryStory && (
            <div>
              <h4
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--sky-text-muted)',
                }}
              >
                Kỷ niệm
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  color: 'var(--sky-text)',
                }}
              >
                {content.memoryStory}
              </p>
            </div>
          )}

          {/* Promise */}
          {content.promise && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 158, 196, 0.08)',
                border: '1px solid rgba(255, 158, 196, 0.22)',
              }}
            >
              <h4
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--star-rose)',
                }}
              >
                Lời hứa của anh
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: '#ffffff',
                }}
              >
                {content.promise}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
