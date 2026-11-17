import { CONSTELLATIONS } from '../data/constellations';
import { STAR_CONTENTS } from '../data/starContents';
import { INTERACTIVE_STARS } from '../data/starsCatalog';
import type {
  CollectionStatus,
  Constellation,
  ConstellationId,
  ContentId,
  DerivedStarView,
  InteractiveStar,
  StarContent,
  StarId,
} from '../types/star';

export interface StarRepository {
  hasStar: (starId: StarId) => boolean;
  getStar: (starId: StarId) => InteractiveStar | undefined;
  getStarById: (starId: StarId) => InteractiveStar | undefined;
  getContentById: (contentId: ContentId) => StarContent | undefined;
  getContentForStar: (starId: StarId) => StarContent | undefined;
  getConstellationById: (constellationId: ConstellationId) => Constellation | undefined;
  getAllInteractiveStars: () => readonly InteractiveStar[];
  getConstellations: () => readonly Constellation[];
  getAllConstellations: () => readonly Constellation[];
  getTotalInteractiveStars: () => number;
  sanitizeStarIds: (rawIds: unknown) => StarId[];
  deriveCollectionStatus: (
    starId: StarId,
    collectedSet: ReadonlySet<StarId>,
    inFlightStarId: StarId | null
  ) => CollectionStatus;
  getDerivedStarView: (
    starId: StarId,
    collectedSet: ReadonlySet<StarId>,
    dedicatedSet: ReadonlySet<StarId>,
    inFlightStarId: StarId | null
  ) => DerivedStarView | undefined;
  getAllDerivedStarViews: (
    collectedSet: ReadonlySet<StarId>,
    dedicatedSet: ReadonlySet<StarId>,
    inFlightStarId: StarId | null
  ) => readonly DerivedStarView[];
}

function cloneAndFreezeStar(star: InteractiveStar): InteractiveStar {
  return Object.freeze({
    ...star,
    position: Object.freeze([
      star.position[0],
      star.position[1],
      star.position[2],
    ] as const),
  });
}

function cloneAndFreezeContent(content: StarContent): StarContent {
  return Object.freeze({ ...content });
}

function cloneAndFreezeConstellation(constellation: Constellation): Constellation {
  const frozenConnections = Object.freeze(
    constellation.connections.map(([starA, starB]) =>
      Object.freeze([starA, starB] as const)
    )
  );
  return Object.freeze({
    ...constellation,
    connections: frozenConnections,
  });
}

/**
 * Builds an immutable O(1) Map-indexed repository from decoupled star/content/constellation datasets.
 * Enforces TD-09 referential invariants at initialization regardless of array ordering.
 */
