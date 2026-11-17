export type StarId = string;
export type ContentId = string;
export type ConstellationId = string;

/** Immutable 3D coordinate tuple for celestial positioning. */
export type StarPosition = readonly [number, number, number];

export type StarCategory = 'message' | 'memory' | 'promise' | 'gallery';

export type CollectionStatus = 'available' | 'collecting' | 'collected';

/**
 * Decoupled narrative memory payload linked by ContentId (TD-09).
 * Reordering stars or contents will never alter this association.
 */
export interface StarContent {
  readonly id: ContentId;
  readonly title: string;
  readonly category: StarCategory;
  readonly dateLabel?: string;
  readonly message: string;
  readonly memoryStory?: string;
  readonly promise?: string;
  readonly imageUrl?: string;
  readonly imageCaption?: string;
}

/**
 * Interactive star entity on the 3D sky dome (TD-09).
 * Identified strictly by immutable string `id` (never by array index).
 */
export interface InteractiveStar {
  readonly id: StarId;
  readonly contentId: ContentId;
  readonly constellationId?: ConstellationId;
  readonly position: StarPosition;
  readonly magnitude: number;
  readonly colorHex: string;
}

export interface Constellation {
  readonly id: ConstellationId;
  readonly name: string;
  readonly subtitle?: string;
  readonly colorHex: string;
  /** Pairs of stable StarIds defining constellation line segments. */
  readonly connections: ReadonlyArray<readonly [StarId, StarId]>;
}

/**
 * Runtime view composed from static star/content data and store-derived status.
 */
export interface DerivedStarView {
  readonly star: InteractiveStar;
  readonly content: StarContent;
  readonly status: CollectionStatus;
  readonly isDedicated: boolean;
}

