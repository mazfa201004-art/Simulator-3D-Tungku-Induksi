import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { inductionAudio } from '../fx/InductionAudio';
import { useSimStore } from '../../store/useSimStore';

interface Button3DProps {
  name: string;
  label: string;
  sublabel?: string;
  baseColor: string;
  glowColor: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  onClick: () => void;
  isActive?: boolean;
}

/**
 * Authentic 22mm Industrial Flush Pushbutton with Chrome Bezel and Legend Plate.
 * Modelled accurately to 1:1 real-world industrial standard (Schneider XB4 / Siemens style).
 */
export const Button3D: React.FC<Button3DProps> = ({
  name,
  label,
  sublabel,
  baseColor,
  glowColor,
  position,
  rotation = [0, 0, 0],
  onClick,
  isActive = false,
}) => {
  const capRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const targetEmissive = hovered ? 0.85 : isActive ? 0.6 : 0.28;
  const targetScale = hovered ? 1.04 : 1.0;
  // Realistic physical button stroke travel: 3.5 mm (0.0035 m)
  const targetZ = pressed ? -0.0035 : 0.0;

  useFrame((_, delta) => {
    if (capRef.current) {
      capRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 20);
      capRef.current.position.z = THREE.MathUtils.lerp(capRef.current.position.z, targetZ, delta * 30);
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        delta * 15
      );
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    if (pressed) {
      setPressed(false);
      useSimStore.getState().setIsDragging3DControl(false);
    }
    document.body.style.cursor = 'auto';
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setPressed(true);
    inductionAudio.resume();
    useSimStore.getState().setIsDragging3DControl(true);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    useSimStore.getState().setIsDragging3DControl(false);
    if (pressed) {
      setPressed(false);
      inductionAudio.playClick();
      onClick();
    }
  };

  return (
    <group name={name} position={position} rotation={rotation}>
      {/* Industrial Legend Plate (Plat Penanda Standar 22mm: 30x45mm) */}
      <group position={[0, -0.022, 0.001]}>
        {/* Metal legend plate frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.038, 0.052, 0.0015]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Black anodized label inset */}
        <mesh position={[0, -0.012, 0.001]}>
          <planeGeometry args={[0.034, 0.022]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Engraved White Text */}
        <Text
          position={[0, -0.008, 0.002]}
          fontSize={0.008}
          color="#f8fafc"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {label}
        </Text>
        {sublabel && (
          <Text
            position={[0, -0.016, 0.002]}
            fontSize={0.0055}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            {sublabel}
          </Text>
        )}
      </group>

      {/* Chrome Plated Bezel Ring Collar (Diameter 30mm, flat against panel) */}
      <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.016, 0.006, 32]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.95}
          roughness={0.12}
        />
      </mesh>

      {/* Internal Bezel Stepped Chamfer */}
      <mesh position={[0, 0, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0125, 0.014, 0.003, 32]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* 22mm Flush Button Cap with physical inward depression travel */}
      <group ref={capRef} name={`${name}_Cap`} position={[0, 0, 0.007]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.004, 32]} />
          <meshStandardMaterial
            ref={materialRef}
            color={baseColor}
            emissive={glowColor}
            emissiveIntensity={0.28}
            toneMapped={false}
            roughness={0.25}
            metalness={0.0}
          />
        </mesh>

        {/* Industrial Tactile Symbol on the cap face */}
        {label.toUpperCase().includes('START') ? (
          <group position={[0, 0, 0.0022]}>
            {/* Crisp white "I" (ON/START) bar symbol */}
            <mesh>
              <boxGeometry args={[0.0024, 0.009, 0.0006]} />
              <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
            </mesh>
          </group>
        ) : label.toUpperCase().includes('STOP') ? (
          <group position={[0, 0, 0.0022]}>
            {/* Crisp white "O" (OFF/STOP) circle symbol */}
            <mesh>
              <ringGeometry args={[0.0032, 0.0058, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.95} transparent />
            </mesh>
          </group>
        ) : (
          <mesh position={[0, 0, 0.0022]}>
            <ringGeometry args={[0.0045, 0.0065, 24]} />
            <meshBasicMaterial color="#ffffff" opacity={0.85} transparent />
          </mesh>
        )}
      </group>

      {/* Enlarged invisible hit collider for effortless clicking and mobile touch */}
      <mesh
        name={`${name}_Hit`}
        position={[0, -0.008, 0.01]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[0.075, 0.088, 0.04]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
