import * as THREE from 'three';
import type { AvatarArchetype } from '../../shared/protocol';

/**
 * Module-level shared BufferGeometries & Materials for StylizedCharacter avatars.
 * Prevents duplicate GPU buffer/program allocations when scaling from 2 to 10-30 concurrent players.
 */
export const AVATAR_GEOMETRIES = {
  footRingLocal: new THREE.RingGeometry(0.38, 0.52, 24),
  footRingRemote: new THREE.RingGeometry(0.28, 0.42, 20),
  celebrateRing: new THREE.RingGeometry(0.58, 0.72, 28),
  cloakSeeker: new THREE.ConeGeometry(0.34, 1.18, 12),
  cloakChronicler: new THREE.ConeGeometry(0.4, 1.18, 12),
  hemSeeker: new THREE.TorusGeometry(0.32, 0.018, 8, 22),
  hemChronicler: new THREE.TorusGeometry(0.38, 0.018, 8, 22),
  mantle: new THREE.CylinderGeometry(0.16, 0.31, 0.42, 12),
  collar: new THREE.TorusGeometry(0.18, 0.022, 8, 18),
  cloakTail: new THREE.BoxGeometry(0.38, 0.76, 0.05),
  ribbon: new THREE.BoxGeometry(0.09, 0.56, 0.025),
  arm: new THREE.CapsuleGeometry(0.055, 0.34, 4, 8),
  head: new THREE.SphereGeometry(0.165, 14, 14),
  hairCrown: new THREE.SphereGeometry(0.18, 14, 12),
  hairFlow: new THREE.ConeGeometry(0.16, 0.38, 10),
  hairpin: new THREE.OctahedronGeometry(0.038, 0),
  spyglassTube: new THREE.CylinderGeometry(0.048, 0.032, 0.64, 10),
  spyglassLens: new THREE.SphereGeometry(0.046, 8, 8),
  bookPage: new THREE.BoxGeometry(0.18, 0.22, 0.016),
  bookSpine: new THREE.BoxGeometry(0.036, 0.23, 0.022),
  bookMote: new THREE.OctahedronGeometry(0.04, 0),
} as const;

export interface AvatarMaterialSet {
  readonly cloak: THREE.MeshBasicMaterial;
  readonly inner: THREE.MeshBasicMaterial;
  readonly trim: THREE.MeshBasicMaterial;
  readonly accent: THREE.MeshBasicMaterial;
  readonly hair: THREE.MeshBasicMaterial;
  readonly skin: THREE.MeshBasicMaterial;
  readonly footAuraLocal: THREE.MeshBasicMaterial;
  readonly footAuraRemote: THREE.MeshBasicMaterial;
  readonly celebrateAura: THREE.MeshBasicMaterial;
  readonly scale: number;
}

function createArchetypeMaterials(config: {
  cloak: string;
  inner: string;
  trim: string;
  accent: string;
  hair: string;
  skin: string;
  scale: number;
}): AvatarMaterialSet {
  return {
    cloak: new THREE.MeshBasicMaterial({ color: config.cloak, fog: true }),
    inner: new THREE.MeshBasicMaterial({ color: config.inner, fog: true }),
    trim: new THREE.MeshBasicMaterial({ color: config.trim, toneMapped: false, fog: false }),
    accent: new THREE.MeshBasicMaterial({
      color: config.accent,
      transparent: true,
      opacity: 0.85,
      toneMapped: false,
      fog: false,
    }),
    hair: new THREE.MeshBasicMaterial({ color: config.hair, fog: true }),
    skin: new THREE.MeshBasicMaterial({ color: config.skin, fog: true }),
    footAuraLocal: new THREE.MeshBasicMaterial({
      color: config.trim,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
    footAuraRemote: new THREE.MeshBasicMaterial({
      color: config.trim,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
    celebrateAura: new THREE.MeshBasicMaterial({
      color: config.trim,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
    scale: config.scale,
  };
}

export const AVATAR_MATERIALS: Readonly<Record<AvatarArchetype, AvatarMaterialSet>> = {
  seeker: createArchetypeMaterials({
    cloak: '#141e46',
    inner: '#0b1028',
    trim: '#ffd89b',
    accent: '#8fd3ff',
    hair: '#1a2240',
    skin: '#e8d7ce',
    scale: 1.0,
  }),
  chronicler: createArchetypeMaterials({
    cloak: '#26184c',
    inner: '#120d29',
    trim: '#ffb6d5',
    accent: '#d8b4fe',
    hair: '#241a3e',
    skin: '#f0dfd6',
    scale: 0.93,
  }),
};

export const PROP_MATERIALS = {
  brass: new THREE.MeshBasicMaterial({ color: '#c99b5b', fog: true }),
  lens: new THREE.MeshBasicMaterial({ color: '#9ee7ff', toneMapped: false, fog: false }),
  bookPages: new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false, fog: false }),
  bookSpine: new THREE.MeshBasicMaterial({ color: '#ff9ec4', toneMapped: false, fog: false }),
  bookMote: new THREE.MeshBasicMaterial({ color: '#ffd89b', toneMapped: false, fog: false }),
} as const;
