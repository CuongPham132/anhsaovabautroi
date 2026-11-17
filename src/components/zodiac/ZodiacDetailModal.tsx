import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getZodiacById, ZODIAC_ELEMENT_META } from '../../data/zodiacCatalog';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useZodiacStore } from '../../store/useZodiacStore';
import { ZodiacSvgChart } from './ZodiacSvgChart';

export const ZodiacDetailModal: React.FC = () => {
  const selectedZodiacId = useZodiacStore((state) => state.selectedZodiacId);
  const selectZodiac = useZodiacStore((state) => state.selectZodiac);
  const setAtlasOpen = useZodiacStore((state) => state.setAtlasOpen);
  const guideToZodiac = useZodiacStore((state) => state.guideToZodiac);
  const { isCompact } = useResponsiveLayout();

  const zodiac = selectedZodiacId ? getZodiacById(selectedZodiacId) : null;

  return (
    <AnimatePresence>
      {zodiac && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 58,
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
            onClick={() => selectZodiac(null)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(3, 5, 17, 0.72)',
              backdropFilter: 'blur(8px)',
              touchAction: 'none',
            }}
          />

          {/* Card */}
          <motion.div
            initial={isCompact ? { y: '100%' } : { opacity: 0, scale: 0.92, y: 14 }}
            animate={isCompact ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isCompact ? { y: '100%' } : { opacity: 0, scale: 0.92, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-panel-strong"
            style={{
              position: 'relative',
              width: isCompact ? '100%' : '480px',
              maxHeight: isCompact ? '88dvh' : '84dvh',
              borderRadius: isCompact ? '26px 26px 0 0' : '24px',
              borderColor: `${zodiac.colorHex}66`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 1,
            }}
          >
            {/* Top Bar */}
            <div
              style={{
                padding: '18px 22px 14px 22px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={() => {
                  selectZodiac(null);
                  setAtlasOpen(true);
                }}
                className="glass-button"
                style={{
                  padding: '6px 11px',
                  borderRadius: '10px',
                  fontSize: '0.76rem',
                }}
              >
                ← Zodiac Atlas
              </button>

              <button
                onClick={() => selectZodiac(null)}
                className="glass-button"
                aria-label="Đóng chi tiết cung hoàng đạo"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div
              className="mobile-scroll-area"
              style={{
                padding: '20px 22px calc(var(--safe-bottom) + 26px) 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '16px',
                    background: 'rgba(4, 8, 24, 0.72)',
                    border: `1px solid ${zodiac.colorHex}44`,
                    flexShrink: 0,
                  }}
                >
                  <ZodiacSvgChart zodiac={zodiac} discovered={true} size={108} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.7rem', color: zodiac.colorHex }}>
                      {zodiac.symbol}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: `${ZODIAC_ELEMENT_META[zodiac.element].colorHex}22`,
                        color: ZODIAC_ELEMENT_META[zodiac.element].colorHex,
                      }}
                    >
                      Nguyên tố {ZODIAC_ELEMENT_META[zodiac.element].labelVi}
                    </span>
                  </div>

                  <h2 style={{ margin: '0 0 2px 0', fontSize: '1.35rem', color: '#ffffff' }}>
                    {zodiac.nameVi}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sky-text-muted)' }}>
                    {zodiac.nameEn} · {zodiac.dateRange}
                  </p>
                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: zodiac.colorHex,
                    }}
                  >
                    ✦ {zodiac.theme}
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.88rem',
                  lineHeight: 1.58,
                  color: '#f3f6ff',
                }}
              >
                {zodiac.shortDescription}
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--sky-text-muted)',
                  }}
                >
                  Truyền thuyết chòm sao
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    color: '#dce4ff',
                  }}
                >
                  {zodiac.mythLore}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={() => guideToZodiac(zodiac.id)}
                  className="glass-button"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    borderColor: zodiac.colorHex,
                    color: zodiac.colorHex,
                    background: `${zodiac.colorHex}18`,
                  }}
                >
                  🔭 Ngắm trên bầu trời
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
