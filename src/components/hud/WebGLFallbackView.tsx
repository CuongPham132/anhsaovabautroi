import React, { useState } from 'react';
import { useSkyStore } from '../../store/useSkyStore';
import { starRepository } from '../../repositories/starRepository';
import { useDerivedStarLists } from '../../hooks/useDerivedStarLists';
import type { DerivedStarView } from '../../types/star';

export const WebGLFallbackView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const setActiveModal = useSkyStore((state) => state.setActiveModal);
  const toggleDedicateStar = useSkyStore((state) => state.toggleDedicateStar);
  const commitCollectAndStartFlight = useSkyStore(
    (state) => state.commitCollectAndStartFlight
  );
  const releaseFlightAndPulseJar = useSkyStore(
    (state) => state.releaseFlightAndPulseJar
  );

  const { allViews, visualCollectedCount, totalStars } = useDerivedStarLists();

  const handleHarvestDirect = (starId: string) => {
    commitCollectAndStartFlight(starId);
    releaseFlightAndPulseJar(starId);
  };

  const filteredStars =
    selectedCategory === 'all'
      ? allViews
      : allViews.filter(
          (item: DerivedStarView) => item.content.category === selectedCategory
        );

  return (
    <div
      className="mobile-scroll-area"
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #030511 0%, #080e26 100%)',
        color: '#f4f6ff',
        paddingTop: 'calc(var(--safe-top) + 74px)',
        paddingRight: 'calc(var(--safe-right) + 16px)',
        paddingBottom: 'calc(var(--safe-bottom) + 96px)',
        paddingLeft: 'calc(var(--safe-left) + 16px)',
        zIndex: 10,
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Fallback Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            marginBottom: '28px',
            border: '1px solid rgba(255, 216, 155, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🌟</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
                Bầu Trời Kỷ Niệm (Chế độ 2D)
              </h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--sky-text-muted)',
                }}
              >
                WebGL chưa khả dụng trên thiết bị này. Bạn vẫn có thể ngắm trọn vẹn
                các chòm sao và kỷ niệm bên dưới!
              </p>
            </div>
          </div>
        </div>

        {/* Categories / Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: 'var(--star-gold)' }}>
            ✨ Đã hái: <strong>{visualCollectedCount}</strong> / {totalStars} ngôi sao
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              className="glass-button"
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                background:
                  selectedCategory === 'all'
                    ? 'rgba(255, 216, 155, 0.2)'
                    : 'transparent',
                borderColor:
                  selectedCategory === 'all' ? 'var(--star-gold)' : undefined,
              }}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedCategory('Kỷ niệm')}
              className="glass-button"
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                background:
                  selectedCategory === 'Kỷ niệm'
                    ? 'rgba(255, 216, 155, 0.2)'
                    : 'transparent',
                borderColor:
                  selectedCategory === 'Kỷ niệm' ? 'var(--star-gold)' : undefined,
              }}
            >
              Kỷ niệm
            </button>
            <button
              onClick={() => setSelectedCategory('Lời hứa')}
              className="glass-button"
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                background:
                  selectedCategory === 'Lời hứa'
                    ? 'rgba(255, 158, 196, 0.2)'
                    : 'transparent',
                borderColor:
                  selectedCategory === 'Lời hứa' ? 'var(--star-rose)' : undefined,
              }}
            >
              Lời hứa
            </button>
          </div>
        </div>

        {/* Star Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredStars.map((item: DerivedStarView) => {
            const constellation = item.star.constellationId
              ? starRepository.getConstellationById(item.star.constellationId)
              : null;
            const isHarvested = item.status === 'collected';

            return (
              <div
                key={item.star.id}
                className="glass-panel"
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: item.isDedicated
                    ? '1px solid rgba(255, 158, 196, 0.4)'
                    : undefined,
                }}
              >
                <div style={{ flex: 1 }}>
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
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: item.isDedicated
                          ? 'var(--star-rose)'
                          : 'var(--star-gold)',
                        background: item.isDedicated
                          ? 'rgba(255, 158, 196, 0.15)'
                          : 'rgba(255, 216, 155, 0.12)',
                        padding: '1px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      {item.content.category}
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

                    {isHarvested && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--star-cyan)',
                          background: 'rgba(158, 231, 255, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '6px',
                        }}
                      >
                        ✓ Đã hái
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      margin: '0 0 2px 0',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: '#ffffff',
                    }}
                  >
                    {item.content.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      color: 'var(--sky-text-muted)',
                    }}
                  >
                    {item.content.dateLabel}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => toggleDedicateStar(item.star.id)}
                    className="glass-button"
                    title={item.isDedicated ? 'Bỏ dành riêng' : 'Dành riêng'}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      color: item.isDedicated ? 'var(--star-rose)' : undefined,
                    }}
                  >
                    {item.isDedicated ? '♥' : '♡'}
                  </button>

                  {isHarvested ? (
                    <button
                      onClick={() =>
                        setActiveModal({ type: 'memory', starId: item.star.id })
                      }
                      className="glass-button"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        background: 'rgba(255, 216, 155, 0.18)',
                        borderColor: 'var(--star-gold)',
                      }}
                    >
                      Mở xem
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHarvestDirect(item.star.id)}
                      className="glass-button"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                      }}
                    >
                      Hái sao
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
