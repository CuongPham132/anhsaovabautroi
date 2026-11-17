import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { getQualityProfile } from '../../data/qualityProfiles';
import { WORLD_SPOTS } from '../../data/worldSpots';
import { isMultiTouchGestureActive } from '../../services/touchGestureGuard';
import { useSkyStore } from '../../store/useSkyStore';
import { useZodiacStore } from '../../store/useZodiacStore';
import { CharacterPair } from '../characters/CharacterPair';
import { GroundHorizon } from '../ground/GroundHorizon';
import { SCENE_FOG_COLOR, SCENE_FOG_DENSITY } from '../ground/ReflectiveLake';
import { ZodiacSkyLayer } from '../zodiac/ZodiacSkyLayer';
import { CameraRig } from './CameraRig';
import { CelestialMoon } from './CelestialMoon';
import { DecorativeStarField } from './DecorativeStarField';
import { MilkyWayNebula } from './MilkyWayNebula';
import { ConstellationLayer } from './ConstellationLayer';
import { InteractiveStarField } from './InteractiveStarField';
import { CollectionFlightEffect } from './CollectionFlightEffect';
import { PostProcessingRig } from './PostProcessingRig';
import { ShootingStarsLayer } from './ShootingStarsLayer';

interface WebGLContextHandlerProps {
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

const WebGLContextHandler: React.FC<WebGLContextHandlerProps> = ({
  onContextLost,
  onContextRestored,
}) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('[SkyCanvas] WebGL context lost. Notifying host...');
      onContextLost?.();
    };

    const handleContextRestored = () => {
      console.info('[SkyCanvas] WebGL context restored.');
      onContextRestored?.();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
};

interface SkyCanvasProps {
  onWebGLFailure?: () => void;
  onWebGLRestore?: () => void;
}

// Initial scenic Third-Person Follow camera behind the opening hilltop characters
const OPENING_SPOT = WORLD_SPOTS.hilltop;
const INITIAL_CAMERA_POSITION: [number, number, number] = [
  OPENING_SPOT.seekerPlacement.position[0],
  OPENING_SPOT.seekerPlacement.position[1] + 2.4,
  OPENING_SPOT.seekerPlacement.position[2] + 6.2,
];

export const SkyCanvas: React.FC<SkyCanvasProps> = ({
  onWebGLFailure,
  onWebGLRestore,
}) => {
  const clearSelection = useSkyStore((state) => state.clearSelection);
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const setQualityTier = useSkyStore((state) => state.setQualityTier);
  const profile = getQualityProfile(qualityTier);

  const handlePerformanceDecline = () => {
    const current = useSkyStore.getState().qualityTier;
    if (current === 'high') {
      setQualityTier('medium');
    } else if (current === 'medium') {
      setQualityTier('low');
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#030511',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        camera={{
          position: INITIAL_CAMERA_POSITION,
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: qualityTier !== 'low',
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[profile.dprRange[0], profile.dprRange[1]]}
        onPointerMissed={(e) => {
          // Clear star & zodiac selection if clicking into empty cosmic space or horizon
          if (isMultiTouchGestureActive()) return;
          if (e.type === 'click' || e.type === 'contextmenu') {
            clearSelection();
            useZodiacStore.getState().guideToZodiac(null);
          }
        }}
      >
        <color attach="background" args={['#030511']} />
        {/* Exponential atmospheric fog for distant mountains & terrain (sky layers opt out via fog={false}) */}
        <fogExp2 attach="fog" args={[SCENE_FOG_COLOR, SCENE_FOG_DENSITY]} />

        <PerformanceMonitor onDecline={handlePerformanceDecline} />
        <AdaptiveDpr pixelated />
        <WebGLContextHandler
          onContextLost={onWebGLFailure}
          onContextRestored={onWebGLRestore}
        />

        {/* 3D Observer-Centered Planetarium Camera */}
        <CameraRig />

        {/* V1.1 Ground Horizon + V2.0 World Landmarks (Lake, Mountains, Observatory, Dock) */}
        <GroundHorizon />

        {/* V2.0 Stylized Character Pair (Star Seeker & Story Chronicler) */}
        <CharacterPair />

        {/* Background Celestial Dome + Procedural Luminous Moon + Shooting Stars */}
        <MilkyWayNebula />
        <DecorativeStarField />
        <CelestialMoon />
        <ShootingStarsLayer />

        {/* Separate V2.1 Layer: 12 Zodiac Constellations (independent from V1 Memory Stars) */}
        <ZodiacSkyLayer />

        {/* Personal Memory Universe (18 V1 Memory Stars & 4 Memory Constellations) */}
        <ConstellationLayer />
        <InteractiveStarField />

        {/* Dynamic Flight Animation Effect */}
        <CollectionFlightEffect />

        {/* Post-Processing Effects (Bloom & Vignette — disabled on low tier) */}
        <PostProcessingRig />
      </Canvas>
    </div>
  );
};
