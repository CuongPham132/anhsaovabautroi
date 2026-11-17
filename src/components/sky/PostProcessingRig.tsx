import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { getQualityProfile } from '../../data/qualityProfiles';
import { useSkyStore } from '../../store/useSkyStore';

export const PostProcessingRig: React.FC = () => {
  const qualityTier = useSkyStore((state) => state.qualityTier);
  const profile = getQualityProfile(qualityTier);

  // TD-05 & TD-11: Bypass postprocessing completely on low-tier devices
  if (!profile.enablePostProcessing) {
    return null;
  }

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.95}
        luminanceSmoothing={0.1}
        intensity={profile.enableBloom ? (qualityTier === 'high' ? 0.85 : 0.6) : 0}
      />
      <Vignette eskil={false} offset={0.35} darkness={0.42} />
    </EffectComposer>
  );
};
