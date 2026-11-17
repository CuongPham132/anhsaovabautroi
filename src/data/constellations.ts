import type { Constellation } from '../types/star';

/**
 * Curated constellations connecting InteractiveStars strictly by stable StarId pairs (TD-09).
 */
export const CONSTELLATIONS: readonly Constellation[] = Object.freeze([
  {
    id: 'const-first-rain',
    name: 'Chòm Mưa Đầu Mùa',
    subtitle: 'Nơi câu chuyện bắt đầu dưới mái hiên',
    colorHex: '#8bc8ff',
    connections: [
      ['star-first-glance', 'star-shared-umbrella'],
      ['star-shared-umbrella', 'star-warm-coffee'],
      ['star-warm-coffee', 'star-late-walk'],
      ['star-late-walk', 'star-rain-promise'],
      ['star-rain-promise', 'star-first-glance'],
    ],
  },
  {
    id: 'const-milky-way',
    name: 'Chòm Dải Ngân Hà',
    subtitle: 'Những đêm dài hóa bình yên khi có em',
    colorHex: '#ffd992',
    connections: [
      ['star-midnight-call', 'star-quiet-shoulder'],
      ['star-quiet-shoulder', 'star-stargazing-night'],
      ['star-stargazing-night', 'star-unspoken-smile'],
      ['star-stargazing-night', 'star-infinite-orbit'],
      ['star-infinite-orbit', 'star-midnight-call'],
    ],
  },
  {
    id: 'const-lantern-glow',
    name: 'Chòm Đèn Lồng',
    subtitle: 'Ánh sáng ấm áp dẫn lối về nhà',
    colorHex: '#ffb4c8',
    connections: [
      ['star-lantern-wish', 'star-hand-in-hand'],
      ['star-hand-in-hand', 'star-little-notes'],
      ['star-little-notes', 'star-home-light'],
      ['star-home-light', 'star-lantern-wish'],
    ],
  },
  {
    id: 'const-forever-vow',
    name: 'Chòm Lời Hứa',
    subtitle: 'Ngôi sao dẫn đường cho mọi ngày mai',
    colorHex: '#d8c2ff',
    connections: [
      ['star-favorite-song', 'star-future-morning'],
      ['star-future-morning', 'star-polar-anchor'],
      ['star-polar-anchor', 'star-all-for-you'],
    ],
  },
]);
