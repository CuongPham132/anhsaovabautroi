import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import {
  setAmbientMeteorsEnabled,
  triggerMeteorShower,
  type MeteorSpawnMode,
} from '../sky/ShootingStarsLayer';

const COUNT_PRESETS = [1, 5, 12, 25] as const;

interface MeteorControlPopoverProps {
  readonly compact?: boolean;
}

export const MeteorControlPopover: React.FC<MeteorControlPopoverProps> = ({
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [meteorCount, setMeteorCount] = useState<number>(8);
  const [spawnMode, setSpawnMode] = useState<MeteorSpawnMode>('in-view');
  const [ambientEnabled, setAmbientEnabled] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isCompact } = useResponsiveLayout();

  // Close desktop popover cleanly on outside click; mobile uses dedicated backdrop
  useEffect(() => {
    if (!isOpen || isCompact) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, isCompact]);

  const handleTrigger = () => {
    triggerMeteorShower(meteorCount, spawnMode);
    // On compact mobile screens, close panel after firing so user enjoys full sky unobstructed
    if (isCompact) {
      setIsOpen(false);
    }
  };

  const handleToggleAmbient = () => {
    const next = !ambientEnabled;
    setAmbientEnabled(next);
    setAmbientMeteorsEnabled(next);
  };

  const panelBody = (
    <>
      {/* Title + Close Button on Compact */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
            ☄️ Mưa Sao Băng
          </span>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--star-gold)',
            }}
          >
            ({meteorCount})
          </span>
        </div>

        {isCompact && (
          <button
            onClick={() => setIsOpen(false)}
            className="glass-button"
            aria-label="Đóng bảng sao băng"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.95rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {COUNT_PRESETS.map((preset) => {
          const active = meteorCount === preset;
          return (
            <button
              key={preset}
              onClick={() => setMeteorCount(preset)}
              className="glass-button"
              style={{
                minHeight: '38px',
                padding: '6px 0',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 500,
                borderColor: active ? 'var(--star-gold)' : 'rgba(255,255,255,0.12)',
                background: active ? 'rgba(255, 216, 155, 0.2)' : 'rgba(255,255,255,0.04)',
                color: active ? 'var(--star-gold)' : 'var(--sky-text-muted)',
              }}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Fine-grained Count Slider (1 - 30) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          type="range"
          min={1}
          max={30}
          value={meteorCount}
          onChange={(e) => setMeteorCount(Number(e.target.value))}
          aria-label="Số lượng sao băng"
          style={{
            width: '100%',
            height: '28px',
            accentColor: '#ffd89b',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--sky-text-muted)',
          }}
        >
          <span>1 sao đơn lẻ</span>
          <span>30 mưa rào</span>
        </div>
      </div>

      {/* Spawn Mode Toggle (3 options) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--sky-text-muted)' }}>
          Vị trí xuất hiện:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {(
            [
              { id: 'in-view', label: 'Trước mặt', title: 'Rơi ngay trong khung trời bạn đang hướng tới' },
              { id: 'distant-horizon', label: 'Chân trời xa', title: 'Rơi xa xa phía trên dãy núi & Đài quan sát' },
              { id: 'random-sky', label: 'Ngẫu nhiên', title: 'Rải ngẫu nhiên toàn bầu trời 360°' },
            ] as const
          ).map((opt) => {
            const active = spawnMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSpawnMode(opt.id)}
                title={opt.title}
                className="glass-button"
                style={{
                  minHeight: '38px',
                  padding: '6px 4px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                  borderColor: active ? 'var(--star-cyan)' : 'rgba(255,255,255,0.12)',
                  background: active
                    ? 'rgba(158, 231, 255, 0.16)'
                    : 'rgba(255,255,255,0.04)',
                  color: active ? '#ffffff' : 'var(--sky-text-muted)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fire Meteor Shower CTA */}
      <button
        onClick={handleTrigger}
        className="glass-button"
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '10px 14px',
          borderRadius: '12px',
          fontSize: '0.86rem',
          fontWeight: 600,
          background:
            'linear-gradient(135deg, rgba(255, 216, 155, 0.28) 0%, rgba(255, 158, 196, 0.24) 100%)',
          borderColor: 'var(--star-gold)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <span>✨</span>
        <span>Thả {meteorCount} sao băng ngay</span>
      </button>

      {/* Natural Ambient Shooting Star Toggle */}
      <button
        onClick={handleToggleAmbient}
        className="glass-button"
        style={{
          width: '100%',
          minHeight: '38px',
          padding: '7px 10px',
          borderRadius: '10px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--sky-text-muted)',
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <span>Sao băng tự nhiên nền</span>
        <span style={{ color: ambientEnabled ? '#9be7b5' : '#8b95b5', fontWeight: 600 }}>
          {ambientEnabled ? 'Đang bật' : 'Đã tắt'}
        </span>
      </button>
    </>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.08 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-button"
        aria-label="Mở bảng điều khiển mưa sao băng"
        title="Mở bảng điều khiển mưa sao băng"
        style={{
          minWidth: compact ? '38px' : 'auto',
          minHeight: compact ? '38px' : 'auto',
          padding: compact ? '6px 10px' : '8px 13px',
          borderRadius: compact ? '12px' : '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: compact ? '0.9rem' : '0.82rem',
          fontWeight: 500,
          borderColor: isOpen
            ? 'var(--star-gold)'
            : 'rgba(255, 216, 155, 0.28)',
          background: isOpen
            ? 'rgba(255, 216, 155, 0.18)'
            : 'rgba(255, 255, 255, 0.08)',
          color: isOpen ? 'var(--star-gold)' : 'var(--sky-text)',
        }}
      >
        <span>☄️</span>
        {!compact && <span>Sao băng</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen &&
          (isCompact ? (
            /* Mobile / Landscape-Safe Centered Sheet (never overflows 360px or short viewports) */
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 55,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '12px',
                paddingBottom: 'calc(var(--safe-bottom) + 12px)',
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(3, 5, 17, 0.56)',
                  backdropFilter: 'blur(4px)',
                  touchAction: 'none',
                }}
              />
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="glass-panel-strong mobile-scroll-area"
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '380px',
                  maxHeight: '78dvh',
                  borderRadius: '22px',
                  padding: '16px',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {panelBody}
              </motion.div>
            </div>
          ) : (
            /* Desktop Floating Popover */
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-panel-strong"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '300px',
                borderRadius: '18px',
                padding: '15px',
                zIndex: 45,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {panelBody}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};
