import React from 'react';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

interface EffectsProps {
  enableBloom?: boolean;
}

export const Effects: React.FC<EffectsProps> = ({ enableBloom = true }) => {
  if (!enableBloom) {
    return null;
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.88}
        luminanceSmoothing={0.30}
        intensity={0.36}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};
