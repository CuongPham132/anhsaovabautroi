import React from 'react';
import { motion } from 'framer-motion';
import { ZODIAC_CATALOG } from '../../data/zodiacCatalog';
import { useDerivedStarLists } from '../../hooks/useDerivedStarLists';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useZodiacStore } from '../../store/useZodiacStore';
import { triggerResetCamera } from '../sky/CameraRig';
import { MeteorControlPopover } from './MeteorControlPopover';

export const SkyHeader: React.FC = () => {
  const { visualCollectedCount, totalStars, dedicatedViews } = useDerivedStarLists();
  const discoveredZodiacCount = useZodiacStore((state) => state.discoveredZodiacIds.length);
  const setAtlasOpen = useZodiacStore((state) => state.setAtlasOpen);
  const { width, isCompact } = useResponsiveLayout();
  const dedicatedCount = dedicatedViews.length;

  const isNarrowPhone = width < 480;

  return (
    <header
      style={{
        position: 'absolute',
        top: `calc(var(--safe-top) + ${isCompact ? '10px' : '16px'})`,
        left: `calc(var(--safe-left) + ${isCompact ? '10px' : '16px'})`,
        right: `calc(var(--safe-right) + ${isCompact ? '10px' : '16px'})`,
        display: 'flex',
        flexDirection: isNarrowPhone ? 'column' : 'row',
        alignItems: isNarrowPhone ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isCompact ? '6px' : '12px',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Row 1 (or Left on Desktop): Title Card + Quick Icon Actions on Narrow Phones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="glass-panel"
          style={{
            padding: isCompact ? '7px 12px' : '10px 18px',
            borderRadius: isCompact ? '13px' : '16px',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: isCompact ? '1.0rem' : '1.25rem',
                color: 'var(--star-gold)',
                lineHeight: 1,
              }}
            >
              ✦
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: isCompact ? '0.88rem' : '1.05rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
                color: '#ffffff',
                whiteSpace: 'nowrap',
              }}
            >
              A Sky Full of You
            </h1>
          </div>
          {!isCompact && (
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'var(--sky-text-muted)',
                letterSpacing: '0.02em',
              }}
            >
              Two souls, one universe
            </p>
          )}
        </motion.div>

        {isNarrowPhone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
            <MeteorControlPopover compact />
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              onClick={() => triggerResetCamera()}
              className="glass-button"
              aria-label="Đặt lại góc nhìn bầu trời"
              title="Đặt lại góc nhìn bầu trời"
              style={{
                minWidth: '38px',
                minHeight: '38px',
                padding: '6px 10px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🎯
            </motion.button>
          </div>
        )}
      </div>

      {/* Controls: Zodiac Atlas, Memory Star Progress, Meteor & Reset Camera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCompact ? '6px' : '8px',
          flexWrap: 'nowrap',
          justifyContent: isNarrowPhone ? 'flex-start' : 'flex-end',
          pointerEvents: 'auto',
        }}
      >
        {/* Separate V2.1 Zodiac Atlas Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          onClick={() => setAtlasOpen(true)}
          className="glass-button"
          title="Mở Zodiac Atlas — 12 Cung Hoàng Đạo"
          style={{
            minHeight: isCompact ? '36px' : 'auto',
            padding: isCompact ? '6px 10px' : '8px 13px',
            borderRadius: isCompact ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: isCompact ? '0.76rem' : '0.82rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            borderColor: 'rgba(180, 210, 255, 0.3)',
          }}
        >
          <span style={{ color: '#c7b8ff', fontSize: isCompact ? '0.88rem' : '0.95rem' }}>♈</span>
          <span>
            <strong style={{ color: '#e4d8ff', fontWeight: 600 }}>
              {discoveredZodiacCount}
            </strong>
            <span style={{ color: 'var(--sky-text-muted)' }}>
              /{ZODIAC_CATALOG.length}
              {!isCompact || isNarrowPhone ? ' cung' : ''}
            </span>
          </span>
        </motion.button>

        {/* V1 Personal Memory Star Progress Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass-panel"
          style={{
            minHeight: isCompact ? '36px' : 'auto',
            padding: isCompact ? '6px 10px' : '8px 14px',
            borderRadius: isCompact ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: isCompact ? '0.76rem' : '0.82rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--star-gold)' }}>✨</span>
          <span>
            <strong style={{ color: 'var(--star-gold)', fontWeight: 600 }}>
              {visualCollectedCount}
            </strong>
            <span style={{ color: 'var(--sky-text-muted)' }}>
              /{totalStars}
              {!isCompact || isNarrowPhone ? ' sao' : ''}
            </span>
          </span>

          {dedicatedCount > 0 && (
            <span
              style={{
                marginLeft: '2px',
                padding: '1px 6px',
                borderRadius: '8px',
                background: 'rgba(255, 158, 196, 0.18)',
                color: 'var(--star-rose)',
                fontSize: '0.7rem',
                border: '1px solid rgba(255, 158, 196, 0.3)',
              }}
            >
              ♥ {dedicatedCount}
            </span>
          )}
        </motion.div>

        {!isNarrowPhone && (
          <>
            <MeteorControlPopover compact={isCompact} />
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              onClick={() => triggerResetCamera()}
              className="glass-button"
              aria-label="Đặt lại góc nhìn bầu trời"
              title="Đặt lại góc nhìn bầu trời"
              style={{
                minHeight: isCompact ? '36px' : 'auto',
                padding: isCompact ? '6px 10px' : '8px 12px',
                borderRadius: '12px',
                fontSize: isCompact ? '0.78rem' : '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>🎯</span>
              {!isCompact && <span>Góc nhìn</span>}
            </motion.button>
          </>
        )}
      </div>
    </header>
  );
};
