import { useMemo } from 'react';
import { starRepository } from '../repositories/starRepository';
import { useSkyStore } from '../store/useSkyStore';
import type { DerivedStarView, StarId } from '../types/star';

export function useDerivedStarLists() {
  const collectedStarIds = useSkyStore((state) => state.collectedStarIds);
  const dedicatedStarIds = useSkyStore((state) => state.dedicatedStarIds);
  const inFlightStarId = useSkyStore((state) => state.inFlightStarId);

  // Runtime O(1) sets (TD-08: string[] in store, memoized Set for read performance)
  const collectedSet = useMemo(
    () => new Set<StarId>(collectedStarIds),
    [collectedStarIds]
  );

  const dedicatedSet = useMemo(
    () => new Set<StarId>(dedicatedStarIds),
    [dedicatedStarIds]
  );

  const allViews = useMemo<readonly DerivedStarView[]>(
    () =>
      starRepository.getAllDerivedStarViews(
        collectedSet,
        dedicatedSet,
        inFlightStarId
      ),
    [collectedSet, dedicatedSet, inFlightStarId]
  );

  const collectedViews = useMemo(
    () => allViews.filter((view) => view.status === 'collected'),
    [allViews]
  );

  const dedicatedViews = useMemo(
    () => allViews.filter((view) => view.isDedicated),
    [allViews]
  );

  // Visual counter: hold count while a star is currently in flight toward the jar
  const visualCollectedCount = useMemo(() => {
    if (inFlightStarId !== null) {
      return Math.max(0, collectedStarIds.length - 1);
    }
    return collectedStarIds.length;
  }, [collectedStarIds.length, inFlightStarId]);

  return {
    collectedSet,
    dedicatedSet,
    allViews,
    collectedViews,
    dedicatedViews,
    visualCollectedCount,
    totalStars: starRepository.getTotalInteractiveStars(),
  };
}
