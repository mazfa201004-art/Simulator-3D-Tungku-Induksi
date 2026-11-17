import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * Handheld Viewmodel for Coagulant Shovel & Deslagging Skimmer.
 * Follows the operator camera in First-Person POV mode when heldTool is 'shovel' or 'skimmer'.
 * Directly animates the held tool during powder throwing and slag skimming (no ghost tools).
 */
export const HandheldSkimmerAndShovel: React.FC = () => {
  const heldTool = useSimStore((s) => s.heldTool);
  const setHeldTool = useSimStore((s) => s.setHeldTool);
  const isShovelFilled = useSimStore((s) => s.isShovelFilled);
  const coagulantDoseKg = useSimStore((s) => s.coagulantDoseKg);
  const throwCoagulantFromShovel = useSimStore((s) => s.throwCoagulantFromShovel);
  const skimSlagWithRake = useSimStore((s) => s.skimSlagWithRake);
  const isSlagSequenceActive = useSimStore((s) => s.isSlagSequenceActive);
  const slagSequenceStep = useSimStore((s) => s.slagSequenceStep);

  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [isDumping, setIsDumping] = useState(false);
  const dumpTimerRef = useRef(0);

  // Trigger viewmodel motion automatically whenever store enters 'powder' or 'skimming'
  useEffect(() => {
    if (
      (heldTool === 'shovel' && slagSequenceStep === 'powder') ||
      (heldTool === 'skimmer' && slagSequenceStep === 'skimming')
    ) {
      setIsDumping(true);
      dumpTimerRef.current = 0;
    }
  }, [heldTool, slagSequenceStep]);

  // White granular powder particles emitted directly from the held Kamal KML shovel blade
  const scoopParticlesPos = useMemo(() => {
    const count = 32;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.16;
      arr[i * 3 + 1] = -Math.random() * 0.28;
      arr[i * 3 + 2] = 0.04 + Math.random() * 0.24;
    }
    return arr;
  }, []);

  // Global keydown: ESC to drop tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (heldTool === 'shovel' || heldTool === 'skimmer')) {
        inductionAudio.resume();
        inductionAudio.playClick();
        setHeldTool('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [heldTool, setHeldTool]);

  useFrame((_, delta) => {
    if (!groupRef.current || (heldTool !== 'shovel' && heldTool !== 'skimmer')) return;

    if (isDumping) {
      dumpTimerRef.current += delta;
      if (dumpTimerRef.current >= 1.25) {
        setIsDumping(false);
        dumpTimerRef.current = 0;
      }
    }

    const activeProgress = isDumping ? Math.min(1.0, dumpTimerRef.current / 1.2) : 0;
    const swingWave = Math.sin(activeProgress * Math.PI);

    if (heldTool === 'shovel') {
      // Shovel reaches forward over crucible mouth, tilts forward & rolls wrist to scatter powder
      const localOffset = new THREE.Vector3(
        0.18 - swingWave * 0.16,
        -0.12 - swingWave * 0.08,
        -0.45 - swingWave * 0.34
      );
      const targetPos = camera.position.clone().add(localOffset.applyQuaternion(camera.quaternion));

      const pitch = 0.25 + swingWave * 0.85;
      const yaw = Math.PI - 0.05 + swingWave * 0.15;
      const roll = 0.02 + swingWave * 0.65;
      const targetQuat = camera.quaternion
        .clone()
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')));

      groupRef.current.position.lerp(targetPos, Math.min(1, delta * 25));
      groupRef.current.quaternion.slerp(targetQuat, Math.min(1, delta * 25));
    } else {
      // Skimmer rake reaches into molten pool and sweeps laterally from left-center toward right Slag Pot
      const sweepLateral = activeProgress > 0 ? THREE.MathUtils.lerp(-0.18, 0.28, activeProgress) : 0.18;
      const localOffset = new THREE.Vector3(
        sweepLateral,
        -0.12 - swingWave * 0.12,
        -0.45 - swingWave * 0.38
      );
      const targetPos = camera.position.clone().add(localOffset.applyQuaternion(camera.quaternion));

      const pitch = 0.28 + swingWave * 0.45;
      const yaw = Math.PI - 0.05 - (activeProgress > 0 ? (activeProgress - 0.5) * 0.65 : 0);
      const roll = 0.02 + swingWave * 0.22;
      const targetQuat = camera.quaternion
        .clone()
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')));

      groupRef.current.position.lerp(targetPos, Math.min(1, delta * 25));
      groupRef.current.quaternion.slerp(targetQuat, Math.min(1, delta * 25));
    }
  });

  if (heldTool !== 'shovel' && heldTool !== 'skimmer') return null;

  return (
    <group ref={groupRef} name="Handheld_Foundry_Tool_Viewmodel">
      {/* ===================================================================== */}
      {/* 1. SHOVEL VIEWMODEL (When heldTool === 'shovel')                       */}
      {/* ===================================================================== */}
      {heldTool === 'shovel' && (
        <group
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDumping && isShovelFilled) {
              setIsDumping(true);
              dumpTimerRef.current = 0;
              throwCoagulantFromShovel();
            }
          }}
        >
          {/* 1. D-Handle Grip at Top (Near Hand) */}
          <group position={[0, 0.50, 0]}>
            {/* Horizontal Handgrip Bar */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.013, 0.013, 0.12, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            {/* Left Angled Side Arm */}
            <mesh position={[-0.045, -0.045, 0]} rotation={[0, 0, -Math.PI / 8]}>
              <cylinderGeometry args={[0.010, 0.010, 0.09, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            {/* Right Angled Side Arm */}
            <mesh position={[0.045, -0.045, 0]} rotation={[0, 0, Math.PI / 8]}>
              <cylinderGeometry args={[0.010, 0.010, 0.09, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>
            {/* D-Handle Neck Socket */}
            <mesh position={[0, -0.09, 0]}>
              <cylinderGeometry args={[0.017, 0.015, 0.04, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>

          {/* 2. Round Wooden Shaft (Tangkai Kayu Kamal KML) */}
          <mesh position={[0, 0.10, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.62, 12]} />
            <meshStandardMaterial color="#b4793b" roughness={0.7} metalness={0.05} />
          </mesh>

          {/* 3. KAMAL KML Brand Sticker Label on Wooden Shaft */}
          <group position={[0, 0.22, 0]}>
            <mesh position={[0, 0, 0.015]}>
              <boxGeometry args={[0.034, 0.08, 0.003]} />
              <meshStandardMaterial color="#facc15" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.017]}>
              <boxGeometry args={[0.028, 0.04, 0.002]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
            <Text
              position={[0, 0.012, 0.02]}
              fontSize={0.011}
              color="#ffffff"
              anchorX="center"
              fontWeight="bold"
            >
              KAMAL
            </Text>
            <Text
              position={[0, -0.008, 0.02]}
              fontSize={0.009}
              color="#facc15"
              anchorX="center"
              fontWeight="bold"
            >
              KML
            </Text>
          </group>

          {/* 4. Steel Ferrule / Socket Collar (Sambungan Baja Hitam) */}
          <mesh position={[0, -0.22, 0.01]} rotation={[Math.PI / 18, 0, 0]}>
            <cylinderGeometry args={[0.017, 0.022, 0.12, 12]} />
            <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* 5. Square-Nosed Pressed Steel Shovel Scoop Blade */}
          <group position={[0, -0.38, 0.03]} rotation={[Math.PI / 16, 0, 0]}>
            {/* Flat Base Blade */}
            <mesh position={[0, -0.08, 0]}>
              <boxGeometry args={[0.18, 0.006, 0.22]} />
              <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
            </mesh>

            {/* Left Flanged Up-Turned Lip */}
            <mesh position={[-0.092, -0.065, 0]} rotation={[0, 0, Math.PI / 12]}>
              <boxGeometry args={[0.006, 0.035, 0.22]} />
              <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
            </mesh>

            {/* Right Flanged Up-Turned Lip */}
            <mesh position={[0.092, -0.065, 0]} rotation={[0, 0, -Math.PI / 12]}>
              <boxGeometry args={[0.006, 0.035, 0.22]} />
              <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
            </mesh>

            {/* Rear Lip Wall */}
            <mesh position={[0, -0.065, -0.108]}>
              <boxGeometry args={[0.18, 0.035, 0.006]} />
              <meshStandardMaterial color="#1e242d" metalness={0.85} roughness={0.35} />
            </mesh>

            {/* Center Stamped Strengthening Spine */}
            <mesh position={[0, -0.075, 0]}>
              <cylinderGeometry args={[0.008, 0.005, 0.18, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
            </mesh>

            {/* White Granular Drosan Powder (When Filled or Scattering) */}
            {(isShovelFilled || isDumping || slagSequenceStep === 'powder') && (
              <mesh position={[0, -0.065, 0.01]} scale={[1, isDumping ? 0.45 : 1, 1]}>
                <boxGeometry args={[0.15, 0.02, 0.18]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.95} />
              </mesh>
            )}

            {/* Scattering White Powder Stream Directly from Held Shovel Scoop */}
            {(isDumping || slagSequenceStep === 'powder') && (
              <points position={[0, -0.09, 0.06]}>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[scoopParticlesPos, 3]} />
                </bufferGeometry>
                <pointsMaterial color="#ffffff" size={0.016} transparent opacity={0.92} />
              </points>
            )}
          </group>

          {/* Label Display */}
          <Text
            position={[0, 0.05, 0.03]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.022}
            color={isShovelFilled ? '#facc15' : '#94a3b8'}
            anchorX="center"
            fontWeight="bold"
          >
            {isShovelFilled ? `${coagulantDoseKg.toFixed(1)} KG DROSAN` : 'SKOP KOSONG (KLIK EMBER)'}
          </Text>
        </group>
      )}

      {/* ===================================================================== */}
      {/* 2. SKIMMER RAKE VIEWMODEL (When heldTool === 'skimmer')                */}
      {/* ===================================================================== */}
      {heldTool === 'skimmer' && (
        <group
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSlagSequenceActive) {
              setIsDumping(true);
              dumpTimerRef.current = 0;
              skimSlagWithRake();
            }
          }}
        >
          {/* Heavy Steel Shaft */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 1.3, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>

          {/* Scraping Rake Blade */}
          <mesh position={[0, -0.20, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.22, 0.05, 0.015]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.4} />
          </mesh>

          {/* Glowing Slag Clinker Adhering to Held Rake Blade During Skimming */}
          {(isDumping || slagSequenceStep === 'skimming') && (
            <mesh position={[0, -0.21, 0.03]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial
                color="#27272a"
                roughness={0.95}
                emissive="#ea580c"
                emissiveIntensity={0.85}
              />
            </mesh>
          )}

          <Text
            position={[0, 0.05, 0.03]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.022}
            color="#4ade80"
            anchorX="center"
            fontWeight="bold"
          >
            SEROKAN TERAK
          </Text>
        </group>
      )}
    </group>
  );
};