export function createStarRepository(
  starsInput: readonly InteractiveStar[],
  contentsInput: readonly StarContent[],
  constellationsInput: readonly Constellation[]
): StarRepository {
  const contentsById = new Map<ContentId, StarContent>();
  for (const rawContent of contentsInput) {
    const content = cloneAndFreezeContent(rawContent);
    if (contentsById.has(content.id)) {
      throw new Error(`Duplicate StarContent id detected: "${content.id}"`);
    }
    contentsById.set(content.id, content);
  }

  const constellationsById = new Map<ConstellationId, Constellation>();
  const frozenConstellationsList: Constellation[] = [];
  for (const rawConstellation of constellationsInput) {
    const constellation = cloneAndFreezeConstellation(rawConstellation);
    if (constellationsById.has(constellation.id)) {
      throw new Error(
        `Duplicate Constellation id detected: "${constellation.id}"`
      );
    }
    constellationsById.set(constellation.id, constellation);
    frozenConstellationsList.push(constellation);
  }

  const starsById = new Map<StarId, InteractiveStar>();
  const frozenStarsList: InteractiveStar[] = [];
  for (const rawStar of starsInput) {
    const star = cloneAndFreezeStar(rawStar);
    if (starsById.has(star.id)) {
      throw new Error(`Duplicate InteractiveStar id detected: "${star.id}"`);
    }
    if (!contentsById.has(star.contentId)) {
      throw new Error(
        `InteractiveStar "${star.id}" references missing StarContent "${star.contentId}"`
      );
    }
    if (
      star.constellationId !== undefined &&
      !constellationsById.has(star.constellationId)
    ) {
      throw new Error(
        `InteractiveStar "${star.id}" references missing Constellation "${star.constellationId}"`
      );
    }
    starsById.set(star.id, star);
    frozenStarsList.push(star);
  }

  for (const constellation of frozenConstellationsList) {
    for (const [starA, starB] of constellation.connections) {
      if (!starsById.has(starA) || !starsById.has(starB)) {
        throw new Error(
          `Constellation "${constellation.id}" has connection ["${starA}", "${starB}"] referencing unknown starId`
        );
      }
    }
  }

  const frozenStars: readonly InteractiveStar[] = Object.freeze(frozenStarsList);
  const frozenConstellations: readonly Constellation[] = Object.freeze(
    frozenConstellationsList
  );

  const hasStar = (starId: StarId): boolean => starsById.has(starId);

  const getStarById = (starId: StarId): InteractiveStar | undefined =>
    starsById.get(starId);

  const getContentById = (contentId: ContentId): StarContent | undefined =>
    contentsById.get(contentId);

  const getContentForStar = (starId: StarId): StarContent | undefined => {
    const star = starsById.get(starId);
    if (!star) {
      return undefined;
    }
    return contentsById.get(star.contentId);
  };

  const getConstellationById = (
    constellationId: ConstellationId
  ): Constellation | undefined => constellationsById.get(constellationId);

  const getAllInteractiveStars = (): readonly InteractiveStar[] => frozenStars;

  const getAllConstellations = (): readonly Constellation[] =>
    frozenConstellations;

  const getTotalInteractiveStars = (): number => starsById.size;

  /**
   * Sanitizes persisted StarId arrays for Zustand rehydration (TD-08 / TD-09):
   * validates array shape, removes unknown/orphan IDs via hasStar(), and deduplicates.
   */
  const sanitizeStarIds = (rawIds: unknown): StarId[] => {
    if (!Array.isArray(rawIds)) {
      return [];
    }
    const seen = new Set<StarId>();
    const sanitized: StarId[] = [];
    for (const entry of rawIds) {
      if (typeof entry !== 'string') {
        continue;
      }
      if (!starsById.has(entry) || seen.has(entry)) {
        continue;
      }
      seen.add(entry);
      sanitized.push(entry);
    }
    return sanitized;
  };

  const deriveCollectionStatus = (
    starId: StarId,
    collectedSet: ReadonlySet<StarId>,
    inFlightStarId: StarId | null
  ): CollectionStatus => {
    if (inFlightStarId === starId) {
      return 'collecting';
    }
    if (collectedSet.has(starId)) {
      return 'collected';
    }
    return 'available';
  };

  const getDerivedStarView = (
    starId: StarId,
    collectedSet: ReadonlySet<StarId>,
    dedicatedSet: ReadonlySet<StarId>,
    inFlightStarId: StarId | null
  ): DerivedStarView | undefined => {
    const star = starsById.get(starId);
    if (!star) {
      return undefined;
    }
    const content = contentsById.get(star.contentId);
    if (!content) {
      return undefined;
    }
    return {
      star,
      content,
      status: deriveCollectionStatus(starId, collectedSet, inFlightStarId),
      isDedicated: dedicatedSet.has(starId),
    };
  };

  const getAllDerivedStarViews = (
    collectedSet: ReadonlySet<StarId>,
    dedicatedSet: ReadonlySet<StarId>,
    inFlightStarId: StarId | null
  ): readonly DerivedStarView[] => {
    const views: DerivedStarView[] = [];
    for (const star of frozenStars) {
      const content = contentsById.get(star.contentId);
      if (!content) {
        continue;
      }
      views.push({
        star,
        content,
        status: deriveCollectionStatus(star.id, collectedSet, inFlightStarId),
        isDedicated: dedicatedSet.has(star.id),
      });
    }
    return views;
  };

  return Object.freeze({
    hasStar,
    getStar: getStarById,
    getStarById,
    getContentById,
    getContentForStar,
    getConstellationById,
    getAllInteractiveStars,
    getConstellations: getAllConstellations,
    getAllConstellations,
    getTotalInteractiveStars,
    sanitizeStarIds,
    deriveCollectionStatus,
    getDerivedStarView,
    getAllDerivedStarViews,
  });
}

export const starRepository: StarRepository = createStarRepository(
  INTERACTIVE_STARS,
  STAR_CONTENTS,
  CONSTELLATIONS
);
