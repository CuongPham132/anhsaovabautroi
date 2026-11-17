import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ZODIAC_CATALOG, ZODIAC_ELEMENT_META } from '../../data/zodiacCatalog';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useZodiacStore } from '../../store/useZodiacStore';
import type { ZodiacElement } from '../../types/zodiac';
import { ZodiacSvgChart } from './ZodiacSvgChart';

type ElementFilter = 'all' | ZodiacElement;

export const ZodiacAtlasDrawer: React.FC = () => {
  const [filter, setFilter] = useState<ElementFilter>('all');

  const isAtlasOpen = useZodiacStore((state) => state.isAtlasOpen);
  const discoveredZodiacIds = useZodiacStore((state) => state.discoveredZodiacIds);
  const setAtlasOpen = useZodiacStore((state) => state.setAtlasOpen);
  const selectZodiac = useZodiacStore((state) => state.selectZodiac);
  const guideToZodiac = useZodiacStore((state) => state.guideToZodiac);

  const { isCompact, isMobile } = useResponsiveLayout();

  const discoveredSet = useMemo(
    () => new Set(discoveredZodiacIds),
    [discoveredZodiacIds]
  );

  const filteredZodiacs = useMemo(() => {
    if (filter === 'all') return ZODIAC_CATALOG;
    return ZODIAC_CATALOG.filter((z) => z.element === filter);
  }, [filter]);

  return (
    <AnimatePresence>
      {isAtlasOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 52,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAtlasOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(3, 5, 17, 0.72)',
              backdropFilter: 'blur(8px)',
              touchAction: 'none',
            }}
          />

          {/* Atlas Drawer Panel */}
          <motion.div
            initial={isCompact ? { y: '100%' } : { x: '100%' }}
            animate={isCompact ? { y: 0 } : { x: 0 }}
            exit={isCompact ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="glass-panel-strong"
            style={{
              position: 'relative',
              width: isCompact ? '100%' : '520px',
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
            {/* Header */}
            <div
              style={{
                padding: '22px 24px 16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.35rem', color: 'var(--star-gold)' }}>♈</span>
                  <h2 style={{ margin: 0, fontSize: '1.22rem', color: '#ffffff' }}>
                    Zodiac Atlas — 12 Cung Hoàng Đạo
                  </h2>
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--sky-text-muted)',
                  }}
                >
                  Đã khám phá{' '}
                  <strong style={{ color: 'var(--star-gold)' }}>
                    {discoveredZodiacIds.length} / {ZODIAC_CATALOG.length}
                  </strong>{' '}
                  chòm sao trên bầu trời 360°
                </p>
              </div>

              <button
                onClick={() => setAtlasOpen(false)}
                className="glass-button"
                aria-label="Đóng Zodiac Atlas"
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

            {/* Element Filter Pills */}
            <div
              style={{
                padding: '12px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {(
                [
                  { id: 'all', label: 'Tất cả (12)' },
                  { id: 'fire', label: '🔥 Lửa' },
                  { id: 'earth', label: '🌿 Đất' },
                  { id: 'air', label: '🌬️ Khí' },
                  { id: 'water', label: '💧 Nước' },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className="glass-button"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '11px',
                      fontSize: '0.78rem',
                      fontWeight: active ? 600 : 500,
                      background: active
                        ? 'rgba(255, 216, 155, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: active ? 'var(--star-gold)' : 'transparent',
                      color: active ? 'var(--star-gold)' : 'var(--sky-text-muted)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 12 Zodiac Cards Grid */}
            <div
              className="mobile-scroll-area"
              style={{
                flex: 1,
                padding: '16px 20px calc(var(--safe-bottom) + 28px) 20px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
                alignContent: 'start',
              }}
            >
              {filteredZodiacs.map((zodiac) => {
                const discovered = discoveredSet.has(zodiac.id);
                const elMeta = ZODIAC_ELEMENT_META[zodiac.element];

                return (
                  <div
                    key={zodiac.id}
                    className="glass-panel"
                    style={{
                      padding: '14px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      borderColor: discovered
                        ? `${zodiac.colorHex}55`
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '1.35rem',
                            color: discovered ? zodiac.colorHex : '#6b7b9e',
                          }}
                        >
                          {zodiac.symbol}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 600,
                              color: discovered ? '#ffffff' : 'var(--sky-text-muted)',
                            }}
                          >
                            {zodiac.nameVi}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--sky-text-muted)',
                            }}
                          >
                            {zodiac.nameEn} · {elMeta.labelVi}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.66rem',
                          padding: '2px 7px',
                          borderRadius: '8px',
                          background: discovered
                            ? 'rgba(255, 216, 155, 0.16)'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: discovered ? 'var(--star-gold)' : 'var(--sky-text-muted)',
                        }}
                      >
                        {discovered ? 'Đã khám phá' : 'Chưa tìm thấy'}
                      </span>
                    </div>

                    {/* Mini Constellation Preview */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 0',
                        borderRadius: '12px',
                        background: 'rgba(4, 7, 20, 0.55)',
                      }}
                    >
                      <ZodiacSvgChart zodiac={zodiac} discovered={discovered} size={96} />
                    </div>

                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: discovered ? '#e6ecff' : 'var(--sky-text-muted)',
                        minHeight: '32px',
                        lineHeight: 1.4,
                      }}
                    >
                      {discovered
                        ? zodiac.theme
                        : 'Xoay bầu trời hoặc bấm dẫn hướng để khám phá chòm sao này.'}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                      {discovered ? (
                        <>
                          <button
                            onClick={() => {
                              setAtlasOpen(false);
                              selectZodiac(zodiac.id);
                            }}
                            className="glass-button"
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              borderRadius: '10px',
                              fontSize: '0.76rem',
                              fontWeight: 500,
                              borderColor: `${zodiac.colorHex}80`,
                              color: zodiac.colorHex,
                            }}
                          >
                            Xem truyền thuyết
                          </button>
                          <button
                            onClick={() => guideToZodiac(zodiac.id)}
                            className="glass-button"
                            title="Ngắm chòm sao trên bầu trời"
                            style={{
                              padding: '7px 10px',
                              borderRadius: '10px',
                              fontSize: '0.76rem',
                            }}
                          >
                            🔭
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => guideToZodiac(zodiac.id)}
                          className="glass-button"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '10px',
                            fontSize: '0.76rem',
                            fontWeight: 500,
                            color: '#d8e4ff',
                          }}
                        >
                          🧭 Dẫn hướng tìm trên trời
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
