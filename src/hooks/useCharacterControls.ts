import { useEffect } from 'react';
import { triggerMeteorShower } from '../components/sky/ShootingStarsLayer';
import {
  characterRuntime,
  syncCombinedMoveInput,
} from '../services/characterRuntime';
import type { SocialEmote } from '../shared/protocol';
import { useSkyStore } from '../store/useSkyStore';
import { useZodiacStore } from '../store/useZodiacStore';
import type { NearbyInteractable } from '../types/world';

let emoteResetTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerSocialEmote(emote: SocialEmote): void {
  const sky = useSkyStore.getState();

  if (emoteResetTimer) {
    clearTimeout(emoteResetTimer);
    emoteResetTimer = null;
  }

  if (emote === 'sit') {
    const nextPose = sky.characterPose === 'sit' ? 'idle' : 'sit';
    sky.setCharacterPose(nextPose);
    return;
  }

  sky.setCharacterPose(emote);
  emoteResetTimer = setTimeout(() => {
    const current = useSkyStore.getState().characterPose;
    if (current === emote) {
      useSkyStore.getState().setCharacterPose('idle');
    }
  }, 2600);
}

export function executeInteractableAction(item: NearbyInteractable): void {
  const sky = useSkyStore.getState();

  switch (item.actionType) {
    case 'sit-lakeside': {
      const nextPose = sky.characterPose === 'sit' ? 'idle' : 'sit';
      sky.setCharacterPose(nextPose);
      sky.setWorldToast(
        nextPose === 'sit'
          ? 'Hai người ngồi xuống bên bến đá lặng ngắm bầu trời soi đáy hồ...'
          : 'Hai người đứng dậy, sẵn sàng tiếp tục khám phá.'
      );
      setTimeout(() => useSkyStore.getState().setWorldToast(null), 3200);
      break;
    }
    case 'open-zodiac-atlas': {
      useZodiacStore.getState().setAtlasOpen(true);
      break;
    }
    case 'open-memory-jar': {
      sky.setActiveModal({ type: 'jar' });
      break;
    }
    case 'trigger-meteor': {
      triggerMeteorShower(10, 'distant-horizon');
      break;
    }
  }
}

/**
 * Keyboard controller for V2.2 character locomotion:
 *   - WASD / Arrow Keys: Camera-relative character movement
 *   - Tab: Switch controlled character (Seeker <-> Chronicler)
 *   - E: Contextual world interaction when standing near a landmark
 */
export function useCharacterControls(): void {
  useEffect(() => {
    const pressed = new Set<string>();

    const updateKeyVector = () => {
      let x = 0;
      let y = 0;
      if (pressed.has('KeyW') || pressed.has('ArrowUp')) y += 1;
      if (pressed.has('KeyS') || pressed.has('ArrowDown')) y -= 1;
      if (pressed.has('KeyD') || pressed.has('ArrowRight')) x += 1;
      if (pressed.has('KeyA') || pressed.has('ArrowLeft')) x -= 1;

      characterRuntime.keyInput.x = x;
      characterRuntime.keyInput.y = y;
      syncCombinedMoveInput();
    };

    const isUiBlockingMovement = (target: EventTarget | null): boolean => {
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          return true;
        }
      }
      const sky = useSkyStore.getState();
      const zodiac = useZodiacStore.getState();
      return (
        sky.activeModal.type !== 'none' ||
        zodiac.isAtlasOpen ||
        zodiac.selectedZodiacId !== null
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUiBlockingMovement(e.target)) {
        return;
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        useSkyStore.getState().switchControlledRole();
        setTimeout(() => useSkyStore.getState().setWorldToast(null), 2800);
        return;
      }

      if (e.code === 'KeyE' && !e.repeat) {
        const nearby = useSkyStore.getState().nearbyInteractable;
        if (nearby) {
          e.preventDefault();
          executeInteractableAction(nearby);
        }
        return;
      }

      // Quick social emotes (MVP Phase 1.5 -> synced in Phase 3)
      if (!e.repeat && e.code === 'Digit1') {
        triggerSocialEmote('wave');
        return;
      }
      if (!e.repeat && e.code === 'Digit2') {
        triggerSocialEmote('point');
        return;
      }
      if (!e.repeat && e.code === 'Digit3') {
        triggerSocialEmote('sit');
        return;
      }

      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        pressed.add(e.code);
        updateKeyVector();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (pressed.delete(e.code)) {
        updateKeyVector();
      }
    };

    const handleWindowBlur = () => {
      pressed.clear();
      characterRuntime.keyInput.x = 0;
      characterRuntime.keyInput.y = 0;
      syncCombinedMoveInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      handleWindowBlur();
    };
  }, []);
}
