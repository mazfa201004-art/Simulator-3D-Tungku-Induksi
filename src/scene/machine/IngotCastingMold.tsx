import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '../../store/useSimStore';
import { getBlackbodyColor } from '../../sim/blackbody';

interface IngotCastingMoldProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Authentic Industrial Cast Iron Multi-Cavity Ingot Mold (Cetakan Cor Ingot Batangan Logam).
 * Positioned on the foundry floor right under the furnace pouring spout.
 * Receives the molten aluminum stream poured from the furnace crucible.
 */
export const IngotCastingMold: React.FC<IngotCastingMoldProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const liquidMeshRef = useRef<THREE.Mesh>(null);
  const liquidMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const fumeRef = useRef<THREE.Mesh>(null);

  const ladleFilledFraction = useSimStore((s) => s.ladleFilledFraction);

  useFrame(() => {
    if (!liquidMeshRef.current || !liquidMatRef.current) return;

    if (ladleFilledFraction <= 0.005) {
      liquidMeshRef.current.visible = false;
      if (fumeRef.current) fumeRef.current.visible = false;
      return;
    }
    liquidMeshRef.current.visible = true;

    // Liquid surface rises as poured metal fills the mold cavities
    const currentY = 0.04 + ladleFilledFraction * 0.12;
    liquidMeshRef.current.position.y = currentY;

    const temp = useSimStore.getState().sim.temperatureC;
    const glow = getBlackbodyColor(temp);
    liquidMatRef.current.emissive.setRGB(glow.r, glow.g, glow.b);
    liquidMatRef.current.emissiveIntensity = glow.emissiveIntensity;

    if (fumeRef.current) {
      if (ladleFilledFraction > 0.02 && temp >= 450) {
        fumeRef.current.visible = true;
        fumeRef.current.rotation.y += 0.005;
        const mat = fumeRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.min(0.20, ladleFilledFraction * 0.25);
      } else {
        fumeRef.current.visible = false;
      }
    }
  });

  const width = 0.58;
  const length = 0.48;
  const height = 0.20;

  return (
    <group name="ENV_IngotCastingMold" position={position} rotation={rotation}>
      {/* 1. Heavy Foundry Cast Iron Ingot Mold Box with Tapered Walls */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.45} />
      </mesh>

      {/* Heavy Top Rim Lip Flange */}
      <mesh position={[0, height + 0.005, 0]}>
        <boxGeometry args={[width + 0.05, 0.025, length + 0.05]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Cast Iron Feet Runners on Floor */}
      {[-0.18, 0.18].map((fx, fi) => (
        <mesh key={fi} position={[fx, 0.015, 0]}>
          <boxGeometry args={[0.05, 0.03, length + 0.02]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.5} />
        </mesh>
      ))}

      {/* Heavy Mold Lifting Handles at Ends */}
      {[-width / 2 - 0.025, width / 2 + 0.025].map((hx, hi) => (
        <group key={hi} position={[hx, height * 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.045, 0.012, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </group>
      ))}

      {/* Recessed Trapezoidal Ingot Cavity Wells (3 parallel ingot molds) */}
      {[-0.14, 0, 0.14].map((zOffset, zi) => (
        <mesh key={zi} position={[0, height / 2 + 0.02, zOffset]}>
          <boxGeometry args={[width - 0.10, 0.002, 0.10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}

      {/* 2. Rising Molten Liquid Ingot Pool inside Mold Cavities */}
      <mesh
        ref={liquidMeshRef}
        name="VFX_IngotMoltenLiquid"
        position={[0, 0.10, 0]}
        visible={false}
      >
        <boxGeometry args={[width - 0.12, 0.02, length - 0.12]} />
        <meshStandardMaterial
          ref={liquidMatRef}
          color="#f97316"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Dynamic Thermal Fumes rising above hot ingot mold */}
      <mesh
        ref={fumeRef}
        name="VFX_IngotThermalFumes"
        position={[0, height + 0.16, 0]}
        visible={false}
      >
        <cylinderGeometry args={[width * 0.55, width * 0.45, 0.35, 16, 1, true]} />
        <meshBasicMaterial
          color="#cbd5e1"
          transparent
          opacity={0.16}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
