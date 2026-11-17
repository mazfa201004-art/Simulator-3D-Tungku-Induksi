import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSimStore } from '../../store/useSimStore';
import { inductionAudio } from '../fx/InductionAudio';

interface Knob3DProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  onDragStateChange?: (isDragging: boolean) => void;
}

/**
 * Authentic 35mm Industrial Heavy-Duty Potentiometer Dial Knob.
 * Accurately scaled with graduated aluminum dial scale plate (0-100%).
 * Uses damped linear drag (160px full scale with 5% detent steps) so turning the knob is never slippery.
 */
export const Knob3D: React.FC<Knob3DProps> = ({
  position,
  rotation = [0, 0, 0],
  onDragStateChange,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const knobMeshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const powerSetpoint = useSimStore((s) => s.powerSetpoint);
  const setPowerSetpoint = useSimStore((s) => s.setPowerSetpoint);

  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startPower: number }>({
    x: 0,
    y: 0,
    startPower: 0,
  });
  const lastDetentIndexRef = useRef(0);

  // 0 to 270 degrees in radians
  const MAX_ANGLE_RAD = 1.5 * Math.PI;

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    if (knobMeshRef.current) {
      const targetRotationZ = -powerSetpoint * MAX_ANGLE_RAD;
      knobMeshRef.current.rotation.z = THREE.MathUtils.lerp(
        knobMeshRef.current.rotation.z,
        targetRotationZ,
        Math.min(1, safeDelta * 25)
      );
    }

    if (materialRef.current) {
      const targetEmissive = hovered || isDragging ? 0.6 : 0.05;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        Math.min(1, safeDelta * 15)
      );
    }
  });

  useEffect(() => {
    if (!isDragging) return;
    onDragStateChange?.(true);

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = dragStartRef.current.y - e.clientY; // Up or Right increases power
      const combinedDelta = dx * 0.7 + dy * 0.9;

      // 160px drag covers 0% to 100%, snapped to 5% increments (0.05) for firm tactile feel
      const rawPower = dragStartRef.current.startPower + combinedDelta / 160;
      const clampedPower = Math.max(0, Math.min(1.0, rawPower));
      const snappedPower = Math.round(clampedPower * 20) / 20;

      const detentIndex = Math.round(snappedPower * 20);
      if (detentIndex !== lastDetentIndexRef.current) {
        inductionAudio.playDetent();
        lastDetentIndexRef.current = detentIndex;
        setPowerSetpoint(snappedPower);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      onDragStateChange?.(false);
      document.body.style.cursor = 'auto';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, setPowerSetpoint, onDragStateChange]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const currentPower = useSimStore.getState().powerSetpoint;
    dragStartRef.current = {
      x: e.clientX ?? 0,
      y: e.clientY ?? 0,
      startPower: currentPower,
    };
    lastDetentIndexRef.current = Math.round(currentPower * 20);
    setIsDragging(true);
    inductionAudio.resume();
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    if (!isDragging) document.body.style.cursor = 'grab';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    if (!isDragging) document.body.style.cursor = 'auto';
  };

  const handleWheel = (e: any) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newPower = Math.max(0, Math.min(powerSetpoint + delta, 1.0));
    setPowerSetpoint(newPower);
    inductionAudio.playDetent();
  };

  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <group ref={groupRef} name="INT_KnobPower" position={position} rotation={rotation}>
      {/* Precision Brushed Aluminum Dial Scale Plate (Diameter 54mm, flat against panel) */}
      <mesh position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.029, 0.0015, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Graduated Scale Labels */}
      {ticks.map((t) => {
        const angle = -t * MAX_ANGLE_RAD + Math.PI * 0.75;
        const radius = 0.023;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <group key={t} position={[x, y, 0.0025]}>
            <Text
              fontSize={0.0045}
              color="#cbd5e1"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {Math.round(t * 100)}
            </Text>
          </group>
        );
      })}

      {/* Dial Bezel Nut Collar (flat against panel) */}
      <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.019, 0.02, 0.003, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Rotating Fluted Industrial Knob (Diameter 32mm, Height 16mm) */}
      <group ref={knobMeshRef} position={[0, 0, 0.006]}>
        {/* Main Bakelite / Aluminum Knurled Knob */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.017, 0.015, 32]} />
          <meshStandardMaterial
            ref={materialRef}
            color="#0f172a"
            emissive="#38bdf8"
            emissiveIntensity={0.05}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        {/* Chrome Machined Top Inset */}
        <mesh position={[0, 0, 0.0078]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.001, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Precision Index Pointer Arrow / Indicator Line */}
        <mesh position={[0, 0.011, 0.0082]}>
          <boxGeometry args={[0.0025, 0.007, 0.002]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Legend Header Plate above potentiometer */}
      <group position={[0, 0.038, 0.002]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.048, 0.014, 0.001]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
        </mesh>
        <Text
          position={[0, 0, 0.001]}
          fontSize={0.006}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          POWER SET (%)
        </Text>
      </group>

      {/* Enlarged invisible hit collider (0.07 x 0.07 m) for effortless grabbing & wheel scroll */}
      <mesh
        name="INT_KnobPower_Hit"
        position={[0, 0, 0.015]}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onWheel={handleWheel}
      >
        <boxGeometry args={[0.075, 0.085, 0.04]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
