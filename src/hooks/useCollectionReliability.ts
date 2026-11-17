import { useEffect } from 'react';
import { starCollectionService } from '../services/starCollectionService';

/**
 * Handles visibilitychange and unmount cleanup to ensure in-flight locks
 * are never permanently trapped if the user switches tabs or navigates away (TD-10).
 */
export function useCollectionReliability() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        starCollectionService.handleInterruption();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      starCollectionService.cleanupAll();
    };
  }, []);
}
