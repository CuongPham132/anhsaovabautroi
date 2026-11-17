import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WORLD_SPOT_LIST } from '../../data/worldSpots';
import { triggerSocialEmote } from '../../hooks/useCharacterControls';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { SocialEmote } from '../../shared/protocol';
import { useSessionStore } from '../../store/useSessionStore';
import { useSkyStore } from '../../store/useSkyStore';

const SOCIAL_EMOTES: ReadonlyArray<{
  readonly id: SocialEmote;
  readonly icon: string;
  readonly label: string;
  readonly keyHint: string;
}> = [
  { id: 'wave', icon: '👋', label: 'Vẫy tay', keyHint: '1' },
  { id: 'point', icon: '✨', label: 'Chỉ lên trời', keyHint: '2' },
  { id: 'sit', icon: '🌙', label: 'Ngồi nghỉ', keyHint: '3' },
];

export const WorldSpotBar: React.FC = () => {
  const activeWorldSpot = useSkyStore((state) => state.activeWorldSpot);
  const controlledRole = useSkyStore((state) => state.controlledRole);
  const characterPose = useSkyStore((state) => state.characterPose);
  const worldToastMessage = useSkyStore((state) => state.worldToastMessage);
  const setActiveWorldSpot = useSkyStore((state) => state.setActiveWorldSpot);
  const switchControlledRole = useSkyStore((state) => state.switchControlledRole);
  const connectionMode = useSessionStore((state) => state.connectionMode);
  const { width, isCompact, isLandscapeMobile, isTouchDevice } = useResponsiveLayout();

  const isNarrowPhone = width < 480;

  const handleSwitchCharacter = () => {
    switchControlledRole();
    setTimeout(() => {
      useSkyStore.getState().setWorldToast(null);
    }, 2800);
  };

  return (
    <>
      {/* Poetic Character / Landmark Whisper Toast
          On mobile/compact, positioned cleanly below header so it NEVER overlaps Joystick or bottom bar */}
      <AnimatePresence>
        {worldToastMessage && (
          <motion.div
            key={worldToastMessage}
            initial={{ opacity: 0, y: isCompact || isTouchDevice ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isCompact || isTouchDevice ? -6 : 6, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="glass-panel-strong"
            style={{
              position: 'fixed',
              ...(isCompact || isTouchDevice
                ? {
                    top: `calc(var(--safe-top) + ${
                      isLandscapeMobile
                        ? '54px'
                        : isNarrowPhone
                          ? '98px'
                          : isCompact
                            ? '58px'
                            : '76px'
                    })`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: 'calc(100vw - 28px)',
                    textAlign: 'center',
                  }
                : {
                    left: '24px',
                    bottom: 'calc(var(--safe-bottom) + 92px)',
                    maxWidth: '380px',
                  }),
              padding: isCompact ? '7px 13px' : '9px 14px',
              borderRadius: '14px',
              fontSize: isCompact ? '0.76rem' : '0.8rem',
              lineHeight: 1.45,
              color: '#f8f4ff',
              borderColor: 'rgba(255, 216, 155, 0.32)',
              pointerEvents: 'none',
              zIndex: 27,
            }}
          >
            <span style={{ color: 'var(--star-gold)', marginRight: '6px' }}>✦</span>
            {worldToastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom World Navigation Strip (strictly 1 single horizontally-scrollable row on mobile so Joystick sits cleanly above) */}
      <div
        style={{
          position: 'fixed',
          left: `calc(var(--safe-left) + ${isCompact ? '10px' : '24px'})`,
          bottom: `calc(var(--safe-bottom) + ${isCompact ? '14px' : '20px'})`,
          right: isCompact ? 'calc(var(--safe-right) + 78px)' : 'auto',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '6px',
          pointerEvents: 'none',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.65 }}
          className={isCompact ? 'mobile-scroll-x' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: isCompact ? 'nowrap' : 'wrap',
            gap: isCompact ? '6px' : '8px',
            pointerEvents: 'auto',
            maxWidth: '100%',
            paddingBottom: isCompact ? '2px' : 0,
          }}
        >
          {/* 4 Unified Zones Quick-Travel Bar */}
          <nav
            aria-label="Khu vực thế giới"
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              borderRadius: isCompact ? '15px' : '18px',
              flexShrink: 0,
            }}
          >
            {WORLD_SPOT_LIST.map((spot) => {
              const isActive = spot.id === activeWorldSpot;
              return (
                <button
                  key={spot.id}
                  onClick={() => setActiveWorldSpot(spot.id, true)}
                  title={spot.subtitle}
                  className="glass-button"
                  style={{
                    minHeight: isCompact ? '36px' : 'auto',
                    padding: isCompact ? '6px 9px' : '7px 11px',
                    borderRadius: isCompact ? '11px' : '13px',
                    fontSize: isCompact ? '0.73rem' : '0.78rem',
                    fontWeight: isActive ? 600 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    background: isActive
                      ? 'rgba(255, 216, 155, 0.2)'
                      : 'transparent',
                    borderColor: isActive ? 'var(--star-gold)' : 'transparent',
                    color: isActive ? 'var(--star-gold)' : 'var(--sky-text-muted)',
                    boxShadow: isActive
                      ? '0 0 12px rgba(255, 216, 155, 0.22)'
                      : 'none',
                  }}
                >
                  <span>{spot.icon}</span>
                  <span>{spot.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Character Switcher Pill (Offline Companion Mode) */}
          {connectionMode === 'offline' && (
            <button
              onClick={handleSwitchCharacter}
              title="Nhấn Tab hoặc bấm để đổi nhân vật điều khiển"
              className="glass-panel"
              style={{
                minHeight: isCompact ? '44px' : 'auto',
                padding: isCompact ? '6px 11px' : '8px 12px',
                borderRadius: isCompact ? '15px' : '16px',
                fontSize: isCompact ? '0.74rem' : '0.77rem',
                fontWeight: 500,
                color: controlledRole === 'seeker' ? '#ffd89b' : '#ffb6d5',
                borderColor:
                  controlledRole === 'seeker'
                    ? 'rgba(255, 216, 155, 0.42)'
                    : 'rgba(255, 182, 213, 0.42)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                touchAction: 'manipulation',
              }}
            >
              <span>{controlledRole === 'seeker' ? '🔭' : '📖'}</span>
              <span>{controlledRole === 'seeker' ? 'Nam' : 'Nữ'}</span>
              {!isTouchDevice && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    padding: '1px 5px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--sky-text-muted)',
                  }}
                >
                  Tab
                </span>
              )}
            </button>
          )}

          {/* Compact Social Emotes Bar (Wave / Point / Sit) */}
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '4px',
              borderRadius: isCompact ? '15px' : '16px',
              flexShrink: 0,
            }}
          >
            {SOCIAL_EMOTES.map((emote) => {
              const active = characterPose === emote.id;
              return (
                <button
                  key={emote.id}
                  onClick={() => triggerSocialEmote(emote.id)}
                  aria-label={emote.label}
                  title={`${emote.label} (Phím ${emote.keyHint})`}
                  className="glass-button"
                  style={{
                    minWidth: isCompact ? '36px' : 'auto',
                    minHeight: isCompact ? '36px' : 'auto',
                    padding: isCompact ? '5px 8px' : '6px 9px',
                    borderRadius: '11px',
                    fontSize: isCompact ? '0.84rem' : '0.82rem',
                    background: active ? 'rgba(255, 216, 155, 0.22)' : 'transparent',
                    borderColor: active ? 'var(--star-gold)' : 'transparent',
                  }}
                >
                  {emote.icon}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Whisper-quiet Desktop Movement Legend */}
        {!isTouchDevice && !isCompact && (
          <div
            style={{
              fontSize: '0.69rem',
              color: 'rgba(182, 194, 226, 0.7)',
              paddingLeft: '6px',
              letterSpacing: '0.02em',
            }}
          >
            WASD di chuyển · Chuột xoay & ngước ngắm trời · E tương tác · 1/2/3 biểu cảm · Tab đổi nhân vật
          </div>
        )}
      </div>
    </>
  );
};
