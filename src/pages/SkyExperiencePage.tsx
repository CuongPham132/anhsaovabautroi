import React, { useState } from 'react';
import { SkyCanvas } from '../components/sky/SkyCanvas';
import { SkyHeader } from '../components/hud/SkyHeader';
import { StarContextMenu } from '../components/hud/StarContextMenu';
import { MemoryJarButton } from '../components/hud/MemoryJarButton';
import { ModalHost } from '../components/hud/ModalHost';
import { WebGLFallbackView } from '../components/hud/WebGLFallbackView';
import { MovementHud } from '../components/hud/MovementHud';
import { WorldSpotBar } from '../components/hud/WorldSpotBar';
import { ZodiacAtlasDrawer } from '../components/zodiac/ZodiacAtlasDrawer';
import { ZodiacDetailModal } from '../components/zodiac/ZodiacDetailModal';
import { useCollectionReliability } from '../hooks/useCollectionReliability';
import { isWebGLSupported } from '../services/devicePerfService';

export const SkyExperiencePage: React.FC = () => {
  const [webglFailed, setWebglFailed] = useState<boolean>(() => !isWebGLSupported());

  // TD-10: Reliability hook for visibilitychange & unmount cleanup
  useCollectionReliability();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        minHeight: '100svh',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        backgroundColor: '#030511',
      }}
    >
      {/* 3D World Canvas or 2D WebGL Fallback */}
      {webglFailed ? (
        <WebGLFallbackView />
      ) : (
        <SkyCanvas
          onWebGLFailure={() => setWebglFailed(true)}
          onWebGLRestore={() => setWebglFailed(false)}
        />
      )}

      {/* Presentation Layer HUD Overlays */}
      <SkyHeader />
      <StarContextMenu />
      {!webglFailed && <WorldSpotBar />}
      {!webglFailed && <MovementHud />}
      <MemoryJarButton />
      <ModalHost />
      <ZodiacAtlasDrawer />
      <ZodiacDetailModal />
    </div>
  );
};
