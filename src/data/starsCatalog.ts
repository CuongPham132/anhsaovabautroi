import type { InteractiveStar } from '../types/star';

/**
 * Spatial catalog of curated interactive memory stars (TD-09).
 * Each star links to its narrative payload via immutable `contentId`.
 */
export const INTERACTIVE_STARS: readonly InteractiveStar[] = Object.freeze([
  // Chòm Sao Mưa Đầu Mùa (Upper-Left Sky)
  {
    id: 'star-first-glance',
    contentId: 'content-first-glance',
    constellationId: 'const-first-rain',
    position: [-26, 13, -34],
    magnitude: 1.45,
    colorHex: '#b9e3ff',
  },
  {
    id: 'star-shared-umbrella',
    contentId: 'content-shared-umbrella',
    constellationId: 'const-first-rain',
    position: [-19, 17.5, -36],
    magnitude: 1.25,
    colorHex: '#d4efff',
  },
  {
    id: 'star-warm-coffee',
    contentId: 'content-warm-coffee',
    constellationId: 'const-first-rain',
    position: [-12.5, 14.5, -32],
    magnitude: 1.15,
    colorHex: '#ffe6b8',
  },
  {
    id: 'star-late-walk',
    contentId: 'content-late-walk',
    constellationId: 'const-first-rain',
    position: [-16, 7.5, -38],
    magnitude: 1.2,
    colorHex: '#a7dcff',
  },
  {
    id: 'star-rain-promise',
    contentId: 'content-rain-promise',
    constellationId: 'const-first-rain',
    position: [-23.5, 5.5, -35],
    magnitude: 1.35,
    colorHex: '#ffd992',
  },

  // Chòm Sao Dải Ngân Hà (Center-Top Sky)
  {
    id: 'star-midnight-call',
    contentId: 'content-midnight-call',
    constellationId: 'const-milky-way',
    position: [-5.5, 9.5, -31],
    magnitude: 1.3,
    colorHex: '#ffe2ad',
  },
  {
    id: 'star-quiet-shoulder',
    contentId: 'content-quiet-shoulder',
    constellationId: 'const-milky-way',
    position: [-0.8, 14.8, -35],
    magnitude: 1.25,
    colorHex: '#fff3d6',
  },
  {
    id: 'star-stargazing-night',
    contentId: 'content-stargazing-night',
    constellationId: 'const-milky-way',
    position: [4.5, 11.2, -29],
    magnitude: 1.65,
    colorHex: '#ffd992',
  },
  {
    id: 'star-unspoken-smile',
    contentId: 'content-unspoken-smile',
    constellationId: 'const-milky-way',
    position: [9.5, 16.0, -37],
    magnitude: 1.2,
    colorHex: '#ffe9c6',
  },
  {
    id: 'star-infinite-orbit',
    contentId: 'content-infinite-orbit',
    constellationId: 'const-milky-way',
    position: [2.2, 4.2, -33],
    magnitude: 1.4,
    colorHex: '#ffcbda',
  },

  // Chòm Sao Đèn Lồng (Right Sky)
  {
    id: 'star-lantern-wish',
    contentId: 'content-lantern-wish',
    constellationId: 'const-lantern-glow',
    position: [18.5, 10.5, -32],
    magnitude: 1.6,
    colorHex: '#ffb9d1',
  },
  {
    id: 'star-hand-in-hand',
    contentId: 'content-hand-in-hand',
    constellationId: 'const-lantern-glow',
    position: [25.5, 6.2, -36],
    magnitude: 1.3,
    colorHex: '#ffd7b8',
  },
  {
    id: 'star-little-notes',
    contentId: 'content-little-notes',
    constellationId: 'const-lantern-glow',
    position: [21.5, -1.5, -34],
    magnitude: 1.2,
    colorHex: '#ffc5d9',
  },
  {
    id: 'star-home-light',
    contentId: 'content-home-light',
    constellationId: 'const-lantern-glow',
    position: [14.5, 2.5, -30],
    magnitude: 1.4,
    colorHex: '#ffe0a8',
  },

  // Chòm Sao Lời Hứa (Lower-Center Sky)
  {
    id: 'star-favorite-song',
    contentId: 'content-favorite-song',
    constellationId: 'const-forever-vow',
    position: [-9.5, -6.5, -35],
    magnitude: 1.25,
    colorHex: '#dec8ff',
  },
  {
    id: 'star-future-morning',
    contentId: 'content-future-morning',
    constellationId: 'const-forever-vow',
    position: [-2.5, -10.5, -31],
    magnitude: 1.35,
    colorHex: '#ffe4b5',
  },
  {
    id: 'star-polar-anchor',
    contentId: 'content-polar-anchor',
    constellationId: 'const-forever-vow',
    position: [4.5, -5.8, -28],
    magnitude: 1.75,
    colorHex: '#fff5dc',
  },
  {
    id: 'star-all-for-you',
    contentId: 'content-all-for-you',
    constellationId: 'const-forever-vow',
    position: [11.5, -11.2, -34],
    magnitude: 1.5,
    colorHex: '#ffb9d1',
  },
]);
