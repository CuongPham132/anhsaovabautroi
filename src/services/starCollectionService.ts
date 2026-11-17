import { useSkyStore } from '../store/useSkyStore';
import type { StarId } from '../types/star';

export const FLIGHT_DURATION_MS = 1100;
export const WATCHDOG_TIMEOUT_MS = 1500;

class StarCollectionService {
  private activeWatchdogs = new Map<StarId, ReturnType<typeof setTimeout>>();

  public requestCollectStar(starId: StarId): boolean {
    const state = useSkyStore.getState();

    // Guard duplicate ID and in-flight lock (TD-08, TD-10)
    if (state.collectedStarIds.includes(starId) || state.inFlightStarId !== null) {
      return false;
    }

    // 1. Early-durable commit: persists immediately to localStorage
    state.commitCollectAndStartFlight(starId);

    // 2. Setup Watchdog fallback timer (1500ms) to prevent infinite UI lock
    this.scheduleWatchdog(starId);

    return true;
  }

  public finalizeCollectionVisual(starId: StarId): void {
    this.clearWatchdog(starId);
    useSkyStore.getState().releaseFlightAndPulseJar(starId);
  }

  public handleInterruption(): void {
    const currentInFlight = useSkyStore.getState().inFlightStarId;
    if (currentInFlight) {
      this.finalizeCollectionVisual(currentInFlight);
    }
  }

  private scheduleWatchdog(starId: StarId): void {
    this.clearWatchdog(starId);
    const timer = setTimeout(() => {
      this.activeWatchdogs.delete(starId);
      const inFlight = useSkyStore.getState().inFlightStarId;
      if (inFlight === starId) {
        useSkyStore.getState().releaseFlightAndPulseJar(starId);
      }
    }, WATCHDOG_TIMEOUT_MS);

    this.activeWatchdogs.set(starId, timer);
  }

  private clearWatchdog(starId: StarId): void {
    const timer = this.activeWatchdogs.get(starId);
    if (timer) {
      clearTimeout(timer);
      this.activeWatchdogs.delete(starId);
    }
  }

  public cleanupAll(): void {
    for (const timer of this.activeWatchdogs.values()) {
      clearTimeout(timer);
    }
    this.activeWatchdogs.clear();
  }
}

export const starCollectionService = new StarCollectionService();
