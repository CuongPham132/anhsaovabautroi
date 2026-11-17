import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSkyStore } from '../../store/useSkyStore';
import { useDerivedStarLists } from '../../hooks/useDerivedStarLists';
import { starRepository } from '../../repositories/starRepository';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { DerivedStarView } from '../../types/star';

export const MemoryJarDrawer: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'dedicated'>('all');
  const closeModal = useSkyStore((state) => state.closeModal);
  const setActiveModal = useSkyStore((state) => state.setActiveModal);
  const { collectedViews, dedicatedViews } = useDerivedStarLists();
  const { isCompact } = useResponsiveLayout();

  const displayedStars = filter === 'all' ? collectedViews : dedicatedViews;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Dimmed backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(3, 5, 17, 0.72)',
          backdropFilter: 'blur(8px)',
          touchAction: 'none',
        }}
      />

      {/* Drawer content */}
      <motion.div
        initial={isCompact ? { y: '100%' } : { x: '100%' }}
        animate={isCompact ? { y: 0 } : { x: 0 }}
        exit={isCompact ? { y: '100%' } : { x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="glass-panel-strong"
        style={{
          position: 'relative',
          width: isCompact ? '100%' : '440px',
          height: isCompact ? '88dvh' : '100dvh',
          marginTop: isCompact ? 'auto' : 0,
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: isCompact ? 0 : '24px',
          borderTopRightRadius: isCompact ? '24px' : 0,
          borderRight: isCompact ? '1px solid var(--sky-border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🏺</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                Chiếc Lọ Kỷ Niệm
              </h2>
            </div>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '0.8rem',
                color: 'var(--sky-text-muted)',
              }}
            >
              Những ngôi sao đã được hái về cất giữ
            </p>
          </div>

          <button
            onClick={closeModal}
            className="glass-button"
            aria-label="Đóng Chiếc Lọ Kỷ Niệm"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            onClick={() => setFilter('all')}
            className="glass-button"
            style={{
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background:
                filter === 'all'
                  ? 'rgba(255, 216, 155, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor:
                filter === 'all' ? 'var(--star-gold)' : 'transparent',
              color: filter === 'all' ? 'var(--star-gold)' : 'var(--sky-text-muted)',
            }}
          >
            Tất cả ({collectedViews.length})
          </button>

          <button
            onClick={() => setFilter('dedicated')}
            className="glass-button"
            style={{
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background:
                filter === 'dedicated'
                  ? 'rgba(255, 158, 196, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor:
                filter === 'dedicated' ? 'var(--star-rose)' : 'transparent',
              color:
                filter === 'dedicated' ? 'var(--star-rose)' : 'var(--sky-text-muted)',
            }}
          >
            ♥ Dành riêng ({dedicatedViews.length})
          </button>
        </div>

        {/* Star List or Empty State */}
        <div
          className="mobile-scroll-area"
          style={{
            flex: 1,
            padding: '16px 20px calc(var(--safe-bottom) + 24px) 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {displayedStars.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--sky-text-muted)',
              }}
            >
              <span style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.6 }}>
                ✨
              </span>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#ffffff' }}>
                {filter === 'all'
                  ? 'Chiếc lọ chưa có ngôi sao nào'
                  : 'Chưa có ngôi sao nào được dành riêng'}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', maxWidth: '280px', lineHeight: 1.5 }}>
                {filter === 'all'
                  ? 'Hãy chạm vào một ngôi sao lấp lánh trên bầu trời và chọn "Hái ngôi sao này" nhé!'
                  : 'Chọn một ngôi sao và bấm "Dành riêng cho em" để gắn trái tim kỷ niệm.'}
              </p>
            </div>
          ) : (
            displayedStars.map((item: DerivedStarView) => {
              const constellation = item.star.constellationId
                ? starRepository.getConstellationById(item.star.constellationId)
                : null;

              return (
                <motion.div
                  key={item.star.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    border: item.isDedicated
                      ? '1px solid rgba(255, 158, 196, 0.4)'
                      : '1px solid var(--sky-border)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: item.isDedicated
                            ? 'var(--star-rose)'
                            : 'var(--star-gold)',
                          background: item.isDedicated
                            ? 'rgba(255, 158, 196, 0.15)'
                            : 'rgba(255, 216, 155, 0.12)',
                          padding: '1px 6px',
                          borderRadius: '8px',
                        }}
                      >
                        {item.content.category}
                      </span>
                      {constellation && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--sky-text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {constellation.name}
                        </span>
                      )}
                    </div>

                    <h4
                      style={{
                        margin: '0 0 2px 0',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.content.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.72rem',
                        color: 'var(--sky-text-muted)',
                      }}
                    >
                      {item.content.dateLabel}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveModal({ type: 'memory', starId: item.star.id });
                    }}
                    className="glass-button"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Mở xem</span>
                    <span>→</span>
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
