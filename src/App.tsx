import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MainScene } from './scene/MainScene';
import { CanvasLoader } from './scene/CanvasLoader';
import { SimulationHUD } from './scene/hud/SimulationHUD';
import { LauncherScreen } from './scene/hud/LauncherScreen';
import { TutorialGuideModal } from './scene/hud/TutorialGuideModal';
import { AboutUsModal } from './scene/hud/AboutUsModal';
import { inductionAudio } from './scene/fx/InductionAudio';
import { useSimStore } from './store/useSimStore';

if (typeof window !== 'undefined') {
  (window as any).useSimStore = useSimStore;
}

export const App: React.FC = () => {
  const isAppLaunched = useSimStore((s) => s.isAppLaunched);
  const performanceProfile = useSimStore((s) => s.performanceProfile);
  const isLite = performanceProfile === 'lite';

  // Responsive device & orientation detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resume Web Audio upon first canvas interaction
  const handleCanvasInteraction = useCallback(() => {
    inductionAudio.resume();
  }, []);

  const bgColor = isLite ? '#0b0f19' : '#070b14';

  // Adaptive device pixel ratio:
  // On mobile devices, cap DPR to 0.75 - 0.85 to prevent GPU fillrate starvation on FHD+ screens
  const targetDpr = isMobile ? 0.8 : (isLite ? 1.0 : [1.0, 1.5] as [number, number]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh', // Modern dvh avoids mobile address bar clipping
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: bgColor,
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={handleCanvasInteraction}
    >
      <Canvas
        camera={{ position: [0.0, 1.68, 5.2], fov: 46 }}
        dpr={targetDpr}
        gl={{
          antialias: !isMobile && !isLite,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          alpha: false,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={[bgColor]} />

        <Suspense fallback={<CanvasLoader />}>
          <MainScene enableBloom={!isLite && !isMobile} />
        </Suspense>
      </Canvas>

      {/* Initial Welcome Overlay vs Active In-Simulation HUD */}
      {!isAppLaunched ? <LauncherScreen /> : <SimulationHUD />}

      {/* Illustrated Tutorial Popups & Developer Info Modal */}
      <TutorialGuideModal />
      <AboutUsModal />
    </div>
  );
};

export default App;
