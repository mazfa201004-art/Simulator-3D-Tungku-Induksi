import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

/**
 * HandheldFireExtinguisher: First-Person 3D Viewmodel for APAR (Dry Chemical Powder 6kg).
 * Carried in operator hands when isAparHeld is true.
 * Emits dynamic high-pressure powder fog plume from nozzle horn when isAparSpraying is active.
 * Hold Left-Click anywhere in 3D to spray extinguisher!
 */
export const HandheldFireExtinguisher: React.FC = () => {
  const isAparHeld = useSimStore((s) => s.isAparHeld);
  const isAparSpraying = useSimStore((s) => s.isAparSpraying);
  const setIsAparSpraying = useSimStore((s) => s.setIsAparSpraying);
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const sprayGroupRef = useRef<THREE.Group>(null);

  // Left-Click spray listener (diegetic, no on-screen button needed)
  useEffect(() => {
    if (!isAparHeld) return;

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button') || target?.closest('input') || target?.closest('a')) return;

      setIsAparSpraying(true);
      inductionAudio.startSpray();
    };

    const handlePointerUp = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        setIsAparSpraying(false);
        inductionAudio.stopSpray();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsAparSpraying(false);
      inductionAudio.stopSpray();
    };
  }, [isAparHeld, setIsAparSpraying]);

  useFrame((_, delta) => {
    if (!groupRef.current || !isAparHeld) return;

    // Viewmodel offset relative to camera
    const localOffset = new THREE.Vector3(0.18, -0.16, -0.42);
    const worldPos = camera.position.clone().add(localOffset.applyQuaternion(camera.quaternion));

    // Slight tilt facing forward into the scene
    const heldEuler = new THREE.Euler(0.12, Math.PI - 0.15, 0.05, 'YXZ');
    const heldQuat = new THREE.Quaternion().setFromEuler(heldEuler);
    const worldQuat = camera.quaternion.clone().multiply(heldQuat);

    groupRef.current.position.lerp(worldPos, Math.min(1, delta * 30));
    groupRef.current.quaternion.slerp(worldQuat, Math.min(1, delta * 30));

    // Animate turbulent spray particle puffs
    if (sprayGroupRef.current) {
      sprayGroupRef.current.visible = isAparSpraying;
      if (isAparSpraying) {
        sprayGroupRef.current.children.forEach((child, i) => {
          child.scale.x = 1.0 + Math.sin(Date.now() * 0.04 + i) * 0.35;
          child.scale.y = 1.0 + Math.cos(Date.now() * 0.03 + i) * 0.35;
        });
      }
    }
  });

  if (!isAparHeld) return null;

  const safetyRed = '#dc2626';
  const valveBrass = '#ca8a04';
  const blackRubber = '#0f172a';

  return (
    <group ref={groupRef} name="Handheld_APAR_Viewmodel">
      {/* 1. Main Steel Cylinder Tank */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.38, 20]} />
        <meshStandardMaterial color={safetyRed} metalness={0.25} roughness={0.35} />
      </mesh>
      {/* Top Cap */}
      <mesh position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.075, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={safetyRed} metalness={0.25} roughness={0.35} />
      </mesh>
      {/* Bottom Protective Base */}
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.080, 0.082, 0.04, 20]} />
        <meshStandardMaterial color="#090d16" roughness={0.8} />
      </mesh>

      {/* 2. Forged Brass Operating Valve & Neck */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.022, 0.030, 0.05, 12]} />
        <meshStandardMaterial color={valveBrass} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Squeeze Operating Lever & Carry Handle */}
      <mesh position={[0, 0.22, -0.02]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.018, 0.07, 0.014]} />
        <meshStandardMaterial color={blackRubber} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.24, -0.01]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.012]} />
        <meshStandardMaterial color={safetyRed} metalness={0.7} />
      </mesh>

      {/* Pressure Gauge */}
      <group position={[0, 0.19, 0.03]} rotation={[0.3, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.007, 12]} />
          <meshStandardMaterial color={valveBrass} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.004]}>
          <circleGeometry args={[0.011, 12]} />
          <meshBasicMaterial color="#15803d" />
        </mesh>
      </group>

      {/* 3. High-Pressure Discharge Hose & Aimed Trumpet Nozzle Horn */}
      {/* Curved Flexible Hose */}
      <mesh position={[-0.05, 0.17, 0.05]} rotation={[0.8, 0.4, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.16, 10]} />
        <meshStandardMaterial color={blackRubber} roughness={0.7} />
      </mesh>

      {/* Forward-Aimed Discharge Nozzle Horn (Points +Z into scene) */}
      <group position={[-0.07, 0.18, 0.16]} rotation={[0.1, 0.05, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.024, 0.09, 14]} />
          <meshStandardMaterial color={blackRubber} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, -0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.010, 0.010, 0.03, 10]} />
          <meshStandardMaterial color={valveBrass} metalness={0.85} />
        </mesh>

        {/* 4. Dense Dynamic Powder Plume Shoots Forward (+Z) */}
        <group ref={sprayGroupRef} position={[0, 0, 0.06]} visible={false}>
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <mesh key={`powder-puff-${step}`} position={[0, (Math.random() - 0.5) * 0.04, step * 0.35]}>
              <sphereGeometry args={[0.08 * step, 10, 10]} />
              <meshStandardMaterial
                color="#f8fafc"
                transparent
                opacity={Math.max(0.08, 0.55 - step * 0.08)}
                depthWrite={false}
                roughness={1.0}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};
